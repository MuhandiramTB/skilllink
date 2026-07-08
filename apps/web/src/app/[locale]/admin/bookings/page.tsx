'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { adminApi, type AdminBooking } from '@/lib/admin-api';
import { PageHeader, Card, Spinner, EmptyState, ErrorBanner, StatusBadge, Money } from '@/components/ui';
import { ICONS } from '@/components/nav-config';

export default function AdminBookingsPage() {
  const t = useTranslations('admin');
  const [rows, setRows] = useState<AdminBooking[] | null>(null);
  const [err, setErr] = useState('');
  useEffect(() => { adminApi.adminBookings().then(setRows).catch((e) => setErr((e as Error).message)); }, []);

  const serviceName = (b: AdminBooking) => b.categoryKey?.replace(/[._]/g, ' ') ?? t('bookings.service');

  return (
    <div className="space-y-5">
      <PageHeader
        title={t('bookings.title')}
        subtitle={t('bookings.subtitle')}
        action={rows ? <span className="rounded-full bg-surface px-2.5 py-1 text-xs font-semibold tabular-nums text-slate dark:bg-gray-800">{rows.length}</span> : undefined}
      />

      {err && <ErrorBanner message={err} />}
      {!rows && !err && <Spinner label={t('bookings.loading')} />}
      {rows && rows.length === 0 && <EmptyState>{t('bookings.empty')}</EmptyState>}

      {rows && rows.length > 0 && (
        <>
          {/* Mobile: stacked row cards */}
          <ul className="space-y-2 md:hidden">
            {rows.map((b) => (
              <li key={b.id}>
                <Card>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface text-slate dark:bg-gray-800" aria-hidden="true">{ICONS.chat}</span>
                      <div className="min-w-0">
                        <p className="truncate font-semibold capitalize text-ink dark:text-gray-100">{serviceName(b)}</p>
                        <p className="mt-0.5 text-xs text-slate">
                          <span className="tabular-nums">
                            {b.price_cents == null ? '—' : <Money cents={b.price_cents} />}
                          </span>
                          {' · '}
                          <span className="tabular-nums">{new Date(b.created_at).toLocaleDateString()}</span>
                        </p>
                      </div>
                    </div>
                    <StatusBadge status={b.status} />
                  </div>
                </Card>
              </li>
            ))}
          </ul>

          {/* Desktop: clean table */}
          <Card className="hidden p-0 md:block">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line bg-surface-2 text-left dark:border-gray-800 dark:bg-gray-800/40">
                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate">{t('bookings.service')}</th>
                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate">{t('payments.colAmount')}</th>
                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate">{t('payments.colDate')}</th>
                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate">{t('payments.colStatus')}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((b) => (
                    <tr key={b.id} className="border-b border-line-soft transition-colors last:border-0 hover:bg-surface dark:border-gray-800 dark:hover:bg-gray-800/40">
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-2.5 font-semibold capitalize text-ink dark:text-gray-100">
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-surface text-slate dark:bg-gray-800" aria-hidden="true">{ICONS.chat}</span>
                          {serviceName(b)}
                        </span>
                      </td>
                      <td className="px-4 py-3 tabular-nums text-slate">
                        {b.price_cents == null ? '—' : <Money cents={b.price_cents} />}
                      </td>
                      <td className="px-4 py-3 tabular-nums text-slate">{new Date(b.created_at).toLocaleDateString()}</td>
                      <td className="px-4 py-3"><StatusBadge status={b.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
