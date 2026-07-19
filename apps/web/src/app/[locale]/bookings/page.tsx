'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { bookingApi, type BookingListItem } from '@/lib/booking-api';
import { getToken } from '@/lib/session';
import { Card, Spinner, EmptyState, ErrorBanner, StatusBadge, PageHeader } from '@/components/ui';
import { ICONS } from '@/components/nav-config';

export default function BookingsListPage() {
  const locale = (useParams().locale as string) ?? 'en';
  const t = useTranslations('dash');
  const [items, setItems] = useState<BookingListItem[] | null>(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (!getToken()) { window.location.href = `/${locale}/login?next=/${locale}/bookings`; return; }
    bookingApi.list('customer').then(setItems).catch((e) => setErr((e as Error).message));
  }, [locale]);

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <PageHeader
        title={t('myBookings')}
        subtitle={t('myBookingsSubtitle')}
        action={items ? <span className="rounded-full bg-surface px-2.5 py-1 text-xs font-semibold tabular-nums text-slate dark:bg-gray-800">{items.length}</span> : undefined}
      />
      {err && <ErrorBanner message={err} />}
      {!items && !err && <Spinner />}
      {items && items.length === 0 && !err && (
        <EmptyState>{t('noBookingsBrowse')} <a href={`/${locale}/book`} className="text-primary underline">{t('browseServices')}</a></EmptyState>
      )}
      {items && items.length > 0 && (
        <div className="space-y-2.5">
          {items.map((b) => (
            <a key={b.id} href={`/${locale}/bookings/${b.id}`} className="block">
              <Card className="group flex items-center gap-3.5 rounded-xl2 transition-all hover:-translate-y-0.5 hover:border-brand hover:shadow-lift">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-surface text-slate transition-colors group-hover:bg-brand group-hover:text-brand-ink dark:bg-gray-800" aria-hidden="true">{ICONS.chat}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-base font-extrabold tracking-tight capitalize text-ink dark:text-gray-100">{b.categoryKey?.replace(/[._]/g, ' ') ?? t('service')}</p>
                  <p className="mt-0.5 truncate text-xs text-slate">
                    {b.description || '—'} · {new Date(b.created_at).toLocaleDateString()}
                  </p>
                </div>
                <StatusBadge status={b.status} />
              </Card>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
