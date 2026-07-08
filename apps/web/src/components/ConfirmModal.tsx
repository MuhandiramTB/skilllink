'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

/**
 * Reusable confirmation dialog. Rendered in a portal with a dimmed backdrop; used
 * before consequential actions (e.g. a customer deciding to also become a provider).
 * Matches SessionExpiredModal's look. Confirm/cancel labels + tone are passed in so
 * it stays i18n-driven at the call site.
 */
export function ConfirmModal({
  open,
  title,
  body,
  confirmLabel,
  cancelLabel,
  tone = 'primary',
  icon,
  busy = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  body?: ReactNode;
  confirmLabel: string;
  cancelLabel: string;
  tone?: 'primary' | 'danger';
  icon?: ReactNode;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  // Close on Escape (only while open and not mid-action).
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !busy) onCancel(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, busy, onCancel]);

  if (!mounted || !open) return null;

  const confirmCls =
    tone === 'danger'
      ? 'bg-danger hover:brightness-110'
      : 'bg-primary hover:bg-primary-600';
  const iconWrap =
    tone === 'danger' ? 'bg-danger/12 text-danger' : 'bg-primary-soft text-primary dark:bg-primary/15';

  return createPortal(
    <div className="fixed inset-0 z-[130] flex items-end justify-center p-4 sm:items-center" role="alertdialog" aria-modal="true" aria-label={title}>
      <button type="button" aria-label={cancelLabel} tabIndex={-1} className="absolute inset-0 cursor-default bg-ink/50 backdrop-blur-sm" onClick={() => { if (!busy) onCancel(); }} />
      <div className="relative z-10 w-full max-w-sm rounded-xl2 border border-line bg-white p-6 text-center shadow-lift dark:border-gray-800 dark:bg-gray-900">
        {icon && (
          <span className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full [&>svg]:h-7 [&>svg]:w-7 ${iconWrap}`} aria-hidden="true">
            {icon}
          </span>
        )}
        <h2 className="mt-4 font-display text-lg font-bold text-ink dark:text-gray-50">{title}</h2>
        {body && <p className="mt-1.5 text-sm text-slate">{body}</p>}
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="flex-1 rounded-base border border-line bg-white px-5 py-2.5 text-sm font-semibold text-ink transition-all hover:border-ink hover:bg-surface active:translate-y-px disabled:opacity-40 dark:border-gray-700 dark:bg-transparent dark:text-gray-100"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className={`flex flex-1 items-center justify-center gap-2 rounded-base px-5 py-2.5 text-sm font-bold text-white shadow-card transition-all active:translate-y-px disabled:opacity-60 ${confirmCls}`}
          >
            {busy && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
