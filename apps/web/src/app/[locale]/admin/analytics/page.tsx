'use client';

import { useEffect, useState } from 'react';
import { adminApi, type Analytics } from '@/lib/admin-api';

const lkr = (cents: number) => `LKR ${(cents / 100).toLocaleString()}`;

export default function AdminAnalyticsPage() {
  const [a, setA] = useState<Analytics | null>(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    adminApi.analytics().then(setA).catch((e) => setErr((e as Error).message));
  }, []);

  if (err) return <p className="rounded-base bg-red-50 p-2 text-sm text-danger">{err}</p>;
  if (!a) return <p className="text-sm text-gray-500">Loading…</p>;

  const Stat = ({ label, value }: { label: string; value: string | number }) => (
    <div className="rounded-base border bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
      <p className="text-2xl font-semibold text-primary">{value}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
    </div>
  );

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Analytics</h1>
      <div className="grid grid-cols-2 gap-3">
        <Stat label="Total bookings" value={a.bookings.total} />
        <Stat label="Completed jobs" value={a.bookings.completed} />
        <Stat label="Gross revenue" value={lkr(a.revenue.grossCents)} />
        <Stat label="Commission earned" value={lkr(a.revenue.commissionCents)} />
        <Stat label="Approved providers" value={a.providers.approved} />
        <Stat label="Pending providers" value={a.providers.pending} />
        <Stat label="Customers" value={a.customers} />
        <Stat label="Active districts" value={a.activeDistricts} />
      </div>
    </div>
  );
}
