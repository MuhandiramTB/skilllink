'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getSession, homeForMode, becomeProvider } from '@/lib/session';
import { bookingApi, type BookingListItem } from '@/lib/booking-api';
import { Button, Card, StatCard, StatusBadge, Spinner, EmptyState, ErrorBanner } from '@/components/ui';

const ACTIVE_STATUSES = new Set(['requested', 'matched', 'accepted', 'in_progress']);

export default function CustomerDashboard() {
  const locale = (useParams().locale as string) ?? 'en';
  const [bookings, setBookings] = useState<BookingListItem[] | null>(null);
  const [err, setErr] = useState('');
  const [becoming, setBecoming] = useState(false);

  const session = typeof window !== 'undefined' ? getSession() : null;
  const hasProvider = session?.roles.includes('provider') ?? false;

  useEffect(() => {
    const s = getSession();
    if (s && s.mode !== 'customer') {
      window.location.href = homeForMode(locale, s.mode);
      return;
    }
    bookingApi
      .list('customer')
      .then(setBookings)
      .catch((e) => setErr((e as Error).message));
  }, [locale]);

  async function onBecomeProvider() {
    setErr('');
    setBecoming(true);
    try {
      const s = await becomeProvider();
      window.location.href = homeForMode(locale, s.mode);
    } catch (e) {
      setErr((e as Error).message);
      setBecoming(false);
    }
  }

  const active = bookings?.filter((b) => ACTIVE_STATUSES.has(b.status)).length ?? 0;
  const completed = bookings?.filter((b) => b.status === 'completed').length ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-xl font-bold">Your dashboard</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Track your bookings and find help fast.</p>
      </div>

      {err && <ErrorBanner message={err} />}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard label="Active bookings" value={active} tone="primary" />
        <StatCard label="Completed" value={completed} tone="success" />
        <StatCard label="Total bookings" value={bookings?.length ?? 0} />
      </div>

      <div className="flex flex-wrap gap-3">
        <a href={`/${locale}`}>
          <Button>Book a service</Button>
        </a>
        {!hasProvider && (
          <Button variant="ghost" disabled={becoming} onClick={onBecomeProvider}>
            {becoming ? 'Setting up…' : 'Become a provider'}
          </Button>
        )}
      </div>

      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          Your bookings
        </h2>
        {bookings === null && !err ? (
          <Spinner label="Loading bookings…" />
        ) : bookings && bookings.length === 0 ? (
          <EmptyState>No bookings yet. Tap “Book a service” to get started.</EmptyState>
        ) : (
          <ul className="space-y-2">
            {bookings?.map((b) => (
              <li key={b.id}>
                <a href={`/${locale}/bookings/${b.id}`}>
                  <Card className="transition hover:border-primary">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate font-medium">{b.categoryKey ?? 'Service'}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(b.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <StatusBadge status={b.status} />
                    </div>
                  </Card>
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
