import { useState } from 'react';
import { QrCode, CheckCircle2, GraduationCap } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { inr } from '../../lib/format';
import { outstandingOf } from '../../domain/reconcile';
import { PayModal } from './PayModal';
import { PlanTimeline } from './PlanTimeline';
import { PaymentHistory } from './PaymentHistory';
import { NeedMoreTimeCard } from './NeedMoreTimeCard';

import { ParentInbox } from './ParentInbox';
import { Sparkles } from 'lucide-react';
import { FeeBridgeGenius } from '../admin/FeeBridgeGenius';

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

  const [geniusOpen, setGeniusOpen] = useState(false);

  const kids = data.students.filter((s) => s.familyId === familyId);

  const plan = [...data.plans]
    .filter((p) => p.familyId === familyId)
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))[0];

  const openInvoice = data.invoices.find((i) => i.familyId === familyId && outstandingOf(i) > 0);

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
    <div className="mx-auto max-w-md lg:max-w-4xl space-y-6 animate-in fade-in duration-300">
      
      {/* Portal Header with Notification Bell */}
      <div className="flex justify-between items-center bg-white/40 dark:bg-[#151a17]/40 border border-line rounded-xl p-4 backdrop-blur-sm">
        <div>
          <h2 className="text-xl font-bold text-ink">Parent Wallet Portal</h2>
          <p className="text-xs text-muted">Green Valley School · Family Portal</p>
        </div>
        <ParentInbox familyId={familyId} />
      </div>

      <div className="lg:grid lg:grid-cols-[0.9fr_1.1fr] lg:items-start lg:gap-6">
        <div className="space-y-6">
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

          {plan ? (
            <PlanTimeline plan={plan} onPayPart={payNextPart} />
          ) : (
            balance > 0 && openInvoice && (
              <NeedMoreTimeCard balance={balance} invoiceId={openInvoice.id} />
            )
          )}
        </div>

        <div className="mt-6 space-y-6 lg:mt-0">
          <div className="space-y-2">
            {kids.map((kid) => {
              const invoices = data.invoices.filter((i) => i.studentId === kid.id && outstandingOf(i) > 0);
              const owed = invoices.reduce((sum, i) => sum + outstandingOf(i), 0);
              return (
                <div key={kid.id} className="card-flat p-4">
                  <div className="flex items-center justify-between">
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
                  {invoices.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 pl-12 text-xs text-muted">
                      {invoices.map((i) => (
                        <span key={i.id}>{i.title.split(' –')[0]} · {inr(outstandingOf(i))}</span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div>
            <h2 className="text-xl font-bold">Payment history</h2>
            <div className="mt-3">
              <PaymentHistory familyId={familyId} />
            </div>
          </div>
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

      {geniusOpen && (
        <FeeBridgeGenius onClose={() => setGeniusOpen(false)} />
      )}

      {/* Floating AI Sparkles Button */}
      <button
        onClick={() => setGeniusOpen(true)}
        className="fixed bottom-6 right-6 z-30 flex h-12 w-12 items-center justify-center rounded-full bg-brand text-cream shadow-2xl hover:scale-105 transition-all cursor-pointer border-2 border-cream/20"
        title="Ask Family Assistant"
      >
        <Sparkles size={20} fill="currentColor" className="animate-pulse" />
      </button>
    </div>
  );
}
