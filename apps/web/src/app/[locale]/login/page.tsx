'use client';

import { useRef, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { verifyOtp, fetchMe, homeForMode } from '@/lib/session';
import { Button, ErrorBanner } from '@/components/ui';

// Dev: real Firebase OTP isn't wired yet — verifyOtp sends `mock:<phone>` and any
// 6-digit code is accepted. The two-step UI mirrors the eventual SMS flow.
const PHONE_RE = /^\+94\d{9}$/;

export default function LoginPage() {
  const locale = (useParams().locale as string) ?? 'en';
  const t = useTranslations('login');
  const search = useSearchParams();
  const next = search.get('next');

  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [local, setLocal] = useState(''); // digits after +94
  const [code, setCode] = useState('');
  const [phoneErr, setPhoneErr] = useState('');
  const [codeErr, setCodeErr] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const codeRef = useRef<HTMLInputElement>(null);

  const fullPhone = `+94${local}`;
  const prettyPhone = `+94 ${local.replace(/(\d{2})(\d{3})(\d{0,4})/, '$1 $2 $3').trim()}`.trim();

  function sendCode(e: React.FormEvent) {
    e.preventDefault();
    setErr('');
    if (!PHONE_RE.test(fullPhone)) {
      setPhoneErr(t('phoneInvalid'));
      return;
    }
    setPhoneErr('');
    setStep('code');
    setTimeout(() => codeRef.current?.focus(), 0);
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setErr('');
    if (!/^\d{6}$/.test(code.trim())) {
      setCodeErr(t('codeInvalid'));
      return;
    }
    setCodeErr('');
    setBusy(true);
    try {
      const session = await verifyOtp(fullPhone);
      if (session.mode === 'customer') {
        const me = await fetchMe();
        if (me && me.profileComplete === false) {
          window.location.href = next ?? `/${locale}/register`;
          return;
        }
      }
      window.location.href = next ?? homeForMode(locale, session.mode);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    // Break out of the app-shell content padding for a full-bleed two-column auth screen.
    <div className="-mx-4 -my-5 grid min-h-[calc(100vh-61px)] md:-my-8 lg:grid-cols-2">
      {/* Left: branded navy panel (desktop only). */}
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-[#131b2e] p-12 text-white lg:flex">
        <div className="pointer-events-none absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '22px 22px' }} aria-hidden="true" />
        <div className="pointer-events-none absolute -right-20 top-1/4 h-72 w-72 rounded-full bg-primary/25 blur-3xl" aria-hidden="true" />

        <div className="relative z-10 flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-sm font-black text-white">S</span>
          <span className="font-display text-xl font-extrabold tracking-tightest">SkillLink</span>
        </div>

        <div className="relative z-10 max-w-md">
          <h2 className="font-display text-4xl font-extrabold leading-tight tracking-tightest" style={{ textWrap: 'balance' } as React.CSSProperties}>
            {t('panelTitle')}
          </h2>
          <p className="mt-4 text-base leading-relaxed text-white/65">{t('panelSub')}</p>
          <ul className="mt-8 space-y-3.5">
            {[t('panelPoint1'), t('panelPoint2'), t('panelPoint3')].map((p) => (
              <li key={p} className="flex items-center gap-3 text-sm font-medium text-white/85">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary-fixed-dim">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5" aria-hidden="true"><path d="M20 6L9 17l-5-5" /></svg>
                </span>
                {p}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative z-10 text-xs text-white/40">© SkillLink · Kandy</p>
      </aside>

      {/* Right: the form. Centered, full-width on mobile. */}
      <div className="flex items-center justify-center px-5 py-12 sm:px-8">
      <div className="w-full max-w-sm">
        {/* Brand mark above the card — anchors the screen on mobile (panel hidden). */}
        <div className="mb-8 text-center">
          <span className="inline-flex h-14 w-14 items-center justify-center rounded-xl2 bg-ink text-lg font-extrabold text-white shadow-card lg:hidden dark:bg-primary">SL</span>
          <h1 className="mt-4 font-display text-2xl font-extrabold tracking-tightest text-ink dark:text-white">{t('title')}</h1>
          <p className="mt-2 text-sm text-slate">
            {step === 'phone' ? t('subtitlePhone') : t('subtitleCode', { phone: prettyPhone })}
          </p>
        </div>

        <div className="rounded-xl2 border border-line bg-white p-7 shadow-card dark:border-gray-800 dark:bg-gray-900">
          {step === 'phone' ? (
            <form onSubmit={sendCode} className="space-y-4" noValidate>
              <div>
                <label htmlFor="phone" className="mb-1.5 block text-sm font-medium text-ink dark:text-gray-200">{t('phoneLabel')}</label>
                {/* Country code as a fixed adornment — the user only types local digits. */}
                <div className={`flex items-stretch overflow-hidden rounded-base border border-line transition-colors focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10 dark:border-gray-700 ${phoneErr ? 'border-danger' : ''}`}>
                  <span className="flex items-center gap-1.5 border-r border-line bg-surface px-3 text-sm font-semibold text-slate dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
                    LK +94
                  </span>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    inputMode="numeric"
                    autoFocus
                    autoComplete="tel-national"
                    value={local}
                    onChange={(e) => { setLocal(e.target.value.replace(/\D/g, '').slice(0, 9)); setPhoneErr(''); }}
                    placeholder="77 123 4567"
                    aria-invalid={!!phoneErr}
                    aria-describedby={phoneErr ? 'phone-err' : 'phone-hint'}
                    className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-ink outline-none dark:bg-transparent dark:text-white"
                  />
                </div>
                {phoneErr ? (
                  <p id="phone-err" className="mt-1.5 text-xs text-danger">{phoneErr}</p>
                ) : (
                  <p id="phone-hint" className="mt-1.5 text-xs text-slate">{t('phoneHint')}</p>
                )}
              </div>
              <Button type="submit" className="w-full">{t('sendCode')}</Button>
            </form>
          ) : (
            <form onSubmit={verify} className="space-y-4" noValidate>
              <div>
                <label htmlFor="code" className="mb-1.5 block text-sm font-medium text-ink dark:text-gray-200">{t('codeLabel')}</label>
                <input
                  id="code"
                  name="code"
                  ref={codeRef}
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={code}
                  onChange={(e) => { setCode(e.target.value.replace(/\D/g, '')); setCodeErr(''); }}
                  placeholder="••••••"
                  aria-invalid={!!codeErr}
                  aria-describedby={codeErr ? 'code-err' : 'code-hint'}
                  className={`w-full rounded-base border border-line px-3 py-3 text-center text-2xl font-semibold tracking-[0.5em] text-ink outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white ${codeErr ? 'border-danger' : ''}`}
                />
                {codeErr ? (
                  <p id="code-err" className="mt-1.5 text-xs text-danger">{codeErr}</p>
                ) : (
                  <p id="code-hint" className="mt-1.5 text-xs text-slate">{t('devHint')}</p>
                )}
              </div>
              <Button type="submit" disabled={busy} className="flex w-full items-center justify-center gap-2">
                {busy && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden />}
                {busy ? t('verifying') : t('verify')}
              </Button>
              <button
                type="button"
                onClick={() => { setStep('phone'); setCode(''); setCodeErr(''); setErr(''); }}
                className="block w-full text-center text-xs text-slate transition-colors hover:text-primary"
              >
                {t('resend')}
              </button>
            </form>
          )}

          {err && <div className="mt-4"><ErrorBanner message={err} /></div>}
        </div>

        <div className="mt-6 space-y-2 text-center">
          <p className="flex items-center justify-center gap-1.5 text-xs text-slate">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5" aria-hidden="true">
              <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
            </svg>
            {t('trust')}
          </p>
          <p className="px-4 text-[11px] leading-relaxed text-slate">{t('terms')}</p>
        </div>
      </div>
      </div>
    </div>
  );
}
