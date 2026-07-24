import { HeartHandshake } from 'lucide-react';

/**
 * Shown when a family has a balance but no plan yet - purely informational
 * for now (no backend action), reinforcing that asking for help is normal.
 */
export function NeedMoreTimeCard() {
  return (
    <div className="card-flat p-4">
      <div className="flex items-start gap-3">
        <span className="grid h-9 w-9 flex-none place-items-center rounded-full bg-peach text-terra-dark">
          <HeartHandshake size={16} />
        </span>
        <div>
          <div className="font-semibold text-ink">Need more time?</div>
          <p className="mt-1 text-sm text-body">
            If paying the full amount by the due date is difficult, let the office know -
            they can offer a fairer instalment plan. No questions asked.
          </p>
        </div>
      </div>
    </div>
  );
}
