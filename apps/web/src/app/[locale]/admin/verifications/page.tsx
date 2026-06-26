'use client';

import { useEffect, useState } from 'react';
import { adminApi, type VerificationQueueItem } from '@/lib/admin-api';

export default function AdminVerificationsPage() {
  const [queue, setQueue] = useState<VerificationQueueItem[]>([]);
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');

  async function load() {
    setErr('');
    try { setQueue(await adminApi.verificationQueue()); }
    catch (e) { setErr((e as Error).message); }
  }
  useEffect(() => { void load(); }, []);

  async function decide(providerId: string, decision: 'approve' | 'reject') {
    setErr(''); setMsg('');
    try {
      const reason = decision === 'reject' ? (prompt('Reason for rejection?') ?? '') : undefined;
      await adminApi.decideVerification(providerId, decision, reason);
      setMsg(`Provider ${decision}d.`);
      await load();
    } catch (e) { setErr((e as Error).message); }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Provider Verification Queue</h1>
      {err && <p className="rounded-base bg-red-50 p-2 text-sm text-danger">{err}</p>}
      {msg && <p className="rounded-base bg-green-50 p-2 text-sm text-success">{msg}</p>}
      {queue.length === 0 && <p className="text-sm text-gray-500">No pending verifications.</p>}

      <ul className="space-y-3">
        {queue.map((p) => (
          <li key={p.providerId} className="rounded-base border bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{p.businessName ?? '(no name)'}</p>
                <p className="text-xs text-gray-500">{p.documents.length} document(s): {p.documents.map((d) => d.type).join(', ')}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => decide(p.providerId, 'approve')} className="rounded-base bg-success px-3 py-1 text-sm text-white">Approve</button>
                <button onClick={() => decide(p.providerId, 'reject')} className="rounded-base bg-danger px-3 py-1 text-sm text-white">Reject</button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
