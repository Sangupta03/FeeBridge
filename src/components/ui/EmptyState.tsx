import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  hint?: string;
}

/** A calmer "nothing here" - an icon and a sentence, not just a grey line of text. */
export function EmptyState({ icon: Icon, title, hint }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-2 py-10 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-full bg-mint text-brand-dark">
        <Icon size={22} strokeWidth={2} />
      </span>
      <p className="font-semibold text-ink">{title}</p>
      {hint && <p className="max-w-xs text-sm text-muted">{hint}</p>}
    </div>
  );
}
