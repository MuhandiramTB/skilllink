'use client';

import type { ReactNode } from 'react';

/** Small inline icon set for row actions. */
export const ActionIcons = {
  edit: 'M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4z',
  activate: 'M20 6L9 17l-5-5', // check
  deactivate: 'M18.36 6.64A9 9 0 1120.77 16M12 8v4', // power-ish
  trash: 'M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m2 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14M10 11v6M14 11v6',
} as const;

/**
 * Icon-only action button with a tooltip (native `title`, shown near the cursor on
 * hover) + an accessible `aria-label`. `tone` colours destructive/positive actions.
 */
export function IconButton({
  icon,
  label,
  onClick,
  tone = 'default',
  small,
}: {
  icon: keyof typeof ActionIcons;
  label: string;
  onClick: () => void;
  tone?: 'default' | 'danger' | 'primary';
  small?: boolean;
}) {
  const toneCls: Record<string, string> = {
    default: 'border-gray-300 text-gray-600 hover:border-primary hover:text-primary dark:border-gray-600 dark:text-gray-300',
    danger: 'border-danger/40 text-danger hover:bg-danger/10',
    primary: 'border-primary/40 text-primary hover:bg-primary/10',
  };
  const size = small ? 'h-9 w-9' : 'h-10 w-10';
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`flex ${size} shrink-0 items-center justify-center rounded-base border transition ${toneCls[tone]}`}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]" aria-hidden="true">
        <path d={ActionIcons[icon]} />
      </svg>
    </button>
  );
}

/** Confirmation modal — replaces window.confirm with a styled, accessible dialog. */
export function ConfirmModal({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  danger,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean;
}): ReactNode {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} aria-hidden="true" />
      <div className="relative z-10 w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl dark:bg-gray-800">
        <h3 className="font-display text-lg font-bold">{title}</h3>
        <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">{message}</p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="min-h-[44px] rounded-base border px-4 text-sm font-medium text-gray-700 hover:border-primary dark:border-gray-600 dark:text-gray-200"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`min-h-[44px] rounded-base px-4 text-sm font-semibold text-white transition hover:opacity-90 ${danger ? 'bg-danger' : 'bg-primary'}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
