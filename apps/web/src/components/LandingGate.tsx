'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getSession, homeForMode } from '@/lib/session';
import { BrandLoader } from './BrandLoader';

/**
 * Public-landing gate. The marketing landing page is for signed-OUT visitors only.
 *  - Signed-in visitor → redirect to their dashboard immediately (no splash; they're
 *    just passing through).
 *  - Signed-out visitor → play the 3-second branded trade-loader splash, then reveal
 *    the landing. Scoped to the landing page only, so daily app pages aren't slowed.
 */
const SPLASH_MS = 3000;

export function LandingGate({ children }: { children: React.ReactNode }) {
  const locale = (useParams().locale as string) ?? 'en';
  // 'checking' → 'splash' (signed out, playing intro) → 'landing'; or 'redirecting'.
  const [phase, setPhase] = useState<'checking' | 'splash' | 'landing' | 'redirecting'>('checking');

  useEffect(() => {
    const s = getSession();
    if (s) {
      window.location.replace(homeForMode(locale, s.mode));
      setPhase('redirecting');
      return;
    }
    setPhase('splash');
    const id = setTimeout(() => setPhase('landing'), SPLASH_MS);
    return () => clearTimeout(id);
  }, [locale]);

  if (phase === 'landing') {
    // Gentle fade-in so the reveal after the splash feels intentional, not abrupt.
    return <div className="motion-safe:animate-[gateFade_0.5s_ease]">{children}</div>;
  }
  // checking / splash / redirecting → branded loader.
  return <BrandLoader />;
}
