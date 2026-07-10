'use client';

import { useParams } from 'next/navigation';

/**
 * Branded 404 within the app shell. Client component so it can resolve the active
 * locale and keep the "back" link locale-correct (the rest of the app routes with
 * /{locale} hrefs; a bare "/" could drop the user's language).
 */
export default function NotFound() {
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
