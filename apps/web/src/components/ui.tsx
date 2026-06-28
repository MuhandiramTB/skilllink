'use client';

import type { ButtonHTMLAttributes, ReactNode } from 'react';

/**
 * Shared UI primitives — "Bold marketplace" design system.
 * Near-black ink + a single electric-blue accent. Crisp 1px-bordered cards with
 * a confident hover lift (no shadow at rest), tight radius, strong type hierarchy.
 */

export function Button({
  variant = 'primary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'success' | 'danger' | 'ghost' }) {
  const styles: Record<string, string> = {
    // Primary = ink (near-black), the confident default action.
    primary: 'bg-ink text-white hover:bg-black active:translate-y-px',
    success: 'bg-success text-white hover:brightness-110 active:translate-y-px',
    danger: 'bg-danger text-white hover:brightness-110 active:translate-y-px',
    ghost: 'border border-line bg-white text-ink hover:border-ink hover:bg-surface dark:border-gray-700 dark:bg-transparent dark:text-gray-100 dark:hover:border-gray-500',
  };
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-1.5 rounded-base px-4 py-2.5 text-sm font-semibold transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-40 ${styles[variant]} ${className}`}
    />
  );
}

/** Accent (electric-blue) button — for the single most important CTA on a view. */
export function AccentButton({ className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-1.5 rounded-base bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-card transition-all duration-150 hover:bg-primary-700 active:translate-y-px disabled:opacity-40 ${className}`}
    />
  );
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl2 border border-line bg-white p-5 shadow-card transition-all duration-150 dark:border-gray-800 dark:bg-gray-900 ${className}`}>
      {children}
    </div>
  );
}

/** Card that is a link/affordance — gains a hover lift + accent border. */
export function CardLink({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl2 border border-line bg-white p-5 shadow-card transition-all duration-150 hover:-translate-y-0.5 hover:border-primary hover:shadow-lift dark:border-gray-800 dark:bg-gray-900 ${className}`}>
      {children}
    </div>
  );
}

const STATUS_STYLES: Record<string, string> = {
  requested: 'bg-slate/10 text-slate ring-slate/20',
  matched: 'bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-500/10 dark:text-blue-300',
  accepted: 'bg-amber-50 text-warn ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300',
  in_progress: 'bg-indigo-50 text-indigo-700 ring-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-300',
  completed: 'bg-green-50 text-success ring-green-200 dark:bg-green-500/10 dark:text-green-300',
  cancelled: 'bg-slate/10 text-slate ring-slate/20',
  rejected: 'bg-red-50 text-danger ring-red-200 dark:bg-red-500/10 dark:text-red-300',
  approved: 'bg-green-50 text-success ring-green-200 dark:bg-green-500/10 dark:text-green-300',
  pending: 'bg-amber-50 text-warn ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300',
  open: 'bg-amber-50 text-warn ring-amber-200',
  resolved: 'bg-green-50 text-success ring-green-200',
  paid: 'bg-green-50 text-success ring-green-200',
};

export function StatusBadge({ status }: { status: string }) {
  const cls = STATUS_STYLES[status] ?? 'bg-slate/10 text-slate ring-slate/20';
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ring-1 ring-inset ${cls}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}

/**
 * Loading state. Default = a centered, branded loader with breathing room (used for
 * page/section loads). `inline` = the compact row variant for buttons/small spots.
 */
export function Spinner({ label = 'Loading…', inline = false }: { label?: string; inline?: boolean }) {
  if (inline) {
    return (
      <div className="flex items-center gap-2.5 py-6 text-sm font-medium text-slate">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-line border-t-primary" />
        {label}
      </div>
    );
  }
  return (
    <div className="flex min-h-[45vh] flex-col items-center justify-center gap-5 py-10 text-center">
      {/* Dual-ring loader: a soft track + a spinning accent arc, with a pulsing dot core. */}
      <span className="relative flex h-12 w-12 items-center justify-center" aria-hidden="true">
        <span className="absolute inset-0 rounded-full border-[3px] border-line dark:border-gray-800" />
        <span className="absolute inset-0 animate-spin rounded-full border-[3px] border-transparent border-t-primary" />
        <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
      </span>
      <span className="text-sm font-medium text-slate">{label}</span>
      <span className="sr-only" role="status">{label}</span>
    </div>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl2 border border-dashed border-line bg-white/50 p-8 text-center text-sm text-slate dark:border-gray-800 dark:bg-gray-900/40">
      {children}
    </div>
  );
}

export function ErrorBanner({ message }: { message: string }) {
  return (
    <p className="flex items-start gap-2 rounded-base border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-medium text-danger dark:border-red-500/30 dark:bg-red-500/10">
      <span aria-hidden="true">⚠</span>{message}
    </p>
  );
}

export function SuccessBanner({ message }: { message: string }) {
  return (
    <p className="flex items-start gap-2 rounded-base border border-green-200 bg-green-50 px-3 py-2.5 text-sm font-medium text-success dark:border-green-500/30 dark:bg-green-500/10">
      <span aria-hidden="true">✓</span>{message}
    </p>
  );
}

/** Dashboard summary tile: big tabular number + uppercase label, optional tone. */
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
    default: 'text-ink dark:text-gray-100',
    success: 'text-success',
    danger: 'text-danger',
    primary: 'text-primary',
  };
  return (
    <div className="rounded-xl2 border border-line bg-white p-4 shadow-card dark:border-gray-800 dark:bg-gray-900">
      <div className={`font-display text-2xl font-bold leading-none tabular-nums sm:text-3xl ${toneCls[tone]}`}>{value}</div>
      <div className="mt-2 text-[11px] font-semibold uppercase tracking-wider text-slate">{label}</div>
    </div>
  );
}

