import { notFound } from 'next/navigation';

/**
 * Catch-all for any unmatched path under a locale (e.g. /en/typo). Without this,
 * Next serves its bare default 404 instead of our branded [locale]/not-found.tsx.
 * Calling notFound() renders the branded page inside the app shell.
 */
export default function CatchAll() {
  notFound();
}
