'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { bookingApi, type Match } from '@/lib/booking-api';
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
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => { setAuthed(!!getToken()); }, []);

  function fail(e: unknown) { setErr((e as Error).message); }

  async function findProviders() {
    setErr(''); setBusy(true);
    try {
      const b = await bookingApi.create(key, desc, location.lat, location.lng);
      setBookingId(b.id);
      const m = await bookingApi.matches(b.id);
      setMatches(m.results);
      if (m.note) setErr(t('noProvidersNote'));
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
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{t('chooseProvider')}</h2>
          {matches.length === 0 && <EmptyState>{t('noProvidersNearby')}</EmptyState>}
          {matches.map((m) => (
            <Card key={m.provider_id} className="flex items-center justify-between gap-3 rounded-2xl">
              <div className="min-w-0">
                <p className="truncate font-medium">{m.business_name}</p>
                <p className="mt-0.5 text-xs text-gray-500">{(m.distance_m / 1000).toFixed(1)} km · ★ {m.rating_avg}</p>
              </div>
              <Button variant="success" onClick={() => book(m.provider_id)}>{t('book')}</Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
