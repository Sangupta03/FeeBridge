import { useAppStore } from '../../store/useAppStore';
import { inr } from '../../lib/format';

/** A quick pulse of today's activity at this desk - real data, updates as payments are recorded. */
export function TodayAtDesk() {
  const data = useAppStore((s) => s.data)!;

  const today = new Date().toDateString();
  const takenToday = data.payments.filter((p) => new Date(p.paidAt).toDateString() === today);
  const collected = takenToday.reduce((sum, p) => sum + p.amount, 0);
  const needsReview = takenToday.filter((p) => p.status === 'review').length;

  return (
    <div className="card flex flex-wrap gap-x-8 gap-y-3 p-4">
      <Stat label="Collected today" value={inr(collected)} />
      <Stat label="Payments taken" value={String(takenToday.length)} />
      <Stat label="Need review" value={String(needsReview)} />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="label-caps">{label}</div>
      <div className="mt-0.5 font-serif text-2xl font-bold text-ink">{value}</div>
    </div>
  );
}
