import { useState } from 'react';
import { HeartHandshake, Calendar, Sparkles, CheckCircle2 } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { planInstallments } from '../../domain/installments';
import { inr, shortDate } from '../../lib/format';

interface NeedMoreTimeCardProps {
  balance: number;
  invoiceId: string;
}

export function NeedMoreTimeCard({ balance, invoiceId }: NeedMoreTimeCardProps) {
  const offerPlan = useAppStore((s) => s.offerPlan);
  const [expanded, setExpanded] = useState(false);
  const [parts, setParts] = useState(3);
  const [dayOfMonth, setDayOfMonth] = useState(10);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  // Derive preview installments using the domain engine
  const preview = planInstallments({
    amountDue: balance,
    dueDate: new Date().toISOString(), // Base from today
    parts: parts,
    preferredDayOfMonth: dayOfMonth,
  });

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await offerPlan(invoiceId, parts, dayOfMonth);
      setSubmitted(true);
    } catch (err) {
      console.error('[plan] failed to save custom plan:', err);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="card p-5 bg-mint border-mint-border text-brand-dark animate-in fade-in duration-200">
        <div className="flex items-center gap-3">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-brand text-cream">
            <CheckCircle2 size={16} />
          </span>
          <div>
            <div className="font-semibold">Installment Plan Activated</div>
            <p className="text-xs text-body mt-0.5">
              Your requested plan is now active. Your wallet timeline has been updated.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-5 transition-all duration-200">
      <div className="flex items-start gap-3">
        <span className="grid h-9 w-9 flex-none place-items-center rounded-full bg-peach text-terra-dark mt-0.5">
          <HeartHandshake size={16} />
        </span>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-ink">Need more time?</div>
          <p className="mt-1 text-sm text-body">
            If paying the full amount of {inr(balance)} at once is difficult, we can split it into interest-free monthly installments. No questions asked.
          </p>

          {!expanded ? (
            <button
              onClick={() => setExpanded(true)}
              className="btn-ghost mt-3 text-xs py-1.5 px-3 cursor-pointer"
            >
              Configure Installments
            </button>
          ) : (
            <div className="mt-4 pt-4 border-t border-line space-y-4 animate-in slide-in-from-top-4 duration-200">
              
              {/* Part selector */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-brand block mb-1.5">
                  Number of installments
                </label>
                <div className="flex gap-2">
                  {[2, 3, 4].map((p) => (
                    <button
                      key={p}
                      onClick={() => setParts(p)}
                      className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                        parts === p
                          ? 'bg-brand border-brand text-cream'
                          : 'bg-white border-line text-muted hover:border-brand hover:text-ink'
                      }`}
                    >
                      {p} Parts
                    </button>
                  ))}
                </div>
              </div>

              {/* Preferred day of month */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-brand block mb-1.5">
                  Preferred monthly payment date
                </label>
                <select
                  value={dayOfMonth}
                  onChange={(e) => setDayOfMonth(Number(e.target.value))}
                  className="w-full text-xs font-semibold rounded-lg border border-line p-2 bg-white focus:outline-none focus:border-brand"
                >
                  <option value={5}>5th of the month (e.g. after early salaries)</option>
                  <option value={10}>10th of the month (standard billing)</option>
                  <option value={15}>15th of the month (mid-month)</option>
                  <option value={25}>25th of the month (end-of-month)</option>
                </select>
              </div>

              {/* Installment breakdown preview */}
              <div className="bg-paper p-3 rounded-lg border border-line">
                <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-brand mb-2">
                  <Calendar size={12} />
                  Plan Schedule Preview
                </div>
                <div className="space-y-2 text-xs">
                  {preview.installments.map((inst) => (
                    <div key={inst.seq} className="flex justify-between items-center text-body border-b border-line/40 pb-1.5 last:border-b-0 last:pb-0">
                      <span>Part {inst.seq}</span>
                      <span className="font-semibold text-ink">{inr(inst.amount)}</span>
                      <span className="text-muted">{shortDate(inst.dueDate)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2">
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 btn-primary py-2 text-xs cursor-pointer flex items-center justify-center gap-1"
                >
                  <Sparkles size={13} fill="currentColor" />
                  {loading ? 'Activating...' : 'Activate This Plan'}
                </button>
                <button
                  onClick={() => setExpanded(false)}
                  className="btn-ghost py-2 text-xs cursor-pointer"
                >
                  Cancel
                </button>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}

