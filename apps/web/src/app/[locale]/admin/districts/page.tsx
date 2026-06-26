'use client';

import { useEffect, useState } from 'react';
import { adminApi, type AdminDistrict } from '@/lib/admin-api';

export default function AdminDistrictsPage() {
  const [districts, setDistricts] = useState<AdminDistrict[]>([]);
  const [err, setErr] = useState('');

  async function load() {
    try { setDistricts(await adminApi.listDistricts()); }
    catch (e) { setErr((e as Error).message); }
  }
  useEffect(() => { void load(); }, []);

  async function toggle(d: AdminDistrict) {
    try { await adminApi.setDistrictActive(d.id, !d.is_active); await load(); }
    catch (e) { setErr((e as Error).message); }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Districts (Coverage)</h1>
      <p className="text-sm text-gray-600">
        v1 launches in <b>Kandy</b>. Activate another district to expand — providers there
        become matchable immediately.
      </p>
      {err && <p className="rounded-base bg-red-50 p-2 text-sm text-danger">{err}</p>}

      <ul className="divide-y rounded-base border bg-white dark:divide-gray-700 dark:border-gray-700 dark:bg-gray-800">
        {districts.map((d) => (
          <li key={d.id} className="flex items-center justify-between px-4 py-3">
            <span className="font-medium">
              {d.name_en}
              {d.is_active && <span className="ml-2 rounded-full bg-green-100 px-2 py-0.5 text-xs text-success">Active</span>}
            </span>
            <button
              onClick={() => toggle(d)}
              className={`rounded-base px-3 py-1 text-sm font-medium ${d.is_active ? 'bg-gray-100 text-gray-700' : 'bg-primary text-white'}`}
            >
              {d.is_active ? 'Deactivate' : 'Activate'}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
