'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { getSession, homeForMode, becomeProvider } from '@/lib/session';
import { bookingApi, type BookingListItem } from '@/lib/booking-api';
import { rewardsApi, type RewardsSummary } from '@/lib/rewards-api';
import { favouritesApi, type Favourite } from '@/lib/favourites-api';
import { Button, AccentButton, Card, MetricCard, StatusBadge, Spinner, EmptyState, ErrorBanner } from '@/components/ui';
import { ICONS } from '@/components/nav-config';

const ACTIVE_STATUSES = new Set(['requested', 'matched', 'accepted', 'in_progress']);

export default function CustomerDashboard() {
  const locale = (useParams().locale as string) ?? 'en';
  const t = useTranslations('dash');
  const [bookings, setBookings] = useState<BookingListItem[] | null>(null);
  const [err, setErr] = useState('');
  const [becoming, setBecoming] = useState(false);
  const [rewards, setRewards] = useState<RewardsSummary | null>(null);
  const [favourites, setFavourites] = useState<Favourite[]>([]);

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
    // Rewards/favourites failures shouldn't break the dashboard — show inline only.
    rewardsApi.me().then(setRewards).catch(() => {});
    favouritesApi.list().then(setFavourites).catch(() => {});
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
        <h1 className="font-display text-xl font-bold text-ink dark:text-gray-50">{t('customerTitle')}</h1>
        <p className="text-sm text-slate dark:text-gray-400">{t('customerSubtitle')}</p>
      </div>

      {err && <ErrorBanner message={err} />}

      <div className="grid grid-cols-3 gap-3">
        <MetricCard icon={ICONS.chat} tone="primary" label={t('activeBookings')} value={active} />
        <MetricCard icon={ICONS.star} tone="success" label={t('completed')} value={completed} />
        <MetricCard icon={ICONS.briefcase} label={t('totalBookings')} value={bookings?.length ?? 0} />
      </div>

      <div className="flex flex-wrap gap-3">
        <a href={`/${locale}/book`}>
          <AccentButton>{t('bookAService')}</AccentButton>
        </a>
        {!hasProvider && (
          <Button variant="ghost" disabled={becoming} onClick={onBecomeProvider}>
            {becoming ? t('settingUp') : t('becomeProvider')}
          </Button>
        )}
      </div>

      {rewards && (
        <section>
          <Card className="rounded-xl2">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-[11px] font-medium uppercase tracking-wide text-slate dark:text-gray-400">{t('rewards')}</div>
                <div className="text-2xl font-bold tabular-nums text-primary">⭐ {t('pointsBalance', { points: rewards.points })}</div>
              </div>
            </div>
            {rewards.ledger.length > 0 && (
              <div className="mt-3">
                <div className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-slate dark:text-gray-400">{t('recentActivity')}</div>
                <ul className="space-y-1 text-sm">
                  {rewards.ledger.slice(0, 3).map((e) => (
                    <li key={e.id} className="flex items-center justify-between rounded-base bg-surface px-3 py-1.5 dark:bg-gray-700">
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

      {/* Compact referral promo — full code/apply UI lives in Profile (discoverable
          here without cluttering the dashboard). */}
      <a
        href={`/${locale}/profile#referrals`}
        className="group flex items-center gap-3.5 rounded-xl2 border border-primary/20 bg-primary/5 p-4 transition-all duration-150 hover:-translate-y-0.5 hover:border-primary hover:shadow-lift dark:border-primary/30 dark:bg-primary/10"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-white" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
            <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM22 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
          </svg>
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-semibold text-ink dark:text-gray-100">{t('referFriends')}</span>
          <span className="mt-0.5 block truncate text-xs text-slate">{t('referDashboardHint')}</span>
        </span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 shrink-0 text-primary transition-transform group-hover:translate-x-0.5" aria-hidden="true">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </a>

      {favourites.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate dark:text-gray-400">
            {t('favourites')}
          </h2>
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {favourites.map((f) => (
              <li key={f.providerId}>
                <Card className="flex items-center gap-3 transition-all hover:-translate-y-0.5 hover:border-primary hover:shadow-lift">
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-800">
                    {f.coverPhoto ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={f.coverPhoto} alt={f.businessName ?? ''} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-gray-300">🛠️</div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{f.businessName ?? t('service')}</div>
                    <div className="text-xs text-slate">★ {f.ratingAvg.toFixed(1)}{f.ratingCount > 0 && ` (${f.ratingCount})`}</div>
                  </div>
                  <a href={`/${locale}/providers/${f.providerId}`}>
                    <Button>{t('bookAgain')}</Button>
                  </a>
                </Card>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate dark:text-gray-400">
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
                  <Card className="transition-all hover:-translate-y-0.5 hover:border-primary hover:shadow-lift">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate font-medium">{b.categoryKey ?? t('service')}</div>
                        <div className="text-xs text-slate dark:text-gray-400">
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
