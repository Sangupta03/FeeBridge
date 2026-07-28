import { useAppStore } from '../../store/useAppStore';
import { inr } from '../../lib/format';
import { Coins, Layers, AlertCircle } from 'lucide-react';

export function TodayAtDesk() {
  const data = useAppStore((s) => s.data)!;

  const today = new Date().toDateString();
  const takenToday = data.payments.filter((p) => new Date(p.paidAt).toDateString() === today);
  const collected = takenToday.reduce((sum, p) => sum + p.amount, 0);
  const needsReview = takenToday.filter((p) => p.status === 'review').length;

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
      <StatCard 
        label="Collected Today" 
        value={inr(collected)} 
        desc="Total counter payments recorded"
        icon={<Coins size={16} />}
        accent="text-brand bg-brand/10 dark:bg-brand/20"
      />
      <StatCard 
        label="Payments Processed" 
        value={String(takenToday.length)} 
        desc="Total transactions completed today"
        icon={<Layers size={16} />}
        accent="text-blue-600 bg-blue-100 dark:bg-blue-950/40"
      />
      <StatCard 
        label="Requires Audit" 
        value={String(needsReview)} 
        desc="Payments flagged for manual review"
        icon={<AlertCircle size={16} />}
        accent={needsReview > 0 ? "text-amber bg-amber/15" : "text-muted bg-line/40"}
      />
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string;
  desc: string;
  icon: React.ReactNode;
  accent: string;
}

function StatCard({ label, value, desc, icon, accent }: StatCardProps) {
  return (
    <div className="card p-4 flex gap-3.5 items-center">
      <span className={`grid h-9 w-9 place-items-center rounded-xl flex-none ${accent}`}>
        {icon}
      </span>
      <div>
        <span className="text-[10px] font-bold text-muted uppercase tracking-wider block">{label}</span>
        <div className="font-serif text-2xl font-bold text-ink leading-tight mt-0.5">{value}</div>
        <p className="text-[10px] text-body mt-0.5">{desc}</p>
      </div>
    </div>
  );
}
