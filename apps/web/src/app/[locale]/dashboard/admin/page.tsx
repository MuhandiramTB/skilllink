'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { getSession, homeForMode } from '@/lib/session';
import { adminApi, type Analytics } from '@/lib/admin-api';
import { Card, NavCard, Money, Spinner, EmptyState, ErrorBanner } from '@/components/ui';
import { ICONS } from '@/components/nav-config';
import { KpiCard, CountUp } from '@/components/charts';

// label = key in the `nav` namespace (already translated for the sidebar).
const QUICK_LINKS: { navKey: string; path: string; icon: keyof typeof ICONS }[] = [
  { navKey: 'users', path: '/admin/users', icon: 'user' },
  { navKey: 'providers', path: '/admin/verifications', icon: 'shield' },
  { navKey: 'disputes', path: '/admin/disputes', icon: 'flag' },
  { navKey: 'payments', path: '/admin/payments', icon: 'wallet' },
  { navKey: 'auditLog', path: '/admin/audit', icon: 'receipt' },
  { navKey: 'categories', path: '/admin/categories', icon: 'grid' },
  { navKey: 'districts', path: '/admin/districts', icon: 'map' },
];

export default function AdminDashboard() {
  const locale = (useParams().locale as string) ?? 'en';
  const t = useTranslations('dash');
  const tNav = useTranslations('nav');
  const [data, setData] = useState<Analytics | null>(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    const s = getSession();
    if (s && !s.roles.includes('admin')) {
      window.location.href = homeForMode(locale, s.mode);
      return;
    }
    if (s && s.mode !== 'admin') {
      window.location.href = homeForMode(locale, s.mode);
      return;
    }
    adminApi.analytics().then(setData).catch((e) => setErr((e as Error).message));
  }, [locale]);

  const byStatus = data ? Object.entries(data.bookings.byStatus) : [];
  const maxStatus = byStatus.reduce((m, [, n]) => Math.max(m, n), 0) || 1;

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-xl2 bg-ink p-5 shadow-lift sm:p-6">
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-brand/20 blur-2xl" aria-hidden="true" />
        <div className="relative">
          <h1 className="font-display text-3xl font-extrabold tracking-tightest text-white sm:text-4xl">{t('adminOverview')}</h1>
          <p className="mt-1 text-sm font-medium text-white/60">{t('platformHealth')}</p>
        </div>
      </div>

      {err && <ErrorBanner message={err} />}

      {data === null && !err ? (
        <Spinner label={t('loadingAnalytics')} />
      ) : data ? (
        <>
          {/* Money first — the headline metrics for an operator. */}
          <section className="space-y-3">
            <h2 className="font-display text-sm font-extrabold uppercase tracking-wide text-ink dark:text-gray-100">{t('revenueGroup')}</h2>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <KpiCard icon={ICONS.wallet} tone="success" label={t('grossRevenue')} value={<Money cents={data.revenue.grossCents} />} />
              <KpiCard icon={ICONS.receipt} tone="primary" label={t('commissionEarned')} value={<Money cents={data.revenue.commissionCents} />} />
              <KpiCard icon={ICONS.chat} tone="sky" label={t('totalBookings')} value={<CountUp value={data.bookings.total} />} />
              <KpiCard icon={ICONS.star} tone="success" label={t('completed')} value={<CountUp value={data.bookings.completed} />} />
            </div>
          </section>

          {/* Supply + reach. Pending verifications flagged when there's a backlog. */}
          <section className="space-y-3">
            <h2 className="font-display text-sm font-extrabold uppercase tracking-wide text-ink dark:text-gray-100">{t('marketplaceGroup')}</h2>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <KpiCard icon={ICONS.shield} tone="primary" label={t('approvedProviders')} value={<CountUp value={data.providers.approved} />} />
              <KpiCard icon={ICONS.shield} tone={data.providers.pending > 0 ? 'warn' : 'primary'} label={t('pendingVerifications')} value={<CountUp value={data.providers.pending} />} delta={data.providers.pending > 0 ? { value: data.providers.pending, suffix: '', invert: true } : undefined} />
              <KpiCard icon={ICONS.user} tone="sky" label={t('customers')} value={<CountUp value={data.customers} />} />
              <KpiCard icon={ICONS.map} tone="success" label={t('activeDistricts')} value={<CountUp value={data.activeDistricts} />} />
            </div>
          </section>

          {/* Insight + actions side by side on desktop; stacked on mobile. */}
          <div className="grid gap-4 lg:grid-cols-5">
            <section className="space-y-3 lg:col-span-2">
              <h2 className="font-display text-sm font-extrabold uppercase tracking-wide text-ink dark:text-gray-100">{t('bookingsByStatus')}</h2>
              {byStatus.length === 0 ? (
                <EmptyState>{t('noBookingsYet')}</EmptyState>
              ) : (
                <Card>
                  <ul className="space-y-3">
                    {byStatus.map(([status, count]) => (
                      <li key={status} className="grid grid-cols-[7rem_1fr_2.5rem] items-center gap-3">
                        <span className="truncate text-xs font-medium capitalize text-slate">{status.replace(/_/g, ' ')}</span>
                        <div className="h-2.5 w-full overflow-hidden rounded-full bg-surface-2 dark:bg-gray-800">
                          <div className="h-full rounded-full bg-brand transition-all duration-700" style={{ width: `${(count / maxStatus) * 100}%` }} />
                        </div>
                        <span className="text-right text-sm font-extrabold tabular-nums text-ink dark:text-gray-100">{count}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              )}
            </section>

            <section className="space-y-3 lg:col-span-3">
              <h2 className="font-display text-sm font-extrabold uppercase tracking-wide text-ink dark:text-gray-100">{t('manage')}</h2>
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {QUICK_LINKS.map((l) => (
                  <NavCard
                    key={l.path}
                    href={`/${locale}${l.path}`}
                    icon={ICONS[l.icon]}
                    title={tNav(l.navKey)}
                    badge={l.navKey === 'providers' && data.providers.pending > 0
                      ? <span className="rounded-full bg-warn/15 px-1.5 py-0.5 text-[10px] font-bold text-warn">{data.providers.pending}</span>
                      : undefined}
                  />
                ))}
              </div>
            </section>
          </div>
        </>
      ) : null}
    </div>
  );
}
