'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { providerApi } from '@/lib/provider-api';
import { getToken } from '@/lib/session';
import { Button, Card, ErrorBanner, Spinner, StatusBadge } from '@/components/ui';
import { LocationPicker, KANDY, type LatLng } from '@/components/LocationPicker';
import { FileUpload } from '@/components/FileUpload';

interface Cat { id: string; key: string; name: { en: string }; children: Cat[] }
const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

const STEPS = ['Basic', 'Service', 'Area', 'Verification', 'Availability'];
const RADII = [{ m: 5000, label: '5 km' }, { m: 10000, label: '10 km' }, { m: 25000, label: '25 km' }];

/** Provider multi-step registration (spec 10, Req 3) — target under 10 minutes. */
export default function ProviderRegisterPage() {
  const locale = (useParams().locale as string) ?? 'en';
  const [step, setStep] = useState(0);
  const [cats, setCats] = useState<Cat[]>([]);
  const [err, setErr] = useState('');
  const [done, setDone] = useState(false);

  // form state
  const [business, setBusiness] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [years, setYears] = useState('');
  const [radius, setRadius] = useState(10000);
  const [loc, setLoc] = useState<LatLng>(KANDY);
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
    providerApi.become(business || 'My Service').catch(() => {});
  }, [locale]);

  function fail(e: unknown) { setErr((e as Error).message); }
  async function guard(fn: () => Promise<unknown>, advance = true) {
    setErr('');
    try { await fn(); if (advance) setStep((s) => s + 1); } catch (e) { fail(e); }
  }

  // Receives the picked file from FileUpload. v1 doesn't ship bytes yet (Cloudinary
  // wiring pending) — we presign and record the returned fileUrl — but we keep the
  // File param so the transport swaps in here later without touching the callers.
  async function uploadDoc(type: string, _file?: File) {
    try {
      const { fileUrl } = await providerApi.presign(type) as { uploadUrl: string; fileUrl: string };
      await providerApi.addVerification(type, fileUrl);
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
      <div className="mx-auto max-w-md text-center">
        <Card className="space-y-3">
          <StatusBadge status="pending" />
          <h1 className="font-display text-xl font-semibold">Submitted for review</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Our team will verify your details. You&apos;ll appear in customer searches once approved.
          </p>
          <Button onClick={() => (window.location.href = `/${locale}/provider`)}>Go to dashboard</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md space-y-4">
      <div>
        <h1 className="font-display text-xl font-semibold">Become a provider</h1>
        {/* stepper */}
        <div className="mt-3 flex gap-1.5">
          {STEPS.map((s, i) => (
            <div key={s} className={`h-1.5 flex-1 rounded-full ${i <= step ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700'}`} />
          ))}
        </div>
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Step {step + 1} of {STEPS.length} — {STEPS[step]}</p>
      </div>

      {err && <ErrorBanner message={err} />}
      {cats.length === 0 ? <Spinner /> : (
        <Card className="space-y-4">
          {step === 0 && (
            <>
              <label className="block"><span className="mb-1 block text-sm font-medium">Business / your name</span>
                <input autoFocus value={business} onChange={(e) => setBusiness(e.target.value)}
                  className="w-full rounded-base border px-3 py-2.5 dark:border-gray-600 dark:bg-gray-900" placeholder="e.g. Bandara Electricals" /></label>
              <Button className="w-full" onClick={() => guard(() => providerApi.become(business || 'My Service'))}>Continue</Button>
            </>
          )}

          {step === 1 && (
            <>
              <label className="block"><span className="mb-1 block text-sm font-medium">Service category</span>
                <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full rounded-base border px-3 py-2.5 dark:border-gray-600 dark:bg-gray-900">
                  {cats.map((c) => <option key={c.id} value={c.id}>{c.name.en}</option>)}
                </select></label>
              <label className="block"><span className="mb-1 block text-sm font-medium">Years of experience</span>
                <input inputMode="numeric" value={years} onChange={(e) => setYears(e.target.value)}
                  className="w-full rounded-base border px-3 py-2.5 dark:border-gray-600 dark:bg-gray-900" placeholder="e.g. 5" /></label>
              <Button className="w-full" onClick={() => guard(() => providerApi.setCategories([categoryId]))}>Continue</Button>
            </>
          )}

          {step === 2 && (
            <>
              <p className="text-sm font-medium">Working radius from your location</p>
              <div className="grid grid-cols-3 gap-2">
                {RADII.map((r) => (
                  <button key={r.m} onClick={() => setRadius(r.m)}
                    className={`rounded-base border p-3 text-sm font-medium ${radius === r.m ? 'border-primary bg-primary/10' : 'dark:border-gray-600'}`}>{r.label}</button>
                ))}
              </div>
              <LocationPicker value={loc} onChange={setLoc} label="Your base location" />
              <Button className="w-full" onClick={() => guard(() => providerApi.setServiceArea(loc.lat, loc.lng, radius))}>Continue</Button>
            </>
          )}

          {step === 3 && (
            <>
              <p className="text-sm font-medium">Upload documents</p>
              <FileUpload label="NIC (front & back)" capture="environment"
                uploaded={docs['nic']} onPicked={(file) => uploadDoc('nic', file)} />
              <FileUpload label="Selfie verification" capture="user"
                uploaded={docs['selfie']} onPicked={(file) => uploadDoc('selfie', file)} />
              <FileUpload label="Trade certificate (optional)"
                uploaded={docs['certificate']} onPicked={(file) => uploadDoc('certificate', file)} />
              <Button className="w-full" disabled={!docs['nic'] || !docs['selfie']}
                onClick={() => setStep(4)}>Continue</Button>
              {(!docs['nic'] || !docs['selfie']) && <p className="text-xs text-gray-400">NIC and selfie are required.</p>}
            </>
          )}

          {step === 4 && (
            <>
              <label className="block"><span className="mb-1 block text-sm font-medium">Working days</span>
                <input value={days} onChange={(e) => setDays(e.target.value)}
                  className="w-full rounded-base border px-3 py-2.5 dark:border-gray-600 dark:bg-gray-900" /></label>
              <label className="block"><span className="mb-1 block text-sm font-medium">Working hours</span>
                <input value={hours} onChange={(e) => setHours(e.target.value)}
                  className="w-full rounded-base border px-3 py-2.5 dark:border-gray-600 dark:bg-gray-900" /></label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={emergency} onChange={(e) => setEmergency(e.target.checked)} />
                Available for emergency calls
              </label>
              <Button className="w-full" onClick={submitAll}>Submit for verification</Button>
            </>
          )}
        </Card>
      )}
    </div>
  );
}
