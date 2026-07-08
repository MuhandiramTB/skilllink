'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

/**
 * Data-viz + motion primitives — "Modern SaaS / clean". Lightweight inline SVG
 * (no chart library, no dependency), theme-aware via currentColor / CSS tokens,
 * and reduced-motion-safe. These carry the "next-level" insight layer: KPI
 * sparklines, an earnings area chart, a rating histogram, animated counters.
 */

/* ------------------------------------------------------------------ *
 * PageShell — page-level width control now that the app shell is full-bleed.
 * `wide`   = dashboards/tables (fills the canvas up to the shell's max).
 * `narrow` = forms / detail / reading views (centered, comfortable measure).
 * ------------------------------------------------------------------ */
export function PageShell({
  width = 'wide',
  className = '',
  children,
}: {
  width?: 'wide' | 'narrow';
  className?: string;
  children: ReactNode;
}) {
  const w = width === 'narrow' ? 'mx-auto w-full max-w-2xl' : 'w-full';
  return <div className={`${w} ${className}`}>{children}</div>;
}

/* ------------------------------------------------------------------ *
 * useReducedMotion — one hook, shared by every animated primitive.
 * ------------------------------------------------------------------ */
function useReducedMotion() {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    const m = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!m) return;
    setReduce(m.matches);
    const on = () => setReduce(m.matches);
    m.addEventListener?.('change', on);
    return () => m.removeEventListener?.('change', on);
  }, []);
  return reduce;
}

/* ------------------------------------------------------------------ *
 * CountUp — animates a number from 0 to `value` on first mount. Used on KPIs.
 * `format` lets callers render currency/decimals; `duration` in ms.
 * ------------------------------------------------------------------ */
