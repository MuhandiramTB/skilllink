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
        <ul className="space-y-2">
          {rows.map((b) => (
            <Card key={b.id}>
              <li className="flex list-none items-center justify-between gap-3">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface text-slate dark:bg-gray-800" aria-hidden="true">{ICONS.chat}</span>
                  <div className="min-w-0">
                    <p className="truncate font-semibold capitalize text-ink dark:text-gray-100">
                      {b.categoryKey?.replace(/[._]/g, ' ') ?? t('bookings.service')}
                    </p>
                    <p className="mt-0.5 text-xs text-slate">
                      <span className="tabular-nums">
                        {b.price_cents == null ? '—' : <Money cents={b.price_cents} />}
                      </span>
                      {' · '}
                      {new Date(b.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <StatusBadge status={b.status} />
              </li>
            </Card>
          ))}
        </ul>
      )}
    </div>
  );
}
