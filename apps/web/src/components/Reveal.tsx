'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

/**
 * Reveals children with a subtle rise+fade when they scroll into view (once).
 * Respects prefers-reduced-motion (shows immediately, no animation). `delay` in ms
 * lets siblings stagger.
 */
export function Reveal({ children, delay = 0, className = '' }: { children: ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce) { setShown(true); return; }
    const io = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setShown(true); io.disconnect(); } },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`${shown ? 'sl-reveal' : 'opacity-0'} ${className}`}
      style={shown ? ({ '--sl-delay': `${delay}ms` } as React.CSSProperties) : undefined}
    >
      {children}
    </div>
  );
}