export function CountUp({
  value,
  duration = 900,
  decimals = 0,
  prefix = '',
  suffix = '',
  format,
}: {
  value: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  format?: (n: number) => string;
}) {
  const reduce = useReducedMotion();
  const [n, setN] = useState(reduce ? value : 0);
  const raf = useRef<number>();

  useEffect(() => {
    if (reduce) { setN(value); return; }
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      // easeOutCubic — fast then settle.
      const eased = 1 - Math.pow(1 - p, 3);
      setN(value * eased);
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [value, duration, reduce]);

  const text = format
    ? format(n)
    : n.toLocaleString('en-LK', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  return <span className="tabular-nums">{prefix}{text}{suffix}</span>;
}

/* ------------------------------------------------------------------ *
 * Delta — a trend chip (▲/▼ + magnitude), tone-colored. Semantic, not accent.
 * ------------------------------------------------------------------ */
export function Delta({ value, suffix = '%', invert = false }: { value: number; suffix?: string; invert?: boolean }) {
  const up = value >= 0;
  const good = invert ? !up : up; // for metrics where "down is good" (e.g. response time)
  const cls = good
    ? 'text-success bg-success/10'
    : 'text-danger bg-danger/10';
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums ${cls}`}>
      <span aria-hidden="true">{up ? '▲' : '▼'}</span>{Math.abs(value)}{suffix}
    </span>
  );
}

/* ------------------------------------------------------------------ *
 * Sparkline — a tiny trend line for KPI cards. `data` is a number[]; the line
 * auto-scales. `tone` sets the stroke via a token color.
 * ------------------------------------------------------------------ */
export function Sparkline({
  data,
  width = 64,
  height = 24,
  tone = 'primary',
  className = '',
}: {
  data: number[];
  width?: number;
  height?: number;
  tone?: 'primary' | 'success' | 'warn' | 'danger';
  className?: string;
}) {
  if (data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const pad = 2;
  const pts = data
    .map((d, i) => {
      const x = (i / (data.length - 1)) * (width - pad * 2) + pad;
      const y = height - pad - ((d - min) / span) * (height - pad * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
  const stroke: Record<string, string> = {
    primary: 'stroke-primary', success: 'stroke-success', warn: 'stroke-warn', danger: 'stroke-danger',
  };
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} fill="none" className={className} aria-hidden="true">
      <polyline points={pts} className={stroke[tone]} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ------------------------------------------------------------------ *
 * AreaChart — the earnings/trend hero. One primary series (area + line) with an
 * optional faint comparison series. Draws in on mount, has a soft grid and an
 * emphasized endpoint. Responsive: scales to its container width.
 * ------------------------------------------------------------------ */
export function AreaChart({
  data,
  compare,
  labels,
  height = 200,
  ariaLabel = 'Trend chart',
}: {
  data: number[];
  compare?: number[];
  labels?: string[];
  height?: number;
  ariaLabel?: string;
}) {
  const reduce = useReducedMotion();
  const [drawn, setDrawn] = useState(reduce);
  const W = 640;
  const H = height;
  const pad = 8;

  useEffect(() => {
    if (reduce) { setDrawn(true); return; }
    const id = requestAnimationFrame(() => setDrawn(true));
    return () => cancelAnimationFrame(id);
  }, [reduce]);

  const all = compare ? [...data, ...compare] : data;
  const max = Math.max(...all, 1);
  const min = Math.min(...all, 0);
  const span = max - min || 1;
  const xy = (arr: number[]) =>
    arr.map((d, i) => {
      const x = (i / (arr.length - 1)) * (W - pad * 2) + pad;
      const y = H - pad - ((d - min) / span) * (H - pad * 2);
      return [x, y] as const;
    });

  const line = (arr: number[]) => xy(arr).map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const areaPath = (() => {
    const p = xy(data);
    const top = p.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' L');
    const first = p[0], last = p[p.length - 1];
    return `M${top} L${last[0].toFixed(1)},${H} L${first[0].toFixed(1)},${H} Z`;
  })();
  const end = xy(data)[data.length - 1];

  const gridY = [0.25, 0.5, 0.75, 1].map((f) => pad + f * (H - pad * 2));

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="none" role="img" aria-label={ariaLabel}>
        <defs>
          <linearGradient id="sl-area-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.24" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* grid */}
        <g className="stroke-line" strokeWidth="1">
          {gridY.map((y, i) => <line key={i} x1="0" y1={y} x2={W} y2={y} />)}
        </g>
        {/* comparison series (faint, dashed) */}
        {compare && (
          <polyline points={line(compare)} fill="none" className="stroke-slate-2" strokeWidth="2" strokeDasharray="4 5" strokeOpacity="0.55" />
        )}
        {/* primary area + line — text-primary drives currentColor */}
        <g className="text-primary">
          <path d={areaPath} fill="url(#sl-area-fill)" style={{ opacity: drawn ? 1 : 0, transition: 'opacity .6s ease-out .2s' }} />
          <polyline
            points={line(data)}
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            pathLength={1}
            style={reduce ? undefined : { strokeDasharray: 1, strokeDashoffset: drawn ? 0 : 1, transition: 'stroke-dashoffset 1s ease-out' }}
          />
          <circle cx={end[0]} cy={end[1]} r="9" fill="currentColor" opacity="0.16" style={{ opacity: drawn ? 0.16 : 0, transition: 'opacity .4s ease-out .8s' }} />
          <circle cx={end[0]} cy={end[1]} r="4.5" fill="currentColor" style={{ opacity: drawn ? 1 : 0, transition: 'opacity .4s ease-out .8s' }} />
        </g>
      </svg>
      {labels && (
        <div className="mt-1.5 flex justify-between px-1 text-[10.5px] font-semibold text-slate-2">
          {labels.map((l) => <span key={l}>{l}</span>)}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * RatingBars — a 5→1 star histogram. `counts` indexed [5★,4★,3★,2★,1★].
 * Bars grow in on mount.
 * ------------------------------------------------------------------ */
export function RatingBars({ counts }: { counts: [number, number, number, number, number] }) {
  const reduce = useReducedMotion();
  const [grown, setGrown] = useState(reduce);
  useEffect(() => {
    if (reduce) { setGrown(true); return; }
    const id = requestAnimationFrame(() => setGrown(true));
    return () => cancelAnimationFrame(id);
  }, [reduce]);
  const total = counts.reduce((a, b) => a + b, 0) || 1;
  return (
    <div className="space-y-2">
      {counts.map((c, i) => {
        const star = 5 - i;
        const pct = Math.round((c / total) * 100);
        return (
          <div key={star} className="flex items-center gap-2.5">
            <span className="w-8 text-xs tabular-nums text-slate">{star} ★</span>
            <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-line dark:bg-gray-800">
              <span
                className="block h-full rounded-full bg-primary"
                style={{ width: grown ? `${pct}%` : '0%', transition: `width .8s cubic-bezier(.16,1,.3,1) ${i * 80}ms` }}
              />
            </span>
            <span className="w-9 text-right text-xs tabular-nums text-slate">{pct}%</span>
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * KpiCard — the KPI building block: icon tile, animated value, label, an
 * optional delta chip and sparkline. Lifts on hover. Responsive by grid.
 * ------------------------------------------------------------------ */
export function KpiCard({
  icon,
  label,
  value,
  delta,
  spark,
  tone = 'primary',
}: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  delta?: { value: number; suffix?: string; invert?: boolean };
  spark?: { data: number[]; tone?: 'primary' | 'success' | 'warn' | 'danger' };
  tone?: 'primary' | 'success' | 'warn' | 'danger' | 'sky';
}) {
  const tile: Record<string, string> = {
    primary: 'bg-primary-soft text-primary dark:bg-primary/15',
    success: 'bg-success/10 text-success',
    warn: 'bg-warn/10 text-warn',
    danger: 'bg-danger/10 text-danger',
    sky: 'bg-sky-100 text-sky-600 dark:bg-sky-500/15 dark:text-sky-400',
  };
  return (
    <div className="group relative overflow-hidden rounded-xl2 border border-line bg-white p-4 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-start justify-between gap-2">
        <span className={`flex h-9 w-9 items-center justify-center rounded-lg [&>svg]:h-[18px] [&>svg]:w-[18px] ${tile[tone]}`} aria-hidden="true">{icon}</span>
        {delta && <Delta value={delta.value} suffix={delta.suffix} invert={delta.invert} />}
      </div>
      <div className="mt-3.5 font-display text-2xl font-extrabold leading-none tracking-tightest text-ink dark:text-gray-50 sm:text-[26px]">{value}</div>
      <div className="mt-1.5 text-[11.5px] font-semibold text-slate">{label}</div>
      {spark && (
        <div className="pointer-events-none absolute bottom-3 right-3 opacity-90">
          <Sparkline data={spark.data} tone={spark.tone ?? (tone === 'sky' ? 'primary' : tone as 'primary')} />
        </div>
      )}
    </div>
  );
}
