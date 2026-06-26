'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { bookingApi, type BookingListItem } from '@/lib/booking-api';
import { getToken } from '@/lib/admin-api';
import { Card, Spinner, EmptyState, ErrorBanner, StatusBadge } from '@/components/ui';
import { BottomNav } from '@/components/BottomNav';

export default function BookingsListPage() {
  const locale = (useParams().locale as string) ?? 'en';
  const [items, setItems] = useState<BookingListItem[] | null>(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (!getToken()) { window.location.href = `/${locale}/login?next=/${locale}/bookings`; return; }
    bookingApi.list('customer').then(setItems).catch((e) => setErr((e as Error).message));
  }, [locale]);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">My Bookings</h1>
      {err && <ErrorBanner message={err} />}
      {!items && !err && <Spinner />}
      {items && items.length === 0 && !err && (
        <EmptyState>No bookings yet. <a href={`/${locale}`} className="text-primary underline">Browse services →</a></EmptyState>
      )}
      {items && items.map((b) => (
        <a key={b.id} href={`/${locale}/bookings/${b.id}`}>
          <Card className="flex items-center justify-between hover:border-primary">
            <div>
              <p className="font-medium capitalize">{b.categoryKey?.replace(/[._]/g, ' ') ?? 'Service'}</p>
              <p className="text-xs text-gray-500">{b.description || '—'} · {new Date(b.created_at).toLocaleDateString()}</p>
            </div>
            <StatusBadge status={b.status} />
          </Card>
        </a>
      ))}
      <BottomNav role="customer" />
    </div>
  );
}