/**
 * Icon-led metric card — the building block of a real dashboard. An icon tile
 * (tinted by tone), a big tabular value, a label, and an optional context line.
 * Tone drives the icon tile color so state reads at a glance.
 */
export function MetricCard({
  icon,
  label,
  value,
  sub,
  tone = 'default',
}: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  tone?: 'default' | 'primary' | 'success' | 'warn' | 'danger';
}) {
  const tile: Record<string, string> = {
    default: 'bg-slate/10 text-slate',
    primary: 'bg-primary/10 text-primary',
    success: 'bg-green-100 text-success dark:bg-green-500/15',
    warn: 'bg-amber-100 text-warn dark:bg-amber-500/15',
    danger: 'bg-red-100 text-danger dark:bg-red-500/15',
  };
  return (
    <div className="rounded-xl2 border border-line bg-white p-4 shadow-card dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-start justify-between gap-2">
        <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${tile[tone]}`} aria-hidden="true">{icon}</span>
        {sub && <span className="text-[11px] font-semibold text-slate">{sub}</span>}
      </div>
      <div className="mt-3 font-display text-2xl font-bold leading-none tabular-nums text-ink dark:text-gray-50 sm:text-[28px]">{value}</div>
      <div className="mt-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate">{label}</div>
    </div>
  );
}

/** Navigation card — icon tile + title + one-line description. The proper way to
 *  present a "jump to section" link (vs. a bare text box). */
export function NavCard({ href, icon, title, desc, badge }: { href: string; icon: ReactNode; title: string; desc?: string; badge?: ReactNode }) {
  return (
    <a
      href={href}
      className="group flex items-center gap-3.5 rounded-xl2 border border-line bg-white p-4 shadow-card transition-all duration-150 hover:-translate-y-0.5 hover:border-primary hover:shadow-lift dark:border-gray-800 dark:bg-gray-900"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface text-slate transition-colors group-hover:bg-primary group-hover:text-white dark:bg-gray-800" aria-hidden="true">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2 font-semibold text-ink dark:text-gray-100">{title}{badge}</span>
        {desc && <span className="mt-0.5 block truncate text-xs text-slate">{desc}</span>}
      </span>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 shrink-0 text-slate transition-transform group-hover:translate-x-0.5 group-hover:text-primary" aria-hidden="true">
        <path d="M9 18l6-6-6-6" />
      </svg>
    </a>
  );
}

/** Format integer cents as a non-wrapping LKR amount. */
export function Money({ cents }: { cents: number }) {
  const v = (cents / 100).toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return <span className="whitespace-nowrap tabular-nums">LKR {v}</span>;
}

/** Page title + optional subtitle, used at the top of every page. */
export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="font-display text-2xl font-extrabold tracking-tightest text-ink dark:text-gray-50 sm:text-[28px]" style={{ textWrap: 'balance' } as React.CSSProperties}>{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate">{subtitle}</p>}
      </div>
      {action}
    </header>
  );
}

/** A titled content block (uppercase section label + body). */
export function Section({ title, children, className = '' }: { title?: string; children: ReactNode; className?: string }) {
  return (
    <section className={`space-y-3 ${className}`}>
      {title && <h2 className="text-xs font-semibold uppercase tracking-wider text-slate">{title}</h2>}
      {children}
    </section>
  );
}

/** Uniform labelled field. */
export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-ink dark:text-gray-200">{label}</span>
      {children}
      {hint && <span className="mt-1.5 block text-xs text-slate">{hint}</span>}
    </label>
  );
}

export const inputCls =
  'w-full rounded-base border border-line bg-white px-3.5 py-2.5 text-ink transition-colors placeholder:text-slate/60 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100';

/**
 * Booking progress stepper — shows where the job is in its lifecycle. Cancelled /
 * rejected collapse to a single terminal state. `labels` passed in step order (i18n).
 */
const BOOKING_FLOW = ['requested', 'matched', 'accepted', 'in_progress', 'completed'] as const;
export function BookingProgress({ status, labels }: { status: string; labels: string[] }) {
  if (status === 'cancelled' || status === 'rejected') {
    return (
      <div className="rounded-base bg-surface px-3 py-2 text-sm text-slate dark:bg-gray-800">
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
          <li key={step} className="flex flex-1 flex-col items-center gap-1.5">
            <div className="flex w-full items-center">
              {i > 0 && <span className={`h-0.5 flex-1 ${i <= activeIdx ? 'bg-primary' : 'bg-line dark:bg-gray-700'}`} />}
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold transition-colors ${
                  done ? 'bg-primary text-white' : active ? 'bg-primary text-white ring-4 ring-primary/15' : 'bg-line text-slate dark:bg-gray-700'
                }`}
              >
                {done ? '✓' : i + 1}
              </span>
              {i < BOOKING_FLOW.length - 1 && <span className={`h-0.5 flex-1 ${i < activeIdx ? 'bg-primary' : 'bg-line dark:bg-gray-700'}`} />}
            </div>
            <span className={`text-center text-[10px] font-medium leading-tight ${active ? 'font-bold text-primary' : 'text-slate'}`}>
              {labels[i]}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
