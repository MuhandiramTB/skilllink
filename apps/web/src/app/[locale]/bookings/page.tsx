'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { bookingApi, type BookingListItem } from '@/lib/booking-api';
import { getToken } from '@/lib/session';
import { Card, Spinner, EmptyState, ErrorBanner, StatusBadge, PageHeader } from '@/components/ui';

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
    <div className="space-y-5">
      <PageHeader title={t('myBookings')} subtitle={t('myBookingsSubtitle')} />
      {err && <ErrorBanner message={err} />}
      {!items && !err && <Spinner />}
      {items && items.length === 0 && !err && (
        <EmptyState>{t('noBookingsBrowse')} <a href={`/${locale}/book`} className="text-primary underline">{t('browseServices')}</a></EmptyState>
      )}
      {items && items.length > 0 && (
        <div className="space-y-4">
          {items.map((b) => (
            <a key={b.id} href={`/${locale}/bookings/${b.id}`} className="block">
              <Card className="flex items-center justify-between gap-3 rounded-xl2 transition-all hover:-translate-y-0.5 hover:border-primary hover:shadow-lift">
                <div className="min-w-0">
                  <p className="truncate font-medium capitalize">{b.categoryKey?.replace(/[._]/g, ' ') ?? t('service')}</p>
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
