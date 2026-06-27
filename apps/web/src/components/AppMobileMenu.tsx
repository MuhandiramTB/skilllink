'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { getSession, onAuthChange, type Session } from '@/lib/session';
import { NavBody } from './AppSidebar';

/**
 * Mobile hamburger → slide-over drawer holding the full role-aware menu (the same
 * NavBody as the desktop sidebar). The bottom tab bar covers the 3 primary
 * destinations; this drawer exposes everything else. Desktop hides it (md:hidden).
 */
export function AppMobileMenu() {
  const [session, setSession] = useState<Session | null>(null);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const sync = () => setSession(getSession());
    sync();
    return onAuthChange(sync);
  }, []);

  // Lock body scroll while the drawer is open.
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!session) return null; // public pages: no menu button

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        aria-expanded={open}
        className="-ml-1 flex h-9 w-9 items-center justify-center rounded-base text-gray-600 hover:bg-gray-100 md:hidden dark:text-gray-300 dark:hover:bg-gray-800"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-6 w-6" aria-hidden="true">
          <path d="M3 6h18M3 12h18M3 18h18" />
        </svg>
      </button>

      {/* Portal to <body> so the drawer escapes the header's backdrop-blur, which
          creates a containing block that would otherwise trap our fixed positioning
          and collapse the panel to the header's height. */}
      {open && mounted && createPortal(
        <div className="fixed inset-0 z-50 flex h-dvh md:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} aria-hidden="true" />
          {/* Panel — explicit viewport height (h-dvh) so it never collapses to the
              header height regardless of positioned ancestors in the app shell. */}
          <div className="relative z-10 flex h-dvh w-72 max-w-[80%] flex-col bg-white shadow-xl dark:bg-gray-900">
            <div className="flex items-center justify-between border-b px-4 py-3 dark:border-gray-700">
              <span className="font-display text-lg font-bold text-primary">SkillLink LK</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="flex h-9 w-9 items-center justify-center rounded-base text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-5 w-5" aria-hidden="true">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <NavBody onNavigate={() => setOpen(false)} />
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
