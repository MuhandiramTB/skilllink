'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { adminApi, type Analytics } from '@/lib/admin-api';
import { PageHeader, Card, StatCard, Money, Spinner, EmptyState, ErrorBanner } from '@/components/ui';

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
            <StatCard label={t('analytics.totalBookings')} value={a.bookings.total} tone="primary" />
            <StatCard label={t('analytics.completedJobs')} value={a.bookings.completed} tone="success" />
            <StatCard label={t('analytics.grossRevenue')} value={<Money cents={a.revenue.grossCents} />} />
            <StatCard label={t('analytics.commissionEarned')} value={<Money cents={a.revenue.commissionCents} />} tone="success" />
            <StatCard label={t('analytics.approvedProviders')} value={a.providers.approved} />
            <StatCard label={t('analytics.pendingProviders')} value={a.providers.pending} tone="danger" />
            <StatCard label={t('analytics.customers')} value={a.customers} />
            <StatCard label={t('analytics.activeDistricts')} value={a.activeDistricts} />
          </div>

          <section>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              {t('analytics.bookingsByStatus')}
            </h2>
            {byStatus.length === 0 ? (
              <EmptyState>{t('analytics.empty')}</EmptyState>
            ) : (
              <Card className="rounded-2xl">
                <ul className="space-y-2">
                  {byStatus.map(([status, count]) => (
                    <li key={status}>
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="capitalize">{status.replace(/_/g, ' ')}</span>
                        <span className="font-medium tabular-nums">{count}</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
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
