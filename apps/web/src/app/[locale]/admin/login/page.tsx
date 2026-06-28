'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { verifyOtp, homeForMode } from '@/lib/session';
import { Button, ErrorBanner } from '@/components/ui';

/** Hidden admin sign-in (not linked from public pages). OTP only; admins routed to console. */
export default function AdminLoginPage() {
  const locale = (useParams().locale as string) ?? 'en';
  // Only the 9 local digits live in state; "+94" is a fixed, non-editable prefix.
  const [local, setLocal] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function signIn(e: React.FormEvent) {
    e.preventDefault(); setErr(''); setBusy(true);
    try {
      const phone = `+94${local}`;
      if (!/^\+94\d{9}$/.test(phone)) { setErr('Enter your 9-digit mobile number (e.g. 7X XXX XXXX).'); return; }
      const s = await verifyOtp(phone);
      if (!s.roles.includes('admin')) { setErr('This account does not have admin access.'); return; }
      window.location.href = homeForMode(locale, 'admin');
    } catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
  }

  return (
    <div className="flex min-h-[75vh] items-center justify-center py-8">
      <div className="w-full max-w-sm">
        {/* Brand mark above the card — anchors the screen like real auth pages. */}
        <div className="mb-6 text-center">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl2 bg-primary text-lg font-bold text-white shadow-card">SL</span>
          <h1 className="mt-3 font-display text-2xl font-bold text-ink dark:text-gray-50">Staff sign in</h1>
          <p className="mt-1 text-sm text-slate">Authorized personnel only.</p>
        </div>

        <div className="rounded-xl2 border border-line bg-white p-6 shadow-card dark:border-gray-800 dark:bg-gray-900">
          <form onSubmit={signIn} className="space-y-4">
            <div>
              <label htmlFor="admin-phone" className="mb-1.5 block text-sm font-semibold text-ink dark:text-gray-200">Mobile number</label>
              <div className="flex items-stretch overflow-hidden rounded-base border border-line bg-white transition-colors focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10 dark:border-gray-700 dark:bg-gray-900">
                {/* Fixed country prefix — not editable, can't be deleted. */}
                <span className="flex select-none items-center border-r border-line bg-surface px-3 text-sm font-semibold text-slate dark:border-gray-700 dark:bg-gray-800">+94</span>
                <input
                  id="admin-phone"
                  autoFocus
                  value={local}
                  onChange={(e) => setLocal(e.target.value.replace(/\D/g, '').slice(0, 9))}
                  inputMode="numeric"
                  maxLength={9}
                  autoComplete="tel-national"
                  className="w-full bg-transparent px-3.5 py-2.5 tracking-wide text-ink placeholder:text-slate/50 focus:outline-none dark:text-gray-100"
                  placeholder="7X XXX XXXX"
                />
              </div>
            </div>
            <Button disabled={busy} className="flex w-full items-center justify-center gap-2">
              {busy && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden />}
              {busy ? 'Verifying…' : 'Sign in'}
            </Button>
            {err && <ErrorBanner message={err} />}
          </form>
        </div>

        <div className="mt-5 text-center">
          <p className="flex items-center justify-center gap-1.5 text-xs text-slate">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5" aria-hidden="true">
              <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
            </svg>
            Secured admin access
          </p>
        </div>
      </div>
    </div>
  );
}
