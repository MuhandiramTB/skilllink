'use client';

import { useEffect, useState } from 'react';
import { adminApi, type AuditRow } from '@/lib/admin-api';
import { Spinner, EmptyState, ErrorBanner, Card } from '@/components/ui';
import { Pagination } from '@/components/Pagination';

const LIMIT = 20;

export default function AdminAuditPage() {
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
    <div className="space-y-4">
      <div className="flex items-baseline justify-between">
        <h1 className="text-xl font-semibold">Audit Log</h1>
        {rows && <span className="text-xs text-gray-500">{total} entries</span>}
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400">Every admin mutation is recorded here.</p>
      {err && <ErrorBanner message={err} />}
      {!rows && !err && <Spinner />}
      {rows && rows.length === 0 && <EmptyState>No audit entries yet.</EmptyState>}
      {rows && rows.length > 0 && (
        <Card className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500 dark:border-gray-700">
                <th className="px-3 py-2">When</th>
                <th>Action</th>
                <th>Entity</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b last:border-0 dark:border-gray-700">
                  <td className="px-3 py-2 text-xs text-gray-500">{new Date(r.created_at).toLocaleString()}</td>
                  <td><code className="text-xs">{r.action}</code></td>
                  <td className="text-xs text-gray-600 dark:text-gray-400">{r.entity}{r.entity_id ? ` · ${r.entity_id.slice(0, 8)}` : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
      <Pagination total={total} limit={LIMIT} offset={offset} onChange={setOffset} />
    </div>
  );
}
