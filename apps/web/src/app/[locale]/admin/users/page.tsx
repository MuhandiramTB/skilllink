'use client';

import { useEffect, useState } from 'react';
import { adminApi, type AdminUser } from '@/lib/admin-api';
import { Button, Card, Spinner, EmptyState, ErrorBanner, SuccessBanner, StatusBadge } from '@/components/ui';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [search, setSearch] = useState('');
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');

  async function load(q = '') {
    setErr('');
    try { const r = await adminApi.users(q); setUsers(r.rows); } catch (e) { setErr((e as Error).message); }
  }
  useEffect(() => { void load(); }, []);

  async function act(fn: () => Promise<unknown>, ok: string) {
    setErr(''); setMsg('');
    try { await fn(); setMsg(ok); await load(search); } catch (e) { setErr((e as Error).message); }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Users</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        OTP accounts — no passwords. <b>Suspend</b> blocks login &amp; ends sessions; <b>Force&nbsp;logout</b> ends
        sessions (user logs back in with a fresh OTP).
      </p>
      <div className="flex gap-2">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search phone…"
          className="flex-1 rounded-base border px-3 py-2 dark:border-gray-600 dark:bg-gray-800" />
        <Button onClick={() => load(search)}>Search</Button>
      </div>
      {err && <ErrorBanner message={err} />}
      {msg && <SuccessBanner message={msg} />}
      {!users && !err && <Spinner />}
      {users && users.length === 0 && <EmptyState>No users found.</EmptyState>}
      {users && users.map((u) => (
        <Card key={u.id} className="flex items-center justify-between">
          <div>
            <p className="font-medium">{u.phone}</p>
            <p className="text-xs text-gray-500">
              <StatusBadge status={u.role} /> {!u.is_active && <span className="ml-1 text-danger">suspended</span>}
            </p>
          </div>
          <div className="flex gap-2">
            {u.is_active ? (
              <Button variant="danger" onClick={() => act(() => adminApi.setUserActive(u.id, false), 'User suspended.')}>Suspend</Button>
            ) : (
              <Button variant="success" onClick={() => act(() => adminApi.setUserActive(u.id, true), 'User reactivated.')}>Reactivate</Button>
            )}
            <Button variant="ghost" onClick={() => act(() => adminApi.forceLogout(u.id), 'Sessions revoked.')}>Force logout</Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
