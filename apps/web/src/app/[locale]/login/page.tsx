'use client';

import { useRef, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { verifyOtp, fetchMe, homeForMode } from '@/lib/session';
import { Button, Card, ErrorBanner } from '@/components/ui';

// Dev: real Firebase OTP isn't wired yet — verifyOtp sends `mock:<phone>` and any
// 6-digit code is accepted. The two-step UI mirrors the eventual SMS flow.
const PHONE_RE = /^\+94\d{9}$/;

export default function LoginPage() {
  const locale = (useParams().locale as string) ?? 'en';
  const search = useSearchParams();
  const next = search.get('next');

  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [phone, setPhone] = useState('+94');
  const [code, setCode] = useState('');
  const [phoneErr, setPhoneErr] = useState('');
  const [codeErr, setCodeErr] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const codeRef = useRef<HTMLInputElement>(null);

  const normalizedPhone = phone.replace(/\s+/g, '');

  function sendCode(e: React.FormEvent) {
    e.preventDefault();
    setErr('');
    if (!PHONE_RE.test(normalizedPhone)) {
      setPhoneErr('Enter a valid Sri Lankan mobile number, e.g. +94 77 123 4567.');
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
      setCodeErr('Enter the 6-digit code.');
      return;
    }
    setCodeErr('');
    setBusy(true);
    try {
      const session = await verifyOtp(normalizedPhone);
      // New customer with no profile → complete simple registration first.
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
    <div className="flex min-h-[70vh] items-center justify-center">
      <div className="w-full max-w-sm">
        <Card>
          <div className="mb-6 text-center">
            <h1 className="font-display text-2xl font-bold">
              Skill<span className="text-primary">Link</span> LK
            </h1>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              {step === 'phone' ? 'Sign in with your mobile number' : `We sent a code to ${normalizedPhone}`}
            </p>
          </div>

          {step === 'phone' ? (
            <form onSubmit={sendCode} className="space-y-4" noValidate>
              <div>
                <label htmlFor="phone" className="mb-1 block text-sm font-medium">
                  Mobile number
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  inputMode="tel"
                  autoFocus
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => { setPhone(e.target.value); setPhoneErr(''); }}
                  placeholder="+94 77 123 4567"
                  aria-invalid={!!phoneErr}
                  aria-describedby={phoneErr ? 'phone-err' : 'phone-hint'}
                  className="w-full rounded-base border px-3 py-2.5 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40 dark:border-gray-600 dark:bg-gray-900"
                />
                {phoneErr ? (
                  <p id="phone-err" className="mt-1 text-xs text-danger">{phoneErr}</p>
                ) : (
                  <p id="phone-hint" className="mt-1 text-xs text-gray-400">Format: +94 followed by 9 digits.</p>
                )}
              </div>
              <Button type="submit" className="w-full">Send code</Button>
            </form>
          ) : (
            <form onSubmit={verify} className="space-y-4" noValidate>
              <div>
                <label htmlFor="code" className="mb-1 block text-sm font-medium">
                  Verification code
                </label>
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
                  placeholder="123456"
                  aria-invalid={!!codeErr}
                  aria-describedby={codeErr ? 'code-err' : 'code-hint'}
                  className="w-full rounded-base border px-3 py-2.5 tracking-[0.5em] focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40 dark:border-gray-600 dark:bg-gray-900"
                />
                {codeErr ? (
                  <p id="code-err" className="mt-1 text-xs text-danger">{codeErr}</p>
                ) : (
                  <p id="code-hint" className="mt-1 text-xs text-gray-400">Dev mode: enter any 6 digits.</p>
                )}
              </div>
              <Button type="submit" disabled={busy} className="flex w-full items-center justify-center gap-2">
                {busy && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden />}
                {busy ? 'Verifying…' : 'Verify & sign in'}
              </Button>
              <button
                type="button"
                onClick={() => { setStep('phone'); setCode(''); setCodeErr(''); setErr(''); }}
                className="block w-full text-center text-xs text-gray-500 hover:text-primary dark:text-gray-400"
              >
                Use a different number
              </button>
            </form>
          )}

          {err && <div className="mt-4"><ErrorBanner message={err} /></div>}
        </Card>

        <p className="mt-5 text-center text-xs text-gray-400">
          We text you a one-time code. No password to remember.
        </p>
      </div>
    </div>
  );
}
