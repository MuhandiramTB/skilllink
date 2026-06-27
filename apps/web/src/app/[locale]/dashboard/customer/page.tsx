'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { getSession, homeForMode, becomeProvider } from '@/lib/session';
import { bookingApi, type BookingListItem } from '@/lib/booking-api';
import { rewardsApi, type RewardsSummary } from '@/lib/rewards-api';
import { Button, Card, StatCard, StatusBadge, Spinner, EmptyState, ErrorBanner } from '@/components/ui';

const ACTIVE_STATUSES = new Set(['requested', 'matched', 'accepted', 'in_progress']);

export default function CustomerDashboard() {
  const locale = (useParams().locale as string) ?? 'en';
  const t = useTranslations('dash');
  const [bookings, setBookings] = useState<BookingListItem[] | null>(null);
  const [err, setErr] = useState('');
  const [becoming, setBecoming] = useState(false);
  const [rewards, setRewards] = useState<RewardsSummary | null>(null);

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
    // Rewards failure shouldn't break the dashboard — show inline only.
    rewardsApi.me().then(setRewards).catch(() => {});
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
        <h1 className="font-display text-xl font-bold">{t('customerTitle')}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">{t('customerSubtitle')}</p>
      </div>

      {err && <ErrorBanner message={err} />}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard label={t('activeBookings')} value={active} tone="primary" />
        <StatCard label={t('completed')} value={completed} tone="success" />
        <StatCard label={t('totalBookings')} value={bookings?.length ?? 0} />
      </div>

      <div className="flex flex-wrap gap-3">
        <a href={`/${locale}/book`}>
          <Button>{t('bookAService')}</Button>
        </a>
        {!hasProvider && (
          <Button variant="ghost" disabled={becoming} onClick={onBecomeProvider}>
            {becoming ? t('settingUp') : t('becomeProvider')}
          </Button>
        )}
      </div>

      {rewards && (
        <section>
          <Card className="rounded-2xl">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-[11px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">{t('rewards')}</div>
                <div className="text-2xl font-bold tabular-nums text-primary">⭐ {t('pointsBalance', { points: rewards.points })}</div>
              </div>
            </div>
            {rewards.ledger.length > 0 && (
              <div className="mt-3">
                <div className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">{t('recentActivity')}</div>
                <ul className="space-y-1 text-sm">
                  {rewards.ledger.slice(0, 3).map((e) => (
                    <li key={e.id} className="flex items-center justify-between rounded-base bg-gray-50 px-3 py-1.5 dark:bg-gray-700">
                      <span className="capitalize text-gray-600 dark:text-gray-300">{e.reason.replace(/_/g, ' ')}</span>
                      <span className={`font-medium tabular-nums ${e.points >= 0 ? 'text-success' : 'text-danger'}`}>
                        {e.points >= 0 ? '+' : ''}{e.points}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Card>
        </section>
      )}

      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          {t('yourBookings')}
        </h2>
        {bookings === null && !err ? (
          <Spinner label={t('loadingBookings')} />
        ) : bookings && bookings.length === 0 ? (
          <EmptyState>{t('noBookingsYet')}</EmptyState>
        ) : (
          <ul className="space-y-2">
            {bookings?.map((b) => (
              <li key={b.id}>
                <a href={`/${locale}/bookings/${b.id}`}>
                  <Card className="transition hover:border-primary">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate font-medium">{b.categoryKey ?? t('service')}</div>
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
