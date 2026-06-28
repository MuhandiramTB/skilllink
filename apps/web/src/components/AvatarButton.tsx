'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { getSession, fetchMe, clearToken, onAuthChange } from '@/lib/session';

/**
 * Header account button: a round avatar (photo or initials) that opens a dropdown
 * with "View profile" and "Sign out". Renders only when signed in. Stays in sync
 * with login/logout and profile changes via onAuthChange + a refetch.
 */
export function AvatarButton() {
  const locale = (useParams().locale as string) ?? 'en';
  const t = useTranslations('profile');
  const [signedIn, setSignedIn] = useState(false);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [initials, setInitials] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    const sync = async () => {
      const s = getSession();
      if (!s) { setSignedIn(false); return; }
      setSignedIn(true);
      const me = await fetchMe();
      if (cancelled || !me) return;
      setAvatar(me.avatarUrl);
      // Initials only from a real name; if the user hasn't set a name yet we show a
      // generic person icon (not the phone digits, which read like a meaningless "00").
      const name = me.fullName?.trim();
      setInitials(name ? name.split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('') : '');
    };
    void sync();
    const off = onAuthChange(() => void sync());
    return () => { cancelled = true; off(); };
  }, []);

  // Close the dropdown on outside-click or Escape.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [open]);

  if (!signedIn) return null;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Account menu"
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-gray-200 bg-primary/10 text-xs font-semibold text-primary transition hover:ring-2 hover:ring-primary/30 dark:border-gray-600 dark:bg-primary/20"
      >
        {avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatar} alt="" className="h-full w-full object-cover" />
        ) : initials ? (
          <span>{initials}</span>
        ) : (
          // No photo and no name yet → generic person icon.
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z" />
          </svg>
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-44 overflow-hidden rounded-base border bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800"
        >
          <a
            href={`/${locale}/profile`}
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z" />
            </svg>
            {t('title')}
          </a>
          <button
            type="button"
            role="menuitem"
            onClick={() => { clearToken(); window.location.href = `/${locale}`; }}
            className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-danger hover:bg-danger/10"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
            </svg>
            {t('signOut')}
          </button>
        </div>
      )}
    </div>
  );
}
