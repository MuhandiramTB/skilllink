'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { getSession, homeForMode, becomeProvider } from '@/lib/session';
import { bookingApi, type BookingListItem } from '@/lib/booking-api';
import { rewardsApi, type RewardsSummary } from '@/lib/rewards-api';
import { favouritesApi, type Favourite } from '@/lib/favourites-api';
import { Button, AccentButton, Card, MetricCard, StatusBadge, SkeletonList, EmptyState, ErrorBanner } from '@/components/ui';
import { ICONS } from '@/components/nav-config';
import { CategoryIcon } from '@/components/category-icon';

// Popular service shortcuts shown in Quick Rebook before a customer has favourites.
const QUICK_SERVICES: { key: string; label: string }[] = [
  { key: 'electrician', label: 'Electrician' },
  { key: 'plumber', label: 'Plumber' },
  { key: 'ac_tech', label: 'AC' },
  { key: 'cleaning', label: 'Cleaning' },
];

const ACTIVE_STATUSES = new Set(['requested', 'matched', 'accepted', 'in_progress']);

// Per-category thumbnail photos for booking cards (free Unsplash), matching the
// Stitch design's photo-left layout. Falls back to a generic home-service shot.
const CAT_PHOTO: Record<string, string> = {
  electrician: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=400&q=70',
  plumber: 'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?auto=format&fit=crop&w=400&q=70',
  ac_tech: 'https://images.unsplash.com/photo-1631545806609-23da3b91c0d2?auto=format&fit=crop&w=400&q=70',
  cleaning: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=400&q=70',
  painter: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=400&q=70',
  carpenter: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=400&q=70',
  solar: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&w=400&q=70',
};
const FALLBACK_PHOTO = 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=400&q=70';
function catPhoto(key: string | null): string {
  if (!key) return FALLBACK_PHOTO;
  const m = Object.keys(CAT_PHOTO).find((k) => key.startsWith(k));
  return m ? CAT_PHOTO[m] : FALLBACK_PHOTO;
}

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

  const active = bookings?.filter((b) => ACTIVE_STATUSES.has(b.status)) ?? [];
  const completed = bookings?.filter((b) => b.status === 'completed').length ?? 0;
  const reasonIcon: Record<string, keyof typeof ICONS> = {
    booking_completed: 'star', review: 'star', referral_signup: 'user', referral_sender: 'user',
  };

  return (
    <div className="space-y-6">
      {/* Welcome header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tightest text-ink dark:text-gray-50">{t('customerTitle')}</h1>
          <p className="mt-1 text-sm text-slate dark:text-gray-400">
            {active.length > 0 ? t('activeToday', { count: active.length }) : t('customerSubtitle')}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <a href={`/${locale}/book`}><AccentButton>{t('bookAService')}</AccentButton></a>
          {!hasProvider && (
            <Button variant="ghost" disabled={becoming} onClick={onBecomeProvider}>
              {becoming ? t('settingUp') : t('becomeProvider')}
            </Button>
          )}
        </div>
      </div>

      {err && <ErrorBanner message={err} />}

      {/* Summary metrics */}
      <div className="grid grid-cols-3 gap-3">
        <MetricCard icon={ICONS.chat} tone="primary" label={t('activeBookings')} value={active.length} />
        <MetricCard icon={ICONS.star} tone="success" label={t('completed')} value={completed} />
        <MetricCard icon={ICONS.briefcase} label={t('totalBookings')} value={bookings?.length ?? 0} />
      </div>

      {/* Bento grid: active bookings (main) + side column */}
      <div className="grid gap-4 lg:grid-cols-12">
        {/* ---- Active bookings (8 cols) ---- */}
        <section className="flex flex-col gap-3 lg:col-span-8">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-ink dark:text-gray-50">{t('activeBookings')}</h2>
            <a href={`/${locale}/bookings`} className="text-sm font-semibold text-primary hover:underline">{t('viewAll')}</a>
          </div>

          {bookings === null && !err ? (
            <SkeletonList rows={2} />
          ) : active.length === 0 ? (
            <EmptyState>{t('noActiveBookings')} <a href={`/${locale}/book`} className="font-semibold text-primary hover:underline">{t('bookAService')}</a></EmptyState>
          ) : (
            <div className="flex flex-col gap-4">
              {active.map((b) => (
                <div key={b.id} className="group relative flex flex-col gap-4 overflow-hidden rounded-xl2 border border-line bg-white p-4 shadow-card transition-all duration-150 hover:shadow-lift dark:border-gray-800 dark:bg-gray-900 sm:flex-row">
                  {/* Status ribbon, top-right */}
                  <span className="absolute right-0 top-0 rounded-bl-xl bg-secondary-container px-4 py-1 text-xs font-semibold capitalize text-white">
                    {b.status.replace(/_/g, ' ')}
                  </span>
                  {/* Photo thumbnail */}
                  <div className="h-32 w-full shrink-0 overflow-hidden rounded-lg bg-surface dark:bg-gray-800 sm:w-32">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={catPhoto(b.categoryKey)} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
                  </div>
                  {/* Details */}
                  <div className="flex flex-1 flex-col justify-between gap-3">
                    <div>
                      <h3 className="font-display text-lg font-bold capitalize text-ink dark:text-gray-50">{b.categoryKey?.replace(/[._]/g, ' ') ?? t('service')}</h3>
                      <p className="mt-0.5 text-sm text-slate">{b.description || t('noDescription')} · {new Date(b.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <a href={`/${locale}/bookings/${b.id}`} className="rounded-lg bg-secondary-container px-5 py-2 text-sm font-semibold text-white transition-all hover:bg-primary-700 active:translate-y-px">{t('track')}</a>
                      <a href={`/${locale}/bookings/${b.id}`} className="rounded-lg border-2 border-secondary-container px-5 py-2 text-sm font-semibold text-secondary-container transition-colors hover:bg-secondary-container/10">{t('message')}</a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ---- Side column (4 cols) — always rendered so the bento layout holds ---- */}
        <div className="flex flex-col gap-4 lg:col-span-4">
          {/* Recent activity (rewards ledger) — colored icon circles per Stitch. */}
          <Card>
            <h2 className="mb-3 font-display text-base font-bold text-ink dark:text-gray-50">{t('recentActivity')}</h2>
            {rewards && rewards.ledger.length > 0 ? (
              <ul className="space-y-4">
                {rewards.ledger.slice(0, 4).map((e, idx) => {
                  const tone = [
                    'bg-secondary-container text-white',
                    'bg-primary-fixed text-primary-container',
                    'bg-tertiary-fixed-dim text-primary-container',
                  ][idx % 3];
                  return (
                    <li key={e.id} className="flex items-start gap-3">
                      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${tone}`} aria-hidden="true">
                        <span className="[&>svg]:h-[18px] [&>svg]:w-[18px]">{ICONS[reasonIcon[e.reason] ?? 'star']}</span>
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold capitalize text-ink dark:text-gray-100">{e.reason.replace(/_/g, ' ')}</p>
                        <p className="text-xs text-slate">{new Date(e.created_at).toLocaleDateString()} · <span className={`font-semibold tabular-nums ${e.points >= 0 ? 'text-success' : 'text-danger'}`}>{e.points >= 0 ? '+' : ''}{e.points} pts</span></p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="py-2 text-sm text-slate">{t('noActivityYet')}</p>
            )}
          </Card>

          {/* Quick rebook — favourites if any, else popular service shortcuts. */}
          <section>
            <h2 className="mb-2 font-display text-base font-bold text-ink dark:text-gray-50">{t('quickRebook')}</h2>
            <div className="grid grid-cols-2 gap-2">
              {favourites.length > 0
                ? favourites.slice(0, 4).map((f) => (
                    <a key={f.providerId} href={`/${locale}/providers/${f.providerId}`} className="flex flex-col items-center gap-2 rounded-xl2 border border-line bg-white p-4 text-center shadow-card transition-all hover:-translate-y-0.5 hover:border-primary hover:shadow-lift dark:border-gray-800 dark:bg-gray-900">
                      <span className="h-11 w-11 shrink-0 overflow-hidden rounded-full bg-primary/10">
                        {f.coverPhoto ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={f.coverPhoto} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <span className="flex h-full w-full items-center justify-center text-primary">{ICONS.briefcase}</span>
                        )}
                      </span>
                      <span className="truncate text-xs font-semibold text-ink dark:text-gray-100">{f.businessName ?? t('service')}</span>
                    </a>
                  ))
                : QUICK_SERVICES.map((s) => (
                    <a key={s.key} href={`/${locale}/category/${s.key}`} className="flex flex-col items-center gap-2 rounded-xl2 border border-line bg-white p-4 text-center shadow-card transition-all hover:-translate-y-0.5 hover:border-primary hover:shadow-lift dark:border-gray-800 dark:bg-gray-900">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <CategoryIcon keyName={s.key} className="h-5 w-5" />
                      </span>
                      <span className="truncate text-xs font-semibold text-ink dark:text-gray-100">{s.label}</span>
                    </a>
                  ))}
            </div>
          </section>
        </div>
      </div>

      {/* ===== Full-width promo band (Stitch "Protect your home" layout) ===== */}
      <section className="relative overflow-hidden rounded-[20px] bg-secondary-container p-7 text-white sm:p-9">
          <div className="relative z-10 max-w-lg">
            <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-white/80">
              <span className="[&>svg]:h-4 [&>svg]:w-4">{ICONS.star}</span>
              {t('rewards')} · {t('pointsBalance', { points: rewards?.points ?? 0 })}
            </p>
            <h3 className="mt-2 font-display text-2xl font-extrabold tracking-tightest sm:text-[28px]">{t('promoTitle')}</h3>
            <p className="mt-3 text-sm leading-relaxed text-white/90">{t('promoSub', { referrer: 50, referee: 30 })}</p>
            <a href={`/${locale}/profile#referrals`} className="mt-6 inline-block rounded-lg bg-white px-7 py-3 text-sm font-bold text-secondary-container transition-all hover:bg-white/90 active:translate-y-px">
              {t('referFriends')}
            </a>
          </div>
          {/* Giant faded decorative icon, like the Stitch HVAC glyph */}
          <div className="pointer-events-none absolute -bottom-10 -right-8 opacity-15" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="h-56 w-56">
              <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM22 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </section>

      {/* All bookings (full history) */}
      <section>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate">{t('yourBookings')}</h2>
        {bookings && bookings.length === 0 && !err ? (
          <EmptyState>{t('noBookingsYet')}</EmptyState>
        ) : (
          <ul className="space-y-2">
            {bookings?.map((b) => (
              <li key={b.id}>
                <a href={`/${locale}/bookings/${b.id}`}>
                  <Card className="transition-all hover:-translate-y-0.5 hover:border-primary hover:shadow-lift">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface text-slate dark:bg-gray-800" aria-hidden="true">{ICONS.chat}</span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-semibold capitalize text-ink dark:text-gray-100">{b.categoryKey?.replace(/[._]/g, ' ') ?? t('service')}</div>
                        <div className="text-xs text-slate dark:text-gray-400">{new Date(b.created_at).toLocaleDateString()}</div>
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
