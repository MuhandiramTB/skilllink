'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getSession, clearToken, onAuthChange, type Role, type Session } from '@/lib/session';

const ROLE_LABEL: Record<Role, string> = { customer: 'Customer', provider: 'Provider', admin: 'Admin' };

/** Shows sign-in link when logged out, or active mode + sign-out when logged in.
 *  Live-refreshes on login/logout (same tab and across tabs) — no stale session. */
export function HeaderAuth() {
  const locale = (useParams().locale as string) ?? 'en';
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    const sync = () => setSession(getSession());
    sync();
    return onAuthChange(sync);
  }, []);

  if (!session) {
    return (
      <a href={`/${locale}/login`} className="text-xs font-medium text-primary hover:underline">
        Sign in
      </a>
    );
  }

  return (
    <span className="flex items-center gap-2 text-xs">
      <span className="rounded-full bg-primary/10 px-2 py-0.5 font-medium text-primary dark:bg-primary/20">
        {ROLE_LABEL[session.mode]}
      </span>
      <button
        onClick={() => { clearToken(); window.location.href = `/${locale}`; }}
        className="text-gray-500 hover:text-danger dark:text-gray-400"
      >
        Sign out
      </button>
    </span>
  );
}
