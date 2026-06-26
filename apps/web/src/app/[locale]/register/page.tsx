'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { fetchDistricts, saveProfile, getToken, type District } from '@/lib/session';
import { Button, Card, ErrorBanner, Spinner } from '@/components/ui';

/** Customer registration — simple, under 30 seconds (spec 10, Req 2). */
export default function RegisterPage() {
  const locale = (useParams().locale as string) ?? 'en';
  const [districts, setDistricts] = useState<District[] | null>(null);
  const [fullName, setFullName] = useState('');
  const [districtId, setDistrictId] = useState('');
  const [language, setLanguage] = useState<'si' | 'ta' | 'en'>(locale as 'si' | 'ta' | 'en');
  const [email, setEmail] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!getToken()) { window.location.href = `/${locale}/login?next=/${locale}/register`; return; }
    fetchDistricts().then((d) => { setDistricts(d); if (d[0]) setDistrictId(d[0].id); });
  }, [locale]);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr('');
    if (fullName.trim().length < 2) { setErr('Please enter your full name.'); return; }
    if (!districtId) { setErr('Please choose your district.'); return; }
    setBusy(true);
    try {
      await saveProfile({ fullName: fullName.trim(), districtId, language, email: email || undefined });
      window.location.href = `/${locale}/bookings`;
    } catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
  }

  const dName = (d: District) => (language === 'si' ? d.name_si : language === 'ta' ? d.name_ta : d.name_en);

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="mb-1 font-display text-2xl font-semibold">Welcome</h1>
      <p className="mb-5 text-sm text-gray-500 dark:text-gray-400">Just a few details and you&apos;re ready to book.</p>
      <Card>
        {!districts ? <Spinner /> : (
          <form onSubmit={submit} className="space-y-4">
            <label className="block">
              <span className="mb-1 block text-sm font-medium">Full name</span>
              <input autoFocus value={fullName} onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-base border px-3 py-2.5 dark:border-gray-600 dark:bg-gray-900" placeholder="Your name" />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium">District</span>
              <select value={districtId} onChange={(e) => setDistrictId(e.target.value)}
                className="w-full rounded-base border px-3 py-2.5 dark:border-gray-600 dark:bg-gray-900">
                {districts.map((d) => <option key={d.id} value={d.id}>{dName(d)}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium">Language</span>
              <select value={language} onChange={(e) => setLanguage(e.target.value as 'si' | 'ta' | 'en')}
                className="w-full rounded-base border px-3 py-2.5 dark:border-gray-600 dark:bg-gray-900">
                <option value="en">English</option>
                <option value="si">සිංහල</option>
                <option value="ta">தமிழ்</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium">Email <span className="text-gray-400">(optional)</span></span>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-base border px-3 py-2.5 dark:border-gray-600 dark:bg-gray-900" placeholder="you@example.com" />
            </label>
            <Button disabled={busy} className="w-full">{busy ? 'Saving…' : 'Start booking'}</Button>
            {err && <ErrorBanner message={err} />}
          </form>
        )}
      </Card>
    </div>
  );
}
