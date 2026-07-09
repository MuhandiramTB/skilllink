'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { createPortal } from 'react-dom';
import { safetyApi } from '@/lib/safety-api';

/**
 * Trust & Safety SOS (product analysis gap #4). Shown during an active in-home job.
 * Tapping opens a confirm sheet; confirming records a safety alert, notifies the
 * customer's trusted contacts, and offers a one-tap call to local emergency (119)
 * and to each trusted contact. Deliberately high-contrast and hard to mis-trigger.
 */
export function SafetyButton({ bookingId }: { bookingId?: string }) {
  const t = useTranslations('safety');
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState<{ name: string; phone: string }[] | null>(null);

  async function raise() {
    setSending(true);
    try {
      // Attach GPS if the user allows it (best-effort, non-blocking).
      const coords = await new Promise<{ lat?: number; lng?: number }>((resolve) => {
        if (!('geolocation' in navigator)) return resolve({});
        navigator.geolocation.getCurrentPosition(
          (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
          () => resolve({}),
          { timeout: 5000 },
        );
      });
      const res = await safetyApi.raiseAlert({ bookingId, ...coords });
      setSent(res.contacts);
    } catch {
      setSent([]); // still show the emergency-call options even if the record failed
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => { setOpen(true); setSent(null); }}
        className="inline-flex items-center gap-1.5 rounded-full border border-danger/30 bg-danger/10 px-3 py-1.5 text-xs font-bold text-danger transition hover:bg-danger/20"
      >
        <svg viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5" aria-hidden="true"><path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5m.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2" /></svg>
        {t('sos')}
      </button>

      {open && createPortal(
        <div className="fixed inset-0 z-[130] flex items-end justify-center p-4 sm:items-center" role="alertdialog" aria-modal="true" aria-label={t('sosTitle')}>
          <button type="button" aria-label={t('close')} tabIndex={-1} className="absolute inset-0 cursor-default bg-ink/60 backdrop-blur-sm" onClick={() => !sending && setOpen(false)} />
          <div className="relative z-10 w-full max-w-sm rounded-xl2 border border-line bg-white p-6 text-center shadow-lift dark:border-gray-800 dark:bg-gray-900">
            {!sent ? (
              <>
                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-danger/12 text-danger [&>svg]:h-7 [&>svg]:w-7" aria-hidden="true">
                  <svg viewBox="0 0 16 16" fill="currentColor"><path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5m.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2" /></svg>
                </span>
                <h2 className="mt-4 font-display text-lg font-bold text-ink dark:text-gray-50">{t('sosTitle')}</h2>
                <p className="mt-1.5 text-sm text-slate">{t('sosBody')}</p>
                <div className="mt-6 flex flex-col gap-2">
                  <button type="button" onClick={raise} disabled={sending} className="flex items-center justify-center gap-2 rounded-base bg-danger px-5 py-3 text-sm font-bold text-white transition hover:brightness-110 active:translate-y-px disabled:opacity-60">
                    {sending && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" />}
                    {sending ? t('sosSending') : t('sosConfirm')}
                  </button>
                  <a href="tel:119" className="rounded-base border border-danger/30 px-5 py-3 text-sm font-bold text-danger transition hover:bg-danger/10">{t('call119')}</a>
                  <button type="button" onClick={() => setOpen(false)} disabled={sending} className="rounded-base px-5 py-2.5 text-sm font-medium text-slate hover:text-ink dark:hover:text-gray-200">{t('cancel')}</button>
                </div>
              </>
            ) : (
              <>
                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success/12 text-success [&>svg]:h-7 [&>svg]:w-7" aria-hidden="true">
                  <svg viewBox="0 0 16 16" fill="currentColor"><path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0m-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z" /></svg>
                </span>
                <h2 className="mt-4 font-display text-lg font-bold text-ink dark:text-gray-50">{t('sosSentTitle')}</h2>
                <p className="mt-1.5 text-sm text-slate">
                  {sent.length ? t('sosSentContacts', { count: sent.length }) : t('sosSentNoContacts')}
                </p>
                <div className="mt-6 flex flex-col gap-2">
                  <a href="tel:119" className="rounded-base bg-danger px-5 py-3 text-sm font-bold text-white transition hover:brightness-110">{t('call119')}</a>
                  {sent.map((c) => (
                    <a key={c.phone} href={`tel:${c.phone}`} className="rounded-base border border-line px-5 py-2.5 text-sm font-semibold text-ink transition hover:border-primary dark:border-gray-700 dark:text-gray-100">
                      {t('callContact', { name: c.name })}
                    </a>
                  ))}
                  <button type="button" onClick={() => setOpen(false)} className="rounded-base px-5 py-2.5 text-sm font-medium text-slate hover:text-ink dark:hover:text-gray-200">{t('close')}</button>
                </div>
              </>
            )}
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
