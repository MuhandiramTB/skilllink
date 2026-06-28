'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { getToken } from '@/lib/session';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

interface Notif { id: string; type: string; title: string; body: string | null; link: string | null; read_at: string | null; created_at: string }

async function api<T>(path: string, init?: RequestInit): Promise<T | null> {
  const t = getToken();
  if (!t) return null;
  const r = await fetch(`${API}${path}`, { ...init, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` } });
  const b = await r.json().catch(() => ({ error: true }));
  return r.ok && !b.error ? (b.data as T) : null;
}

/** Header notification bell: unread badge + dropdown list, mark-read. */
export function NotificationBell() {
  const locale = (useParams().locale as string) ?? 'en';
  const t = useTranslations('notif');
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notif[]>([]);
  const [count, setCount] = useState(0);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    if (!getToken()) return;
    setAuthed(true);
    const tick = () => api<{ count: number }>('/notifications/unread-count').then((d) => d && setCount(d.count));
    tick();
    const iv = setInterval(tick, 30000); // light poll; real-time push is a later enhancement
    return () => clearInterval(iv);
  }, []);

  async function toggle() {
    const next = !open;
    setOpen(next);
    if (next) {
      const list = await api<Notif[]>('/notifications');
      if (list) setItems(list);
    }
  }

  async function openItem(n: Notif) {
    await api(`/notifications/${n.id}/read`, { method: 'PATCH' });
    setCount((c) => Math.max(0, c - (n.read_at ? 0 : 1)));
    if (n.link) window.location.href = `/${locale}${n.link}`;
  }

  async function markAll() {
    await api('/notifications/read-all', { method: 'PATCH' });
    setCount(0);
    setItems((xs) => xs.map((x) => ({ ...x, read_at: new Date().toISOString() })));
  }

  if (!authed) return null;

  return (
    <div className="relative">
      <button onClick={toggle} aria-label={t('title')}
        className="relative rounded-base border px-2 py-1 text-xs font-medium dark:border-gray-600">
        {t('alerts')}
        {count > 0 && (
          <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-30 mt-2 w-72 rounded-base border bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center justify-between border-b px-3 py-2 text-sm font-medium dark:border-gray-700">
            <span>{t('title')}</span>
            {count > 0 && <button onClick={markAll} className="text-xs text-primary">{t('markAllRead')}</button>}
          </div>
          <ul className="max-h-80 overflow-y-auto">
            {items.length === 0 && <li className="px-3 py-6 text-center text-sm text-gray-400">{t('none')}</li>}
            {items.map((n) => (
              <li key={n.id}>
                <button onClick={() => openItem(n)}
                  className={`block w-full px-3 py-2.5 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 ${n.read_at ? '' : 'bg-primary/5 dark:bg-primary/10'}`}>
                  <p className="font-medium">{n.title}</p>
                  {n.body && <p className="text-xs text-gray-500 dark:text-gray-400">{n.body}</p>}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
