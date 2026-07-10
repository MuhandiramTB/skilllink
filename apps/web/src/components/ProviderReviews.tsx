'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { reviewsApi, type ProviderReview } from '@/lib/reviews-api';
import { Card, Button, EmptyState, Spinner } from '@/components/ui';

/**
 * Reviews the provider has received, with an inline reply box (spec: reputation
 * management). Replying hits POST /reviews/:id/response. Shown on the provider
 * dashboard. `providerId` = the provider's own user id.
 */
export default function ProviderReviews({ providerId }: { providerId: string }) {
  const t = useTranslations('dash');
  const [reviews, setReviews] = useState<ProviderReview[] | null>(null);
  const [replyFor, setReplyFor] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    reviewsApi.listForProvider(providerId).then(setReviews).catch(() => setReviews([]));
  }, [providerId]);

  async function submit(reviewId: string) {
    if (!text.trim() || busy) return;
    setBusy(true);
    try {
      await reviewsApi.respond(reviewId, text.trim());
      // Reflect the reply locally so it shows immediately.
      setReviews((prev) => (prev ?? []).map((r) => (r.id === reviewId ? { ...r, provider_response: text.trim() } : r)));
      setReplyFor(null); setText('');
    } catch { /* surfaced by the shared error banner elsewhere; keep the box open */ }
    finally { setBusy(false); }
  }

  return (
    <section>
      <h2 className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-slate">{t('reviewsTitle')}</h2>
      {reviews === null ? (
        <Spinner inline label={t('loading')} />
      ) : reviews.length === 0 ? (
        <EmptyState>{t('noReviewsYet')}</EmptyState>
      ) : (
        <ul className="space-y-2.5">
          {reviews.map((r) => (
            <li key={r.id}>
              <Card>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-warn" aria-label={`${r.rating} / 5`}>{'★'.repeat(r.rating)}<span className="text-line dark:text-gray-700">{'★'.repeat(5 - r.rating)}</span></span>
                  <span className="text-xs tabular-nums text-slate-2">{new Date(r.created_at).toLocaleDateString()}</span>
                </div>
                {r.comment && <p className="mt-2 text-sm text-ink dark:text-gray-100">{r.comment}</p>}

                {r.provider_response ? (
                  <div className="mt-2.5 rounded-base bg-surface px-3 py-2 dark:bg-gray-800/60">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-2">{t('providerReplyLabel')}</p>
                    <p className="mt-0.5 text-sm text-slate">{r.provider_response}</p>
                  </div>
                ) : replyFor === r.id ? (
                  <div className="mt-2.5 space-y-2">
                    <textarea
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      rows={2}
                      placeholder={t('replyPlaceholder')}
                      className="w-full rounded-base border border-line bg-white px-3 py-2 text-sm text-ink placeholder:text-slate/60 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                    />
                    <div className="flex gap-2">
                      <Button disabled={busy || !text.trim()} onClick={() => submit(r.id)} className="px-4 py-1.5 text-xs">{busy ? t('saving') : t('replySubmit')}</Button>
                      <Button variant="ghost" onClick={() => { setReplyFor(null); setText(''); }} className="px-4 py-1.5 text-xs">{t('cancel')}</Button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => { setReplyFor(r.id); setText(''); }}
                    className="mt-2 text-xs font-semibold text-primary hover:underline"
                  >
                    {t('replyToReview')}
                  </button>
                )}
              </Card>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
