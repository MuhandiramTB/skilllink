'use client';

import { useEffect, useState } from 'react';
import { useParams, usePathname } from 'next/navigation';
import { getSession, onAuthChange } from '@/lib/session';
import { ModeSwitch } from '@/components/ModeSwitch';
import { HeaderAuth } from '@/components/HeaderAuth';
import { Spinner } from '@/components/ui';

/**
 * Authenticated dashboard shell. Guards the whole /dashboard subtree: redirects to
 * login (with ?next=) when signed out, and never flashes protected content while
 * the auth check runs. Per-mode pages handle their own mode-mismatch redirects.
 */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const locale = (useParams().locale as string) ?? 'en';
  const pathname = usePathname();
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    const check = () => {
      const s = getSession();
      if (!s) {
        window.location.href = `/${locale}/login?next=${encodeURIComponent(pathname)}`;
        return;
      }
      setAuthed(true);
    };
    check();
    return onAuthChange(check);
  }, [locale, pathname]);

  if (!authed) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner label="Loading your dashboard…" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b pb-4 dark:border-gray-700">
        <span className="font-display text-lg font-bold text-primary">SkillLink LK</span>
        <div className="flex flex-wrap items-center gap-3">
          <ModeSwitch />
          <HeaderAuth />
        </div>
      </div>
      {children}
    </div>
  );
}
