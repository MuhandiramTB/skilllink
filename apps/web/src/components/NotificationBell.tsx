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
      <button onClick={toggle} aria-label={t('title')} title={t('title')} aria-expanded={open}
        className="relative flex h-9 w-9 items-center justify-center rounded-base border border-line text-slate transition hover:border-primary hover:text-primary dark:border-gray-700 dark:text-gray-300">
        {/* Bell icon (Bootstrap bell-fill) */}
        <svg viewBox="0 0 16 16" fill="currentColor" className="h-[18px] w-[18px]" aria-hidden="true">
          <path d="M8 16a2 2 0 0 0 2-2H6a2 2 0 0 0 2 2m.995-14.901a1 1 0 1 0-1.99 0A5 5 0 0 0 3 6c0 1.098-.5 6-2 7h14c-1.5-1-2-5.902-2-7 0-2.42-1.72-4.44-4.005-4.901" />
        </svg>
        {count > 0 && (
          <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {open && (
        <>
          {/* Backdrop — dims + captures the click-away. On mobile it makes the panel
              read as a clear overlay; on desktop it's an invisible click catcher. */}
          <button
            type="button"
            aria-label={t('close')}
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 cursor-default bg-ink/40 backdrop-blur-[1px] sm:bg-transparent sm:backdrop-blur-0"
          />
          {/* Panel — mobile: a fixed sheet pinned near the top, almost full-width and
              clearly visible; desktop (sm+): an anchored dropdown under the bell. */}
          <div className="fixed inset-x-3 top-16 z-50 overflow-hidden rounded-xl2 border border-line bg-white shadow-lift dark:border-gray-800 dark:bg-gray-900 sm:absolute sm:inset-x-auto sm:right-0 sm:top-auto sm:mt-2 sm:w-80">
            <div className="flex items-center justify-between border-b border-line px-4 py-3 dark:border-gray-800">
              <span className="font-display text-sm font-bold text-ink dark:text-gray-50">{t('title')}</span>
              {count > 0 && <button onClick={markAll} className="text-xs font-semibold text-primary hover:underline">{t('markAllRead')}</button>}
            </div>
            <ul className="max-h-[60vh] overflow-y-auto sm:max-h-96">
              {items.length === 0 && (
                <li className="flex flex-col items-center gap-2 px-4 py-10 text-center">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-surface text-slate-2 dark:bg-gray-800" aria-hidden="true">
                    <svg viewBox="0 0 16 16" fill="currentColor" className="h-5 w-5"><path d="M8 16a2 2 0 0 0 2-2H6a2 2 0 0 0 2 2m.995-14.901a1 1 0 1 0-1.99 0A5 5 0 0 0 3 6c0 1.098-.5 6-2 7h14c-1.5-1-2-5.902-2-7 0-2.42-1.72-4.44-4.005-4.901" /></svg>
                  </span>
                  <span className="text-sm text-slate">{t('none')}</span>
                </li>
              )}
              {items.map((n) => (
                <li key={n.id} className="border-b border-line-soft last:border-b-0 dark:border-gray-800/60">
                  <button onClick={() => openItem(n)}
                    className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-surface dark:hover:bg-gray-800 ${n.read_at ? '' : 'bg-primary-soft/60 dark:bg-primary/10'}`}>
                    {!n.read_at && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" aria-hidden="true" />}
                    <span className={`min-w-0 flex-1 ${n.read_at ? 'pl-5' : ''}`}>
                      <span className="block truncate text-sm font-semibold text-ink dark:text-gray-100">{n.title}</span>
                      {n.body && <span className="mt-0.5 block text-xs text-slate">{n.body}</span>}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
