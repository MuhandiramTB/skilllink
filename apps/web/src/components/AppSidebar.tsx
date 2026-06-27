'use client';

import { useEffect, useState } from 'react';
import { useParams, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { getSession, clearToken, becomeProvider, homeForMode, onAuthChange, type Session } from '@/lib/session';
import { NAV, ICONS } from './nav-config';
import { ModeSwitch } from './ModeSwitch';

/**
 * Unified role-aware navigation.
 *  - Desktop (md+): a persistent left rail, grouped, with the active item highlighted.
 *  - Mobile: hidden here (the bottom tab bar handles primary nav); the same menu is
 *    available via the hamburger drawer (see AppMobileMenu) which reuses NavBody.
 * One nav-config drives every surface so they never drift apart.
 */

function NavBody({ onNavigate }: { onNavigate?: () => void }) {
  const locale = (useParams().locale as string) ?? 'en';
  const pathname = usePathname();
  const t = useTranslations('nav');
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    const sync = () => setSession(getSession());
    sync();
    return onAuthChange(sync);
  }, []);

  if (!session) return null;
  const nav = NAV[session.mode] ?? NAV.customer;

  // A customer who isn't yet a provider gets a clear upgrade path in the nav.
  const canBecomeProvider = session.mode === 'customer' && !session.roles.includes('provider');
  async function goProvider() {
    try {
      const s = await becomeProvider();
      window.location.href = homeForMode(locale, s.mode);
    } catch { /* surfaced on the dashboard; nav stays put */ }
  }

  return (
    <nav className="space-y-6" aria-label="Main navigation">
      {/* Mode toggle now lives in the nav (sidebar + drawer), not the header. */}
      <div className="px-1"><ModeSwitch /></div>
      {nav.groups.map((g) => (
        <div key={g.titleKey}>
          <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400">{t(g.titleKey)}</p>
          <ul className="space-y-0.5">
            {g.items.map((it) => {
              const href = `/${locale}${it.path}`;
              const active = pathname === href;
              return (
                <li key={it.labelKey}>
                  <a
                    href={href}
                    onClick={onNavigate}
                    aria-current={active ? 'page' : undefined}
                    className={`flex min-h-[44px] items-center gap-3 rounded-base px-3 text-sm transition ${
                      active
                        ? 'bg-primary/10 font-medium text-primary dark:bg-primary/20'
                        : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                    }`}
                  >
                    {ICONS[it.icon]}
                    <span>{t(it.labelKey)}</span>
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
      {canBecomeProvider && (
        <div className="border-t pt-4 dark:border-gray-700">
          <button
            onClick={() => { onNavigate?.(); void goProvider(); }}
            className="flex min-h-[44px] w-full items-center gap-3 rounded-base bg-accent/10 px-3 text-sm font-medium text-accent transition hover:bg-accent/20"
          >
            {ICONS.briefcase}
            <span>{t('becomeProvider')}</span>
          </button>
        </div>
      )}
      <button
        onClick={() => { clearToken(); window.location.href = `/${locale}`; }}
        className="flex min-h-[44px] w-full items-center gap-3 rounded-base px-3 text-sm text-gray-500 hover:bg-gray-100 hover:text-danger dark:hover:bg-gray-800"
      >
        {ICONS.user}
        <span>{t('signOut')}</span>
      </button>
    </nav>
  );
}

/** Desktop-only fixed left rail. Renders nothing when signed out. */
export function AppSidebar() {
  const [authed, setAuthed] = useState(false);
  useEffect(() => {
    const sync = () => setAuthed(!!getSession());
    sync();
    return onAuthChange(sync);
  }, []);
  if (!authed) return null;
  return (
    <aside className="hidden w-60 shrink-0 border-r p-4 md:block dark:border-gray-700">
      <NavBody />
    </aside>
  );
}

export { NavBody };
