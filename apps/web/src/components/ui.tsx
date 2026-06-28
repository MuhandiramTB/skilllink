'use client';

import type { ButtonHTMLAttributes, ReactNode } from 'react';

/** Shared UI primitives — consistent styling across customer/provider/admin areas. */

export function Button({
  variant = 'primary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'success' | 'danger' | 'ghost' }) {
  const styles: Record<string, string> = {
    primary: 'bg-primary text-white hover:opacity-90',
    success: 'bg-success text-white hover:opacity-90',
    danger: 'bg-danger text-white hover:opacity-90',
    ghost: 'border text-gray-700 hover:border-primary',
  };
  return (
    <button
      {...props}
      className={`rounded-base px-4 py-2 text-sm font-medium transition disabled:opacity-50 ${styles[variant]} ${className}`}
    />
  );
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-base border bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800 ${className}`}>
      {children}
    </div>
  );
}

const STATUS_STYLES: Record<string, string> = {
  requested: 'bg-gray-100 text-gray-700',
  matched: 'bg-blue-100 text-blue-700',
  accepted: 'bg-amber-100 text-amber-800',
  in_progress: 'bg-indigo-100 text-indigo-700',
  completed: 'bg-green-100 text-success',
  cancelled: 'bg-gray-100 text-gray-500',
  rejected: 'bg-red-100 text-danger',
  approved: 'bg-green-100 text-success',
  pending: 'bg-amber-100 text-amber-800',
  open: 'bg-amber-100 text-amber-800',
  resolved: 'bg-green-100 text-success',
  paid: 'bg-green-100 text-success',
};

export function StatusBadge({ status }: { status: string }) {
  const cls = STATUS_STYLES[status] ?? 'bg-gray-100 text-gray-700';
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}

export function Spinner({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 py-6 text-sm text-gray-500">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-primary" />
      {label}
    </div>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <p className="rounded-base border border-dashed bg-gray-50 p-6 text-center text-sm text-gray-500">{children}</p>;
}

export function ErrorBanner({ message }: { message: string }) {
  return <p className="rounded-base bg-red-50 p-2 text-sm text-danger">{message}</p>;
}

export function SuccessBanner({ message }: { message: string }) {
  return <p className="rounded-base bg-green-50 p-2 text-sm text-success">{message}</p>;
}

/** Dashboard summary tile: big tabular number + label, optional semantic color. */
export function StatCard({
  label,
  value,
  tone = 'default',
}: {
  label: string;
  value: ReactNode;
  tone?: 'default' | 'success' | 'danger' | 'primary';
}) {
  const toneCls: Record<string, string> = {
    default: 'text-gray-900 dark:text-gray-100',
    success: 'text-success',
    danger: 'text-danger',
    primary: 'text-primary',
  };
  return (
    <Card>
      {/* Numbers/money: scale a touch with viewport and never clip — break the LKR
          prefix to its own line rather than truncating the amount. */}
      <div className={`text-xl font-bold leading-tight tabular-nums sm:text-2xl ${toneCls[tone]}`}>{value}</div>
      <div className="mt-1 text-[11px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</div>
    </Card>
  );
}

/** Format integer cents as a non-wrapping LKR amount for StatCard values. */
export function Money({ cents }: { cents: number }) {
  const v = (cents / 100).toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return <span className="whitespace-nowrap">LKR {v}</span>;
}

/** Consistent page title + optional subtitle, used at the top of every page. */
export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="font-display text-2xl font-bold">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>}
      </div>
      {action}
    </header>
  );
}

/** A titled content block (uppercase section label + card body). */
export function Section({ title, children, className = '' }: { title?: string; children: ReactNode; className?: string }) {
  return (
    <section className={`space-y-3 ${className}`}>
      {title && <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{title}</h2>}
      {children}
    </section>
  );
}

/** Uniform text input — matches the polished form fields elsewhere. */
export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-gray-400">{hint}</span>}
    </label>
  );
}

export const inputCls =
  'w-full rounded-base border px-3 py-2.5 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 dark:border-gray-600 dark:bg-gray-900';

/**
 * Booking progress stepper — shows the customer/provider where the job is in its
 * lifecycle so the next action is obvious. Cancelled/rejected bookings collapse the
 * timeline to a single terminal state. `labels` are passed in (i18n) in step order.
 */
const BOOKING_FLOW = ['requested', 'matched', 'accepted', 'in_progress', 'completed'] as const;
export function BookingProgress({ status, labels }: { status: string; labels: string[] }) {
  if (status === 'cancelled' || status === 'rejected') {
    return (
      <div className="rounded-base bg-gray-50 px-3 py-2 text-sm text-gray-500 dark:bg-gray-800">
        <StatusBadge status={status} />
      </div>
    );
  }
  const current = BOOKING_FLOW.indexOf(status as (typeof BOOKING_FLOW)[number]);
  const activeIdx = current < 0 ? 0 : current;
  return (
    <ol className="flex items-center gap-1" aria-label="Booking progress">
      {BOOKING_FLOW.map((step, i) => {
        const done = i < activeIdx;
        const active = i === activeIdx;
        return (
          <li key={step} className="flex flex-1 flex-col items-center gap-1">
            <div className="flex w-full items-center">
              {i > 0 && <span className={`h-0.5 flex-1 ${i <= activeIdx ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700'}`} />}
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                  done ? 'bg-primary text-white' : active ? 'bg-primary text-white ring-2 ring-primary/30' : 'bg-gray-200 text-gray-400 dark:bg-gray-700'
                }`}
              >
                {done ? '✓' : i + 1}
              </span>
              {i < BOOKING_FLOW.length - 1 && <span className={`h-0.5 flex-1 ${i < activeIdx ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700'}`} />}
            </div>
            <span className={`text-center text-[10px] leading-tight ${active ? 'font-semibold text-primary' : 'text-gray-400'}`}>
              {labels[i]}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
