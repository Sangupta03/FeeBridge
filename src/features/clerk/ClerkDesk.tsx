import { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { StudentPicker } from './StudentPicker';
import { PaymentForm } from './PaymentForm';
import { ReceiptView } from './ReceiptView';
import { RecentPayments } from './RecentPayments';
import { TodayAtDesk } from './TodayAtDesk';
import type { Student, Payment } from '../../types';

interface RecordedPayment {
  student: Student;
  amount: number;
  method: Payment['method'];
  reference: string;
  status: Payment['status'];
  reason: string;
  paidAt: string;
}

const STATUS_COPY: Record<Payment['status'], { label: string; tone: string }> = {
  matched: { label: 'Matched', tone: 'bg-mint text-brand-dark' },
  review: { label: 'Needs review', tone: 'bg-amber/10 text-amber' },
  duplicate: { label: 'Possible duplicate', tone: 'bg-peach text-terra-dark' },
};

/**
 * The cash desk: pick a student, record cash or cheque, see the reconciliation
 * outcome plainly, then print a receipt. Works the same online or offline.
 */
export default function ClerkDesk() {
  const data = useAppStore((s) => s.data)!;
  const [student, setStudent] = useState<Student | null>(null);
  const [recorded, setRecorded] = useState<RecordedPayment | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  // bumped on every "Next payment" so StudentPicker remounts fresh, clearing
  // its own search text - it isn't otherwise reset just because student:null
  const [pickerKey, setPickerKey] = useState(0);

  const pendingCount = data.payments.filter((p) => p.pending).length;

  function startNext() {
    setStudent(null);
    setRecorded(null);
    setShowReceipt(false);
    setPickerKey((k) => k + 1);
  }

  return (
    <div className="mx-auto max-w-xl space-y-6 lg:max-w-5xl">
      <TodayAtDesk />

      {/* narrow and stacked on a phone; a clerk at a real desk gets two columns -
          new payment on the left, what just happened on the right */}
      <div className="lg:grid lg:grid-cols-[1.1fr_0.9fr] lg:items-start lg:gap-6">
        <div className="space-y-6">
          <div className="card p-5">
            <h2 className="text-xl font-bold">Cash desk</h2>
            <p className="mt-1 text-sm text-body">
              {data.online
                ? 'Connected. Payments save straight away.'
                : `Working offline. ${pendingCount} payment${pendingCount === 1 ? '' : 's'} waiting to sync.`}
            </p>
          </div>

          <div>
            <label className="label-caps">Student</label>
            <div className="mt-2">
              <StudentPicker key={pickerKey} selected={student} onSelect={setStudent} />
            </div>
          </div>

          {student && !recorded && (
            <PaymentForm
              student={student}
              onRecorded={(result) => setRecorded({ student, paidAt: new Date().toISOString(), ...result })}
            />
          )}

          {recorded && (
            <div className="card p-5">
              <span className={`rounded-full px-3 py-1 text-xs font-bold ${STATUS_COPY[recorded.status].tone}`}>
                {STATUS_COPY[recorded.status].label}
              </span>
              <p className="mt-2 text-sm text-body">{recorded.reason}</p>
              <div className="mt-4 flex gap-2">
                <button className="btn-primary" onClick={() => setShowReceipt(true)}>View receipt</button>
                <button className="btn-ghost" onClick={startNext}>Next payment</button>
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 lg:mt-0">
          <RecentPayments />
        </div>
      </div>

      {showReceipt && recorded && (
        <ReceiptView
          student={recorded.student}
          familyName={data.families.find((f) => f.id === recorded.student.familyId)?.name ?? ''}
          amount={recorded.amount}
          method={recorded.method}
          reference={recorded.reference}
          paidAt={recorded.paidAt}
          onClose={() => setShowReceipt(false)}
        />
      )}
    </div>
  );
}
