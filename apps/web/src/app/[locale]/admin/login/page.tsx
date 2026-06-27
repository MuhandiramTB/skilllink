'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { verifyOtp, homeForMode } from '@/lib/session';
import { Button, ErrorBanner } from '@/components/ui';

/** Hidden admin sign-in (not linked from public pages). OTP only; admins routed to console. */
export default function AdminLoginPage() {
  const locale = (useParams().locale as string) ?? 'en';
  const [phone, setPhone] = useState('+94');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function signIn(e: React.FormEvent) {
    e.preventDefault(); setErr(''); setBusy(true);
    try {
      if (!/^\+94\d{9}$/.test(phone)) { setErr('Enter a valid mobile number.'); return; }
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
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-lg font-bold text-white shadow-sm">SL</span>
          <h1 className="mt-3 font-display text-xl font-bold">Staff sign in</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Authorized personnel only.</p>
        </div>

        <div className="rounded-2xl border bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <form onSubmit={signIn} className="space-y-4">
            <div>
              <label htmlFor="admin-phone" className="mb-1.5 block text-sm font-medium">Mobile number</label>
              <input
                id="admin-phone"
                autoFocus
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                inputMode="tel"
                className="w-full rounded-base border px-3 py-2.5 outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 dark:border-gray-600 dark:bg-gray-900"
                placeholder="+94 77 123 4567"
              />
            </div>
            <Button disabled={busy} className="flex w-full items-center justify-center gap-2">
              {busy && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden />}
              {busy ? 'Verifying…' : 'Sign in'}
            </Button>
            {err && <ErrorBanner message={err} />}
          </form>
        </div>

        <div className="mt-5 text-center">
          <p className="flex items-center justify-center gap-1.5 text-xs text-gray-400">
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
