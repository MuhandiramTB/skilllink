'use client';

import { useEffect, useState } from 'react';
import { adminApi, type AdminCategory } from '@/lib/admin-api';

const EMPTY = { key: '', name_en: '', name_si: '', name_ta: '', parent_id: '' };

export default function AdminCategoriesPage() {
  const [cats, setCats] = useState<AdminCategory[]>([]);
  const [form, setForm] = useState({ ...EMPTY });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function load() {
    try { setCats(await adminApi.listCategories()); }
    catch (e) { setErr((e as Error).message); }
  }
  useEffect(() => { void load(); }, []);

  const tops = cats.filter((c) => !c.parent_id);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setErr(''); setBusy(true);
    try {
      await adminApi.createCategory({
        key: form.key,
        name_en: form.name_en,
        name_si: form.name_si,
        name_ta: form.name_ta,
        parent_id: form.parent_id || undefined,
      });
      setForm({ ...EMPTY });
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

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-semibold">Categories &amp; Sub-services</h1>
      {err && <p className="rounded-base bg-red-50 p-2 text-sm text-danger">{err}</p>}

      <form onSubmit={add} className="space-y-2 rounded-base border bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <h2 className="font-medium">Add new</h2>
        <input className="w-full rounded-base border px-3 py-2" placeholder="key (e.g. pest_control or solar.monitoring)"
          value={form.key} onChange={(e) => setForm({ ...form, key: e.target.value })} required />
        <div className="grid grid-cols-3 gap-2">
          <input className="rounded-base border px-2 py-2" placeholder="English" value={form.name_en} onChange={(e) => setForm({ ...form, name_en: e.target.value })} required />
          <input className="rounded-base border px-2 py-2" placeholder="සිංහල" value={form.name_si} onChange={(e) => setForm({ ...form, name_si: e.target.value })} required />
          <input className="rounded-base border px-2 py-2" placeholder="தமிழ்" value={form.name_ta} onChange={(e) => setForm({ ...form, name_ta: e.target.value })} required />
        </div>
        <select className="w-full rounded-base border px-2 py-2" value={form.parent_id} onChange={(e) => setForm({ ...form, parent_id: e.target.value })}>
          <option value="">— top-level category —</option>
          {tops.map((t) => <option key={t.id} value={t.id}>under: {t.name_en}</option>)}
        </select>
        <button disabled={busy} className="rounded-base bg-primary px-4 py-2 font-medium text-white disabled:opacity-50">
          {busy ? 'Adding…' : 'Add category'}
        </button>
      </form>

      <table className="w-full text-sm">
        <thead><tr className="border-b text-left text-gray-500">
          <th className="py-2">Key</th><th>English</th><th>Active</th><th></th>
        </tr></thead>
        <tbody>
          {cats.map((c) => (
            <tr key={c.id} className="border-b">
              <td className="py-2">{c.parent_id ? '↳ ' : ''}<code>{c.key}</code></td>
              <td>{c.name_en}</td>
              <td>{c.is_active ? <span className="text-xs font-medium text-success">Active</span> : <span className="text-xs text-gray-400">Hidden</span>}</td>
              <td className="text-right">
                <button onClick={() => toggle(c)} className="text-xs text-primary hover:underline">
                  {c.is_active ? 'Deactivate' : 'Activate'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
