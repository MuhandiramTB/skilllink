'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { fetchDistricts, saveProfile, getToken, type District } from '@/lib/session';
import { Button, Card, ErrorBanner, Spinner, PageHeader, Field, inputCls } from '@/components/ui';

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
    <div className="mx-auto max-w-md space-y-5">
      <PageHeader title="Welcome to SkillLink" subtitle="Just a few details and you're ready to book." />
      <Card className="rounded-2xl">
        {!districts ? <Spinner /> : (
          <form onSubmit={submit} className="space-y-4">
            <Field label="Full name">
              <input autoFocus value={fullName} onChange={(e) => setFullName(e.target.value)}
                className={inputCls} placeholder="Your name" />
            </Field>
            <Field label="District">
              <select value={districtId} onChange={(e) => setDistrictId(e.target.value)} className={inputCls}>
                {districts.map((d) => <option key={d.id} value={d.id}>{dName(d)}</option>)}
              </select>
            </Field>
            <Field label="Language">
              <select value={language} onChange={(e) => setLanguage(e.target.value as 'si' | 'ta' | 'en')} className={inputCls}>
                <option value="en">English</option>
                <option value="si">සිංහල</option>
                <option value="ta">தமிழ்</option>
              </select>
            </Field>
            <Field label="Email (optional)">
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                className={inputCls} placeholder="you@example.com" />
            </Field>
            <Button disabled={busy} className="w-full">{busy ? 'Saving…' : 'Start booking'}</Button>
            {err && <ErrorBanner message={err} />}
          </form>
        )}
      </Card>
    </div>
  );
}
