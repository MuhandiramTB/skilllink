'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { adminApi, type AuditRow } from '@/lib/admin-api';
import { Spinner, EmptyState, ErrorBanner, Card, PageHeader } from '@/components/ui';
import { Pagination } from '@/components/Pagination';

const LIMIT = 20;

export default function AdminAuditPage() {
  const t = useTranslations('admin');
  const [rows, setRows] = useState<AuditRow[] | null>(null);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [err, setErr] = useState('');

  useEffect(() => {
    setRows(null);
    adminApi
      .audit(LIMIT, offset)
      .then((r) => { setRows(r.rows); setTotal(r.total); })
      .catch((e) => setErr((e as Error).message));
  }, [offset]);

  return (
    <div className="space-y-5">
      <PageHeader
        title={t('audit.title')}
        subtitle={t('audit.subtitle')}
        action={rows ? <span className="text-xs text-gray-500 tabular-nums">{t('audit.entries', { count: total })}</span> : undefined}
      />

      {err && <ErrorBanner message={err} />}
      {!rows && !err && <Spinner />}
      {rows && rows.length === 0 && <EmptyState>{t('audit.empty')}</EmptyState>}

      {rows && rows.length > 0 && (
        <>
          {/* Mobile: stacked row cards */}
          <ul className="space-y-3 md:hidden">
            {rows.map((r) => (
              <li key={r.id}>
                <Card className="rounded-2xl">
                  <dl className="space-y-1.5 text-sm">
                    <div className="flex justify-between gap-3">
                      <dt className="text-gray-500">{t('audit.colWhen')}</dt>
                      <dd className="text-right text-xs text-gray-500 tabular-nums">{new Date(r.created_at).toLocaleString()}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-gray-500">{t('audit.colAction')}</dt>
                      <dd className="text-right"><code className="text-xs">{r.action}</code></dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-gray-500">{t('audit.colEntity')}</dt>
                      <dd className="text-right text-xs text-gray-600 dark:text-gray-400">
                        {r.entity}{r.entity_id ? ` · ${r.entity_id.slice(0, 8)}` : ''}
                      </dd>
                    </div>
                  </dl>
                </Card>
              </li>
            ))}
          </ul>

          {/* Desktop: clean table */}
          <Card className="hidden rounded-2xl p-0 md:block">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-gray-500 dark:border-gray-700">
                    <th className="px-4 py-3 font-medium">{t('audit.colWhen')}</th>
                    <th className="px-4 py-3 font-medium">{t('audit.colAction')}</th>
                    <th className="px-4 py-3 font-medium">{t('audit.colEntity')}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} className="border-b last:border-0 dark:border-gray-700">
                      <td className="px-4 py-3 text-xs text-gray-500 tabular-nums">{new Date(r.created_at).toLocaleString()}</td>
                      <td className="px-4 py-3"><code className="text-xs">{r.action}</code></td>
                      <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400">{r.entity}{r.entity_id ? ` · ${r.entity_id.slice(0, 8)}` : ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      <Pagination total={total} limit={LIMIT} offset={offset} onChange={setOffset} />
    </div>
  );
}
