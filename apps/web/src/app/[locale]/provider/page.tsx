'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { providerApi, type ProviderMe } from '@/lib/provider-api';
import { getToken } from '@/lib/session';
import { Button, Card, StatusBadge, ErrorBanner, SuccessBanner, PageHeader, MetricCard } from '@/components/ui';
import { Reveal } from '@/components/Reveal';
import { CountUp } from '@/components/charts';
import { ICONS } from '@/components/nav-config';

interface Cat { id: string; key: string; name: { en: string }; children: Cat[] }
const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

export default function ProviderPage() {
  const locale = (useParams().locale as string) ?? 'en';
  const t = useTranslations('dash');
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [me, setMe] = useState<ProviderMe | null>(null);
  const [cats, setCats] = useState<Cat[]>([]);
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');

  useEffect(() => { setAuthed(!!getToken()); }, []);
  useEffect(() => { if (authed) void refresh(); }, [authed]);

  const [earnings, setEarnings] = useState<{ totalNetCents: number; paidJobs: number } | null>(null);

  async function refresh() {
    setErr('');
    try {
      const flat = await fetch(`${API}/categories`).then((r) => r.json());
      setCats(flat.data ?? []);
      try {
        setMe(await providerApi.me());
        setEarnings(await providerApi.earnings());
      } catch { setMe(null); }
    } catch (e) { setErr((e as Error).message); }
  }

  async function becomeProvider() {
    setErr(''); setMsg('');
    try { await providerApi.become('My Service'); setMsg(t('youAreNowProvider')); await refresh(); }
    catch (e) { setErr((e as Error).message); }
  }

  async function uploadDoc(type: string) {
    try {
      const { fileUrl } = await providerApi.presign(type);
      await providerApi.addVerification(type, fileUrl);
      setMsg(t('docSubmitted', { type })); await refresh();
    } catch (e) { setErr((e as Error).message); }
  }

  async function setArea() {
    try { await providerApi.setServiceArea(7.2906, 80.6350, 10000); setMsg(t('serviceAreaSet')); }
    catch (e) { setErr((e as Error).message); }
  }

  async function pickCategory(id: string) {
    try { await providerApi.setCategories([id]); setMsg(t('categorySet')); await refresh(); }
    catch (e) { setErr((e as Error).message); }
  }

  async function toggleAvail() {
    try { await providerApi.setAvailability(!me?.isAvailable); await refresh(); }
    catch (e) { setErr((e as Error).message); }
  }

  if (authed === null) return null; // checking — matches server render, no flash
  if (authed === false) {
    window.location.href = `/${locale}/login?intent=provider&next=/${locale}/provider`;
    return null;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <PageHeader
        title={t('provider')}
        action={me ? <StatusBadge status={me.status} /> : undefined}
      />
      {err && <ErrorBanner message={err} />}
      {msg && <SuccessBanner message={msg} />}

      {!me ? (
        <Reveal>
          <Card className="space-y-4 text-center">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary [&>svg]:h-6 [&>svg]:w-6" aria-hidden="true">{ICONS.briefcase}</span>
            <div>
              <h2 className="font-display text-lg font-bold text-ink dark:text-gray-50">{t('becomeProvider')}</h2>
            </div>
            <Button onClick={becomeProvider} className="mx-auto">{t('becomeProvider')}</Button>
            <a href="provider/register" className="block text-sm font-semibold text-primary hover:underline">
              {t('completeRegistration')}
            </a>
          </Card>
        </Reveal>
      ) : (
        <div className="space-y-5">
          {/* Availability + paid-jobs summary */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Reveal>
              <Card className="flex h-full flex-col justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate">{t('statusLabel')}</p>
                  <div className="mt-2"><StatusBadge status={me.status} /></div>
                  <p className="mt-2 text-xs text-slate">{t('categoriesSet', { categories: me.categories, documents: me.verifications.length })}</p>
                </div>
                <Button
                  variant={me.isAvailable ? 'success' : 'ghost'}
                  onClick={toggleAvail}
                  className="w-full"
                >
                  {me.isAvailable ? t('available') : t('setAvailable')}
                </Button>
              </Card>
            </Reveal>
            <Reveal delay={40}>
              <a href="provider/jobs" className="block h-full">
                <MetricCard
                  icon={ICONS.briefcase}
                  label={t('viewAllJobs')}
                  value={<CountUp value={earnings?.paidJobs ?? 0} />}
                  tone="primary"
                />
              </a>
            </Reveal>
          </div>

          {/* Identity / documents */}
          <Reveal delay={80}>
            <Card className="space-y-3">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface text-slate dark:bg-gray-800 [&>svg]:h-[18px] [&>svg]:w-[18px]" aria-hidden="true">{ICONS.shield}</span>
                <h2 className="font-display font-bold text-ink dark:text-gray-50">{t('sectionIdentity')}</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {['nic', 'selfie', 'certificate'].map((docType) => (
                  <button key={docType} onClick={() => uploadDoc(docType)}
                    className="rounded-base border border-line px-3.5 py-2 text-sm font-medium text-slate transition-all hover:border-primary hover:text-primary dark:border-gray-700">
                    {t('uploadDoc', { type: docType })}
                  </button>
                ))}
              </div>
              {me.verifications.length > 0 && (
                <ul className="space-y-1 border-t border-line-soft pt-3 text-xs text-slate dark:border-gray-800">
                  {me.verifications.map((v, i) => (
                    <li key={i} className="flex items-center justify-between gap-2">
                      <span className="capitalize">{v.type}</span>
                      <StatusBadge status={v.status} />
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </Reveal>

          {/* Category */}
          <Reveal delay={120}>
            <Card className="space-y-3">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface text-slate dark:bg-gray-800 [&>svg]:h-[18px] [&>svg]:w-[18px]" aria-hidden="true">{ICONS.grid}</span>
                <h2 className="font-display font-bold text-ink dark:text-gray-50">{t('sectionCategory')}</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {cats.map((c) => (
                  <button key={c.id} onClick={() => pickCategory(c.id)}
                    className="rounded-base border border-line px-3.5 py-2 text-sm font-medium text-slate transition-all hover:border-primary hover:text-primary dark:border-gray-700">
                    {c.name.en}
                  </button>
                ))}
              </div>
            </Card>
          </Reveal>

          {/* Service area */}
          <Reveal delay={160}>
            <Card className="space-y-3">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface text-slate dark:bg-gray-800 [&>svg]:h-[18px] [&>svg]:w-[18px]" aria-hidden="true">{ICONS.map}</span>
                <h2 className="font-display font-bold text-ink dark:text-gray-50">{t('sectionServiceArea')}</h2>
              </div>
              <button onClick={setArea}
                className="rounded-base border border-line px-3.5 py-2 text-sm font-medium text-slate transition-all hover:border-primary hover:text-primary dark:border-gray-700">
                {t('setAreaKandy')}
              </button>
            </Card>
          </Reveal>
        </div>
      )}

      {/* Floating online/offline action (spec: "Go Online"). Only when approved. */}
      {me && me.status === 'approved' && (
        <button
          onClick={toggleAvail}
          className={`fixed bottom-20 left-1/2 z-20 -translate-x-1/2 rounded-full px-6 py-3 text-sm font-semibold shadow-lift transition-all active:translate-y-px ${
            me.isAvailable ? 'bg-success text-white hover:brightness-110' : 'bg-primary text-white hover:bg-primary-600'
          }`}
        >
          {me.isAvailable ? t('goOnlineTapOffline') : t('goOnline')}
        </button>
      )}

    </div>
  );
}
