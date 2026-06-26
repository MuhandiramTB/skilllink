'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getSession, homeForMode } from '@/lib/session';
import { adminApi, type Analytics } from '@/lib/admin-api';
import { Card, StatCard, Spinner, EmptyState, ErrorBanner } from '@/components/ui';

function lkr(cents: number) {
  return `LKR ${(cents / 100).toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const QUICK_LINKS: { label: string; path: string }[] = [
  { label: 'Users', path: '/admin/users' },
  { label: 'Verifications', path: '/admin/verifications' },
  { label: 'Disputes', path: '/admin/disputes' },
  { label: 'Payments', path: '/admin/payments' },
  { label: 'Audit log', path: '/admin/audit' },
  { label: 'Categories', path: '/admin/categories' },
  { label: 'Districts', path: '/admin/districts' },
];

export default function AdminDashboard() {
  const locale = (useParams().locale as string) ?? 'en';
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
        <h1 className="font-display text-xl font-bold">Admin overview</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Platform health at a glance.</p>
      </div>

      {err && <ErrorBanner message={err} />}

      {data === null && !err ? (
        <Spinner label="Loading analytics…" />
      ) : data ? (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard label="Total bookings" value={data.bookings.total} tone="primary" />
            <StatCard label="Completed" value={data.bookings.completed} tone="success" />
            <StatCard label="Gross revenue" value={lkr(data.revenue.grossCents)} />
            <StatCard label="Commission earned" value={lkr(data.revenue.commissionCents)} tone="success" />
            <StatCard label="Approved providers" value={data.providers.approved} />
            <StatCard label="Pending verifications" value={data.providers.pending} tone="danger" />
            <StatCard label="Customers" value={data.customers} />
            <StatCard label="Active districts" value={data.activeDistricts} />
          </div>

          <section>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Bookings by status
            </h2>
            {byStatus.length === 0 ? (
              <EmptyState>No bookings yet.</EmptyState>
            ) : (
              <Card>
                <ul className="space-y-2">
                  {byStatus.map(([status, count]) => (
                    <li key={status}>
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="capitalize">{status.replace(/_/g, ' ')}</span>
                        <span className="tabular-nums font-medium">{count}</span>
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

          <section>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Manage
            </h2>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {QUICK_LINKS.map((l) => (
                <a key={l.path} href={`/${locale}${l.path}`}>
                  <Card className="text-center text-sm font-medium transition hover:border-primary">{l.label}</Card>
                </a>
              ))}
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
