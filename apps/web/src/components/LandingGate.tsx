'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getSession, homeForMode } from '@/lib/session';

/**
 * Public-landing gate. The marketing landing page is for signed-OUT visitors only.
 * If a session exists, redirect to that user's dashboard (by active mode) and render
 * nothing in the meantime, so the hero / "Get started" / provider marketing never
 * flashes for someone who's already signed in.
 */
export function LandingGate({ children }: { children: React.ReactNode }) {
  const locale = (useParams().locale as string) ?? 'en';
  // null = still checking; true = signed out (show landing); false = redirecting.
  const [showLanding, setShowLanding] = useState<boolean | null>(null);

  useEffect(() => {
    const s = getSession();
    if (s) {
      window.location.replace(homeForMode(locale, s.mode));
      setShowLanding(false);
    } else {
      setShowLanding(true);
    }
  }, [locale]);

  // While checking or redirecting, render nothing (no public-content flash).
  if (showLanding !== true) return null;
  return <>{children}</>;
}
