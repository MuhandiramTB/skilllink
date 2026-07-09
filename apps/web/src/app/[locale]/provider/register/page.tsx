'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { providerApi } from '@/lib/provider-api';
import { getToken } from '@/lib/session';
import { Button, Card, ErrorBanner, Spinner, StatusBadge, inputCls } from '@/components/ui';
import { FileUpload } from '@/components/FileUpload';
import { fileToDataUrl } from '@/lib/image';
import { TOWNS } from '@/lib/towns';
import { CoverageMap } from '@/components/CoverageMap';

interface Cat { id: string; key: string; name: { en: string }; children: Cat[] }
const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

const STEP_KEYS = ['stepBasic', 'stepService', 'stepArea', 'stepVerification', 'stepAvailability'] as const;
const RADII = [{ m: 5000, labelKey: 'radius5' }, { m: 10000, labelKey: 'radius10' }, { m: 25000, labelKey: 'radius25' }] as const;

/** Provider multi-step registration (spec 10, Req 3) — target under 10 minutes. */
export default function ProviderRegisterPage() {
  const locale = (useParams().locale as string) ?? 'en';
  const t = useTranslations('dash');
  const [step, setStep] = useState(0);
  const [cats, setCats] = useState<Cat[]>([]);
  const [err, setErr] = useState('');
  const [done, setDone] = useState(false);

  // form state
  const [business, setBusiness] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [years, setYears] = useState('');
  const [radius, setRadius] = useState(10000);
  const [towns, setTowns] = useState<Set<string>>(new Set(['kandy'])); // selected town keys

  function toggleTown(key: string) {
    setTowns((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }
  async function saveAreas() {
    const areas = TOWNS.filter((tn) => towns.has(tn.key)).map((tn) => ({ lat: tn.lat, lng: tn.lng, radiusMeters: radius, label: tn.name }));
    await providerApi.setServiceAreas(areas);
  }
  const [docs, setDocs] = useState<Record<string, boolean>>({});
  const [days, setDays] = useState('Mon–Sat');
  const [hours, setHours] = useState('08:00–18:00');
  const [emergency, setEmergency] = useState(false);

  useEffect(() => {
    if (!getToken()) { window.location.href = `/${locale}/login?intent=provider&next=/${locale}/provider/register`; return; }
    fetch(`${API}/categories`).then((r) => r.json()).then((b) => {
      const flat: Cat[] = b.data ?? [];
      setCats(flat);
      if (flat[0]) setCategoryId(flat[0].id);
    });
    // Provider creation happens on the step-0 "Continue" (with the entered business
    // name) — not on mount, so just visiting the page doesn't silently enrol you.
  }, [locale]);

  function fail(e: unknown) { setErr((e as Error).message); }
  async function guard(fn: () => Promise<unknown>, advance = true) {
    setErr('');
    try { await fn(); if (advance) setStep((s) => s + 1); } catch (e) { fail(e); }
  }

  // Validate the picked image (type + size), compress to a data URL, and store it as
  // the verification document so the admin can actually view it.
  async function uploadDoc(type: string, file?: File) {
    setErr('');
    if (!file) return;
    try {
      const dataUrl = await fileToDataUrl(file, 1000); // keep readable for NIC/certs
      await providerApi.addVerification(type, dataUrl);
      setDocs((d) => ({ ...d, [type]: true }));
    } catch (e) { fail(e); }
  }

  async function submitAll() {
    setErr('');
    try {
      await providerApi.setAvailability(false); // stays offline until approved
      await providerApi.setDetails({
        yearsExperience: years ? Number(years) : undefined,
        workingDays: days, workingHours: hours, emergencyService: emergency,
      });
      setDone(true);
    } catch (e) { fail(e); }
  }

  if (done) {
    return (
      <div className="mx-auto max-w-2xl text-center">
        <Card className="space-y-3">
          <StatusBadge status="pending" />
          <h1 className="font-display text-xl font-bold text-ink dark:text-gray-50">{t('submittedForReview')}</h1>
          <p className="text-sm text-slate">
            {t('submittedForReviewBody')}
          </p>
          <Button onClick={() => (window.location.href = `/${locale}/provider`)}>{t('goToDashboard')}</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <h1 className="font-display text-xl font-bold text-ink dark:text-gray-50">{t('registerTitle')}</h1>
        {/* stepper */}
        <div className="mt-3 flex gap-1.5">
          {STEP_KEYS.map((s, i) => (
            <div key={s} className={`h-1.5 flex-1 rounded-full ${i <= step ? 'bg-primary' : 'bg-surface dark:bg-gray-700'}`} />
          ))}
        </div>
        <p className="mt-2 text-xs text-slate">{t('stepOf', { current: step + 1, total: STEP_KEYS.length, name: t(STEP_KEYS[step]) })}</p>
      </div>

      {err && <ErrorBanner message={err} />}
      {cats.length === 0 ? <Spinner /> : (
        <Card className="space-y-4">
          {step === 0 && (
            <>
              <label className="block"><span className="mb-1 block text-sm font-medium">{t('businessName')}</span>
                <input autoFocus value={business} onChange={(e) => setBusiness(e.target.value)}
                  className={inputCls} placeholder={t('businessNamePlaceholder')} /></label>
              <Button className="w-full" onClick={() => guard(() => providerApi.become(business || 'My Service'))}>{t('continue')}</Button>
            </>
          )}

          {step === 1 && (
            <>
              <label className="block"><span className="mb-1 block text-sm font-medium">{t('serviceCategory')}</span>
                <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}
                  className={inputCls}>
                  {cats.map((c) => <option key={c.id} value={c.id}>{c.name.en}</option>)}
                </select></label>
              <label className="block"><span className="mb-1 block text-sm font-medium">{t('yearsExperience')}</span>
                <input inputMode="numeric" value={years} onChange={(e) => setYears(e.target.value)}
                  className={inputCls} placeholder={t('yearsExperiencePlaceholder')} /></label>
              <Button className="w-full" onClick={() => guard(() => providerApi.setCategories([categoryId]))}>{t('continue')}</Button>
            </>
          )}

          {step === 2 && (
            <>
              <div>
                <p className="text-sm font-semibold text-ink dark:text-gray-100">{t('townsTitle')}</p>
                <p className="mt-0.5 text-xs text-slate">{t('townsHint')}</p>
              </div>
              {/* Multi-town selection — each selected town becomes a service area. */}
              <div className="flex flex-wrap gap-2">
                {TOWNS.map((tn) => {
                  const on = towns.has(tn.key);
                  return (
                    <button
                      key={tn.key}
                      type="button"
                      onClick={() => toggleTown(tn.key)}
                      aria-pressed={on}
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium transition-all ${on ? 'border-primary bg-primary/10 text-primary' : 'border-line text-slate hover:border-ink hover:text-ink dark:border-gray-700'}`}
                    >
                      {on && (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5" aria-hidden="true"><path d="M20 6L9 17l-5-5" /></svg>
                      )}
                      {tn.name}
                    </button>
                  );
                })}
              </div>

              <div>
                <p className="mt-2 text-sm font-medium text-ink dark:text-gray-100">{t('coverageRadius')}</p>
                <div className="mt-1.5 grid grid-cols-3 gap-2">
                  {RADII.map((r) => (
                    <button key={r.m} type="button" onClick={() => setRadius(r.m)}
                      className={`rounded-base border p-3 text-sm font-medium transition-all ${radius === r.m ? 'border-primary bg-primary/10 text-primary' : 'border-line text-slate dark:border-gray-700'}`}>{t(r.labelKey)}</button>
                  ))}
                </div>
              </div>

              {/* Visual coverage confirmation — circles for each selected town. */}
              {towns.size > 0 && (
                <div>
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate">{t('coveragePreview')}</p>
                  <CoverageMap selectedKeys={towns} radiusMeters={radius} />
                </div>
              )}

              <p className="text-xs text-slate">{t('townsSelected', { count: towns.size })}</p>
              <Button className="w-full" disabled={towns.size === 0} onClick={() => guard(saveAreas)}>{t('continue')}</Button>
            </>
          )}

          {step === 3 && (
            <>
              <p className="text-sm font-medium">{t('uploadDocuments')}</p>
              <FileUpload label={t('nicLabel')} capture="environment"
                uploaded={docs['nic']} onPicked={(file) => uploadDoc('nic', file)} />
              <FileUpload label={t('selfieLabel')} capture="user"
                uploaded={docs['selfie']} onPicked={(file) => uploadDoc('selfie', file)} />
              <FileUpload label={t('certificateLabel')}
                uploaded={docs['certificate']} onPicked={(file) => uploadDoc('certificate', file)} />
              <Button className="w-full" disabled={!docs['nic'] || !docs['selfie']}
                onClick={() => setStep(4)}>{t('continue')}</Button>
              {(!docs['nic'] || !docs['selfie']) && <p className="text-xs text-slate">{t('nicSelfieRequired')}</p>}
            </>
          )}

          {step === 4 && (
            <>
              <label className="block"><span className="mb-1 block text-sm font-medium">{t('workingDays')}</span>
                <input value={days} onChange={(e) => setDays(e.target.value)}
                  className={inputCls} /></label>
              <label className="block"><span className="mb-1 block text-sm font-medium">{t('workingHours')}</span>
                <input value={hours} onChange={(e) => setHours(e.target.value)}
                  className={inputCls} /></label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={emergency} onChange={(e) => setEmergency(e.target.checked)} />
                {t('emergencyCalls')}
              </label>
              <Button className="w-full" onClick={submitAll}>{t('submitForVerification')}</Button>
            </>
          )}
        </Card>
      )}
    </div>
  );
}
