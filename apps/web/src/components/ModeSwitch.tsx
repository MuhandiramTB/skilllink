'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { createPortal } from 'react-dom';
import { getSession, switchMode, homeForMode, onAuthChange, type Role, type Session } from '@/lib/session';
import { ConfirmModal } from './ConfirmModal';
import { ICONS } from './nav-config';

/**
 * Lets a multi-role account flip its active dashboard mode (Customer | Provider),
 * plus an Admin link when the account is staff. Renders nothing for single-role
 * (non-admin) accounts. Switching is confirmed first, then shows a full-screen
 * loading state while the session flips and the target dashboard loads.
 */
export function ModeSwitch() {
  const locale = (useParams().locale as string) ?? 'en';
  const t = useTranslations('dash');
  const [session, setSession] = useState<Session | null>(null);
  const [pending, setPending] = useState<Role | null>(null); // target awaiting confirm
  const [switching, setSwitching] = useState(false);         // full-screen loading
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const sync = () => setSession(getSession());
    sync();
    return onAuthChange(sync);
  }, []);

  if (!session) return null;

  const hasCustomer = session.roles.includes('customer');
  const hasProvider = session.roles.includes('provider');
  const hasAdmin = session.roles.includes('admin');
  const showToggle = hasCustomer && hasProvider;

  if (!showToggle && !hasAdmin) return null;

  // Ask before switching (prevents an accidental flip mid-task).
  function request(target: Role) {
    if (switching || session?.mode === target) return;
    setPending(target);
  }

  async function confirmSwitch() {
    const target = pending;
    if (!target) return;
    setSwitching(true);
    try {
      await switchMode(target);
      window.location.href = homeForMode(locale, target);
    } catch {
      setSwitching(false);
      setPending(null);
    }
  }

  const roleLabel = (r: Role) => (r === 'customer' ? t('modeCustomer') : r === 'provider' ? t('modeProvider') : t('modeAdmin'));

  const seg = (target: Role, label: string) => {
    const active = session!.mode === target;
    return (
      <button
        key={target}
        type="button"
        onClick={() => request(target)}
        disabled={switching}
        aria-pressed={active}
        className={`rounded-base px-3 py-1 text-xs font-semibold transition disabled:opacity-50 ${
          active
            ? 'bg-white text-primary shadow-card dark:bg-gray-700'
            : 'text-slate hover:text-primary dark:text-gray-400'
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
          aria-label={t('switchMode')}
          className="flex items-center gap-1 rounded-base bg-surface p-0.5 dark:bg-gray-800"
        >
          {seg('customer', t('modeCustomer'))}
          {seg('provider', t('modeProvider'))}
        </div>
      )}
      {hasAdmin && (
        <button
          type="button"
          onClick={() => request('admin')}
          disabled={switching}
          aria-pressed={session.mode === 'admin'}
          className={`rounded-full px-2.5 py-1 text-xs font-semibold transition disabled:opacity-50 ${
            session.mode === 'admin'
              ? 'bg-primary text-white'
              : 'bg-primary/10 text-primary hover:bg-primary/20 dark:bg-primary/20'
          }`}
        >
          {t('modeAdmin')}
        </button>
      )}

      {/* Confirm before flipping mode. */}
      <ConfirmModal
        open={pending !== null && !switching}
        title={t('switchModeConfirmTitle', { mode: pending ? roleLabel(pending) : '' })}
        body={t('switchModeConfirmBody', { mode: pending ? roleLabel(pending) : '' })}
        confirmLabel={t('switchModeConfirmYes')}
        cancelLabel={t('cancel')}
        icon={ICONS.briefcase}
        onConfirm={confirmSwitch}
        onCancel={() => setPending(null)}
      />

      {/* Full-screen loading while the session flips + the dashboard loads. */}
      {mounted && switching && createPortal(
        <div className="fixed inset-0 z-[140] flex flex-col items-center justify-center gap-4 bg-surface/90 backdrop-blur-sm dark:bg-[#0A0B0F]/90" role="status" aria-live="polite">
          <span className="relative flex h-12 w-12 items-center justify-center" aria-hidden="true">
            <span className="absolute inset-0 rounded-full border-[3px] border-line dark:border-gray-800" />
            <span className="absolute inset-0 animate-spin rounded-full border-[3px] border-transparent border-t-primary" />
            <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
          </span>
          <p className="text-sm font-medium text-slate">
            {t('switchingTo', { mode: pending ? roleLabel(pending) : '' })}
          </p>
        </div>,
        document.body,
      )}
    </div>
  );
}
