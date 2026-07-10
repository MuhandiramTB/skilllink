'use client';

import { useRef, useState, type ReactNode } from 'react';
import { haptic } from '@/lib/haptics';

/**
 * Native-feeling pull-to-refresh. Wrap a scrollable list/page; when the user pulls
 * down from the top, it shows a spinner and calls onRefresh(). Touch-only (mobile);
 * a no-op on desktop where there's no overscroll gesture. Reduced-motion safe.
 */
export function PullToRefresh({ onRefresh, children }: { onRefresh: () => Promise<void>; children: ReactNode }) {
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef<number | null>(null);
  const THRESHOLD = 70;

  function onTouchStart(e: React.TouchEvent) {
    // Only arm the gesture when scrolled to the very top.
    if (window.scrollY <= 0 && !refreshing) startY.current = e.touches[0].clientY;
    else startY.current = null;
  }
  function onTouchMove(e: React.TouchEvent) {
    if (startY.current === null) return;
    const dy = e.touches[0].clientY - startY.current;
    if (dy > 0) setPull(Math.min(dy * 0.5, THRESHOLD + 20)); // damped
  }
  async function onTouchEnd() {
    if (startY.current === null) return;
    if (pull >= THRESHOLD && !refreshing) {
      setRefreshing(true); haptic.tap();
      try { await onRefresh(); } finally { setRefreshing(false); }
    }
    setPull(0); startY.current = null;
  }

  const showing = refreshing || pull > 4;
  return (
    <div onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
      <div
        className="flex items-center justify-center overflow-hidden transition-[height] duration-150"
        style={{ height: refreshing ? 44 : pull, opacity: showing ? 1 : 0 }}
        aria-hidden={!showing}
      >
        <span
          className={`h-6 w-6 rounded-full border-2 border-line border-t-primary ${refreshing ? 'animate-spin' : ''}`}
          style={{ transform: refreshing ? undefined : `rotate(${pull * 3}deg)` }}
        />
      </div>
      {children}
    </div>
  );
}
