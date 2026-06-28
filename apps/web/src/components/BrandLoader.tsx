'use client';

import { useEffect, useState } from 'react';

/**
 * Branded full-screen loader for the landing gate. Instead of a generic spinner it
 * cycles through the trade icons SkillLink connects people with (electrician,
 * plumber, AC, solar, painter, carpenter) inside a pulsing ring, on the ink ground.
 * Self-contained: inline SVG, no external images/CDN.
 */
const TRADES: { label: string; d: string }[] = [
  { label: 'Electrician', d: 'M13 2L3 14h7l-1 8 10-12h-7z' },
  { label: 'Plumber', d: 'M9 3v6a3 3 0 003 3 3 3 0 003-3V3M7 21h10M12 12v9' },
  { label: 'AC technician', d: 'M3 7h18M3 12h18M3 17h18' },
  { label: 'Solar technician', d: 'M4 14h16l-2-9H6zM2 18h20M9 5v9M15 5v9' },
  { label: 'Painter', d: 'M5 3h14v6H5zM9 9v3a3 3 0 003 3v6' },
  { label: 'Carpenter', d: 'M2 20l6-6M14 4l6 6-9 9-6-6z' },
];

export function BrandLoader({ label }: { label?: string }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI((n) => (n + 1) % TRADES.length), 900);
    return () => clearInterval(id);
  }, []);
  const trade = TRADES[i];

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-ink text-white" role="status" aria-live="polite">
      {/* dot-grid texture echoes the hero */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '22px 22px' }}
        aria-hidden="true"
      />
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/20 blur-3xl" aria-hidden="true" />

      <div className="relative flex flex-col items-center gap-5">
        {/* Pulsing ring + cycling trade icon */}
        <span className="relative flex h-20 w-20 items-center justify-center" aria-hidden="true">
          <span className="absolute inset-0 rounded-2xl border border-white/10" />
          <span className="absolute inset-0 animate-spin rounded-2xl border-2 border-transparent border-t-primary" style={{ animationDuration: '1.4s' }} />
          <span className="absolute inset-2 rounded-xl bg-primary/15" />
          {/* key on i so each icon fades/scales in */}
          <svg
            key={i}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="relative h-9 w-9 text-white motion-safe:animate-[fadeScale_0.9s_ease]"
          >
            <path d={trade.d} />
          </svg>
        </span>

        <div className="text-center">
          <p className="font-display text-lg font-extrabold tracking-tightest">SkillLink</p>
          <p className="mt-1 text-sm text-white/60">{label ?? `Finding ${trade.label.toLowerCase()}s near you…`}</p>
        </div>

        {/* progress dots reflect the cycle position */}
        <div className="flex gap-1.5">
          {TRADES.map((_, n) => (
            <span key={n} className={`h-1.5 rounded-full transition-all duration-300 ${n === i ? 'w-5 bg-primary' : 'w-1.5 bg-white/20'}`} />
          ))}
        </div>
      </div>

      {/* local keyframes (scoped via styled-jsx) */}
      <style jsx>{`
        @keyframes fadeScale {
          0% { opacity: 0; transform: scale(0.8); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
