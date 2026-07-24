import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Modal } from '../../components/ui/Modal';
import { useAppStore } from '../../store/useAppStore';
import { buildUpiLink } from '../../domain/forecast';
import { inr } from '../../lib/format';

interface PayModalProps {
  amount: number;
  label: string;
  studentId?: string;
  onClose: () => void;
}

const SCHOOL_VPA = import.meta.env.VITE_SCHOOL_UPI_VPA || 'school@upi';
const SCHOOL_NAME = import.meta.env.VITE_SCHOOL_NAME || 'Your School';

function resultMessage(status: string): string {
  if (status === 'matched') return "Payment received and matched. Thank you!";
  if (status === 'review') return 'Payment received — the office will confirm it shortly.';
  return 'This looks like a payment already recorded today.';
}

/** Shows a real UPI QR for one payment. "I've paid" calls recordPayment() so the loop completes without real money moving. */
export function PayModal({ amount, label, studentId, onClose }: PayModalProps) {
  const recordPayment = useAppStore((s) => s.recordPayment);
  const user = useAppStore((s) => s.user)!;
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ status: string } | null>(null);

  const upiLink = buildUpiLink({
    vpa: SCHOOL_VPA,
    payeeName: SCHOOL_NAME,
    amount,
    note: label,
  });

  async function markPaid() {
    setSaving(true);
    const outcome = await recordPayment({
      familyId: user.familyId!,
      studentId,
      amount,
      method: 'upi',
      reference: `UPI-${Date.now()}`,
      note: label,
    });
    setSaving(false);
    setResult(outcome);
  }

  return (
    <Modal title="Pay with UPI" onClose={onClose}>
      <p className="text-sm text-muted">{label}</p>

      <div className="mt-4 flex flex-col items-center gap-3 rounded-lg border border-line bg-white p-5">
        <QRCodeSVG value={upiLink} size={200} />
        <div className="font-serif text-3xl font-bold text-ink">{inr(amount)}</div>
        <p className="text-xs text-muted">Scan with any UPI app</p>
      </div>

      {result ? (
        <div className="mt-4 rounded-lg bg-paper2 p-4 text-sm text-body">
          <p>{resultMessage(result.status)}</p>
          <button className="btn-ghost mt-3" onClick={onClose}>Close</button>
        </div>
      ) : (
        <button className="btn-primary mt-4 w-full" disabled={saving} onClick={() => { void markPaid(); }}>
          {saving ? 'Saving…' : "I've paid"}
        </button>
      )}
    </Modal>
  );
}
