import { Inbox } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { inr, shortDate } from '../../lib/format';
import { EmptyState } from '../../components/ui/EmptyState';

const STATUS_TONE: Record<string, string> = {
  matched: 'bg-mint text-brand-dark',
  review: 'bg-amber/10 text-amber',
  duplicate: 'bg-peach text-terra-dark',
};

const STATUS_LABEL: Record<string, string> = {
  matched: 'Matched',
  review: 'Needs review',
  duplicate: 'Duplicate',
};

/** The most recent payments, newest first - queued ones are marked pending until they sync. */
export function RecentPayments() {
  const data = useAppStore((s) => s.data)!;
  const recent = [...data.payments]
    .sort((a, b) => +new Date(b.paidAt) - +new Date(a.paidAt))
    .slice(0, 15);

  return (
    <section>
      <h2 className="text-lg font-bold">Recent payments</h2>
      <div className="mt-3 space-y-2">
        {recent.length === 0 && (
          <EmptyState icon={Inbox} title="Nothing recorded yet" hint="Payments taken at the desk will appear here as soon as you save one." />
        )}
        {recent.map((p) => {
          const student = data.students.find((s) => s.id === p.studentId);
          return (
            <div key={p.id} className="card-flat flex items-center justify-between p-3">
              <div>
                <div className="font-semibold text-ink">{inr(p.amount)}</div>
                <div className="text-sm text-muted">
                  {student?.name ?? 'Family balance'} · {p.method.toUpperCase()} · {shortDate(p.paidAt)}
                </div>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-bold ${
                  p.pending ? 'bg-terra/10 text-terra-dark' : STATUS_TONE[p.status]
                }`}
              >
                {p.pending ? 'Pending sync' : STATUS_LABEL[p.status]}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
