'use client';

import { useEffect, useState } from 'react';
import { adminApi, type AdminBooking } from '@/lib/admin-api';
import { Card, Spinner, EmptyState, ErrorBanner, StatusBadge } from '@/components/ui';

const lkr = (c: number | null) => (c == null ? '—' : `LKR ${(c / 100).toLocaleString()}`);

export default function AdminBookingsPage() {
  const [rows, setRows] = useState<AdminBooking[] | null>(null);
  const [err, setErr] = useState('');
  useEffect(() => { adminApi.adminBookings().then(setRows).catch((e) => setErr((e as Error).message)); }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Bookings</h1>
      {err && <ErrorBanner message={err} />}
      {!rows && !err && <Spinner />}
      {rows && rows.length === 0 && <EmptyState>No bookings yet.</EmptyState>}
      {rows && rows.map((b) => (
        <Card key={b.id} className="flex items-center justify-between">
          <div>
            <p className="font-medium capitalize">{b.categoryKey?.replace(/[._]/g, ' ') ?? 'Service'}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{lkr(b.price_cents)} · {new Date(b.created_at).toLocaleDateString()}</p>
          </div>
          <StatusBadge status={b.status} />
        </Card>
      ))}
    </div>
  );
}
