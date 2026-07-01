'use client';

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

type ToastKind = 'success' | 'error' | 'info';
interface Toast { id: number; kind: ToastKind; message: string }

const ToastCtx = createContext<{ show: (message: string, kind?: ToastKind) => void } | null>(null);

/** useToast().show('Booking confirmed', 'success') — global, animated feedback. */
export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) return { show: () => {} }; // no-op if provider missing (SSR safety)
  return ctx;
}

const ICON: Record<ToastKind, ReactNode> = {
  success: <path d="M20 6L9 17l-5-5" />,
  error: <path d="M18 6L6 18M6 6l12 12" />,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 8h.01M11 12h1v4h1" /></>,
};
const TONE: Record<ToastKind, string> = {
  success: 'text-success',
  error: 'text-danger',
  info: 'text-primary',
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const show = useCallback((message: string, kind: ToastKind = 'info') => {
    const id = (typeof performance !== 'undefined' ? performance.now() : 0) + Math.round(Math.random() * 1000);
    setToasts((cur) => [...cur, { id, kind, message }]);
    setTimeout(() => setToasts((cur) => cur.filter((x) => x.id !== id)), 4000);
  }, []);

  return (
    <ToastCtx.Provider value={{ show }}>
      {children}
      {mounted && createPortal(
        <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[120] flex flex-col items-center gap-2 px-4 sm:inset-x-auto sm:right-4 sm:items-end" role="region" aria-label="Notifications">
          {toasts.map((tst) => (
            <div
              key={tst.id}
              role="status"
              className="sl-toast-in pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-xl2 border border-line bg-white px-4 py-3 shadow-lift dark:border-gray-700 dark:bg-gray-900"
            >
              <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-current/10 ${TONE[tst.kind]}`} aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">{ICON[tst.kind]}</svg>
              </span>
              <p className="flex-1 text-sm font-medium text-ink dark:text-gray-100">{tst.message}</p>
              <button
                type="button"
                onClick={() => setToasts((cur) => cur.filter((x) => x.id !== tst.id))}
                aria-label="Dismiss"
                className="shrink-0 text-slate transition-colors hover:text-ink dark:hover:text-gray-100"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-4 w-4"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>
            </div>
          ))}
        </div>,
        document.body,
      )}
    </ToastCtx.Provider>
  );
}
