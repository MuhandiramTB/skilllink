'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { getSession, homeForMode } from '@/lib/session';
import { adminApi, type Analytics } from '@/lib/admin-api';
import { Card, MetricCard, NavCard, Money, Spinner, EmptyState, ErrorBanner } from '@/components/ui';
import { ICONS } from '@/components/nav-config';

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
      <div>
        <h1 className="font-display text-2xl font-bold text-ink dark:text-gray-50">{t('adminOverview')}</h1>
        <p className="mt-1 text-sm text-slate">{t('platformHealth')}</p>
      </div>

      {err && <ErrorBanner message={err} />}

      {data === null && !err ? (
        <Spinner label={t('loadingAnalytics')} />
      ) : data ? (
        <>
          {/* Money first — the headline metrics for an operator. */}
          <section className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate">{t('revenueGroup')}</h2>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <MetricCard icon={ICONS.wallet} tone="success" label={t('grossRevenue')} value={<Money cents={data.revenue.grossCents} />} />
              <MetricCard icon={ICONS.receipt} tone="primary" label={t('commissionEarned')} value={<Money cents={data.revenue.commissionCents} />} />
              <MetricCard icon={ICONS.chat} label={t('totalBookings')} value={data.bookings.total} sub={`${data.bookings.completed} ${t('completed').toLowerCase()}`} />
              <MetricCard icon={ICONS.star} tone="success" label={t('completed')} value={data.bookings.completed} />
            </div>
          </section>

          {/* Supply + reach. Pending verifications flagged when there's a backlog. */}
          <section className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate">{t('marketplaceGroup')}</h2>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <MetricCard icon={ICONS.shield} label={t('approvedProviders')} value={data.providers.approved} />
              <MetricCard icon={ICONS.shield} tone={data.providers.pending > 0 ? 'warn' : 'default'} label={t('pendingVerifications')} value={data.providers.pending} sub={data.providers.pending > 0 ? t('needsReview') : undefined} />
              <MetricCard icon={ICONS.user} label={t('customers')} value={data.customers} />
              <MetricCard icon={ICONS.map} label={t('activeDistricts')} value={data.activeDistricts} />
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate">{t('bookingsByStatus')}</h2>
            {byStatus.length === 0 ? (
              <EmptyState>{t('noBookingsYet')}</EmptyState>
            ) : (
              <Card>
                <ul className="space-y-3">
                  {byStatus.map(([status, count]) => (
                    <li key={status} className="grid grid-cols-[7rem_1fr_2.5rem] items-center gap-3">
                      <span className="truncate text-xs font-medium capitalize text-slate">{status.replace(/_/g, ' ')}</span>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-surface dark:bg-gray-800">
                        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(count / maxStatus) * 100}%` }} />
                      </div>
                      <span className="text-right text-sm font-bold tabular-nums text-ink dark:text-gray-100">{count}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}
          </section>

          <section className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate">{t('manage')}</h2>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
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
        </>
      ) : null}
    </div>
  );
}
