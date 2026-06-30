'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

/**
 * Full-screen branded loading splash (design ported from Google Stitch).
 * Deep-navy ground, a gradient progress ring spinning around the SkillLink mark,
 * cycling status messages, and a thin progress bar. Self-contained: no CDN fonts
 * (uses the app's Plus Jakarta Sans), inline SVG, scoped keyframes.
 */
const MESSAGES = [
  'Finding verified pros near you…',
  'Scanning your local area…',
  'Matching service specialists…',
  'Securing professional credentials…',
  'Optimizing for fast response…',
];

export function BrandLoader() {
  const [msgIndex, setMsgIndex] = useState(0);
  const [fading, setFading] = useState(false);
  const [progress, setProgress] = useState(8);
  const [mounted, setMounted] = useState(false);

  // Portal target only exists after mount (SSR has no document).
  useEffect(() => { setMounted(true); }, []);

  // Cycle status messages with a quick fade between them.
  useEffect(() => {
    const id = setInterval(() => {
      setFading(true);
      setTimeout(() => {
        setMsgIndex((n) => (n + 1) % MESSAGES.length);
        setFading(false);
      }, 500);
    }, 1400);
    return () => clearInterval(id);
  }, []);

  // Fake-progress easing toward (not reaching) 95%.
  useEffect(() => {
    const id = setInterval(() => {
      setProgress((p) => (p >= 95 ? 95 : Math.min(95, p + Math.random() * 18)));
    }, 700);
    return () => clearInterval(id);
  }, []);

  if (!mounted) return null;

  // Portal to <body> so the splash escapes the app shell (header backdrop-blur +
  // column layout would otherwise trap `fixed` and box it into the content area).
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-[#020617] font-body text-white">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#2170e4]/20 blur-3xl" aria-hidden="true" />

      <main className="relative z-10 flex flex-col items-center justify-center px-6" role="status" aria-live="polite">
        {/* Animated ring + brand mark */}
        <div className="relative mb-8 flex h-44 w-44 items-center justify-center sm:h-48 sm:w-48">
          <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 100 100" aria-hidden="true">
            <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="2" />
            <circle
              className="bl-ring motion-reduce:animate-none"
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="url(#bl-grad)"
              strokeLinecap="round"
              strokeWidth="4"
            />
            <defs>
              <linearGradient id="bl-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#2170e4" />
                <stop offset="100%" stopColor="#adc6ff" />
              </linearGradient>
            </defs>
          </svg>

          <div className="bl-glow flex flex-col items-center justify-center">
            {/* Tools/engineering glyph — clean wrench, reads clearly at this size. */}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-2 h-11 w-11 text-white" aria-hidden="true">
              <path d="M14.7 6.3a4 4 0 00-5.4 5.4L3 18v3h3l6.3-6.3a4 4 0 005.4-5.4l-2.5 2.5-2.4-.6-.6-2.4 2.5-2.5z" />
            </svg>
            <span className="font-display text-2xl font-extrabold tracking-tight text-white">SkillLink</span>
          </div>
        </div>

        {/* Status message + progress bar */}
        <div className="bl-fade-in flex flex-col items-center gap-1">
          <p className={`text-sm font-semibold tracking-wide text-[#b7c8e1] transition-opacity duration-500 ${fading ? 'opacity-0' : 'opacity-80'}`}>
            {MESSAGES[msgIndex]}
          </p>
          <div className="mt-5 h-0.5 w-32 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-[#2170e4] transition-all duration-700 ease-out" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </main>

      {/* Footer identity */}
      <div className="absolute bottom-10 w-full px-4 text-center">
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/40">
          Trusted network · Verified professionals
        </p>
      </div>

      <style jsx>{`
        .bl-ring {
          stroke-dasharray: 280;
          transform-origin: 50% 50%;
          animation: bl-ring-rotate 2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
        @keyframes bl-ring-rotate {
          0% { transform: rotate(0deg); stroke-dashoffset: 280; }
          50% { transform: rotate(180deg); stroke-dashoffset: 70; }
          100% { transform: rotate(360deg); stroke-dashoffset: 280; }
        }
        .bl-glow { filter: drop-shadow(0 0 15px rgba(33, 112, 228, 0.4)); }
        .bl-fade-in { animation: bl-fade-up 1s ease-out forwards; }
        @keyframes bl-fade-up {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .bl-ring { animation: none; }
        }
      `}</style>
    </div>,
    document.body,
  );
}
