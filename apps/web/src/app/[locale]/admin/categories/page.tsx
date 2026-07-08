'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { adminApi, type AdminCategory } from '@/lib/admin-api';
import { PageHeader, Card, Button, Field, inputCls, ErrorBanner, SuccessBanner } from '@/components/ui';
import { IconButton, ConfirmModal } from '@/components/IconButton';
import { ICONS } from '@/components/nav-config';
import { Reveal } from '@/components/Reveal';

/** Slugify an English name into a valid category key (lowercase, _ separated). */
function toKey(name: string) {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}

export default function AdminCategoriesPage() {
  const t = useTranslations('admin');
  const [cats, setCats] = useState<AdminCategory[]>([]);
  const [name, setName] = useState('');
  const [parentId, setParentId] = useState(''); // '' = top-level; else parent id → sub-service
  const [editing, setEditing] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [confirmTarget, setConfirmTarget] = useState<AdminCategory | null>(null);
  const [err, setErr] = useState('');
  const [ok, setOk] = useState('');
  const [busy, setBusy] = useState(false);

  async function load() {
    try { setCats(await adminApi.listCategories()); }
    catch (e) { setErr((e as Error).message); }
  }
  useEffect(() => { void load(); }, []);

  const tops = cats.filter((c) => !c.parent_id);
  const subsByParent = (id: string) => cats.filter((c) => c.parent_id === id);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setErr(''); setOk('');
    const n = name.trim();
    if (!n) { setErr(t('categories.errEnterName')); return; }
    const parent = tops.find((c) => c.id === parentId);
    const key = parent ? `${parent.key}.${toKey(n)}` : toKey(n);
    if (!key) { setErr(t('categories.errDeriveKey')); return; }
    setBusy(true);
    try {
      // Si/Ta names + the internal key are generated silently — admin only types the name.
      await adminApi.createCategory({ key, name_en: n, name_si: n, name_ta: n, parent_id: parentId || undefined });
      setName(''); setOk(t('categories.serviceAdded'));
      await load();
    } catch (e) { setErr((e as Error).message); }
    finally { setBusy(false); }
  }

  async function toggle(c: AdminCategory) {
    try {
      if (c.is_active) await adminApi.deactivateCategory(c.id);
      else await adminApi.updateCategory(c.id, { is_active: true });
      await load();
    } catch (e) { setErr((e as Error).message); }
  }

  async function doRemove() {
    const c = confirmTarget;
    if (!c) return;
    setConfirmTarget(null); setErr(''); setOk('');
    try {
      await adminApi.deleteCategory(c.id);
      setOk(t('categories.deleted'));
      await load();
    } catch (e) { setErr((e as Error).message); }
  }

  function openEdit(c: AdminCategory) { setErr(''); setOk(''); setEditName(c.name_en); setEditing(c.id); }
  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    const n = editName.trim();
    if (!editing || !n) { setErr(t('categories.errEnterName')); return; }
    setBusy(true);
    try {
      await adminApi.updateCategory(editing, { name_en: n, name_si: n, name_ta: n });
      setEditing(null); setOk(t('categories.renamed'));
      await load();
    } catch (e) { setErr((e as Error).message); }
    finally { setBusy(false); }
  }

  const editRow = (
    <form onSubmit={saveEdit} className="flex flex-wrap items-center gap-2">
      <input autoFocus value={editName} onChange={(e) => setEditName(e.target.value)} className={`${inputCls} min-w-0 flex-1`} />
      <Button disabled={busy}>{t('categories.save')}</Button>
      <Button type="button" variant="ghost" onClick={() => setEditing(null)}>{t('categories.cancel')}</Button>
    </form>
  );

  return (
    <div className="space-y-5">
      <PageHeader title={t('categories.title')} subtitle={t('categories.subtitle')} />
      {ok && <SuccessBanner message={ok} />}
      {err && <ErrorBanner message={err} />}

      {/* Simple add: just a name + where it goes. */}
      <Card className="space-y-4">
        <h2 className="font-display font-bold text-ink dark:text-gray-50">{t('categories.addService')}</h2>
        <form onSubmit={add} className="space-y-4 sm:flex sm:items-end sm:gap-3 sm:space-y-0">
          <Field label={t('categories.name')}>
            <input autoFocus value={name} onChange={(e) => setName(e.target.value)} className={inputCls} placeholder="e.g. Electrician" />
          </Field>
          <Field label={t('categories.type')}>
            <select value={parentId} onChange={(e) => setParentId(e.target.value)} className={`${inputCls} max-w-full`}>
              <option value="">{t('categories.topLevel')}</option>
              {tops.length > 0 && (
                <optgroup label={t('categories.subServiceGroup')}>
                  {tops.map((top) => <option key={top.id} value={top.id}>{top.name_en}</option>)}
                </optgroup>
              )}
            </select>
          </Field>
          <Button disabled={busy} className="w-full sm:w-auto">{busy ? t('categories.adding') : t('categories.addServiceButton')}</Button>
        </form>
      </Card>

      {/* Tree: categories with their sub-services nested — rename / activate. */}
      <div className="space-y-3">
        {tops.map((cat, i) => {
          const subs = subsByParent(cat.id);
          return (
            <Reveal key={cat.id} delay={i * 40}>
            <Card className="space-y-3">
              {editing === cat.id ? editRow : (
                <div className="flex items-center gap-2">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface text-slate dark:bg-gray-800" aria-hidden="true">{ICONS.grid}</span>
                  <p className="min-w-0 flex-1 truncate font-semibold text-ink dark:text-gray-100">{cat.name_en}</p>
                  <StatusPill active={cat.is_active} t={t} />
                  <RowActions c={cat} t={t} onEdit={openEdit} onToggle={toggle} onDelete={setConfirmTarget} />
                </div>
              )}

              {subs.length > 0 && (
                <ul className="space-y-2 border-t border-line pt-3 dark:border-gray-800">
                  {subs.map((sub) => (
                    <li key={sub.id} className="rounded-base bg-surface px-3 py-2 dark:bg-gray-800/40">
                      {editing === sub.id ? editRow : (
                        <div className="flex items-center gap-2">
                          <p className="min-w-0 flex-1 truncate text-sm font-medium text-ink dark:text-gray-200">↳ {sub.name_en}</p>
                          <StatusPill active={sub.is_active} t={t} />
                          <RowActions c={sub} t={t} onEdit={openEdit} onToggle={toggle} onDelete={setConfirmTarget} small />
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </Card>
            </Reveal>
          );
        })}
      </div>

      <ConfirmModal
        open={confirmTarget !== null}
        title={t('categories.deleteTitle')}
        message={t('categories.confirmDelete')}
        confirmLabel={t('categories.delete')}
        cancelLabel={t('categories.confirmCancel')}
        onConfirm={doRemove}
        onCancel={() => setConfirmTarget(null)}
        danger
      />
    </div>
  );
}

function StatusPill({ active, t }: { active: boolean; t: (k: string) => string }) {
  return (
    <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${active ? 'bg-green-50 text-success ring-1 ring-inset ring-green-200' : 'bg-slate/10 text-slate ring-1 ring-inset ring-slate/20'}`}>
      {active ? t('categories.active') : t('categories.hidden')}
    </span>
  );
}

/** Icon-only row actions: edit · activate/deactivate · delete, each with a tooltip. */
function RowActions({ c, t, onEdit, onToggle, onDelete, small }: {
  c: AdminCategory;
  t: (k: string) => string;
  onEdit: (c: AdminCategory) => void;
  onToggle: (c: AdminCategory) => void;
  onDelete: (c: AdminCategory) => void;
  small?: boolean;
}) {
  return (
    <div className="flex shrink-0 items-center gap-1.5">
      <IconButton icon="edit" label={t('categories.edit')} onClick={() => onEdit(c)} small={small} />
      <IconButton
        icon={c.is_active ? 'deactivate' : 'activate'}
        label={c.is_active ? t('categories.deactivate') : t('categories.activate')}
        tone={c.is_active ? 'default' : 'primary'}
        onClick={() => onToggle(c)}
        small={small}
      />
      <IconButton icon="trash" label={t('categories.delete')} tone="danger" onClick={() => onDelete(c)} small={small} />
    </div>
  );
}
