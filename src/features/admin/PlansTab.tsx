import { ClipboardList } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { inr, shortDate, dueCopy } from '../../lib/format';
import { EmptyState } from '../../components/ui/EmptyState';

/**
 * Every instalment plan ever offered, newest first: who it's for, why it was
 * shaped the way it was, and each part's date and paid/upcoming state.
 */
export function PlansTab() {
  const data = useAppStore((s) => s.data)!;

  const plans = [...data.plans].sort(
    (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt),
  );

  return (
    <section>
      <h2 className="text-2xl font-bold">Plans offered</h2>
      <p className="mt-1 text-sm text-muted">
        Every instalment plan offered to a family, and where each part stands.
      </p>

      <div className="mt-4 space-y-3">
        {plans.length === 0 && (
          <EmptyState
            icon={ClipboardList}
            title="No plans offered yet"
            hint="When a family is offered a fairer way to pay, it'll show up here with the full schedule."
          />
        )}
        {plans.map((plan) => {
          const family = data.families.find((f) => f.id === plan.familyId);
          const invoice = data.invoices.find((i) => i.id === plan.invoiceId);
          const student = invoice ? data.students.find((s) => s.id === invoice.studentId) : undefined;

          return (
            <div key={plan.id} className="card p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div>
                  <div className="font-semibold text-ink">
                    {family?.name ?? 'Unknown family'}
                    {student && <span className="font-normal text-muted"> · {student.name}</span>}
                  </div>
                  <div className="text-sm text-muted">
                    {invoice?.title ?? 'Invoice removed'} · offered {shortDate(plan.createdAt)}
                  </div>
                </div>
                <div className="text-sm font-semibold text-ink">
                  {inr(plan.installments.reduce((sum, i) => sum + i.amount, 0))} total
                </div>
              </div>

              <p className="mt-2 text-sm text-body">{plan.reason}</p>

              <ol className="mt-3 flex flex-wrap gap-2">
                {plan.installments.map((i) => (
                  <li
                    key={i.seq}
                    className={
                      i.paid
                        ? 'rounded bg-mint px-3 py-1 text-sm font-semibold text-brand-dark'
                        : 'rounded border border-line bg-white px-3 py-1 text-sm font-semibold text-ink'
                    }
                  >
                    Part {i.seq} · {inr(i.amount)} · {shortDate(i.dueDate)}
                    <span className="ml-1 font-normal text-muted">
                      · {i.paid ? 'paid' : dueCopy(i.dueDate)}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          );
        })}
      </div>
    </section>
  );
}
