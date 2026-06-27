'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { providerApi, type ProviderMe } from '@/lib/provider-api';
import { getToken } from '@/lib/session';

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
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">{t('provider')}</h1>
      {err && <p className="rounded-base bg-red-50 p-2 text-sm text-danger">{err}</p>}
      {msg && <p className="rounded-base bg-green-50 p-2 text-sm text-success">{msg}</p>}

      {!me ? (
        <button onClick={becomeProvider} className="rounded-base bg-primary px-4 py-2 font-medium text-white">
          {t('becomeProvider')}
        </button>
      ) : (
        <div className="space-y-4">
          <div className="rounded-base border bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
            <p>{t('statusLabel')}: <b className={me.status === 'approved' ? 'text-success' : 'text-accent'}>{me.status}</b></p>
            <p className="text-sm text-gray-600">{t('categoriesSet', { categories: me.categories, documents: me.verifications.length })}</p>
            <button onClick={toggleAvail} className={`mt-2 rounded-base px-3 py-1 text-sm ${me.isAvailable ? 'bg-success text-white' : 'bg-gray-200'}`}>
              {me.isAvailable ? t('available') : t('setAvailable')}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-base border bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
              <p className="text-2xl font-semibold text-primary">LKR {((earnings?.totalNetCents ?? 0) / 100).toLocaleString()}</p>
              <p className="text-xs text-gray-500">{t('netEarnings')}</p>
            </div>
            <a href={`provider/jobs`} className="rounded-base border bg-white p-4 hover:border-primary dark:border-gray-700 dark:bg-gray-800">
              <p className="text-2xl font-semibold text-primary">{earnings?.paidJobs ?? 0}</p>
              <p className="text-xs text-gray-500">{t('viewAllJobs')}</p>
            </a>
          </div>

          <div className="rounded-base border bg-white p-4 space-y-2 dark:border-gray-700 dark:bg-gray-800">
            <h2 className="font-medium">{t('sectionIdentity')}</h2>
            <div className="flex flex-wrap gap-2">
              {['nic', 'selfie', 'certificate'].map((docType) => (
                <button key={docType} onClick={() => uploadDoc(docType)} className="rounded-base border px-3 py-1 text-sm hover:border-primary">
                  {t('uploadDoc', { type: docType })}
                </button>
              ))}
            </div>
            <ul className="text-xs text-gray-600">
              {me.verifications.map((v, i) => <li key={i}>{v.type}: {v.status}</li>)}
            </ul>
          </div>

          <div className="rounded-base border bg-white p-4 space-y-2 dark:border-gray-700 dark:bg-gray-800">
            <h2 className="font-medium">{t('sectionCategory')}</h2>
            <div className="flex flex-wrap gap-2">
              {cats.map((c) => (
                <button key={c.id} onClick={() => pickCategory(c.id)} className="rounded-base border px-3 py-1 text-sm hover:border-primary">
                  {c.name.en}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-base border bg-white p-4 space-y-2 dark:border-gray-700 dark:bg-gray-800">
            <h2 className="font-medium">{t('sectionServiceArea')}</h2>
            <button onClick={setArea} className="rounded-base border px-3 py-1 text-sm hover:border-primary">
              {t('setAreaKandy')}
            </button>
          </div>
        </div>
      )}

      {!me && (
        <a href="provider/register" className="block rounded-base border border-dashed border-primary/50 p-4 text-center text-sm font-medium text-primary">
          {t('completeRegistration')}
        </a>
      )}

      {/* Floating online/offline action (spec: "Go Online"). Only when approved. */}
      {me && me.status === 'approved' && (
        <button
          onClick={toggleAvail}
          className={`fixed bottom-20 left-1/2 z-20 -translate-x-1/2 rounded-full px-6 py-3 text-sm font-semibold shadow-lg transition ${
            me.isAvailable ? 'bg-success text-white' : 'bg-primary text-white'
          }`}
        >
          {me.isAvailable ? t('goOnlineTapOffline') : t('goOnline')}
        </button>
      )}

    </div>
  );
}
