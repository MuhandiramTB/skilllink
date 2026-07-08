'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { adminApi, type AdminDistrict } from '@/lib/admin-api';
import { PageHeader, Card, Button, Spinner, EmptyState, ErrorBanner, SuccessBanner } from '@/components/ui';
import { TrilingualNames, useTrilingual } from '@/components/TrilingualNames';
import { IconButton, ConfirmModal } from '@/components/IconButton';
import { ICONS } from '@/components/nav-config';
import { Reveal } from '@/components/Reveal';

export default function AdminDistrictsPage() {
  const t = useTranslations('admin');
  const [districts, setDistricts] = useState<AdminDistrict[] | null>(null);
  const [err, setErr] = useState('');
  const [ok, setOk] = useState('');
  const [busy, setBusy] = useState(false);
  const names = useTrilingual();
  const editNames = useTrilingual();
  const [editing, setEditing] = useState<string | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<AdminDistrict | null>(null);

  async function load() {
    try { setDistricts(await adminApi.listDistricts()); }
    catch (e) { setErr((e as Error).message); }
  }
  useEffect(() => { void load(); }, []);

  function openEdit(d: AdminDistrict) {
    setErr(''); setOk(''); editNames.reset();
    editNames.setEn(d.name_en); editNames.setSi(d.name_si ?? d.name_en); editNames.setTa(d.name_ta ?? d.name_en);
    setEditing(d.id);
  }
  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editing || editNames.en.trim().length < 1) { setErr(t('districts.errEnterName')); return; }
    setBusy(true);
    try {
      await adminApi.updateDistrict(editing, {
        name_en: editNames.en.trim(),
        name_si: editNames.si.trim() || editNames.en.trim(),
        name_ta: editNames.ta.trim() || editNames.en.trim(),
      });
      setEditing(null); setOk(t('districts.renamed')); await load();
    } catch (e) { setErr((e as Error).message); }
    finally { setBusy(false); }
  }

  async function add(e: React.FormEvent) {
    e.preventDefault(); setErr(''); setOk('');
    if (names.en.trim().length < 1) { setErr(t('districts.errEnterName')); return; }
    setBusy(true);
    try {
      await adminApi.createDistrict({ name_en: names.en.trim(), name_si: names.si.trim() || names.en.trim(), name_ta: names.ta.trim() || names.en.trim() });
      names.reset(); setOk(t('districts.districtAdded')); await load();
    } catch (e) { setErr((e as Error).message); }
    finally { setBusy(false); }
  }

  async function toggle(d: AdminDistrict) {
    try { await adminApi.setDistrictActive(d.id, !d.is_active); await load(); }
    catch (e) { setErr((e as Error).message); }
  }

  async function doRemove() {
    const d = confirmTarget;
    if (!d) return;
    setConfirmTarget(null); setErr(''); setOk('');
    try { await adminApi.deleteDistrict(d.id); setOk(t('districts.deleted')); await load(); }
    catch (e) { setErr((e as Error).message); }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title={t('districts.title')}
        subtitle={t('districts.subtitle')}
        action={districts ? <span className="rounded-full bg-surface px-2.5 py-1 text-xs font-semibold tabular-nums text-slate dark:bg-gray-800">{districts.length}</span> : undefined}
      />

      <Card className="space-y-4">
        <h2 className="font-display font-bold text-ink dark:text-gray-50">{t('districts.addDistrict')}</h2>
        <form onSubmit={add} className="space-y-4">
          <TrilingualNames state={names} autoFocus placeholder="e.g. Gampaha" />
          <Button disabled={busy} className="w-full sm:w-auto">{busy ? t('districts.adding') : t('districts.addDistrictButton')}</Button>
        </form>
      </Card>

      <Card className="border-l-4 border-l-primary text-sm text-slate">
        {t('districts.launchNote')}
      </Card>

      {ok && <SuccessBanner message={ok} />}
      {err && <ErrorBanner message={err} />}

      {districts === null && !err ? (
        <Spinner label={t('districts.loading')} />
      ) : districts && districts.length === 0 ? (
        <EmptyState>{t('districts.empty')}</EmptyState>
      ) : (
        // Mobile-first: each district is a stacked row-card with one full-size toggle
        // button (>=44px) instead of a cramped inline link.
        <ul className="space-y-2">
          {districts?.map((d, i) => (
            <Reveal key={d.id} delay={i * 40} className="block">
            <li
              className="rounded-xl2 border border-line bg-white p-3 shadow-card dark:border-gray-800 dark:bg-gray-900"
            >
              {editing === d.id ? (
                <form onSubmit={saveEdit} className="space-y-4">
                  <TrilingualNames state={editNames} autoFocus placeholder="e.g. Gampaha" />
                  <div className="flex gap-2">
                    <Button disabled={busy}>{busy ? t('districts.adding') : t('districts.save')}</Button>
                    <Button type="button" variant="ghost" onClick={() => setEditing(null)}>{t('categories.cancel')}</Button>
                  </div>
                </form>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface text-slate dark:bg-gray-800" aria-hidden="true">{ICONS.map}</span>
                  <p className="min-w-0 flex-1 truncate font-medium text-ink dark:text-gray-100">{d.name_en}</p>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${
                      d.is_active ? 'bg-green-50 text-success ring-green-200' : 'bg-slate/10 text-slate ring-slate/20'
                    }`}
                  >
                    {d.is_active ? t('districts.active') : t('districts.inactive')}
                  </span>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <IconButton icon="edit" label={t('districts.edit')} onClick={() => openEdit(d)} />
                    <IconButton
                      icon={d.is_active ? 'deactivate' : 'activate'}
                      label={d.is_active ? t('districts.deactivate') : t('districts.activate')}
                      tone={d.is_active ? 'default' : 'primary'}
                      onClick={() => toggle(d)}
                    />
                    <IconButton icon="trash" label={t('districts.delete')} tone="danger" onClick={() => setConfirmTarget(d)} />
                  </div>
                </div>
              )}
            </li>
            </Reveal>
          ))}
        </ul>
      )}

      <ConfirmModal
        open={confirmTarget !== null}
        title={t('districts.deleteTitle')}
        message={t('districts.confirmDelete')}
        confirmLabel={t('districts.delete')}
        cancelLabel={t('districts.confirmCancel')}
        onConfirm={doRemove}
        onCancel={() => setConfirmTarget(null)}
        danger
      />
    </div>
  );
}
