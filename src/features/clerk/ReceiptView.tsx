import { Modal } from '../../components/ui/Modal';
import { inr, shortDate } from '../../lib/format';
import type { Student, Payment } from '../../types';

interface ReceiptViewProps {
  student: Student;
  familyName: string;
  amount: number;
  method: Payment['method'];
  reference: string;
  paidAt: string;
  onClose: () => void;
}

/** A printable receipt. Only the .print-area block (see index.css) survives printing. */
export function ReceiptView({
  student, familyName, amount, method, reference, paidAt, onClose,
}: ReceiptViewProps) {
  return (
    <Modal
      title="Receipt"
      onClose={onClose}
      footer={
        <>
          <button className="btn-ghost" onClick={onClose}>Close</button>
          <button className="btn-primary" onClick={() => window.print()}>Print</button>
        </>
      }
    >
      <div className="print-area space-y-2 text-sm">
        <Row label="School" value="Green Valley School" />
        <Row label="Student" value={`${student.name} · ${student.className}`} />
        <Row label="Family" value={familyName} />
        <Row label="Date" value={shortDate(paidAt)} />
        <Row label="Method" value={method.toUpperCase()} />
        <Row label="Reference" value={reference} />
        <div className="mt-3 flex justify-between border-t border-line pt-3">
          <span className="font-bold text-ink">Amount</span>
          <span className="font-serif text-2xl font-bold text-ink">{inr(amount)}</span>
        </div>
      </div>
    </Modal>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted">{label}</span>
      <span className="font-semibold text-ink">{value}</span>
    </div>
  );
}
