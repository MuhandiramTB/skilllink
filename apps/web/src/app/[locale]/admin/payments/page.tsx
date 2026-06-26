'use client';

import { useEffect, useState } from 'react';
import { adminApi, type AdminPayment } from '@/lib/admin-api';
import { Card, Spinner, EmptyState, ErrorBanner, StatusBadge } from '@/components/ui';

const lkr = (c: number) => `LKR ${(c / 100).toLocaleString()}`;

export default function AdminPaymentsPage() {
  const [rows, setRows] = useState<AdminPayment[] | null>(null);
  const [err, setErr] = useState('');
  useEffect(() => { adminApi.adminPayments().then(setRows).catch((e) => setErr((e as Error).message)); }, []);

  const totalNet = rows?.filter((r) => r.status === 'paid').reduce((s, r) => s + (r.amount_cents - r.commission_cents), 0) ?? 0;
  const totalCommission = rows?.filter((r) => r.status === 'paid').reduce((s, r) => s + r.commission_cents, 0) ?? 0;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Payments</h1>
      {err && <ErrorBanner message={err} />}
      {!rows && !err && <Spinner />}
      {rows && (
        <div className="grid grid-cols-2 gap-3">
          <Card><p className="text-2xl font-semibold text-primary">{lkr(totalCommission)}</p><p className="text-xs text-gray-500 dark:text-gray-400">Commission earned</p></Card>
          <Card><p className="text-2xl font-semibold text-primary">{lkr(totalNet)}</p><p className="text-xs text-gray-500 dark:text-gray-400">Paid to providers</p></Card>
        </div>
      )}
      {rows && rows.length === 0 && <EmptyState>No payments yet.</EmptyState>}
      {rows && rows.map((p) => (
        <Card key={p.id} className="flex items-center justify-between">
          <div>
            <p className="font-medium">{lkr(p.amount_cents)} <span className="text-xs font-normal text-gray-500">via {p.provider}</span></p>
            <p className="text-xs text-gray-500 dark:text-gray-400">commission {lkr(p.commission_cents)} · {new Date(p.created_at).toLocaleDateString()}</p>
          </div>
          <StatusBadge status={p.status} />
        </Card>
      ))}
    </div>
  );
}
