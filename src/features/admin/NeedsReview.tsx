import { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { inr, shortDate } from '../../lib/format';
import { outstandingOf } from '../../domain/reconcile';
import type { Payment, Invoice } from '../../types';

/** Payments the reconciliation engine could not place - the office splits them by hand. */
export function NeedsReview() {
  const data = useAppStore((s) => s.data)!;

  const review = data.payments
    .filter((p) => p.status === 'review')
    .sort((a, b) => +new Date(b.paidAt) - +new Date(a.paidAt));

  return (
    <section>
      <h2 className="text-2xl font-bold">Needs review</h2>
      <p className="mt-1 text-sm text-muted">
        Payments the system could not match on its own. Allocate each one across the
        right invoice or invoices - a payment bigger than any single invoice needs
        splitting, not just attaching.
      </p>

      <div className="mt-4 space-y-3">
        {review.length === 0 && (
          <p className="text-sm text-muted">Nothing needs review right now.</p>
        )}
        {review.map((payment) => (
          <ReviewRow key={payment.id} payment={payment} />
        ))}
      </div>
    </section>
  );
}

/** Greedily fill each invoice's full outstanding balance until the payment runs out. */
function defaultAllocations(amount: number, invoices: Invoice[]): Record<string, number> {
  let remaining = amount;
  const out: Record<string, number> = {};
  for (const inv of invoices) {
    const take = Math.max(0, Math.min(remaining, outstandingOf(inv)));
    out[inv.id] = take;
    remaining -= take;
  }
  return out;
}

function ReviewRow({ payment }: { payment: Payment }) {
  const data = useAppStore((s) => s.data)!;
  const splitPayment = useAppStore((s) => s.splitPayment);

  const family = data.families.find((f) => f.id === payment.familyId);
  const openInvoices = data.invoices.filter(
    (i) => i.familyId === payment.familyId && outstandingOf(i) > 0,
  );

  const [allocations, setAllocations] = useState<Record<string, number>>(
    () => defaultAllocations(payment.amount, openInvoices),
  );
  const [saving, setSaving] = useState(false);

  const total = Object.values(allocations).reduce((sum, n) => sum + n, 0);
  const matches = Math.abs(total - payment.amount) <= 1;

  function setAmount(invoiceId: string, value: number) {
    setAllocations((a) => ({ ...a, [invoiceId]: value }));
  }

  async function confirm() {
    const list = openInvoices
      .map((inv) => ({ invoiceId: inv.id, amount: allocations[inv.id] ?? 0 }))
      .filter((a) => a.amount > 0);
    if (list.length === 0) return;
    setSaving(true);
    try {
      await splitPayment(payment.id, list);
    } catch (err) {
      console.error('[needs-review] splitPayment failed:', err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card p-4">
      <div>
        <div className="font-semibold text-ink">{family?.name ?? 'Unknown family'}</div>
        <div className="text-sm text-muted">
          {inr(payment.amount)} · {payment.method.toUpperCase()} · {payment.reference} · {shortDate(payment.paidAt)}
        </div>
        {payment.note && <div className="mt-1 text-sm text-body">{payment.note}</div>}
      </div>

      {openInvoices.length === 0 ? (
        <p className="mt-3 text-sm text-muted">This family has no open invoices to attach to.</p>
      ) : (
        <>
          <div className="mt-3 space-y-2">
            {openInvoices.map((inv) => (
              <div
                key={inv.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-line bg-white px-3 py-2"
              >
                <div className="text-sm">
                  <div className="font-semibold text-ink">{inv.title}</div>
                  <div className="text-muted">{inr(outstandingOf(inv))} owed</div>
                </div>
                <input
                  type="number"
                  value={allocations[inv.id] ?? 0}
                  onChange={(e) => setAmount(inv.id, Number(e.target.value))}
                  className="w-28 rounded-lg border border-line bg-white px-2 py-1 text-right text-sm text-ink"
                />
              </div>
            ))}
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <span className={matches ? 'text-sm text-muted' : 'text-sm font-semibold text-terra-dark'}>
              Allocated {inr(total)} of {inr(payment.amount)}
            </span>
            <button className="btn-primary" disabled={!matches || saving} onClick={() => { void confirm(); }}>
              {saving ? 'Saving…' : 'Confirm split'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
