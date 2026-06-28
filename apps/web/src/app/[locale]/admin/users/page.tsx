'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { adminApi, type AdminUser } from '@/lib/admin-api';
import {
  Button,
  Card,
  Spinner,
  EmptyState,
  ErrorBanner,
  SuccessBanner,
  StatusBadge,
  PageHeader,
  Field,
  inputCls,
} from '@/components/ui';

export default function AdminUsersPage() {
  const t = useTranslations('admin');
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
    <div className="space-y-5">
      <PageHeader
        title={t('users.title')}
        subtitle={t('users.subtitle')}
      />

      <Card>
        <form
          onSubmit={(e) => { e.preventDefault(); void load(search); }}
          className="flex flex-col gap-3 sm:flex-row sm:items-end"
        >
          <div className="flex-1">
            <Field label={t('users.search')}>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('users.searchPlaceholder')}
                className={inputCls}
              />
            </Field>
          </div>
          <Button type="submit" onClick={() => load(search)} className="min-h-[44px] w-full sm:w-auto">
            {t('users.search')}
          </Button>
        </form>
      </Card>

      {err && <ErrorBanner message={err} />}
      {msg && <SuccessBanner message={msg} />}
      {!users && !err && <Spinner />}
      {users && users.length === 0 && <EmptyState>{t('users.empty')}</EmptyState>}

      {users && users.length > 0 && (
        <ul className="space-y-3">
          {users.map((u) => (
            <li key={u.id}>
              <Card>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="truncate font-semibold tabular-nums text-ink dark:text-gray-100">{u.phone}</p>
                    <p className="mt-1 flex items-center gap-2 text-xs text-slate">
                      <StatusBadge status={u.role} />
                      {!u.is_active && <span className="font-medium text-danger">{t('users.suspended')}</span>}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {u.is_active ? (
                      <Button
                        variant="danger"
                        className="min-h-[44px] flex-1 sm:flex-none"
                        onClick={() => act(() => adminApi.setUserActive(u.id, false), t('users.userSuspended'))}
                      >
                        {t('users.suspend')}
                      </Button>
                    ) : (
                      <Button
                        variant="success"
                        className="min-h-[44px] flex-1 sm:flex-none"
                        onClick={() => act(() => adminApi.setUserActive(u.id, true), t('users.userReactivated'))}
                      >
                        {t('users.reactivate')}
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      className="min-h-[44px] flex-1 sm:flex-none"
                      onClick={() => act(() => adminApi.forceLogout(u.id), t('users.sessionsRevoked'))}
                    >
                      {t('users.forceLogout')}
                    </Button>
                  </div>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
