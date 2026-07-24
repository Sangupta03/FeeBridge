import { useState } from 'react';
import { QrCode, CheckCircle2, GraduationCap } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { inr } from '../../lib/format';
import { outstandingOf } from '../../domain/reconcile';
import { PayModal } from './PayModal';
import { PlanTimeline } from './PlanTimeline';
import { PaymentHistory } from './PaymentHistory';

interface PayRequest {
  amount: number;
  label: string;
  studentId?: string;
}

/**
 * The parent wallet: one family balance (not one bill per child), a per-child
 * breakdown, a UPI pay flow, the instalment plan if there is one, and history.
 * Mobile-first, since parents are on phones.
 */
export default function ParentWallet() {
  const data = useAppStore((s) => s.data)!;
  const user = useAppStore((s) => s.user)!;
  const familyId = user.familyId!;
  const balance = useAppStore((s) => s.familyBalance(familyId));

  const kids = data.students.filter((s) => s.familyId === familyId);

  const plan = [...data.plans]
    .filter((p) => p.familyId === familyId)
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))[0];

  const [pay, setPay] = useState<PayRequest | null>(null);

  function payNextPart() {
    if (!plan) return;
    const nextPart = plan.installments.find((i) => !i.paid);
    if (!nextPart) return;
    const invoice = data.invoices.find((i) => i.id === plan.invoiceId);
    setPay({
      amount: nextPart.amount,
      label: `Part ${nextPart.seq} of plan`,
      studentId: invoice?.studentId,
    });
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div className="card p-6 text-center">
        <div className="label-caps">Your family balance</div>
        <div className="mt-1 font-serif text-5xl font-bold text-ink">{inr(balance)}</div>
        <div className="mt-1 text-sm text-muted">
          Covering {kids.length} {kids.length === 1 ? 'child' : 'children'} · one payment
        </div>
        {balance > 0 ? (
          <button
            className="btn-primary mt-4 w-full"
            onClick={() => setPay({ amount: balance, label: 'Family balance' })}
          >
            <QrCode size={16} />
            Pay now
          </button>
        ) : (
          <div className="mt-4 flex items-center justify-center gap-2 text-sm font-semibold text-brand-dark">
            <CheckCircle2 size={16} />
            You're all settled up
          </div>
        )}
      </div>

      <div className="space-y-2">
        {kids.map((kid) => {
          const owed = data.invoices
            .filter((i) => i.studentId === kid.id)
            .reduce((sum, i) => sum + outstandingOf(i), 0);
          return (
            <div key={kid.id} className="card-flat flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-mint text-brand-dark">
                  <GraduationCap size={16} />
                </span>
                <div>
                  <div className="font-semibold text-ink">{kid.name}</div>
                  <div className="text-sm text-muted">{kid.className}</div>
                </div>
              </div>
              <div className="font-semibold text-ink">{inr(owed)}</div>
            </div>
          );
        })}
      </div>

      {plan && <PlanTimeline plan={plan} onPayPart={payNextPart} />}

      <div>
        <h2 className="text-xl font-bold">Payment history</h2>
        <div className="mt-3">
          <PaymentHistory familyId={familyId} />
        </div>
      </div>

      {pay && (
        <PayModal
          amount={pay.amount}
          label={pay.label}
          studentId={pay.studentId}
          onClose={() => setPay(null)}
        />
      )}
    </div>
  );
}
