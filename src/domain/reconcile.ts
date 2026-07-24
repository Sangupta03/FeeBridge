import type { Invoice, Payment, PaymentStatus } from '../types';

/**
 * Reconciliation.
 *
 * Every payment - cash, cheque or UPI - has to end up attached to the right
 * invoice, or land in a "Needs Review" pile that a human looks at. This is the
 * unglamorous part of school fees and the part that actually loses money, so we
 * do it properly rather than hand-waving it.
 */

/** payments within this many rupees of the balance are treated as a match */
export const AMOUNT_TOLERANCE = 1;
/** same reference + same amount inside this window looks like a double entry */
export const DUPLICATE_WINDOW_MS = 24 * 60 * 60 * 1000;

export interface MatchResult {
  status: PaymentStatus;
  invoiceId?: string;
  reason: string;
}

export function outstandingOf(inv: Invoice): number {
  return Math.max(0, inv.amountDue - inv.amountPaid);
}

/**
 * Is this payment the same one recorded twice?
 * Front desks double-enter cash, and parents tap "pay" twice on a flaky network.
 */
export function findDuplicate(payment: Payment, recent: Payment[]): Payment | undefined {
  const t = new Date(payment.paidAt).getTime();
  return recent.find((p) => {
    if (p.id === payment.id) return false;
    if (p.status === 'duplicate') return false;
    if (p.familyId !== payment.familyId) return false;
    if (Math.abs(p.amount - payment.amount) > AMOUNT_TOLERANCE) return false;
    // an identical reference is the strongest signal, but cash has weak refs,
    // so we also treat same-family + same-amount + same-day as suspicious
    const sameRef = !!p.reference && p.reference === payment.reference;
    const closeInTime = Math.abs(new Date(p.paidAt).getTime() - t) <= DUPLICATE_WINDOW_MS;
    return closeInTime && (sameRef || p.method === payment.method);
  });
}

/**
 * Attach a payment to the best open invoice.
 * Preference order: exact balance match, then the oldest invoice it fits inside.
 */
export function matchPayment(
  payment: Payment,
  openInvoices: Invoice[],
  recentPayments: Payment[] = [],
): MatchResult {
  const dup = findDuplicate(payment, recentPayments);
  if (dup) {
    return {
      status: 'duplicate',
      reason: `Looks like the same payment as ${dup.reference || dup.id} recorded earlier today.`,
    };
  }

  const candidates = openInvoices
    .filter((inv) => inv.familyId === payment.familyId)
    .filter((inv) => (payment.studentId ? inv.studentId === payment.studentId : true))
    .filter((inv) => outstandingOf(inv) > 0);

  if (candidates.length === 0) {
    return { status: 'review', reason: 'No open invoice found for this family.' };
  }

  // 1. exact settle
  const exact = candidates.find(
    (inv) => Math.abs(outstandingOf(inv) - payment.amount) <= AMOUNT_TOLERANCE,
  );
  if (exact) {
    return { status: 'matched', invoiceId: exact.id, reason: 'Amount matches the balance exactly.' };
  }

  // 2. part payment against the oldest invoice it fits inside
  const byOldest = [...candidates].sort(
    (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
  );
  const partial = byOldest.find((inv) => payment.amount < outstandingOf(inv));
  if (partial) {
    return {
      status: 'matched',
      invoiceId: partial.id,
      reason: 'Part payment applied to the oldest open invoice.',
    };
  }

  // 3. more money than any single invoice -> a human should decide how to split
  return {
    status: 'review',
    reason: 'Amount is larger than any single open invoice. Needs splitting by hand.',
  };
}

/** Apply a matched payment to its invoice and return the updated invoice. */
export function applyPayment(invoice: Invoice, payment: Payment): Invoice {
  const amountPaid = invoice.amountPaid + payment.amount;
  const status = amountPaid >= invoice.amountDue ? 'paid' : 'part_paid';
  return { ...invoice, amountPaid, status };
}

/** Summary numbers for the reconciliation screen. */
export function reconciliationSummary(payments: Payment[]) {
  return {
    matched: payments.filter((p) => p.status === 'matched').length,
    review: payments.filter((p) => p.status === 'review').length,
    duplicates: payments.filter((p) => p.status === 'duplicate').length,
    pendingSync: payments.filter((p) => p.pending).length,
  };
}
