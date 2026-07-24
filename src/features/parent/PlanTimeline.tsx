import { inr, dueCopy } from '../../lib/format';
import type { InstallmentPlan } from '../../types';

interface PlanTimelineProps {
  plan: InstallmentPlan;
  onPayPart: () => void;
}

/**
 * Friendly view of an instalment plan for a parent: just the schedule, no
 * engine reasoning (that's office-only, same as risk scores).
 */
export function PlanTimeline({ plan, onPayPart }: PlanTimelineProps) {
  const nextPart = plan.installments.find((i) => !i.paid);

  return (
    <div className="card p-5">
      <div className="label-caps">Payment plan</div>
      <p className="mt-1 text-sm text-body">Split into {plan.installments.length} easier parts.</p>

      <ol className="mt-4 space-y-2">
        {plan.installments.map((i) => (
          <li
            key={i.seq}
            className={
              i.paid
                ? 'flex items-center justify-between rounded-lg bg-mint px-4 py-2 text-sm'
                : 'flex items-center justify-between rounded-lg border border-line bg-white px-4 py-2 text-sm'
            }
          >
            <span className="font-semibold text-ink">Part {i.seq} · {inr(i.amount)}</span>
            <span className="text-muted">{i.paid ? 'Paid' : dueCopy(i.dueDate)}</span>
          </li>
        ))}
      </ol>

      {nextPart && (
        <button className="btn-primary mt-4 w-full" onClick={onPayPart}>
          Pay part {nextPart.seq} · {inr(nextPart.amount)}
        </button>
      )}
    </div>
  );
}
