import { useEffect } from 'react';
import { useAppStore, useForecast } from './store/useAppStore';
import { inr, inrShort, dueCopy } from './lib/format';
import { outstandingOf } from './domain/reconcile';
import { bandCopy } from './domain/risk';
import type { Role } from './types';

/**
 * Starter shell.
 *
 * This is deliberately small: it proves the whole spine works end to end
 * (repository -> store -> engines -> UI) on day one. The real screens get built
 * on top of it in the phases described in docs/BUILD_PHASES.md.
 */

const ROLES: Array<{ role: Role; label: string; blurb: string }> = [
  { role: 'admin',  label: 'The office',     blurb: 'See every rupee, and who needs help' },
  { role: 'parent', label: 'A parent',       blurb: 'One balance for all your children' },
  { role: 'clerk',  label: 'The front desk', blurb: 'Take cash and cheque, even offline' },
];

export default function App() {
  const { init, ready, user, signInAs, signOut, data, toggleOffline } = useAppStore();

  useEffect(() => { init(); }, [init]);

  if (!ready || !data) {
    return <div className="grid min-h-screen place-items-center text-muted">Loading FeeBridge…</div>;
  }

  if (!user) return <RolePicker onPick={signInAs} />;

  return (
    <div className="min-h-screen">
      <header className="border-b border-line bg-white/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <div className="font-serif text-xl font-bold text-ink">FeeBridge</div>
            <div className="text-xs text-muted">Green Valley School · Term 2 2026</div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleOffline}
              className={data.online ? 'btn-ghost' : 'btn bg-terra text-white'}
              title="Demo: pretend the internet went away"
            >
              {data.online ? 'Online' : `Offline · ${data.queuedWrites} queued`}
            </button>
            <div className="text-right">
              <div className="text-sm font-semibold text-ink">{user.name}</div>
              <div className="text-xs capitalize text-muted">{user.role}</div>
            </div>
            <button onClick={signOut} className="btn-ghost">Switch</button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        {user.role === 'admin' && <OfficeStarter />}
        {user.role === 'parent' && <ParentStarter />}
        {user.role === 'clerk' && <ClerkStarter />}
      </main>
    </div>
  );
}

function RolePicker({ onPick }: { onPick: (r: Role) => Promise<void> }) {
  return (
    <div className="grid min-h-screen place-items-center px-6">
      <div className="w-full max-w-3xl">
        <h1 className="font-serif text-4xl font-bold">FeeBridge</h1>
        <p className="mt-2 text-lg text-body">
          A calmer, kinder way for schools to handle fees, and for families to pay them.
        </p>
        <p className="mt-6 label-caps">Sign in as</p>
        <div className="mt-3 grid gap-4 sm:grid-cols-3">
          {ROLES.map(({ role, label, blurb }) => (
            <button
              key={role}
              onClick={() => { void onPick(role); }}
              className="card p-5 text-left transition hover:border-brand"
            >
              <div className="font-serif text-xl font-bold text-ink">{label}</div>
              <div className="mt-1 text-sm text-body">{blurb}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function OfficeStarter() {
  const data = useAppStore((s) => s.data)!;
  const profiles = useAppStore((s) => s.riskProfiles());
  const offerPlan = useAppStore((s) => s.offerPlan);
  const forecast = useForecast();

  const atRisk = Object.values(profiles)
    .filter((p) => p.result.band !== 'healthy')
    .sort((a, b) => a.result.score - b.result.score);

  return (
    <div className="space-y-8">
      <section className="grid gap-4 sm:grid-cols-3">
        <Stat label="Outstanding this term" value={inrShort(forecast.totalOutstanding)} />
        <Stat
          label="Expected to come in"
          value={inrShort(forecast.expected)}
          hint={`${Math.round(forecast.confidence * 100)}% confidence · ${inrShort(forecast.low)}–${inrShort(forecast.high)}`}
        />
        <Stat label="Families needing help" value={String(atRisk.length)} />
      </section>

      <section>
        <h2 className="text-2xl font-bold">Families worth a quiet word</h2>
        <p className="mt-1 text-sm text-muted">
          Flagged before the due date, so there is still time to help.
        </p>
        <div className="mt-4 space-y-3">
          {atRisk.map((p) => {
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
                      <button className="btn-primary" onClick={() => offerPlan(invoice.id)}>
                        Offer a plan
                      </button>
                    )}
                  </div>
                </div>
                {/* explainability: never flag without saying why */}
                <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-body">
                  {p.result.reasons.map((r) => (
                    <li key={r.code}>· {r.label}</li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </section>

      {data.plans.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold">Plans offered</h2>
          <div className="mt-3 space-y-2">
            {data.plans.map((plan) => (
              <div key={plan.id} className="card-flat p-4">
                <div className="text-sm text-muted">{plan.reason}</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {plan.installments.map((i) => (
                    <span key={i.seq} className="rounded bg-mint px-3 py-1 text-sm font-semibold text-ink">
                      {inr(i.amount)} · {new Date(i.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function ParentStarter() {
  const data = useAppStore((s) => s.data)!;
  const user = useAppStore((s) => s.user)!;
  const balance = useAppStore((s) => s.familyBalance(user.familyId!));
  const kids = data.students.filter((s) => s.familyId === user.familyId);

  return (
    <div className="max-w-xl space-y-6">
      <div className="card p-6">
        <div className="label-caps">Your family balance</div>
        <div className="mt-1 font-serif text-5xl font-bold text-ink">{inr(balance)}</div>
        <div className="mt-1 text-sm text-muted">
          Covering {kids.length} {kids.length === 1 ? 'child' : 'children'} · one payment
        </div>
      </div>
      <div className="space-y-2">
        {data.invoices
          .filter((i) => i.familyId === user.familyId && outstandingOf(i) > 0)
          .map((i) => {
            const kid = data.students.find((s) => s.id === i.studentId);
            return (
              <div key={i.id} className="card-flat flex items-center justify-between p-4">
                <div>
                  <div className="font-semibold text-ink">{kid?.name}</div>
                  <div className="text-sm text-muted">{i.title} · {dueCopy(i.dueDate)}</div>
                </div>
                <div className="font-semibold">{inr(outstandingOf(i))}</div>
              </div>
            );
          })}
      </div>
      <p className="text-sm text-muted">Phase 3 adds the UPI QR code here.</p>
    </div>
  );
}

function ClerkStarter() {
  const data = useAppStore((s) => s.data)!;
  const pending = data.payments.filter((p) => p.pending).length;
  return (
    <div className="max-w-xl space-y-4">
      <div className="card p-6">
        <h2 className="text-2xl font-bold">Cash desk</h2>
        <p className="mt-1 text-sm text-body">
          {data.online
            ? 'Connected. Payments save straight away.'
            : `Working offline. ${pending} payment${pending === 1 ? '' : 's'} waiting to sync.`}
        </p>
      </div>
      <p className="text-sm text-muted">Phase 4 adds the cash entry form and Needs Review pile.</p>
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="card p-5">
      <div className="label-caps">{label}</div>
      <div className="mt-1 font-serif text-3xl font-bold text-ink">{value}</div>
      {hint && <div className="mt-1 text-xs text-muted">{hint}</div>}
    </div>
  );
}
