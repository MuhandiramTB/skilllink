'use client';

import { useEffect, useState } from 'react';
import { adminApi, type Dispute } from '@/lib/admin-api';

export default function AdminDisputesPage() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [err, setErr] = useState('');

  async function load() {
    try { setDisputes(await adminApi.disputes()); } catch (e) { setErr((e as Error).message); }
  }
  useEffect(() => { void load(); }, []);

  async function resolve(id: string) {
    const resolution = prompt('Resolution note?') ?? '';
    if (resolution.length < 3) return;
    try { await adminApi.resolveDispute(id, resolution); await load(); } catch (e) { setErr((e as Error).message); }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Disputes</h1>
      {err && <p className="rounded-base bg-red-50 p-2 text-sm text-danger">{err}</p>}
      {disputes.length === 0 && <p className="text-sm text-gray-500">No open disputes.</p>}
      <ul className="space-y-2">
        {disputes.map((d) => (
          <li key={d.id} className="flex items-center justify-between rounded-base border bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
            <div>
              <p className="text-sm">Booking <code>{d.booking_id.slice(0, 8)}</code></p>
              <p className="text-xs text-gray-500">{d.resolution}</p>
            </div>
            <button onClick={() => resolve(d.id)} className="rounded-base bg-primary px-3 py-1 text-sm text-white">Resolve</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
