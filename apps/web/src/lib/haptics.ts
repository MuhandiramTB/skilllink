'use client';

/**
 * Haptic feedback — the tactile layer that makes an app feel native. Uses the
 * Vibration API (Android/Chrome; iOS Safari ignores it, degrades silently). Call
 * on confirmations, successes, and errors. Respects reduced-motion.
 */
function canVibrate(): boolean {
  if (typeof navigator === 'undefined' || !('vibrate' in navigator)) return false;
  try {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return false;
  } catch { /* no-op */ }
  return true;
}

export const haptic = {
  /** A light tap — button presses, selections. */
  tap() { if (canVibrate()) navigator.vibrate(10); },
  /** A confirming double-pulse — action succeeded (booked, sent, saved). */
  success() { if (canVibrate()) navigator.vibrate([15, 40, 15]); },
  /** A warning buzz — errors, destructive confirms. */
  warn() { if (canVibrate()) navigator.vibrate([40, 30, 40]); },
  /** A celebratory pattern — peak moments (booking confirmed, job done). */
  celebrate() { if (canVibrate()) navigator.vibrate([12, 25, 12, 25, 40]); },
};
