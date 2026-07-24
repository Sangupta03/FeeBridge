interface StatCardProps {
  label: string;
  value: string;
  hint?: string;
}

/** A single number on the dashboard: label, big serif value, optional context line. */
export function StatCard({ label, value, hint }: StatCardProps) {
  return (
    <div className="card p-5">
      <div className="label-caps">{label}</div>
      <div className="mt-1 font-serif text-3xl font-bold text-ink">{value}</div>
      {hint && <div className="mt-1 text-xs text-muted">{hint}</div>}
    </div>
  );
}
