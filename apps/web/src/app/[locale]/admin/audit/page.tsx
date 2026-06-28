'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { adminApi, type AuditRow } from '@/lib/admin-api';
import { Spinner, EmptyState, ErrorBanner, Card, PageHeader } from '@/components/ui';
import { Pagination } from '@/components/Pagination';
import { ICONS } from '@/components/nav-config';

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
        action={rows ? <span className="text-xs text-slate tabular-nums">{t('audit.entries', { count: total })}</span> : undefined}
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
                <Card>
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface text-slate dark:bg-gray-800" aria-hidden="true">{ICONS.receipt}</span>
                    <dl className="min-w-0 flex-1 space-y-1.5 text-sm">
                      <div className="flex justify-between gap-3">
                        <dt className="text-slate">{t('audit.colWhen')}</dt>
                        <dd className="text-right text-xs text-slate tabular-nums">{new Date(r.created_at).toLocaleString()}</dd>
                      </div>
                      <div className="flex justify-between gap-3">
                        <dt className="text-slate">{t('audit.colAction')}</dt>
                        <dd className="text-right"><code className="text-xs text-ink dark:text-gray-100">{r.action}</code></dd>
                      </div>
                      <div className="flex justify-between gap-3">
                        <dt className="text-slate">{t('audit.colEntity')}</dt>
                        <dd className="text-right text-xs text-slate">
                          {r.entity}{r.entity_id ? ` · ${r.entity_id.slice(0, 8)}` : ''}
                        </dd>
                      </div>
                    </dl>
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
                  <tr className="border-b border-line text-left dark:border-gray-800">
                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate">{t('audit.colWhen')}</th>
                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate">{t('audit.colAction')}</th>
                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate">{t('audit.colEntity')}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} className="border-b border-line last:border-0 dark:border-gray-800">
                      <td className="px-4 py-3 text-xs text-slate tabular-nums">{new Date(r.created_at).toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-2">
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-surface text-slate dark:bg-gray-800" aria-hidden="true">{ICONS.receipt}</span>
                          <code className="text-xs text-ink dark:text-gray-100">{r.action}</code>
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate">{r.entity}{r.entity_id ? ` · ${r.entity_id.slice(0, 8)}` : ''}</td>
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
