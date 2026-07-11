'use client';

import { useParams } from 'next/navigation';

/**
 * Catch-all for any unmatched path under a locale (e.g. /en/typo). Renders the
 * branded not-found UI directly inside the app shell. (In the App Router with a
 * dynamic [locale] segment + next-intl middleware, notFound() bubbles to the root
 * default 404 rather than [locale]/not-found.tsx, so we render the branded body
 * here for a consistent, on-brand experience. Real routes take priority.)
 */
export default function CatchAll() {
  const locale = (useParams().locale as string) ?? 'en';
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <span className="font-display text-6xl font-extrabold tracking-tightest text-primary/25">404</span>
      <h1 className="mt-2 font-display text-2xl font-extrabold tracking-tightest text-ink dark:text-gray-50">Page not found</h1>
      <p className="mt-2 max-w-sm text-sm text-slate">The page you’re looking for doesn’t exist or may have moved.</p>
      <a href={`/${locale}`} className="mt-6 rounded-base bg-primary px-5 py-2.5 text-sm font-bold text-white transition hover:bg-primary-600 active:translate-y-px">
        Back to SkillLink
      </a>
    </div>
  );
}
