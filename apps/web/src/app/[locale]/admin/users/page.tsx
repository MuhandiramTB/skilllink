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
  StatusBadge,
  PageHeader,
  Field,
  inputCls,
} from '@/components/ui';
import { ConfirmModal } from '@/components/IconButton';
import { useToast } from '@/components/Toast';
import { ICONS } from '@/components/nav-config';

export default function AdminUsersPage() {
  const t = useTranslations('admin');
  const toast = useToast();
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [search, setSearch] = useState('');
  const [err, setErr] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  // A pending destructive action awaiting confirmation in the modal.
  const [confirmAction, setConfirmAction] = useState<
    null | { title: string; message: string; confirmLabel: string; run: () => Promise<unknown>; ok: string }
  >(null);

  async function load(q = '') {
    setErr('');
    try { const r = await adminApi.users(q); setUsers(r.rows); } catch (e) { setErr((e as Error).message); }
  }
  useEffect(() => { void load(); }, []);

  // Immediate action (reactivate, force-logout) — no confirmation needed.
  async function act(id: string, fn: () => Promise<unknown>, ok: string) {
    setErr(''); setBusyId(id);
    try { await fn(); toast.show(ok, 'success'); await load(search); }
    catch (e) { setErr((e as Error).message); toast.show((e as Error).message, 'error'); }
    finally { setBusyId(null); }
  }

  // Runs the confirmed destructive action, then closes the modal.
  async function runConfirmed() {
    if (!confirmAction) return;
    const { run, ok } = confirmAction;
    setConfirmAction(null);
    setErr('');
    try { await run(); toast.show(ok, 'success'); await load(search); }
    catch (e) { setErr((e as Error).message); toast.show((e as Error).message, 'error'); }
  }

  // Row action buttons — shared by the desktop table and the mobile card list.
  const actions = (u: AdminUser) => (
    <div className="flex flex-wrap gap-2">
      {u.is_active ? (
        <Button
          variant="danger"
          disabled={busyId === u.id}
          className="min-h-[44px] flex-1 sm:flex-none"
          onClick={() => setConfirmAction({
            title: t('users.suspend'),
            message: t('users.confirmSuspend', { phone: u.phone }),
            confirmLabel: t('users.suspend'),
            run: () => adminApi.setUserActive(u.id, false),
            ok: t('users.userSuspended'),
          })}
        >
          {t('users.suspend')}
        </Button>
      ) : (
        <Button
          variant="success"
          disabled={busyId === u.id}
          className="min-h-[44px] flex-1 sm:flex-none"
          onClick={() => act(u.id, () => adminApi.setUserActive(u.id, true), t('users.userReactivated'))}
        >
          {t('users.reactivate')}
        </Button>
      )}
      <Button
        variant="ghost"
        disabled={busyId === u.id}
        className="min-h-[44px] flex-1 sm:flex-none"
        onClick={() => act(u.id, () => adminApi.forceLogout(u.id), t('users.sessionsRevoked'))}
      >
        {t('users.forceLogout')}
      </Button>
    </div>
  );

  return (
    <div className="space-y-5">
      <PageHeader
        title={t('users.title')}
        subtitle={t('users.subtitle')}
        action={users ? <span className="rounded-full bg-surface px-2.5 py-1 text-xs font-semibold tabular-nums text-slate dark:bg-gray-800">{users.length}</span> : undefined}
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
      {!users && !err && <Spinner />}
      {users && users.length === 0 && <EmptyState>{t('users.empty')}</EmptyState>}

      {users && users.length > 0 && (
        <>
          {/* Mobile: stacked row cards */}
          <ul className="space-y-2.5 md:hidden">
            {users.map((u) => (
              <li key={u.id}>
                <Card>
                  <div className="flex flex-col gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold tabular-nums ${u.is_active ? 'bg-primary/10 text-primary' : 'bg-slate/10 text-slate'}`} aria-hidden="true">
                        {u.phone.replace(/\D/g, '').slice(-2) || (ICONS.user)}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-semibold tabular-nums text-ink dark:text-gray-100">{u.phone}</p>
                        <p className="mt-1 flex items-center gap-2 text-xs text-slate">
                          <StatusBadge status={u.role} />
                          {!u.is_active && <span className="font-medium text-danger">{t('users.suspended')}</span>}
                        </p>
                      </div>
                    </div>
                    {actions(u)}
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
                  <tr className="border-b border-line bg-surface-2 text-left dark:border-gray-800 dark:bg-gray-800/40">
                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate">{t('users.title')}</th>
                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate">{t('payments.colStatus')}</th>
                    <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wide text-slate" />
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b border-line-soft transition-colors last:border-0 hover:bg-surface dark:border-gray-800 dark:hover:bg-gray-800/40">
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-2.5">
                          <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold tabular-nums ${u.is_active ? 'bg-primary/10 text-primary' : 'bg-slate/10 text-slate'}`} aria-hidden="true">
                            {u.phone.replace(/\D/g, '').slice(-2) || (ICONS.user)}
                          </span>
                          <span className="font-semibold tabular-nums text-ink dark:text-gray-100">{u.phone}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-2">
                          <StatusBadge status={u.role} />
                          {!u.is_active && <span className="text-xs font-medium text-danger">{t('users.suspended')}</span>}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end">{actions(u)}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      <ConfirmModal
        open={!!confirmAction}
        title={confirmAction?.title ?? ''}
        message={confirmAction?.message ?? ''}
        confirmLabel={confirmAction?.confirmLabel ?? ''}
        cancelLabel={t('users.cancel')}
        danger
        onConfirm={runConfirmed}
        onCancel={() => setConfirmAction(null)}
      />
    </div>
  );
}
