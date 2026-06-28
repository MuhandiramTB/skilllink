'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { getSession, homeForMode } from '@/lib/session';
import { adminApi, type Analytics } from '@/lib/admin-api';
import { Card, StatCard, Money, Spinner, EmptyState, ErrorBanner } from '@/components/ui';

// label = key in the `nav` namespace (already translated for the sidebar).
const QUICK_LINKS: { navKey: string; path: string }[] = [
  { navKey: 'users', path: '/admin/users' },
  { navKey: 'providers', path: '/admin/verifications' },
  { navKey: 'disputes', path: '/admin/disputes' },
  { navKey: 'payments', path: '/admin/payments' },
  { navKey: 'auditLog', path: '/admin/audit' },
  { navKey: 'categories', path: '/admin/categories' },
  { navKey: 'districts', path: '/admin/districts' },
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
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            <StatCard label={t('totalBookings')} value={data.bookings.total} tone="primary" />
            <StatCard label={t('completed')} value={data.bookings.completed} tone="success" />
            <StatCard label={t('grossRevenue')} value={<Money cents={data.revenue.grossCents} />} />
            <StatCard label={t('commissionEarned')} value={<Money cents={data.revenue.commissionCents} />} tone="success" />
            <StatCard label={t('approvedProviders')} value={data.providers.approved} />
            <StatCard label={t('pendingVerifications')} value={data.providers.pending} tone="danger" />
            <StatCard label={t('customers')} value={data.customers} />
            <StatCard label={t('activeDistricts')} value={data.activeDistricts} />
          </div>

          <section>
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate">
              {t('bookingsByStatus')}
            </h2>
            {byStatus.length === 0 ? (
              <EmptyState>{t('noBookingsYet')}</EmptyState>
            ) : (
              <Card>
                <ul className="space-y-2">
                  {byStatus.map(([status, count]) => (
                    <li key={status}>
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="capitalize text-ink dark:text-gray-200">{status.replace(/_/g, ' ')}</span>
                        <span className="tabular-nums font-semibold text-ink dark:text-gray-100">{count}</span>
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

          <section>
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate">
              {t('manage')}
            </h2>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {QUICK_LINKS.map((l) => (
                <a key={l.path} href={`/${locale}${l.path}`}>
                  <Card className="text-center text-sm font-semibold text-ink transition-all hover:-translate-y-0.5 hover:border-primary hover:shadow-lift dark:text-gray-100">{tNav(l.navKey)}</Card>
                </a>
              ))}
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
