'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { publicProviderApi, favouritesApi, type PublicProvider } from '@/lib/favourites-api';
import { safetyApi } from '@/lib/safety-api';
import { getToken } from '@/lib/session';
import { Button, Card, Field, inputCls, Spinner, ErrorBanner, EmptyState, StatusBadge, SuccessBanner } from '@/components/ui';
import { Reveal } from '@/components/Reveal';
import { ICONS } from '@/components/nav-config';

/** Public provider profile (spec 12/14): work-photos gallery, rating, verified, favourite. */
export default function ProviderProfilePage() {
  const p = useParams();
  const id = p.id as string;
  const locale = (p.locale as string) ?? 'en';
  const t = useTranslations('dash');
  const [provider, setProvider] = useState<PublicProvider | null>(null);
  const [err, setErr] = useState('');
  const [fav, setFav] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);

  // Report-a-provider
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState<'safety' | 'fraud' | 'no_show' | 'quality' | 'other'>('safety');
  const [reportDetail, setReportDetail] = useState('');
  const [reportBusy, setReportBusy] = useState(false);
  const [reportDone, setReportDone] = useState(false);

  async function submitReport(e: React.FormEvent) {
    e.preventDefault();
    setErr(''); setReportBusy(true);
    try {
      await safetyApi.report({ providerId: id, reason: reportReason, detail: reportDetail.trim() || undefined });
      setReportDone(true);
      setReportOpen(false);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setReportBusy(false);
    }
  }

  useEffect(() => {
    publicProviderApi.profile(id).then(setProvider).catch((e) => setErr((e as Error).message));
    if (getToken()) favouritesApi.ids().then((ids) => setFav(ids.includes(id))).catch(() => {});
  }, [id]);

  async function toggleFav() {
    if (!getToken()) { window.location.href = `/${locale}/login?next=/${locale}/providers/${id}`; return; }
    setFav((v) => !v); // optimistic
    try { const { favourited } = await favouritesApi.toggle(id); setFav(favourited); } catch (e) { setErr((e as Error).message); }
  }

  if (err && !provider) return <div className="mx-auto max-w-2xl"><ErrorBanner message={err} /></div>;
  if (!provider) return <Spinner />;

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <a href={`/${locale}/dashboard/customer`} className="inline-flex items-center gap-1 text-sm text-primary hover:underline">{t('backToMyBookings')}</a>

      {/* Profile header card */}
      <Reveal>
        <Card className="flex items-start gap-4">
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary [&>svg]:h-7 [&>svg]:w-7" aria-hidden="true">{ICONS.user}</span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-xl font-extrabold tracking-tightest text-ink dark:text-gray-50 sm:text-2xl">{provider.businessName ?? t('service')}</h1>
              {provider.verified && <StatusBadge status="approved" />}
            </div>
            <p className="mt-1.5 flex flex-wrap items-center gap-1.5 text-sm text-slate">
              <span className="inline-flex items-center text-warn [&>svg]:h-4 [&>svg]:w-4" aria-hidden="true">{ICONS.star}</span>
              <span className="font-semibold tabular-nums text-ink dark:text-gray-100">{provider.ratingAvg.toFixed(1)}</span>
              {provider.ratingCount > 0 && <span>· {t('photosCount', { count: provider.ratingCount })}</span>}
            </p>
          </div>
          <button
            type="button"
            onClick={toggleFav}
            aria-pressed={fav}
            aria-label={fav ? t('removeFavourite') : t('addFavourite')}
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line transition-all hover:scale-105 ${fav ? 'border-danger/30 bg-danger/10 text-danger' : 'text-slate hover:border-ink hover:text-ink'} dark:border-gray-700`}
            title={fav ? t('removeFavourite') : t('addFavourite')}
          >
            <svg viewBox="0 0 24 24" fill={fav ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true"><path d="M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 00-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 000-7.8z" /></svg>
          </button>
        </Card>
      </Reveal>

      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate dark:text-gray-400">{t('workPhotos')}</h2>
        {provider.photos.length === 0 ? (
          <EmptyState>{t('noWorkPhotosPublic')}</EmptyState>
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {provider.photos.map((ph, i) => (
              <Reveal key={ph.id} delay={Math.min(i, 9) * 40}>
                <button
                  type="button"
                  onClick={() => setLightbox(ph.url)}
                  className="aspect-square w-full overflow-hidden rounded-base border border-line transition hover:opacity-90 dark:border-gray-700"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={ph.url} alt={ph.caption ?? t('workPhotos')} className="h-full w-full object-cover" />
                </button>
              </Reveal>
            ))}
          </div>
        )}
      </section>

      <a href={`/${locale}/book`} className="block">
        <Button className="w-full">{t('bookAgain')}</Button>
      </a>

      {reportDone && <SuccessBanner message={t('reportThanks')} />}

      {/* Subtle report link near the bottom */}
      <div className="pt-2 text-center">
        <button
          type="button"
          onClick={() => { setErr(''); setReportOpen(true); }}
          className="inline-flex items-center gap-1.5 text-sm text-slate transition hover:text-danger"
        >
          <span className="[&>svg]:h-3.5 [&>svg]:w-3.5" aria-hidden="true">{ICONS.flag}</span>
          {t('reportProvider')}
        </button>
      </div>

      {reportOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-ink/50 p-4 backdrop-blur-sm sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-label={t('reportProvider')}
          onClick={() => { if (!reportBusy) setReportOpen(false); }}
        >
          <div
            className="relative w-full max-w-md rounded-xl2 border border-line bg-white p-6 shadow-lift dark:border-gray-800 dark:bg-gray-900"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-display text-lg font-bold text-ink dark:text-gray-50">{t('reportProvider')}</h2>
            {err && <div className="mt-3"><ErrorBanner message={err} /></div>}
            <form onSubmit={submitReport} className="mt-4 space-y-4">
              <Field label={t('reportReason')}>
                <select value={reportReason} onChange={(e) => setReportReason(e.target.value as typeof reportReason)} className={inputCls}>
                  <option value="safety">{t('reportReasonSafety')}</option>
                  <option value="fraud">{t('reportReasonFraud')}</option>
                  <option value="no_show">{t('reportReasonNoShow')}</option>
                  <option value="quality">{t('reportReasonQuality')}</option>
                  <option value="other">{t('reportReasonOther')}</option>
                </select>
              </Field>
              <Field label={t('reportDetail')}>
                <textarea value={reportDetail} onChange={(e) => setReportDetail(e.target.value)} rows={4} className={inputCls} />
              </Field>
              <div className="flex flex-col-reverse gap-2 sm:flex-row">
                <Button type="button" variant="ghost" onClick={() => setReportOpen(false)} disabled={reportBusy} className="flex-1">
                  {t('backToMyBookings')}
                </Button>
                <Button type="submit" variant="danger" disabled={reportBusy} className="flex-1">
                  {reportBusy && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden />}
                  {t('reportSubmit')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setLightbox(null)}
          role="dialog"
          aria-modal="true"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={lightbox} alt="" className="max-h-full max-w-full rounded-base" />
        </div>
      )}
    </div>
  );
}
