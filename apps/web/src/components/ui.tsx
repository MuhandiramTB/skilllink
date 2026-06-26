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
      <div className={`text-2xl font-bold tabular-nums ${toneCls[tone]}`}>{value}</div>
      <div className="mt-1 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</div>
    </Card>
  );
}
