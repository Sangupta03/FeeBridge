import { useEffect } from 'react';
import { useAppStore } from './store/useAppStore';
import type { Role } from './types';
import OfficeDashboard from './features/admin';
import ParentWallet from './features/parent';

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
        {user.role === 'admin' && <OfficeDashboard />}
        {user.role === 'parent' && <ParentWallet />}
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
