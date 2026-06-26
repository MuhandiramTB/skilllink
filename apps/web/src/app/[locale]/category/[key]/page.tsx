'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { bookingApi, type Match } from '@/lib/booking-api';
import { getToken } from '@/lib/admin-api';
import { Button, Card, ErrorBanner, EmptyState, Spinner } from '@/components/ui';
import { LocationPicker, KANDY, type LatLng } from '@/components/LocationPicker';

export default function CategoryBookingPage() {
  const p = useParams();
  const key = p.key as string;
  const locale = (p.locale as string) ?? 'en';
  const [authed, setAuthed] = useState(typeof window !== 'undefined' && !!getToken());
  const [desc, setDesc] = useState('');
  const [location, setLocation] = useState<LatLng>(KANDY);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  function fail(e: unknown) { setErr((e as Error).message); }

  async function findProviders() {
    setErr(''); setBusy(true);
    try {
      const b = await bookingApi.create(key, desc, location.lat, location.lng);
      setBookingId(b.id);
      const m = await bookingApi.matches(b.id);
      setMatches(m.results);
      if (m.note) setErr('No providers available near your location yet.');
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

  if (!authed) {
    if (typeof window !== 'undefined') {
      const next = encodeURIComponent(`/${locale}/category/${key}`);
      window.location.href = `/${locale}/login?next=${next}`;
    }
    return <Spinner label="Redirecting to sign in…" />;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold capitalize">Book: {key.replace(/[._]/g, ' ')}</h1>
      {err && <ErrorBanner message={err} />}

      {!bookingId && (
        <div className="space-y-2">
          <textarea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Describe the issue…"
            className="w-full rounded-base border px-3 py-2" rows={3} />
          <LocationPicker value={location} onChange={setLocation} label="Where do you need the service?" />
          <Button onClick={findProviders} disabled={busy}>{busy ? 'Searching…' : 'Find providers near me'}</Button>
        </div>
      )}

      {bookingId && (
        <div className="space-y-2">
          <h2 className="font-medium">Choose a verified provider</h2>
          {matches.length === 0 && <EmptyState>No verified providers available nearby.</EmptyState>}
          {matches.map((m) => (
            <Card key={m.provider_id} className="flex items-center justify-between">
              <div>
                <p className="font-medium">{m.business_name}</p>
                <p className="text-xs text-gray-500">{(m.distance_m / 1000).toFixed(1)} km · ★ {m.rating_avg}</p>
              </div>
              <Button onClick={() => book(m.provider_id)}>Book</Button>
            </Card>
          ))}
        </div>
      )}

      <a href={`/${locale}/bookings`} className="block text-sm text-primary hover:underline">← My bookings</a>
    </div>
  );
}
