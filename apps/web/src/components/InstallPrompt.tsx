'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { haptic } from '@/lib/haptics';

const DISMISS_KEY = 'skilllink_install_dismissed';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type BIPEvent = Event & { prompt: () => void; userChoice: Promise<{ outcome: string }> };

/**
 * PWA "Add to home screen" prompt. Listens for the browser's beforeinstallprompt,
 * then shows a tasteful bottom banner (once — dismissible, remembered). Makes the
 * app installable like a real native app; big retention lever on mobile-first SL.
 */
export function InstallPrompt() {
  const t = useTranslations('pwa');
  const [evt, setEvt] = useState<BIPEvent | null>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    try { if (localStorage.getItem(DISMISS_KEY)) return; } catch { /* ignore */ }
    const onBIP = (e: Event) => {
      e.preventDefault();
      setEvt(e as BIPEvent);
      // Delay so it doesn't fight onboarding / first paint.
      setTimeout(() => setShow(true), 3000);
    };
    window.addEventListener('beforeinstallprompt', onBIP);
    return () => window.removeEventListener('beforeinstallprompt', onBIP);
  }, []);

  function dismiss() {
    setShow(false);
    try { localStorage.setItem(DISMISS_KEY, '1'); } catch { /* ignore */ }
  }
  async function install() {
    if (!evt) return;
    haptic.tap();
    evt.prompt();
    await evt.userChoice.catch(() => {});
    dismiss();
  }

  if (!show || !evt) return null;
  return (
    <div className="fixed inset-x-3 bottom-3 z-[120] mx-auto max-w-sm rounded-xl2 border border-line bg-white p-3.5 shadow-lift dark:border-gray-800 dark:bg-gray-900 md:bottom-4 md:right-4 md:left-auto">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-black text-white">S</span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-ink dark:text-gray-50">{t('title')}</p>
          <p className="truncate text-xs text-slate">{t('sub')}</p>
        </div>
        <button onClick={install} className="shrink-0 rounded-base bg-primary px-3.5 py-2 text-xs font-bold text-white transition hover:bg-primary-600">{t('install')}</button>
        <button onClick={dismiss} aria-label={t('dismiss')} className="shrink-0 rounded-full p-1 text-slate hover:text-ink dark:hover:text-gray-200">✕</button>
      </div>
    </div>
  );
}
