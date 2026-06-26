'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { verifyOtp, homeForMode } from '@/lib/session';
import { Button, Card, ErrorBanner } from '@/components/ui';

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
    <div className="flex min-h-[70vh] items-center justify-center">
      <div className="w-full max-w-sm">
        <Card>
          <h1 className="mb-1 font-display text-lg font-semibold">Staff sign in</h1>
          <p className="mb-5 text-sm text-gray-500 dark:text-gray-400">Authorized personnel only.</p>
          <form onSubmit={signIn} className="space-y-4">
            <input autoFocus value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel"
              className="w-full rounded-base border px-3 py-2.5 dark:border-gray-600 dark:bg-gray-900" placeholder="+94 77 123 4567" />
            <Button disabled={busy} className="w-full">{busy ? 'Verifying…' : 'Sign in'}</Button>
            {err && <ErrorBanner message={err} />}
          </form>
        </Card>
      </div>
    </div>
  );
}
