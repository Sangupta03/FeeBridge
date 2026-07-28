import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { StatsRow } from './StatsRow';
import { FamiliesAtRisk } from './FamiliesAtRisk';
import { InvoiceTable } from './InvoiceTable';
import { OfferPlanModal } from './OfferPlanModal';
import { PlansTab } from './PlansTab';
import { NeedsReview } from './NeedsReview';
import { OutstandingByClassChart } from './OutstandingByClassChart';
import { CollectionTrendChart } from './CollectionTrendChart';
import { PaymentMethodChart } from './PaymentMethodChart';
import { ForecastCard } from './ForecastCard';
import { FeeBridgeGenius } from './FeeBridgeGenius';
import { MLDashboard } from './MLDashboard';
import { NotificationCenter } from './NotificationCenter';

type Tab = 'overview' | 'invoices' | 'plans' | 'review' | 'ml' | 'notifications';

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
  const [geniusOpen, setGeniusOpen] = useState(false);

  const atRisk = Object.values(profiles)
    .filter((p) => p.result.band !== 'healthy')
    .sort((a, b) => a.result.score - b.result.score);

  const reviewCount = data.payments.filter((p) => p.status === 'review').length;

  return (
    <div className="space-y-8 relative animate-in fade-in duration-300">
      <div role="tablist" aria-label="Office dashboard sections" className="flex flex-wrap gap-2 border-b border-line">
        <TabButton id="overview" active={tab === 'overview'} onClick={() => setTab('overview')}>Overview</TabButton>
        <TabButton id="invoices" active={tab === 'invoices'} onClick={() => setTab('invoices')}>Invoices</TabButton>
        <TabButton id="plans" active={tab === 'plans'} onClick={() => setTab('plans')}>Plans offered</TabButton>
        <TabButton id="review" active={tab === 'review'} onClick={() => setTab('review')}>
          {`Needs review${reviewCount > 0 ? ` · ${reviewCount}` : ''}`}
        </TabButton>
        <TabButton id="ml" active={tab === 'ml'} onClick={() => setTab('ml')}>Risk Predictor</TabButton>
        <TabButton id="notifications" active={tab === 'notifications'} onClick={() => setTab('notifications')}>Notifications</TabButton>
      </div>

      {tab === 'overview' && (
        <div role="tabpanel" aria-labelledby="tab-overview" className="space-y-8">
          <StatsRow atRiskCount={atRisk.length} />
          <FamiliesAtRisk profiles={atRisk} onOfferPlan={setPlanInvoiceId} />
          <div className="grid gap-4 lg:grid-cols-2">
            <OutstandingByClassChart />
            <CollectionTrendChart />
            <PaymentMethodChart />
            <ForecastCard />
          </div>
        </div>
      )}
      {tab === 'invoices' && <div role="tabpanel" aria-labelledby="tab-invoices"><InvoiceTable /></div>}
      {tab === 'plans' && <div role="tabpanel" aria-labelledby="tab-plans"><PlansTab /></div>}
      {tab === 'review' && <div role="tabpanel" aria-labelledby="tab-review"><NeedsReview /></div>}
      {tab === 'ml' && <div role="tabpanel" aria-labelledby="tab-ml"><MLDashboard /></div>}
      {tab === 'notifications' && <div role="tabpanel" aria-labelledby="tab-notifications"><NotificationCenter /></div>}

      {planInvoiceId && (
        <OfferPlanModal invoiceId={planInvoiceId} onClose={() => setPlanInvoiceId(null)} />
      )}

      {/* Floating Copilot Button */}
      <button
        onClick={() => setGeniusOpen(true)}
        className="fixed bottom-6 right-6 z-30 flex items-center gap-2 rounded-full bg-brand px-4 py-3 shadow-2xl hover:bg-brand-mid text-cream hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
        aria-label="Open AI Copilot"
      >
        <Sparkles size={16} fill="currentColor" className="animate-pulse" />
        <span className="text-xs font-bold tracking-wide uppercase">FeeBridge Genius</span>
      </button>

      {/* Copilot Drawer */}
      {geniusOpen && (
        <FeeBridgeGenius 
          onClose={() => setGeniusOpen(false)} 
          onOfferPlan={setPlanInvoiceId} 
        />
      )}
    </div>
  );
}

function TabButton({ id, active, onClick, children }: {
  id: string; active: boolean; onClick: () => void; children: string;
}) {
  return (
    <button
      id={`tab-${id}`}
      role="tab"
      aria-selected={active}
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
