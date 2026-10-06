import { BRAND } from '@food/config';
import { useEffect, useState, type ReactNode } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router';
import { useAuth } from '../lib/auth';
import { cx } from '../lib/cx';
import { IconButton } from './Button';
import { IconCup, IconDashboard, IconFlame, IconGrid, IconLogout, IconMenu, IconReceipt, IconX } from './Icons';

const NAV: Array<{ to: string; label: string; icon: ReactNode; end?: boolean }> = [
  { to: '/', label: 'Dashboard', icon: <IconDashboard />, end: true },
  { to: '/orders', label: 'Orders', icon: <IconReceipt /> },
  { to: '/products', label: 'Products', icon: <IconCup /> },
  { to: '/categories', label: 'Categories', icon: <IconGrid /> },
];

export function Wordmark({ tone = 'light' }: { tone?: 'light' | 'dark' }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex size-8 items-center justify-center rounded-lg bg-caramel text-espresso">
        <IconFlame size={18} />
      </span>
      <div className="leading-none">
        <span
          className={cx(
            'block font-display text-[22px] font-semibold tracking-tight',
            tone === 'light' ? 'text-cream' : 'text-espresso',
          )}
        >
          {BRAND.name}
        </span>
        <span
          className={cx(
            'mt-0.5 block text-[10px] font-bold tracking-[0.18em] uppercase',
            tone === 'light' ? 'text-beige' : 'text-gold',
          )}
        >
          Admin
        </span>
      </div>
    </div>
  );
}

function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { user, logout } = useAuth();
  const initials = (user?.name ?? 'A')
    .split(/\s+/)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex h-full flex-col bg-espresso text-cream">
      <div className="px-5 pt-6 pb-8">
        <Wordmark />
      </div>

      <nav aria-label="Main" className="flex-1 px-3">
        <ul className="space-y-1">
          {NAV.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.end}
                onClick={onNavigate}
                className={({ isActive }) =>
                  cx(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors',
                    'focus-visible:outline-beige',
                    isActive ? 'bg-caramel/15 text-white' : 'text-cream/70 hover:bg-white/5 hover:text-cream',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <span className={isActive ? 'text-caramel' : 'text-cream/50'}>{item.icon}</span>
                    {item.label}
                    {isActive && <span aria-hidden="true" className="ml-auto size-1.5 rounded-full bg-caramel" />}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="border-t border-white/10 p-3">
        <div className="flex items-center gap-3 rounded-lg px-2 py-2">
          <span
            aria-hidden="true"
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-beige text-[13px] font-bold text-espresso"
          >
            {initials}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-cream">{user?.name}</p>
            <p className="truncate text-xs text-cream/55">{user?.email}</p>
          </div>
          <button
            type="button"
            onClick={() => void logout()}
            aria-label="Sign out"
            title="Sign out"
            className="rounded-lg p-2 text-cream/60 transition-colors hover:bg-white/10 hover:text-cream focus-visible:outline-beige"
          >
            <IconLogout />
          </button>
        </div>
      </div>
    </div>
  );
}

export function Layout() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => setOpen(false), [location.pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <div className="min-h-dvh">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[70] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:font-semibold"
      >
        Skip to content
      </a>

      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 lg:block">
        <Sidebar />
      </aside>

      {/* Tablet / mobile top bar + drawer */}
      <div className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-white/10 bg-espresso px-4 lg:hidden">
        <IconButton
          label="Open navigation"
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen(true)}
          className="text-cream/80 hover:bg-white/10 hover:text-cream"
        >
          <IconMenu />
        </IconButton>
        <Wordmark />
      </div>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
          <div className="absolute inset-0 bg-espresso/50" onClick={() => setOpen(false)} aria-hidden="true" />
          <div id="mobile-nav" className="absolute inset-y-0 left-0 w-64 shadow-2xl">
            <Sidebar onNavigate={() => setOpen(false)} />
            <IconButton
              label="Close navigation"
              autoFocus
              onClick={() => setOpen(false)}
              className="absolute top-5 right-3 text-cream/70 hover:bg-white/10 hover:text-cream"
            >
              <IconX />
            </IconButton>
          </div>
        </div>
      )}

      <main id="main" className="lg:pl-60">
        <div className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
