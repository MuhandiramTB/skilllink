'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { bookingApi, type Match } from '@/lib/booking-api';
import { favouritesApi } from '@/lib/favourites-api';
import { getToken } from '@/lib/session';
import { Button, Card, ErrorBanner, EmptyState, Spinner, PageHeader, Field, inputCls } from '@/components/ui';
import { LocationPicker, KANDY, type LatLng } from '@/components/LocationPicker';

export default function CategoryBookingPage() {
  const p = useParams();
  const key = p.key as string;
  const locale = (p.locale as string) ?? 'en';
  const t = useTranslations('dash');
  // null = checking (server + first client paint match), then resolved client-side —
  // avoids a hydration mismatch from reading localStorage during render.
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [desc, setDesc] = useState('');
  const [location, setLocation] = useState<LatLng>(KANDY);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [sort, setSort] = useState<'best' | 'nearest' | 'rating'>('best');
  const [favIds, setFavIds] = useState<Set<string>>(new Set());
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

  function fail(e: unknown) { setErr((e as Error).message); }

  async function findProviders() {
    setErr('');
    if (desc.trim().length < 5) { setErr(t('describeRequired')); return; }
    setBusy(true);
    try {
      const b = await bookingApi.create(key, desc, location.lat, location.lng);
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

      {!bookingId && (
        <Card className="space-y-4 rounded-2xl">
          <Field label={t('needHelpWith')}>
            <textarea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder={t('describePlaceholder')}
              className={inputCls} rows={3} />
          </Field>
          <LocationPicker value={location} onChange={setLocation} label={t('whereService')} />
          <Button onClick={findProviders} disabled={busy} className="w-full">{busy ? t('searching') : t('findProviders')}</Button>
        </Card>
      )}

      {bookingId && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{t('chooseProvider')}</h2>
            {matches.length > 1 && (
              <label className="flex items-center gap-1.5 text-xs text-gray-500">
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
          {sortedMatches.map((m) => (
            <Card key={m.provider_id} className="flex items-center gap-3 rounded-2xl">
              {/* Work-photo thumbnail (spec 12): the strongest trust signal. */}
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-800">
                {m.cover_photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={m.cover_photo} alt={m.business_name ?? ''} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xl text-gray-300">🛠️</div>
                )}
                {m.photo_count > 1 && (
                  <span className="absolute bottom-0.5 right-0.5 rounded bg-black/60 px-1 text-[10px] font-medium text-white">
                    +{m.photo_count - 1}
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="truncate font-medium">{m.business_name}</p>
                  {m.verified && (
                    <span className="shrink-0 rounded-full bg-green-100 px-1.5 py-0.5 text-[10px] font-medium text-success" title={t('verifiedProvider')}>
                      ✓ {t('verified')}
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-gray-500">
                  {(m.distance_m / 1000).toFixed(1)} km · ★ {m.rating_avg.toFixed(1)}
                  {m.rating_count > 0 && <span className="text-gray-400"> ({m.rating_count})</span>}
                </p>
                {m.photo_count > 0 && (
                  <p className="mt-0.5 text-[11px] text-primary">{t('photosCount', { count: m.photo_count })}</p>
                )}
              </div>
              <div className="flex flex-col items-center gap-1">
                <button
                  type="button"
                  onClick={() => toggleFav(m.provider_id)}
                  aria-label={favIds.has(m.provider_id) ? t('removeFavourite') : t('addFavourite')}
                  aria-pressed={favIds.has(m.provider_id)}
                  className="text-xl leading-none transition hover:scale-110"
                  title={favIds.has(m.provider_id) ? t('removeFavourite') : t('addFavourite')}
                >
                  {favIds.has(m.provider_id) ? '❤️' : '🤍'}
                </button>
                <Button variant="success" onClick={() => book(m.provider_id)}>{t('book')}</Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
