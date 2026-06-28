'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { adminApi, type AdminPayment } from '@/lib/admin-api';
import {
  Card,
  Spinner,
  EmptyState,
  ErrorBanner,
  StatusBadge,
  PageHeader,
  StatCard,
  Money,
} from '@/components/ui';

export default function AdminPaymentsPage() {
  const t = useTranslations('admin');
  const [rows, setRows] = useState<AdminPayment[] | null>(null);
  const [err, setErr] = useState('');
  useEffect(() => { adminApi.adminPayments().then(setRows).catch((e) => setErr((e as Error).message)); }, []);

  const totalNet = rows?.filter((r) => r.status === 'paid').reduce((s, r) => s + (r.amount_cents - r.commission_cents), 0) ?? 0;
  const totalCommission = rows?.filter((r) => r.status === 'paid').reduce((s, r) => s + r.commission_cents, 0) ?? 0;

  return (
    <div className="space-y-5">
      <PageHeader title={t('payments.title')} subtitle={t('payments.subtitle')} />

      {err && <ErrorBanner message={err} />}
      {!rows && !err && <Spinner />}

      {rows && (
        <div className="grid grid-cols-2 gap-3">
          <StatCard label={t('payments.commissionEarned')} value={<Money cents={totalCommission} />} tone="primary" />
          <StatCard label={t('payments.paidToProviders')} value={<Money cents={totalNet} />} tone="primary" />
        </div>
      )}

      {rows && rows.length === 0 && <EmptyState>{t('payments.empty')}</EmptyState>}

      {rows && rows.length > 0 && (
        <>
          {/* Mobile: stacked row cards */}
          <ul className="space-y-3 md:hidden">
            {rows.map((p) => (
              <li key={p.id}>
                <Card>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold tabular-nums text-ink dark:text-gray-100">
                        <Money cents={p.amount_cents} />{' '}
                        <span className="text-xs font-normal text-slate">{t('payments.via', { provider: p.provider })}</span>
                      </p>
                      <p className="mt-1 text-xs text-slate">
                        {t('payments.commission')} <span className="tabular-nums"><Money cents={p.commission_cents} /></span>
                      </p>
                      <p className="mt-0.5 text-xs text-slate tabular-nums">
                        {new Date(p.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <StatusBadge status={p.status} />
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
                  <tr className="border-b border-line text-left text-xs uppercase tracking-wider text-slate dark:border-gray-800">
                    <th className="px-4 py-3 font-semibold">{t('payments.colAmount')}</th>
                    <th className="px-4 py-3 font-semibold">{t('payments.colCommission')}</th>
                    <th className="px-4 py-3 font-semibold">{t('payments.colProvider')}</th>
                    <th className="px-4 py-3 font-semibold">{t('payments.colDate')}</th>
                    <th className="px-4 py-3 font-semibold">{t('payments.colStatus')}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((p) => (
                    <tr key={p.id} className="border-b border-line last:border-0 dark:border-gray-800">
                      <td className="px-4 py-3 font-semibold tabular-nums text-ink dark:text-gray-100"><Money cents={p.amount_cents} /></td>
                      <td className="px-4 py-3 tabular-nums text-slate"><Money cents={p.commission_cents} /></td>
                      <td className="px-4 py-3 text-slate">{p.provider}</td>
                      <td className="px-4 py-3 tabular-nums text-slate">{new Date(p.created_at).toLocaleDateString()}</td>
                      <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
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
