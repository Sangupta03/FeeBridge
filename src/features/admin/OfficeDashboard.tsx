import { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { StatsRow } from './StatsRow';
import { FamiliesAtRisk } from './FamiliesAtRisk';
import { InvoiceTable } from './InvoiceTable';
import { OfferPlanModal } from './OfferPlanModal';
import { PlansTab } from './PlansTab';
import { NeedsReview } from './NeedsReview';
import { OutstandingByClassChart } from './OutstandingByClassChart';
import { CollectionTrendChart } from './CollectionTrendChart';

type Tab = 'overview' | 'invoices' | 'plans' | 'review';

/**
 * The office dashboard: Overview (stats + the at-risk list - the glanceable
 * core), Invoices (the full filterable table), Plans offered (every
 * instalment plan, past and present), and Needs review (unmatched payments
 * waiting to be attached by hand). Owns only two bits of state - which tab is
 * active, and which invoice's "offer a plan" modal is open.
 */
export default function OfficeDashboard() {
  const data = useAppStore((s) => s.data)!;
  const profiles = useAppStore((s) => s.riskProfiles());
  const [tab, setTab] = useState<Tab>('overview');
  const [planInvoiceId, setPlanInvoiceId] = useState<string | null>(null);

  const atRisk = Object.values(profiles)
    .filter((p) => p.result.band !== 'healthy')
    .sort((a, b) => a.result.score - b.result.score);

  const reviewCount = data.payments.filter((p) => p.status === 'review').length;

  return (
    <div className="space-y-8">
      <div className="flex gap-2 border-b border-line">
        <TabButton active={tab === 'overview'} onClick={() => setTab('overview')}>Overview</TabButton>
        <TabButton active={tab === 'invoices'} onClick={() => setTab('invoices')}>Invoices</TabButton>
        <TabButton active={tab === 'plans'} onClick={() => setTab('plans')}>Plans offered</TabButton>
        <TabButton active={tab === 'review'} onClick={() => setTab('review')}>
          {`Needs review${reviewCount > 0 ? ` · ${reviewCount}` : ''}`}
        </TabButton>
      </div>

      {tab === 'overview' && (
        <div className="space-y-8">
          <StatsRow atRiskCount={atRisk.length} />
          <FamiliesAtRisk profiles={atRisk} onOfferPlan={setPlanInvoiceId} />
          <div className="grid gap-4 lg:grid-cols-2">
            <OutstandingByClassChart />
            <CollectionTrendChart />
          </div>
        </div>
      )}
      {tab === 'invoices' && <InvoiceTable />}
      {tab === 'plans' && <PlansTab />}
      {tab === 'review' && <NeedsReview />}

      {planInvoiceId && (
        <OfferPlanModal invoiceId={planInvoiceId} onClose={() => setPlanInvoiceId(null)} />
      )}
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: string }) {
  return (
    <button
      onClick={onClick}
      className={
        active
          ? 'border-b-2 border-brand px-1 pb-3 text-sm font-semibold text-ink'
          : 'border-b-2 border-transparent px-1 pb-3 text-sm font-semibold text-muted hover:text-ink'
      }
    >
      {children}
    </button>
  );
}
