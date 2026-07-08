'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { adminApi, type Analytics } from '@/lib/admin-api';
import { PageHeader, Card, Money, Spinner, EmptyState, ErrorBanner } from '@/components/ui';
import { KpiCard, CountUp } from '@/components/charts';
import { ICONS } from '@/components/nav-config';

export default function AdminAnalyticsPage() {
  const t = useTranslations('admin');
  const [a, setA] = useState<Analytics | null>(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    adminApi.analytics().then(setA).catch((e) => setErr((e as Error).message));
  }, []);

  const byStatus = a ? Object.entries(a.bookings.byStatus) : [];
  const maxStatus = byStatus.reduce((m, [, n]) => Math.max(m, n), 0) || 1;

  return (
    <div className="space-y-6">
      <PageHeader title={t('analytics.title')} subtitle={t('analytics.subtitle')} />

      {err && <ErrorBanner message={err} />}

      {!a && !err ? (
        <Spinner label={t('analytics.loading')} />
      ) : a ? (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            <KpiCard icon={ICONS.chat} tone="primary" label={t('analytics.totalBookings')} value={<CountUp value={a.bookings.total} />} />
            <KpiCard icon={ICONS.star} tone="success" label={t('analytics.completedJobs')} value={<CountUp value={a.bookings.completed} />} />
            <KpiCard icon={ICONS.wallet} tone="success" label={t('analytics.grossRevenue')} value={<Money cents={a.revenue.grossCents} />} />
            <KpiCard icon={ICONS.receipt} tone="primary" label={t('analytics.commissionEarned')} value={<Money cents={a.revenue.commissionCents} />} />
            <KpiCard icon={ICONS.shield} tone="primary" label={t('analytics.approvedProviders')} value={<CountUp value={a.providers.approved} />} />
            <KpiCard icon={ICONS.shield} tone={a.providers.pending > 0 ? 'warn' : 'primary'} label={t('analytics.pendingProviders')} value={<CountUp value={a.providers.pending} />} />
            <KpiCard icon={ICONS.user} tone="sky" label={t('analytics.customers')} value={<CountUp value={a.customers} />} />
            <KpiCard icon={ICONS.map} tone="success" label={t('analytics.activeDistricts')} value={<CountUp value={a.activeDistricts} />} />
          </div>

          <section>
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate">
              {t('analytics.bookingsByStatus')}
            </h2>
            {byStatus.length === 0 ? (
              <EmptyState>{t('analytics.empty')}</EmptyState>
            ) : (
              <Card>
                <ul className="space-y-2">
                  {byStatus.map(([status, count]) => (
                    <li key={status}>
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="capitalize text-ink dark:text-gray-200">{status.replace(/_/g, ' ')}</span>
                        <span className="font-semibold tabular-nums text-ink dark:text-gray-100">{count}</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-surface dark:bg-gray-800">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${(count / maxStatus) * 100}%` }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              </Card>
            )}
          </section>
        </>
      ) : null}
    </div>
  );
}
