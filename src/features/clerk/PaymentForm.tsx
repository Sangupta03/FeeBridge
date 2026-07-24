import { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { inr } from '../../lib/format';
import type { Student, Payment } from '../../types';

interface PaymentFormProps {
  student: Student;
  onRecorded: (result: {
    amount: number;
    method: Payment['method'];
    reference: string;
    status: Payment['status'];
    reason: string;
  }) => void;
}

const METHODS: Array<{ value: Payment['method']; label: string }> = [
  { value: 'cash', label: 'Cash' },
  { value: 'cheque', label: 'Cheque' },
];

/** Fast cash/cheque entry: amount, method, reference, an optional note, save. */
export function PaymentForm({ student, onRecorded }: PaymentFormProps) {
  const recordPayment = useAppStore((s) => s.recordPayment);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<Payment['method']>('cash');
  const [reference, setReference] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const amountNum = Number(amount);
  const canSave = amountNum > 0 && reference.trim().length > 0 && !saving;

  async function save() {
    setSaving(true);
    const outcome = await recordPayment({
      familyId: student.familyId,
      studentId: student.id,
      amount: amountNum,
      method,
      reference: reference.trim(),
      note: note.trim() || undefined,
    });
    setSaving(false);
    onRecorded({ amount: amountNum, method, reference: reference.trim(), ...outcome });
  }

  return (
    <div className="card space-y-4 p-5">
      <div>
        <label className="label-caps">Amount</label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0"
          className="mt-1 w-full rounded-lg border border-line bg-white px-4 py-2 text-lg font-semibold text-ink"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label-caps">Method</label>
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value as Payment['method'])}
            className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink"
          >
            {METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </div>
        <div>
          <label className="label-caps">Reference</label>
          <input
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder={method === 'cash' ? 'Receipt no.' : 'Cheque no.'}
            className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink"
          />
        </div>
      </div>

      <div>
        <label className="label-caps">Note (optional)</label>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink"
        />
      </div>

      <button className="btn-primary w-full" disabled={!canSave} onClick={() => { void save(); }}>
        {saving ? 'Saving…' : amountNum > 0 ? `Record ${inr(amountNum)}` : 'Record payment'}
      </button>
    </div>
  );
}
