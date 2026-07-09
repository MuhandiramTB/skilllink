'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { bookingApi, type Match } from '@/lib/booking-api';
import { favouritesApi } from '@/lib/favourites-api';
import { fetchCategories, type CategoryPrice } from '@/lib/api';
import { getToken } from '@/lib/session';
import { TOWNS } from '@/lib/towns';
import { Button, Card, ErrorBanner, EmptyState, Spinner, PageHeader, Field, StatusBadge, inputCls } from '@/components/ui';
import { PriceHint } from '@/components/PriceHint';
import { Reveal } from '@/components/Reveal';
import { LocationPicker, KANDY, type LatLng } from '@/components/LocationPicker';
import { ICONS, HEART_PATH, HEART_OUTLINE_PATH } from '@/components/nav-config';

export default function CategoryBookingPage() {
  const p = useParams();
  const key = p.key as string;
  const locale = (p.locale as string) ?? 'en';
  const searchParams = useSearchParams();
  const t = useTranslations('dash');
  // null = checking (server + first client paint match), then resolved client-side —
  // avoids a hydration mismatch from reading localStorage during render.
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [desc, setDesc] = useState('');
  const [location, setLocation] = useState<LatLng>(KANDY);
  const [when, setWhen] = useState<'asap' | 'scheduled'>('asap');
  const [scheduledFor, setScheduledFor] = useState(''); // datetime-local value
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [sort, setSort] = useState<'best' | 'nearest' | 'rating'>('best');
  const [favIds, setFavIds] = useState<Set<string>>(new Set());
  const [price, setPrice] = useState<CategoryPrice | null>(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function toggleFav(providerId: string) {
    // Optimistic toggle; reconcile from the server response.
    setFavIds((prev) => {
      const next = new Set(prev);
      next.has(providerId) ? next.delete(providerId) : next.add(providerId);
      return next;
    });
    try {
      const { favourited } = await favouritesApi.toggle(providerId);
      setFavIds((prev) => {
        const next = new Set(prev);
        favourited ? next.add(providerId) : next.delete(providerId);
        return next;
      });
    } catch (e) { fail(e); }
  }

  const sortedMatches = [...matches].sort((a, b) => {
    if (sort === 'nearest') return a.distance_m - b.distance_m;
    if (sort === 'rating') return b.rating_avg - a.rating_avg || b.rating_count - a.rating_count;
    return b.score - a.score; // best match (server score)
  });

  useEffect(() => { setAuthed(!!getToken()); }, []);

  // Pricing transparency: look up this category's typical price band (best-effort).
  useEffect(() => {
    fetchCategories()
      .then((cats) => {
        for (const c of cats) {
          if (c.key === key) { setPrice(c.price); return; }
          const child = c.children.find((ch) => ch.key === key);
          if (child) { setPrice(child.price); return; }
        }
      })
      .catch(() => {});
  }, [key]);

  // Pre-set the location from a ?loc=<townKey> handoff (landing-page search), so
  // the map + matches start centered on the visitor's chosen area.
  useEffect(() => {
    const locKey = searchParams.get('loc');
    if (!locKey) return;
    const town = TOWNS.find((tn) => tn.key === locKey);
    if (town) setLocation({ lat: town.lat, lng: town.lng });
  }, [searchParams]);

  function fail(e: unknown) { setErr((e as Error).message); }

  async function findProviders() {
    setErr('');
    if (desc.trim().length < 5) { setErr(t('describeRequired')); return; }
    if (when === 'scheduled' && !scheduledFor) { setErr(t('pickTimeRequired')); return; }
    setBusy(true);
    try {
      const iso = when === 'scheduled' && scheduledFor ? new Date(scheduledFor).toISOString() : undefined;
      const b = await bookingApi.create(key, desc, location.lat, location.lng, iso);
      setBookingId(b.id);
      const m = await bookingApi.matches(b.id);
      setMatches(m.results);
      if (m.note) setErr(t('noProvidersNote'));
      // Load which of these are already favourited (best-effort; non-blocking).
      favouritesApi.ids().then((ids) => setFavIds(new Set(ids))).catch(() => {});
    } catch (e) { fail(e); } finally { setBusy(false); }
  }

  async function book(providerId: string) {
    if (!bookingId) return;
    try {
      await bookingApi.assign(bookingId, providerId);
      // Hand off to the booking detail page for tracking, chat, pay, review.
      window.location.href = `/${locale}/bookings/${bookingId}`;
    } catch (e) { fail(e); }
  }

  if (authed === null) return <Spinner />; // checking (matches server render)
  if (authed === false) {
    const next = encodeURIComponent(`/${locale}/category/${key}`);
    window.location.href = `/${locale}/login?next=${next}`;
    return <Spinner label="Redirecting to sign in…" />;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <a href={`/${locale}/bookings`} className="inline-flex items-center gap-1 text-sm text-primary hover:underline">{t('backToMyBookings')}</a>
      <PageHeader title={key.replace(/[._]/g, ' ')} subtitle={t('categorySubtitle')} />
      {err && <ErrorBanner message={err} />}

      {price && !bookingId && (
        <div className="rounded-xl2 border border-line bg-surface px-4 py-3 dark:border-gray-700 dark:bg-gray-800/40">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate">{t('priceGuidance')}</span>
            <PriceHint price={price} fromLabel={t('priceFrom')} rangeLabel={t('priceRange')} className="text-sm" />
          </div>
          <p className="mt-1 text-xs text-slate">{t('priceDisclaimer')}</p>
        </div>
      )}

      {!bookingId && (
        <Card className="space-y-4 rounded-xl2">
          <Field label={t('needHelpWith')}>
            <textarea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder={t('describePlaceholder')}
              className={inputCls} rows={3} />
          </Field>
          <LocationPicker value={location} onChange={setLocation} label={t('whereService')} />

          {/* When: ASAP (on-demand) or a scheduled date/time. */}
          <Field label={t('whenService')}>
            <div className="flex gap-2">
              {(['asap', 'scheduled'] as const).map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setWhen(opt)}
                  aria-pressed={when === opt}
                  className={`flex-1 rounded-base border px-4 py-2.5 text-sm font-semibold transition-all ${
                    when === opt ? 'border-primary bg-primary/10 text-primary' : 'border-line text-slate hover:border-ink hover:text-ink dark:border-gray-700'
                  }`}
                >
                  {opt === 'asap' ? t('whenAsap') : t('whenScheduled')}
                </button>
              ))}
            </div>
            {when === 'scheduled' && (
              <input
                type="datetime-local"
                value={scheduledFor}
                min={new Date(Date.now() + 30 * 60000).toISOString().slice(0, 16)}
                onChange={(e) => setScheduledFor(e.target.value)}
                className={`${inputCls} mt-2`}
              />
            )}
          </Field>

          <Button onClick={findProviders} disabled={busy} className="w-full">{busy ? t('searching') : t('findProviders')}</Button>
        </Card>
      )}

      {bookingId && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate dark:text-gray-400">{t('chooseProvider')}</h2>
            {matches.length > 1 && (
              <label className="flex items-center gap-1.5 text-xs text-slate">
                {t('sortBy')}
                <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} className={`${inputCls} w-auto py-1 text-xs`}>
                  <option value="best">{t('sortBest')}</option>
                  <option value="nearest">{t('sortNearest')}</option>
                  <option value="rating">{t('sortRating')}</option>
                </select>
              </label>
            )}
          </div>
          {matches.length === 0 && <EmptyState>{t('noProvidersNearby')}</EmptyState>}
          {sortedMatches.map((m, i) => (
            <Reveal key={m.provider_id} delay={i * 40}>
              <Card className="flex items-center gap-3 rounded-xl2 transition-all hover:-translate-y-0.5 hover:border-primary hover:shadow-lift">
                {/* Work-photo thumbnail (spec 12): the strongest trust signal. */}
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-surface dark:bg-gray-800">
                  {m.cover_photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={m.cover_photo} alt={m.business_name ?? ''} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-slate/50 [&>svg]:h-6 [&>svg]:w-6">{ICONS.tools}</div>
                  )}
                  {m.photo_count > 1 && (
                    <span className="absolute bottom-0.5 right-0.5 rounded bg-black/60 px-1 text-[10px] font-medium text-white">
                      +{m.photo_count - 1}
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="truncate font-semibold text-ink dark:text-gray-50">{m.business_name}</p>
                    {m.verified && <StatusBadge status="approved" />}
                  </div>
                  <p className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-slate">
                    <span className="inline-flex items-center gap-1 font-semibold text-warn [&>svg]:h-3.5 [&>svg]:w-3.5" aria-hidden="true">{ICONS.star}</span>
                    <span className="font-semibold tabular-nums text-ink dark:text-gray-100">{m.rating_avg.toFixed(1)}</span>
                    {m.rating_count > 0 && <span>({m.rating_count})</span>}
                    <span aria-hidden="true">·</span>
                    <span className="tabular-nums">{(m.distance_m / 1000).toFixed(1)} km</span>
                  </p>
                  {m.photo_count > 0 && (
                    <p className="mt-0.5 text-[11px] font-medium text-primary">{t('photosCount', { count: m.photo_count })}</p>
                  )}
                </div>
                <div className="flex flex-col items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => toggleFav(m.provider_id)}
                    aria-label={favIds.has(m.provider_id) ? t('removeFavourite') : t('addFavourite')}
                    aria-pressed={favIds.has(m.provider_id)}
                    className={`transition-transform hover:scale-110 ${favIds.has(m.provider_id) ? 'text-danger' : 'text-slate'}`}
                    title={favIds.has(m.provider_id) ? t('removeFavourite') : t('addFavourite')}
                  >
                    <svg viewBox="0 0 16 16" fill="currentColor" className="h-5 w-5" aria-hidden="true"><path d={favIds.has(m.provider_id) ? HEART_PATH : HEART_OUTLINE_PATH} /></svg>
                  </button>
                  <Button onClick={() => book(m.provider_id)}>{t('book')}</Button>
                </div>
              </Card>
            </Reveal>
          ))}
        </div>
      )}
    </div>
  );
}
