'use client';

import { useEffect, useState } from 'react';
import { useParams, usePathname } from 'next/navigation';
import { getSession, onAuthChange } from '@/lib/session';
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

  // No second header here — the global shell owns the top bar (logo + mode switch)
  // and the bottom tab bar. The dashboard layout now only guards + renders content.
  return <>{children}</>;
}
