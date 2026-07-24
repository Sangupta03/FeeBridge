import { useEffect } from 'react';
import {
  GraduationCap, Building2, Wallet, Banknote, Wifi, WifiOff, Lightbulb,
  type LucideIcon,
} from 'lucide-react';
import { useAppStore } from './store/useAppStore';
import type { Role } from './types';
import OfficeDashboard from './features/admin';
import ParentWallet from './features/parent';
import ClerkDesk from './features/clerk';

/**
 * Starter shell.
 *
 * This is deliberately small: it proves the whole spine works end to end
 * (repository -> store -> engines -> UI) on day one. The real screens get built
 * on top of it in the phases described in docs/BUILD_PHASES.md.
 */

const ROLES: Array<{ role: Role; label: string; blurb: string; icon: LucideIcon }> = [
  { role: 'admin',  label: 'The office',     blurb: 'See every rupee, and who needs help', icon: Building2 },
  { role: 'parent', label: 'A parent',       blurb: 'One balance for all your children', icon: Wallet },
  { role: 'clerk',  label: 'The front desk', blurb: 'Take cash and cheque, even offline', icon: Banknote },
];

const WHY: Array<{ icon: LucideIcon; title: string; body: string }> = [
  {
    icon: Lightbulb,
    title: 'Explains itself',
    body: 'Every flag comes with its reasons, right on the card — never a black box the office has to trust blindly.',
  },
  {
    icon: Wallet,
    title: 'One family, one balance',
    body: "Siblings don't get separate reminders — a family sees and pays one number for everyone.",
  },
  {
    icon: WifiOff,
    title: 'Works when the wifi doesn’t',
    body: 'Cash and cheque entries save instantly offline, then reconcile themselves the moment the connection returns.',
  },
];

export default function App() {
  const { init, ready, user, signInAs, signOut, data, toggleOffline } = useAppStore();

  useEffect(() => { init(); }, [init]);

  // the data connection only opens once we have a user (see store/useAppStore.ts),
  // so an unsigned-in visitor must see the role picker before any loading check
  if (!user) return <RolePicker onPick={signInAs} />;

  if (!ready || !data) {
    return <div className="grid min-h-screen place-items-center text-muted">Loading FeeBridge…</div>;
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-line bg-white/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-brand text-cream">
              <GraduationCap size={18} strokeWidth={2.25} />
            </span>
            <div>
              <div className="font-serif text-xl font-bold text-ink">FeeBridge</div>
              <div className="text-xs text-muted">Green Valley School · Term 2 2026</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleOffline}
              className={data.online ? 'btn-ghost gap-1.5' : 'btn gap-1.5 bg-terra text-white'}
              title="Demo: pretend the internet went away"
            >
              {data.online ? <Wifi size={14} /> : <WifiOff size={14} />}
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
        {user.role === 'clerk' && <ClerkDesk />}
      </main>
    </div>
  );
}

function RolePicker({ onPick }: { onPick: (r: Role) => Promise<void> }) {
  return (
    <div className="min-h-screen px-6 pt-16 sm:pt-24">
      <div className="mx-auto w-full max-w-3xl">
        <div className="flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-brand text-cream">
            <GraduationCap size={24} strokeWidth={2.25} />
          </span>
          <h1 className="font-serif text-4xl font-bold">FeeBridge</h1>
        </div>
        <p className="mt-3 text-lg text-body">
          A calmer, kinder way for schools to handle fees, and for families to pay them.
        </p>
        <p className="mt-6 label-caps">Sign in as</p>
        <div className="mt-3 grid gap-4 sm:grid-cols-3">
          {ROLES.map(({ role, label, blurb, icon: Icon }) => (
            <button
              key={role}
              onClick={() => { void onPick(role); }}
              className="card p-5 text-left transition-all duration-150 hover:-translate-y-0.5 hover:border-brand hover:shadow-lg"
            >
              <span className="grid h-10 w-10 place-items-center rounded-full bg-mint text-brand-dark">
                <Icon size={19} strokeWidth={2.25} />
              </span>
              <div className="mt-3 font-serif text-xl font-bold text-ink">{label}</div>
              <div className="mt-1 text-sm text-body">{blurb}</div>
            </button>
          ))}
        </div>

        <div className="mt-10 grid gap-6 border-t border-line pt-8 sm:grid-cols-3">
          {WHY.map(({ icon: Icon, title, body }) => (
            <div key={title} className="flex gap-3">
              <span className="mt-0.5 grid h-8 w-8 flex-none place-items-center rounded-full bg-peach text-terra-dark">
                <Icon size={15} strokeWidth={2.25} />
              </span>
              <div>
                <div className="text-sm font-bold text-ink">{title}</div>
                <p className="mt-0.5 text-sm text-muted">{body}</p>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-8 text-xs text-muted">
          Seeded demo data for Green Valley School · nothing you do here is permanent.
        </p>
      </div>
    </div>
  );
}
