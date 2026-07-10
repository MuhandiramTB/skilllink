'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { createPortal } from 'react-dom';
import { haptic } from '@/lib/haptics';
import { ICONS } from '@/components/nav-config';

const SEEN_KEY = 'skilllink_onboarded';

/**
 * First-run onboarding — a 3-slide intro that answers "what is this / how does it
 * work / can I trust it" in ~10 seconds, then hands off to booking. Shown once
 * (localStorage flag), dismissible, swipeable. First impressions decide whether a
 * user believes this is a real, trustworthy app.
 */
export function Onboarding() {
  const locale = (useParams().locale as string) ?? 'en';
  const t = useTranslations('onboard');
  const [show, setShow] = useState(false);
  const [i, setI] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try { if (!localStorage.getItem(SEEN_KEY)) setShow(true); } catch { /* ignore */ }
  }, []);

  function finish() {
    try { localStorage.setItem(SEEN_KEY, '1'); } catch { /* ignore */ }
    setShow(false);
  }

  const slides = [
    { icon: ICONS.search, title: t('s1Title'), body: t('s1Body') },
    { icon: ICONS.shield, title: t('s2Title'), body: t('s2Body') },
    { icon: ICONS.star, title: t('s3Title'), body: t('s3Body') },
  ];
  const last = i === slides.length - 1;

  if (!mounted || !show) return null;

  return createPortal(
    <div className="fixed inset-0 z-[140] flex flex-col bg-white dark:bg-[#0A0B0F]" role="dialog" aria-modal="true" aria-label={t('title')}>
      {/* Skip */}
      <div className="flex justify-end p-4">
        <button type="button" onClick={finish} className="text-sm font-semibold text-slate transition hover:text-ink dark:hover:text-gray-200">{t('skip')}</button>
      </div>

      {/* Slide */}
      <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
        <div className="relative mb-8 flex h-28 w-28 items-center justify-center">
          <span className="absolute inset-0 rounded-[36px] bg-primary/10 dark:bg-primary/15" aria-hidden="true" />
          <span className="sl-pop relative flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-white shadow-lift [&>svg]:h-8 [&>svg]:w-8" aria-hidden="true">
            {slides[i].icon}
          </span>
        </div>
        <h1 className="font-display text-2xl font-extrabold tracking-tightest text-ink dark:text-gray-50">{slides[i].title}</h1>
        <p className="mt-3 max-w-xs text-[15px] leading-relaxed text-slate">{slides[i].body}</p>
      </div>

      {/* Dots + actions */}
      <div className="space-y-5 p-6 pb-10">
        <div className="flex justify-center gap-2" aria-hidden="true">
          {slides.map((_, n) => (
            <span key={n} className={`h-2 rounded-full transition-all ${n === i ? 'w-6 bg-primary' : 'w-2 bg-line dark:bg-gray-700'}`} />
          ))}
        </div>
        <button
          type="button"
          onClick={() => { haptic.tap(); if (last) { finish(); } else setI((n) => n + 1); }}
          className="w-full rounded-base bg-primary px-6 py-3.5 text-sm font-bold text-white shadow-card transition-all hover:bg-primary-600 active:translate-y-px"
        >
          {last ? t('start') : t('next')}
        </button>
        {last && (
          <a href={`/${locale}/book`} onClick={finish} className="block text-center text-sm font-semibold text-primary hover:underline">
            {t('bookNow')}
          </a>
        )}
      </div>
    </div>,
    document.body,
  );
}
