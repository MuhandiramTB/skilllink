'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { bookingApi, type Match } from '@/lib/booking-api';
import { favouritesApi } from '@/lib/favourites-api';
import { fetchCategories, type CategoryPrice } from '@/lib/api';
import { getToken } from '@/lib/session';
import { TOWNS, nearestTown } from '@/lib/towns';
import { Button, Card, ErrorBanner, EmptyState, Spinner, Field, StatusBadge, SkeletonList, inputCls } from '@/components/ui';
import { PriceHint } from '@/components/PriceHint';
import { Reveal } from '@/components/Reveal';
import { AddressPicker, KANDY, type AddressValue } from '@/components/AddressPicker';
import { CelebrationOverlay } from '@/components/CelebrationOverlay';
import { ICONS, HEART_PATH, HEART_OUTLINE_PATH } from '@/components/nav-config';

/**
 * Category page — Uber-style. Landing on it (with ?loc from the search) IMMEDIATELY
 * shows the ranked providers in that area (public /match — no login, no booking).
 * The user sees real electricians/plumbers/etc. right away, can change the area,
 * and only when they pick "Book" do we collect the job details + create the booking
 * (logging in at that point if needed).
 */
export default function CategoryBookingPage() {
  const p = useParams();
  const key = p.key as string;
  const locale = (p.locale as string) ?? 'en';
  const searchParams = useSearchParams();
  const t = useTranslations('dash');

  const [location, setLocation] = useState<AddressValue>({ ...KANDY });
  const [matches, setMatches] = useState<Match[] | null>(null); // null = loading
  const [browseErr, setBrowseErr] = useState('');
  const [sort, setSort] = useState<'best' | 'nearest' | 'rating'>('best');
  const [favIds, setFavIds] = useState<Set<string>>(new Set());
  const [price, setPrice] = useState<CategoryPrice | null>(null);
  const [editLoc, setEditLoc] = useState(false);

  // Booking step (opens only when the user picks a provider to book).
  const [bookProvider, setBookProvider] = useState<Match | null>(null);
  const [desc, setDesc] = useState('');
  const [when, setWhen] = useState<'asap' | 'scheduled'>('asap');
  const [scheduledFor, setScheduledFor] = useState('');
  const [bookingBusy, setBookingBusy] = useState(false);
  const [bookingErr, setBookingErr] = useState('');
  const [celebrate, setCelebrate] = useState(false);
  const [newBookingId, setNewBookingId] = useState<string | null>(null);

  const areaName = nearestTown(location.lat, location.lng).town.name;

  // Fetch the public provider list for the current area + category.
  const browse = useCallback(async (loc: AddressValue) => {
    setMatches(null); setBrowseErr('');
    try {
      const res = await bookingApi.browseProviders(key, loc.lat, loc.lng);
      setMatches(res);
      if (getToken()) favouritesApi.ids().then((ids) => setFavIds(new Set(ids))).catch(() => {});
    } catch (e) { setBrowseErr((e as Error).message); setMatches([]); }
  }, [key]);

  // Resolve ?loc handoff, then browse immediately.
  useEffect(() => {
    const locKey = searchParams.get('loc');
    const town = locKey ? TOWNS.find((tn) => tn.key === locKey) : undefined;
    const start: AddressValue = town ? { lat: town.lat, lng: town.lng, addressText: town.name } : { ...KANDY };
    setLocation(start);
    void browse(start);
  }, [searchParams, browse]);

  // Category price band (best-effort).
  useEffect(() => {
    fetchCategories().then((cats) => {
      for (const c of cats) {
        if (c.key === key) { setPrice(c.price); return; }
        const child = c.children.find((ch) => ch.key === key);
        if (child) { setPrice(child.price); return; }
      }
    }).catch(() => {});
  }, [key]);

  async function toggleFav(providerId: string) {
    if (!getToken()) { window.location.href = `/${locale}/login?next=/${locale}/category/${key}`; return; }
    setFavIds((prev) => { const n = new Set(prev); n.has(providerId) ? n.delete(providerId) : n.add(providerId); return n; });
    try { const { favourited } = await favouritesApi.toggle(providerId);
      setFavIds((prev) => { const n = new Set(prev); favourited ? n.add(providerId) : n.delete(providerId); return n; });
    } catch { /* revert silently */ }
  }

  function applyLocation(loc: AddressValue) { setLocation(loc); setEditLoc(false); void browse(loc); }

  function startBooking(m: Match) {
    if (!getToken()) { window.location.href = `/${locale}/login?next=/${locale}/category/${key}`; return; }
    setBookProvider(m); setBookingErr(''); setDesc(''); setWhen('asap'); setScheduledFor('');
  }

  async function confirmBooking() {
    if (!bookProvider) return;
    setBookingErr('');
    if (desc.trim().length < 5) { setBookingErr(t('describeRequired')); return; }
    if (when === 'scheduled' && !scheduledFor) { setBookingErr(t('pickTimeRequired')); return; }
    setBookingBusy(true);
    try {
      const iso = when === 'scheduled' && scheduledFor ? new Date(scheduledFor).toISOString() : undefined;
      const b = await bookingApi.create(key, desc, location.lat, location.lng, iso, {
        addressText: location.addressText, addressNotes: location.addressNotes,
      });
      await bookingApi.assign(b.id, bookProvider.provider_id);
      setNewBookingId(b.id); setCelebrate(true);
      setTimeout(() => { window.location.href = `/${locale}/bookings/${b.id}`; }, 2200);
    } catch (e) { setBookingErr((e as Error).message); setBookingBusy(false); }
  }

  const sorted = matches ? [...matches].sort((a, b) => {
    if (sort === 'nearest') return a.distance_m - b.distance_m;
    if (sort === 'rating') return b.rating_avg - a.rating_avg || b.rating_count - a.rating_count;
    return b.score - a.score;
  }) : [];

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <a href={`/${locale}/book`} className="inline-flex items-center gap-1 text-sm text-primary hover:underline">← {t('allServices')}</a>

      {/* Header: category + the area, editable inline (Uber "where" bar). */}
      <div>
        <h1 className="font-display text-3xl font-extrabold capitalize tracking-tightest text-ink dark:text-gray-50 sm:text-4xl">{key.replace(/[._]/g, ' ')}</h1>
        <button type="button" onClick={() => setEditLoc((v) => !v)} className="group mt-2 inline-flex items-center gap-2 rounded-pill border border-line bg-white px-3.5 py-2 text-sm font-bold text-ink shadow-card transition hover:border-brand dark:border-gray-800 dark:bg-gray-900 dark:text-gray-100">
          <span className="[&>svg]:h-4 [&>svg]:w-4 text-primary dark:text-gray-200" aria-hidden="true">{ICONS.map}</span>
          {t('providersIn', { area: areaName })}
          <span className="rounded-pill bg-brand px-2 py-0.5 text-xs font-bold text-brand-ink">{t('change')}</span>
        </button>
      </div>

      {editLoc && (
        <Card className="space-y-3 rounded-xl2">
          <AddressPicker value={location} onChange={setLocation} label={t('whereService')} />
          <Button className="w-full" onClick={() => applyLocation(location)}>{t('showProviders')}</Button>
        </Card>
      )}

      {price && (
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 rounded-xl2 border border-line bg-surface px-4 py-2.5 dark:border-gray-800 dark:bg-gray-800/40">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-slate"><span className="h-1.5 w-1.5 rounded-full bg-brand" aria-hidden="true" />{t('priceGuidance')}</span>
          <PriceHint price={price} fromLabel={t('priceFrom')} rangeLabel={t('priceRange')} className="text-sm" />
          <span className="w-full text-xs text-slate">{t('priceDisclaimer')}</span>
        </div>
      )}

      {browseErr && <ErrorBanner message={browseErr} />}

      {/* Sort + count */}
      {matches && matches.length > 0 && (
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm text-slate">{t('providersFound', { count: matches.length })}</p>
          <label className="flex items-center gap-1.5 text-xs text-slate">
            {t('sortBy')}
            <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} className={`${inputCls} w-auto py-1 text-xs`}>
              <option value="best">{t('sortBest')}</option>
              <option value="nearest">{t('sortNearest')}</option>
              <option value="rating">{t('sortRating')}</option>
            </select>
          </label>
        </div>
      )}

      {/* Provider list — the hero. */}
      {matches === null ? (
        <SkeletonList rows={4} />
      ) : matches.length === 0 ? (
        <EmptyState>
          <div className="space-y-3">
            <p>{t('noProvidersNearby')}</p>
            <Button variant="ghost" onClick={() => setEditLoc(true)}>{t('tryAnotherArea')}</Button>
          </div>
        </EmptyState>
      ) : (
        <div className="space-y-2.5">
          {sorted.map((m, i) => (
            <Reveal key={m.provider_id} delay={Math.min(i, 8) * 40}>
              <Card className="flex items-center gap-3.5 rounded-xl2 p-4 transition-all hover:-translate-y-0.5 hover:border-brand hover:shadow-lift sm:gap-4">
                <a href={`/${locale}/providers/${m.provider_id}`} className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl2 bg-surface dark:bg-gray-800">
                  {m.cover_photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={m.cover_photo} alt={m.business_name ?? ''} className="h-full w-full object-cover" />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-slate/50 [&>svg]:h-7 [&>svg]:w-7">{ICONS.tools}</span>
                  )}
                  {m.photo_count > 1 && <span className="absolute bottom-1 right-1 rounded bg-black/60 px-1 text-[10px] font-semibold text-white">+{m.photo_count - 1}</span>}
                </a>
                <a href={`/${locale}/providers/${m.provider_id}`} className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="truncate font-display text-lg font-extrabold tracking-tight text-ink dark:text-gray-50">{m.business_name}</p>
                    {m.verified && <StatusBadge status="approved" />}
                  </div>
                  <p className="mt-1.5 flex flex-wrap items-center gap-1.5 text-sm text-slate">
                    <span className="inline-flex items-center gap-1 rounded-pill bg-brand-soft px-2 py-0.5 font-bold text-brand-ink [&>svg]:h-3.5 [&>svg]:w-3.5 dark:bg-brand/15 dark:text-brand">
                      {ICONS.star}
                      <span className="tabular-nums">{m.rating_avg.toFixed(1)}</span>
                    </span>
                    {m.rating_count > 0 && <span className="text-xs">({m.rating_count})</span>}
                    <span aria-hidden="true">·</span>
                    <span className="tabular-nums">{(m.distance_m / 1000).toFixed(1)} km</span>
                  </p>
                </a>
                <div className="flex flex-col items-center gap-2">
                  <button type="button" onClick={() => toggleFav(m.provider_id)} aria-label={favIds.has(m.provider_id) ? t('removeFavourite') : t('addFavourite')} aria-pressed={favIds.has(m.provider_id)} className={`transition-transform hover:scale-110 ${favIds.has(m.provider_id) ? 'text-danger' : 'text-slate'}`}>
                    <svg viewBox="0 0 16 16" fill="currentColor" className="h-5 w-5" aria-hidden="true"><path d={favIds.has(m.provider_id) ? HEART_PATH : HEART_OUTLINE_PATH} /></svg>
                  </button>
                  <Button variant="brand" className="min-h-11 px-6" onClick={() => startBooking(m)}>{t('book')}</Button>
                </div>
              </Card>
            </Reveal>
          ))}
        </div>
      )}

      {/* Booking sheet — collects the job details AFTER a provider is chosen. */}
      {bookProvider && (
        <div className="fixed inset-0 z-[130] flex items-end justify-center p-0 sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label={t('bookWith', { name: bookProvider.business_name ?? '' })}>
          <button type="button" aria-label={t('cancel')} tabIndex={-1} className="absolute inset-0 cursor-default bg-ink/50 backdrop-blur-sm" onClick={() => !bookingBusy && setBookProvider(null)} />
          <div className="relative z-10 w-full max-w-md rounded-t-[22px] border border-line bg-white p-6 pt-4 shadow-lift dark:border-gray-800 dark:bg-gray-900 sm:rounded-xl2 sm:pt-6">
            <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-line dark:bg-gray-700 sm:hidden" aria-hidden="true" />
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand text-brand-ink [&>svg]:h-6 [&>svg]:w-6" aria-hidden="true">{ICONS.tools}</span>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate">{t('bookingWith')}</p>
                <p className="truncate font-display text-lg font-extrabold tracking-tight text-ink dark:text-gray-50">{bookProvider.business_name}</p>
              </div>
            </div>
            {bookingErr && <div className="mb-3"><ErrorBanner message={bookingErr} /></div>}
            <div className="space-y-4">
              <Field label={t('needHelpWith')}>
                <textarea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder={t('describePlaceholder')} className={inputCls} rows={3} />
              </Field>
              <Field label={t('whenService')}>
                <div className="flex gap-2">
                  {(['asap', 'scheduled'] as const).map((opt) => (
                    <button key={opt} type="button" onClick={() => setWhen(opt)} aria-pressed={when === opt}
                      className={`min-h-11 flex-1 rounded-base border-2 px-4 py-2.5 text-sm font-bold transition-all ${when === opt ? 'border-brand bg-brand-soft text-brand-ink dark:bg-brand/15 dark:text-brand' : 'border-line text-slate hover:border-ink hover:text-ink dark:border-gray-700'}`}>
                      {opt === 'asap' ? t('whenAsap') : t('whenScheduled')}
                    </button>
                  ))}
                </div>
                {when === 'scheduled' && (
                  <input type="datetime-local" value={scheduledFor} min={new Date(Date.now() + 30 * 60000).toISOString().slice(0, 16)} onChange={(e) => setScheduledFor(e.target.value)} className={`${inputCls} mt-2`} />
                )}
              </Field>
              <p className="text-xs text-slate">{t('bookingAreaNote', { area: areaName })}</p>
              <div className="flex flex-col-reverse gap-2 sm:flex-row">
                <Button variant="ghost" className="min-h-12 flex-1" disabled={bookingBusy} onClick={() => setBookProvider(null)}>{t('cancel')}</Button>
                <Button variant="brand" className="min-h-12 flex-1 text-base" disabled={bookingBusy} onClick={confirmBooking}>
                  {bookingBusy && <span className="h-4 w-4 animate-spin rounded-full border-2 border-brand-ink/30 border-t-brand-ink" aria-hidden="true" />}
                  {bookingBusy ? t('booking') : t('confirmBooking')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <CelebrationOverlay
        open={celebrate}
        title={t('bookingConfirmedTitle')}
        sub={t('bookingConfirmedSub')}
        onClose={() => { if (newBookingId) window.location.href = `/${locale}/bookings/${newBookingId}`; }}
      />
    </div>
  );
}
