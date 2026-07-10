'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { haptic } from '@/lib/haptics';

/**
 * A peak-moment overlay — a full-screen celebratory beat for the app's happiest
 * events (booking confirmed, job done). Canvas confetti (no dependency, GPU-cheap)
 * + a haptic burst + a headline. Auto-dismisses; tap to dismiss early. The kind of
 * moment that makes an app feel delightful rather than transactional.
 */
export function CelebrationOverlay({
  open,
  title,
  sub,
  icon,
  onClose,
}: {
  open: boolean;
  title: string;
  sub?: ReactNode;
  icon?: ReactNode;
  onClose: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!open) return;
    haptic.celebrate();
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const auto = setTimeout(onClose, 2600);

    const canvas = canvasRef.current;
    if (!canvas || reduce) return () => clearTimeout(auto);
    const ctx = canvas.getContext('2d');
    if (!ctx) return () => clearTimeout(auto);
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const colors = ['#4F46E5', '#16A34A', '#F5A623', '#EC4899', '#38BDF8'];
    // Confetti launched from the centre-top, falling with gravity + spin.
    const pieces = Array.from({ length: 90 }, () => ({
      x: canvas.width / 2 + (Math.random() - 0.5) * 120,
      y: canvas.height * 0.32,
      vx: (Math.random() - 0.5) * 9,
      vy: Math.random() * -9 - 4,
      g: 0.28 + Math.random() * 0.12,
      size: 5 + Math.random() * 6,
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.3,
      color: colors[(Math.random() * colors.length) | 0],
    }));
    let raf = 0;
    const start = performance.now();
    const tick = (t: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of pieces) {
        p.vy += p.g; p.x += p.vx; p.y += p.vy; p.rot += p.vr;
        ctx.save();
        ctx.translate(p.x, p.y); ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        ctx.restore();
      }
      if (t - start < 2600) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { clearTimeout(auto); cancelAnimationFrame(raf); };
  }, [open, onClose]);

  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-6" role="alert" aria-live="assertive" onClick={onClose}>
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" aria-hidden="true" />
      <canvas ref={canvasRef} className="pointer-events-none absolute inset-0" aria-hidden="true" />
      <div className="sl-pop relative z-10 w-full max-w-xs rounded-xl2 border border-line bg-white p-7 text-center shadow-lift dark:border-gray-800 dark:bg-gray-900">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/12 text-success [&>svg]:h-8 [&>svg]:w-8" aria-hidden="true">
          {icon ?? (
            <svg viewBox="0 0 16 16" fill="currentColor"><path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0m-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z" /></svg>
          )}
        </span>
        <h2 className="mt-4 font-display text-xl font-extrabold tracking-tightest text-ink dark:text-gray-50">{title}</h2>
        {sub && <p className="mt-1.5 text-sm text-slate">{sub}</p>}
      </div>
    </div>,
    document.body,
  );
}
