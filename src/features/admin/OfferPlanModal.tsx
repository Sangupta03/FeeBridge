import { useMemo, useState } from 'react';
import { Modal } from '../../components/ui/Modal';
import { useAppStore } from '../../store/useAppStore';
import { planInstallments } from '../../domain/installments';
import { outstandingOf } from '../../domain/reconcile';
import { inr, shortDate } from '../../lib/format';
import { seed } from '../../data/seed';

interface OfferPlanModalProps {
  invoiceId: string;
  onClose: () => void;
}

/**
 * Previews the instalments planInstallments() would generate before anything is
 * saved. Confirming calls the store's offerPlan(), which runs the same
 * calculation again and persists it - cheap, and keeps the preview honest.
 */
export function OfferPlanModal({ invoiceId, onClose }: OfferPlanModalProps) {
  const data = useAppStore((s) => s.data)!;
  const offerPlan = useAppStore((s) => s.offerPlan);
  const [confirming, setConfirming] = useState(false);

  const invoice = data.invoices.find((i) => i.id === invoiceId);
  const student = data.students.find((s) => s.id === invoice?.studentId);

  const preview = useMemo(() => {
    if (!invoice) return null;
    const history = seed.historyByFamily[invoice.familyId];
    return planInstallments({
      amountDue: outstandingOf(invoice),
      dueDate: invoice.dueDate,
      avgDelayDays: history?.avgDelayDays ?? 0,
      installmentPlansUsed: history?.installmentPlansUsed ?? 0,
      preferredDayOfMonth: 10,
    });
  }, [invoice]);

  if (!invoice || !preview) return null;

  const confirm = async () => {
    setConfirming(true);
    await offerPlan(invoiceId);
    setConfirming(false);
    onClose();
  };

  return (
    <Modal
      title="Offer an instalment plan"
      onClose={onClose}
      footer={
        <>
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-primary" disabled={confirming} onClick={() => { void confirm(); }}>
            {confirming ? 'Saving…' : 'Confirm plan'}
          </button>
        </>
      }
    >
      <p className="text-sm text-body">
        {student?.name} · {invoice.title} · {inr(outstandingOf(invoice))} outstanding
      </p>
      <p className="mt-2 text-sm text-muted">{preview.reason}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {preview.installments.map((i) => (
          <span key={i.seq} className="rounded bg-mint px-3 py-1 text-sm font-semibold text-ink">
            {inr(i.amount)} · {shortDate(i.dueDate)}
          </span>
        ))}
      </div>
    </Modal>
  );
}
