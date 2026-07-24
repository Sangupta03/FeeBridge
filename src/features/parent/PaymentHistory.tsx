import { Receipt } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { inr, shortDate } from '../../lib/format';
import { EmptyState } from '../../components/ui/EmptyState';

const STATUS_COPY: Record<string, string> = {
  matched: 'Received',
  review: 'Received · office to confirm',
  duplicate: 'Marked as duplicate',
};

interface PaymentHistoryProps {
  familyId: string;
}

/** A family's past payments, newest first, each one a small receipt. */
export function PaymentHistory({ familyId }: PaymentHistoryProps) {
  const data = useAppStore((s) => s.data)!;
  const payments = data.payments
    .filter((p) => p.familyId === familyId)
    .sort((a, b) => +new Date(b.paidAt) - +new Date(a.paidAt));

  if (payments.length === 0) {
    return (
      <EmptyState
        icon={Receipt}
        title="Nothing paid yet this term"
        hint="Every payment you make - in full or by instalment - lands here as a receipt you can look back on."
      />
    );
  }

  return (
    <div className="space-y-2">
      {payments.map((p) => (
        <div key={p.id} className="card-flat flex items-center justify-between p-4">
          <div>
            <div className="font-semibold text-ink">{inr(p.amount)}</div>
            <div className="text-sm text-muted">
              {shortDate(p.paidAt)} · {p.method.toUpperCase()} · {p.reference}
            </div>
          </div>
          <div className="text-sm text-body">
            {p.pending ? 'Queued · will sync' : (STATUS_COPY[p.status] ?? p.status)}
          </div>
        </div>
      ))}
    </div>
  );
}
