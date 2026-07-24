import type { Invoice, CollectionForecast, FamilyRiskProfile } from '../types';
import { outstandingOf } from './reconcile';

/**
 * Collection forecast.
 *
 * "How much will actually come in this month?" is the question every school
 * office asks and no spreadsheet answers. We answer it by weighting each open
 * invoice by the family's modelled probability of paying, then giving an honest
 * range rather than a single confident-looking number.
 */
export function forecastCollection(
  openInvoices: Invoice[],
  profiles: Record<string, FamilyRiskProfile>,
): CollectionForecast {
  let expected = 0;
  let variance = 0;
  let totalOutstanding = 0;

  for (const inv of openInvoices) {
    const outstanding = outstandingOf(inv);
    if (outstanding <= 0) continue;
    totalOutstanding += outstanding;

    // probability this invoice gets paid this cycle
    const pMiss = profiles[inv.familyId]?.result.probability ?? 0.2;
    const pPay = 1 - pMiss;

    expected += outstanding * pPay;
    // variance of a scaled Bernoulli: (amount^2) * p * (1-p)
    variance += outstanding * outstanding * pPay * pMiss;
  }

  const sd = Math.sqrt(variance);
  const low = Math.max(0, expected - 1.28 * sd);   // ~80% band
  const high = Math.min(totalOutstanding, expected + 1.28 * sd);

  // tighter relative spread -> more confidence
  const confidence = expected > 0 ? Math.max(0, Math.min(1, 1 - sd / expected)) : 0;

  return {
    expected: Math.round(expected),
    low: Math.round(low),
    high: Math.round(high),
    confidence: Number(confidence.toFixed(2)),
    totalOutstanding: Math.round(totalOutstanding),
  };
}

/**
 * Build a real UPI deep link. Scanning this opens any Indian payment app with
 * the payee and amount already filled in.
 *
 * We do not move money ourselves: settlement needs a merchant account, which is
 * a business-verification step rather than an engineering one. The rail is real.
 */
export interface UpiLinkInput {
  vpa: string;          // school@bank
  payeeName: string;
  amount: number;
  note?: string;
  txnRef?: string;
}

export function buildUpiLink({ vpa, payeeName, amount, note, txnRef }: UpiLinkInput): string {
  const params = new URLSearchParams({
    pa: vpa,
    pn: payeeName,
    am: amount.toFixed(2),
    cu: 'INR',
  });
  if (note) params.set('tn', note);
  if (txnRef) params.set('tr', txnRef);
  return `upi://pay?${params.toString()}`;
}

/** Group outstanding money by class, for the office dashboard. */
export function pendingByClass(
  invoices: Invoice[],
  classOf: (studentId: string) => string,
): Array<{ className: string; amount: number }> {
  const map = new Map<string, number>();
  for (const inv of invoices) {
    const outstanding = outstandingOf(inv);
    if (outstanding <= 0) continue;
    const cls = classOf(inv.studentId);
    map.set(cls, (map.get(cls) ?? 0) + outstanding);
  }
  return [...map.entries()]
    .map(([className, amount]) => ({ className, amount }))
    .sort((a, b) => b.amount - a.amount);
}
