'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getSession, switchMode, homeForMode, onAuthChange, type Role, type Session } from '@/lib/session';

/**
 * Lets a multi-role account flip its active dashboard mode (Customer | Provider),
 * plus an Admin link when the account is staff. Renders nothing for single-role
 * (non-admin) accounts. Stays live via onAuthChange.
 */
export function ModeSwitch() {
  const locale = (useParams().locale as string) ?? 'en';
  const [session, setSession] = useState<Session | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const sync = () => setSession(getSession());
    sync();
    return onAuthChange(sync);
  }, []);

  if (!session) return null;

  const hasCustomer = session.roles.includes('customer');
  const hasProvider = session.roles.includes('provider');
  const hasAdmin = session.roles.includes('admin');
  const showToggle = hasCustomer && hasProvider;

  // Only an admin chip, or a single non-admin role → no toggle worth showing.
  if (!showToggle && !hasAdmin) return null;

  async function go(target: Role) {
    if (busy || session?.mode === target) return;
    setBusy(true);
    try {
      await switchMode(target);
      window.location.href = homeForMode(locale, target);
    } catch {
      setBusy(false);
    }
  }

  const seg = (target: Role, label: string) => {
    const active = session!.mode === target;
    return (
      <button
        key={target}
        type="button"
        onClick={() => go(target)}
        disabled={busy}
        aria-pressed={active}
        className={`rounded-base px-3 py-1 text-xs font-medium transition disabled:opacity-50 ${
          active
            ? 'bg-white text-primary shadow-sm dark:bg-gray-700'
            : 'text-gray-500 hover:text-primary dark:text-gray-400'
        }`}
      >
        {label}
      </button>
    );
  };

  return (
    <div className="flex items-center gap-2">
      {showToggle && (
        <div
          role="group"
          aria-label="Switch dashboard mode"
          className="flex items-center gap-1 rounded-base bg-gray-100 p-0.5 dark:bg-gray-800"
        >
          {seg('customer', 'Customer')}
          {seg('provider', 'Provider')}
        </div>
      )}
      {hasAdmin && (
        <button
          type="button"
          onClick={() => go('admin')}
          disabled={busy}
          aria-pressed={session.mode === 'admin'}
          className={`rounded-full px-2.5 py-1 text-xs font-medium transition disabled:opacity-50 ${
            session.mode === 'admin'
              ? 'bg-primary text-white'
              : 'bg-primary/10 text-primary hover:bg-primary/20 dark:bg-primary/20'
          }`}
        >
          Admin
        </button>
      )}
    </div>
  );
}
