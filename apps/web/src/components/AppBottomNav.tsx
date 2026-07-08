'use client';

import { useEffect, useState } from 'react';
import { useParams, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { getSession, onAuthChange, type Session } from '@/lib/session';
import { NAV, ICONS } from './nav-config';

/**
 * The single bottom navigation for signed-in mobile users. Role-aware: the tabs come
 * from the SHARED nav-config (NAV[mode].tabs) — the same source as the sidebar/drawer —
 * so paths can never drift. A "You" tab (→ profile) is appended. Fixed, 56px tall,
 * hidden on desktop (md+). Renders nothing when signed out.
 */
export function AppBottomNav() {
  const locale = (useParams().locale as string) ?? 'en';
  const pathname = usePathname();
  const t = useTranslations('nav');
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    const sync = () => setSession(getSession());
    sync();
    return onAuthChange(sync);
  }, []);

  if (!session) return null; // public pages: no bottom nav

  const tabs = (NAV[session.mode] ?? NAV.customer).tabs;
  const profileHref = `/${locale}/profile`;
  const profileActive = pathname === profileHref;

  return (
    <nav
      aria-label="Primary"
      className="fixed bottom-0 left-1/2 z-40 flex w-full max-w-[480px] -translate-x-1/2 border-t border-line bg-white/80 backdrop-blur-xl md:hidden dark:border-gray-800 dark:bg-gray-900/80"
    >
      {tabs.map((tab) => {
        const href = `/${locale}${tab.path}`;
        const active = pathname === href;
        return (
          <a
            key={tab.labelKey}
            href={href}
            aria-current={active ? 'page' : undefined}
            className={`group flex min-h-[56px] flex-1 flex-col items-center justify-center gap-0.5 transition-colors active:bg-surface dark:active:bg-gray-800 ${
              active ? 'text-primary' : 'text-slate hover:text-ink dark:hover:text-gray-200'
            }`}
          >
            <span className={`flex h-8 w-14 items-center justify-center rounded-full transition-all ${active ? 'bg-primary/10 dark:bg-primary/15' : 'bg-transparent'}`}>{ICONS[tab.icon]}</span>
            <span className={`text-[11px] ${active ? 'font-semibold' : 'font-medium'}`}>{t(tab.labelKey)}</span>
          </a>
        );
      })}
      {/* Account tab → profile (sign-out lives inside the profile/sidebar). */}
      <a
        href={profileHref}
        aria-current={profileActive ? 'page' : undefined}
        className={`group flex min-h-[56px] flex-1 flex-col items-center justify-center gap-0.5 transition-colors active:bg-surface dark:active:bg-gray-800 ${
          profileActive ? 'text-primary' : 'text-slate hover:text-ink dark:hover:text-gray-200'
        }`}
      >
        <span className={`flex h-8 w-14 items-center justify-center rounded-full transition-all ${profileActive ? 'bg-primary/10 dark:bg-primary/15' : 'bg-transparent'}`}>{ICONS.user}</span>
        <span className={`text-[11px] ${profileActive ? 'font-semibold' : 'font-medium'}`}>{t('you')}</span>
      </a>
    </nav>
  );
}
