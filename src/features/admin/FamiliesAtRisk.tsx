import type { FamilyRiskProfile } from '../../types';
import { useAppStore } from '../../store/useAppStore';
import { dueCopy } from '../../lib/format';
import { outstandingOf } from '../../domain/reconcile';
import { bandCopy } from '../../domain/risk';

interface FamiliesAtRiskProps {
  /** already filtered to non-healthy and sorted by score ascending */
  profiles: FamilyRiskProfile[];
  onOfferPlan: (invoiceId: string) => void;
}

/** The quiet-word list: family, guardian, what's due, a soft risk chip, and why — never hidden. */
export function FamiliesAtRisk({ profiles, onOfferPlan }: FamiliesAtRiskProps) {
  const data = useAppStore((s) => s.data)!;

  return (
    <section>
      <h2 className="text-2xl font-bold">Families worth a quiet word</h2>
      <p className="mt-1 text-sm text-muted">
        Flagged before the due date, so there is still time to help.
      </p>
      <div className="mt-4 space-y-3">
        {profiles.length === 0 && (
          <p className="text-sm text-muted">No families need a nudge right now.</p>
        )}
        {profiles.map((p) => {
          const fam = data.families.find((f) => f.id === p.familyId)!;
          const copy = bandCopy(p.result.band);
          const invoice = data.invoices
            .filter((i) => i.familyId === p.familyId && outstandingOf(i) > 0)
            .sort((a, b) => +new Date(a.dueDate) - +new Date(b.dueDate))[0];

          return (
            <div key={p.familyId} className="card p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="font-semibold text-ink">{fam.name}</div>
                  <div className="text-sm text-muted">
                    {fam.guardianName} · {invoice ? dueCopy(invoice.dueDate) : 'no open invoice'}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={
                      p.result.band === 'at_risk'
                        ? 'rounded-full bg-peach px-3 py-1 text-xs font-bold text-terra-dark'
                        : 'rounded-full bg-amber/10 px-3 py-1 text-xs font-bold text-amber'
                    }
                  >
                    {copy.label} · {p.result.score}
                  </span>
                  {invoice && (
                    <button className="btn-primary" onClick={() => onOfferPlan(invoice.id)}>
                      Offer a plan
                    </button>
                  )}
                </div>
              </div>
              {/* explainability: never flag without saying why, and never behind a tooltip */}
              <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-body">
                {p.result.reasons.slice(0, 3).map((r) => (
                  <li key={r.code}>· {r.label}</li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );
}
