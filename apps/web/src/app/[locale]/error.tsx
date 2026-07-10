'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';

/**
 * Locale-scoped error boundary. Catches render/runtime errors in any page under
 * [locale] and shows a branded, recoverable screen instead of a white page.
 */
export default function LocaleError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const locale = (useParams().locale as string) ?? 'en';
  useEffect(() => { console.error(error); }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <span className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-danger/10 text-danger" aria-hidden="true">
        <svg viewBox="0 0 16 16" fill="currentColor" className="h-8 w-8"><path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5m.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2" /></svg>
      </span>
      <h1 className="font-display text-2xl font-extrabold tracking-tightest text-ink dark:text-gray-50">Something went wrong</h1>
      <p className="mt-2 max-w-sm text-sm text-slate">An unexpected error interrupted this page. You can try again, or head back home.</p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        <button onClick={reset} className="rounded-base bg-primary px-5 py-2.5 text-sm font-bold text-white transition hover:bg-primary-600 active:translate-y-px">
          Try again
        </button>
        <a href={`/${locale}`} className="rounded-base border border-line bg-white px-5 py-2.5 text-sm font-semibold text-ink transition hover:border-ink dark:border-gray-700 dark:bg-transparent dark:text-gray-100">
          Go home
        </a>
      </div>
      {error.digest && <p className="mt-6 font-mono text-[11px] text-slate-2">Ref: {error.digest}</p>}
    </div>
  );
}
