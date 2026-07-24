import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string;
  hint?: string;
  icon?: LucideIcon;
}

/** A single number on the dashboard: icon, label, big serif value, optional context line. */
export function StatCard({ label, value, hint, icon: Icon }: StatCardProps) {
  return (
    <div className="card p-5">
      <div className="flex items-center gap-2">
        {Icon && (
          <span className="grid h-7 w-7 place-items-center rounded-full bg-mint text-brand-dark">
            <Icon size={15} strokeWidth={2.25} />
          </span>
        )}
        <div className="label-caps">{label}</div>
      </div>
      <div className="mt-2 font-serif text-3xl font-bold text-ink">{value}</div>
      {hint && <div className="mt-1 text-xs text-muted">{hint}</div>}
    </div>
  );
}
