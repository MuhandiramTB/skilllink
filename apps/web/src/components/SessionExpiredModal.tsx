'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { createPortal } from 'react-dom';
import { onSessionExpired } from '@/lib/api-error';
import { clearToken, getSession } from '@/lib/session';

/**
 * Global session-expiry handler. Listens for the session-expired event any API
 * client fires on a 401, and shows a clear modal with a "Sign in" button instead
 * of a raw "UNAUTHORIZED" string leaking into a page. Mounted once in the layout.
 */
export function SessionExpiredModal() {
  const locale = (useParams().locale as string) ?? 'en';
  const t = useTranslations('session');
  const [reason, setReason] = useState<null | 'expired' | 'suspended'>(null);
  const [wasAdmin, setWasAdmin] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => onSessionExpired((r) => {
    // Capture the role from the (still-present) token BEFORE it's cleared, so we
    // can route back to the right login: admin → /admin/login, others → /login.
    setWasAdmin(getSession()?.roles.includes('admin') ?? false);
    setReason(r);
  }), []);

  if (!mounted || !reason) return null;

  function signIn() {
    clearToken();
    window.location.href = wasAdmin ? `/${locale}/admin/login` : `/${locale}/login`;
  }

  return createPortal(
    <div className="fixed inset-0 z-[130] flex items-center justify-center p-4" role="alertdialog" aria-modal="true" aria-label={t('title')}>
      <div className="absolute inset-0 bg-ink/50 backdrop-blur-sm" aria-hidden="true" />
      <div className="relative z-10 w-full max-w-sm rounded-xl2 border border-line bg-white p-6 text-center shadow-lift dark:border-gray-800 dark:bg-gray-900">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-warn/12 text-warn" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7">
            <path d="M12 8v4M12 16h.01M10.3 3.9l-8 14A2 2 0 004 21h16a2 2 0 001.7-3l-8-14a2 2 0 00-3.4 0z" />
          </svg>
        </span>
        <h2 className="mt-4 font-display text-lg font-bold text-ink dark:text-gray-50">
          {reason === 'suspended' ? t('suspendedTitle') : t('title')}
        </h2>
        <p className="mt-1.5 text-sm text-slate">
          {reason === 'suspended' ? t('suspendedBody') : t('body')}
        </p>
        <button
          onClick={signIn}
          className="mt-6 w-full rounded-base bg-primary px-6 py-3 text-sm font-bold text-white transition-all hover:bg-primary-700 active:translate-y-px"
        >
          {t('signIn')}
        </button>
      </div>
    </div>,
    document.body,
  );
}
