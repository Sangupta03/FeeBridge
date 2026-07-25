import { useEffect, useState } from 'react';
import {
  GraduationCap, Building2, Wallet, Banknote, Wifi, WifiOff, Lightbulb, Sun, Moon,
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
  const { init, ready, user, signInAs, signOut, data, toggleOffline, theme, setTheme } = useAppStore();

  useEffect(() => { init(); }, [init]);

  // Inject theme class on HTML element
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // the data connection only opens once we have a user (see store/useAppStore.ts),
  // so an unsigned-in visitor must see the role picker before any loading check
  if (!user) return <RolePicker onPick={signInAs} />;

  if (!ready || !data) {
    return <div className="grid min-h-screen place-items-center text-muted">Loading FeeBridge…</div>;
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-line bg-white/70 dark:bg-[#121614]/70 backdrop-blur transition-colors duration-300">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <span className="grid h-8 w-8 flex-none place-items-center rounded-full bg-brand text-cream sm:h-9 sm:w-9">
              <GraduationCap size={16} strokeWidth={2.25} />
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="truncate font-serif text-base font-bold text-ink sm:text-xl">FeeBridge</span>
                <span
                  className="hidden flex-none rounded-full bg-paper2 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-muted sm:inline"
                  title="This school and its data are seeded for the demo, not real"
                >
                  Demo data
                </span>
              </div>
              <div className="hidden text-xs text-muted sm:block">Green Valley School · Term 2 2026</div>
            </div>
          </div>
          <div className="flex flex-none items-center gap-2 sm:gap-3">
            <button
              onClick={toggleOffline}
              className={data.online ? 'btn-ghost gap-1.5 px-2 sm:px-4' : 'btn gap-1.5 bg-terra px-2 text-white sm:px-4'}
              title="Demo: pretend the internet went away"
              aria-label={data.online ? 'Online. Click to simulate going offline.' : `Offline, ${data.queuedWrites} queued. Click to reconnect.`}
            >
              {data.online ? <Wifi size={14} aria-hidden="true" /> : <WifiOff size={14} aria-hidden="true" />}
              <span className="hidden sm:inline">
                {data.online ? 'Online' : `Offline · ${data.queuedWrites} queued`}
              </span>
            </button>
            <div className="hidden text-right sm:block">
              <div className="text-sm font-semibold text-ink">{user.name}</div>
              <div className="text-xs capitalize text-muted">{user.role}</div>
            </div>
            
            {/* Theme Toggle Button */}
            <button
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              className="p-2 rounded-full hover:bg-paper2 dark:hover:bg-[#1a201d] transition-colors border border-line text-ink cursor-pointer"
              title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            >
              {theme === 'light' ? <Moon size={15} /> : <Sun size={15} />}
            </button>

            <button onClick={signOut} className="btn-ghost px-2 sm:px-4">Switch</button>
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
  const theme = useAppStore((s) => s.theme);
  const setTheme = useAppStore((s) => s.setTheme);

  // 3D Parallax state tracking
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [tiltStyle, setTiltStyle] = useState<React.CSSProperties>({});

  // Setup theme in HTML inside picker too
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  return (
    <div className="min-h-screen flex flex-col justify-between py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden transition-colors duration-300">
      
      {/* Background blobs for premium depth */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-brand/10 dark:bg-brand/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-terra/10 dark:bg-terra/20 rounded-full blur-[140px] pointer-events-none" />

      {/* Header theme toggle */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
        <button
          onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          className="p-2 rounded-full hover:bg-paper2 dark:hover:bg-[#1a201d] transition-all border border-line text-ink cursor-pointer bg-white/40 dark:bg-[#151a17]/40 backdrop-blur-sm shadow-sm"
          title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
        >
          {theme === 'light' ? <Moon size={15} /> : <Sun size={15} />}
        </button>
      </div>

      <div className="max-w-4xl mx-auto w-full space-y-12 my-auto z-10">
        
        {/* Logo and Tagline */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-3 bg-brand/10 dark:bg-brand/20 border border-brand/25 px-4 py-1.5 rounded-full text-brand animate-pulse">
            <GraduationCap size={16} strokeWidth={2.25} />
            <span className="text-[11px] font-bold uppercase tracking-wider">FeeBridge Genius Active</span>
          </div>
          
          <h1 className="font-serif text-5xl sm:text-6xl font-bold tracking-tight text-ink">
            Empathetic Fee Management
          </h1>
          <p className="max-w-2xl mx-auto text-base sm:text-lg text-body">
            Predict late payment risk using in-browser machine learning and offer custom installment plans automatically. Empowering parents, reassuring schools.
          </p>
        </div>

        {/* Roles Selection Cards */}
        <div className="space-y-4">
          <h2 className="label-caps text-center">Select Role Portal</h2>
          <div className="grid gap-6 sm:grid-cols-3">
            {ROLES.map(({ role, label, blurb, icon: Icon }, idx) => (
              <button
                key={role}
                onClick={() => { void onPick(role); }}
                onMouseMove={(e) => {
                  const card = e.currentTarget;
                  const rect = card.getBoundingClientRect();
                  const x = e.clientX - rect.left;
                  const y = e.clientY - rect.top;
                  const xc = rect.width / 2;
                  const yc = rect.height / 2;
                  const rotateY = ((x - xc) / xc) * 16;
                  const rotateX = -((y - yc) / yc) * 16;
                  setTiltStyle({
                    transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`,
                    transition: 'transform 0.05s ease-out',
                    transformStyle: 'preserve-3d',
                  });
                  setHoveredIdx(idx);
                }}
                onMouseLeave={() => {
                  setTiltStyle({
                    transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
                    transition: 'transform 0.35s ease-out',
                  });
                  setHoveredIdx(null);
                }}
                style={hoveredIdx === idx ? tiltStyle : undefined}
                className="card p-6 text-left flex flex-col justify-between min-h-[170px] cursor-pointer hover:border-brand transition-shadow duration-300"
              >
                <div className="space-y-4" style={{ transformStyle: 'preserve-3d' }}>
                  <span 
                    className="grid h-10 w-10 place-items-center rounded-xl bg-mint text-brand dark:bg-mint/10 dark:text-brand-mid"
                    style={{ 
                      transform: hoveredIdx === idx ? 'translateZ(45px)' : 'translateZ(0px)', 
                      transition: 'transform 0.15s ease-out' 
                    }}
                  >
                    <Icon size={20} strokeWidth={2} />
                  </span>
                  <div style={{ transform: hoveredIdx === idx ? 'translateZ(25px)' : 'translateZ(0px)', transition: 'transform 0.15s ease-out' }}>
                    <h3 className="font-serif text-xl font-bold text-ink leading-snug">{label}</h3>
                    <p className="mt-1 text-xs text-body leading-relaxed">{blurb}</p>
                  </div>
                </div>
                <div 
                  className="text-[10px] font-bold text-brand uppercase tracking-wider mt-4 flex items-center gap-1"
                  style={{ 
                    transform: hoveredIdx === idx ? 'translateZ(35px)' : 'translateZ(0px)', 
                    transition: 'transform 0.15s ease-out' 
                  }}
                >
                  Enter portal &rarr;
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Features Pitch List */}
        <div className="grid gap-6 border-t border-line/50 pt-8 sm:grid-cols-3">
          {WHY.map(({ icon: Icon, title, body }) => (
            <div key={title} className="flex gap-3 bg-white/20 dark:bg-[#151a17]/20 border border-line/30 rounded-xl p-4 backdrop-blur-xs">
              <span className="mt-0.5 grid h-8 w-8 flex-none place-items-center rounded-lg bg-peach text-terra-dark dark:bg-peach/10">
                <Icon size={16} strokeWidth={2} />
              </span>
              <div>
                <h4 className="text-xs font-bold text-ink">{title}</h4>
                <p className="mt-1 text-[11px] text-body leading-relaxed">{body}</p>
              </div>
            </div>
          ))}
        </div>

      </div>

      <div className="text-center text-[10px] text-muted max-w-md mx-auto z-10 pt-8">
        Green Valley School Term 2 Demo • Powered by client-side Logistic Regression.
      </div>
    </div>
  );
}
