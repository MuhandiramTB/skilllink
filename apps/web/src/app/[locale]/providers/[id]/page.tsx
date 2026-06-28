'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { publicProviderApi, favouritesApi, type PublicProvider } from '@/lib/favourites-api';
import { getToken } from '@/lib/session';
import { Button, Card, Spinner, ErrorBanner, EmptyState, PageHeader } from '@/components/ui';

/** Public provider profile (spec 12/14): work-photos gallery, rating, verified, favourite. */
export default function ProviderProfilePage() {
  const p = useParams();
  const id = p.id as string;
  const locale = (p.locale as string) ?? 'en';
  const t = useTranslations('dash');
  const [provider, setProvider] = useState<PublicProvider | null>(null);
  const [err, setErr] = useState('');
  const [fav, setFav] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);

  useEffect(() => {
    publicProviderApi.profile(id).then(setProvider).catch((e) => setErr((e as Error).message));
    if (getToken()) favouritesApi.ids().then((ids) => setFav(ids.includes(id))).catch(() => {});
  }, [id]);

  async function toggleFav() {
    if (!getToken()) { window.location.href = `/${locale}/login?next=/${locale}/providers/${id}`; return; }
    setFav((v) => !v); // optimistic
    try { const { favourited } = await favouritesApi.toggle(id); setFav(favourited); } catch (e) { setErr((e as Error).message); }
  }

  if (err && !provider) return <div className="mx-auto max-w-2xl"><ErrorBanner message={err} /></div>;
  if (!provider) return <Spinner />;

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <a href={`/${locale}/dashboard/customer`} className="inline-flex items-center gap-1 text-sm text-primary hover:underline">{t('backToMyBookings')}</a>

      <PageHeader
        title={provider.businessName ?? t('service')}
        subtitle={`★ ${provider.ratingAvg.toFixed(1)}${provider.ratingCount > 0 ? ` · ${t('photosCount', { count: provider.ratingCount })}` : ''}`}
        action={
          <button
            type="button"
            onClick={toggleFav}
            aria-pressed={fav}
            aria-label={fav ? t('removeFavourite') : t('addFavourite')}
            className="text-2xl transition hover:scale-110"
            title={fav ? t('removeFavourite') : t('addFavourite')}
          >
            {fav ? '❤️' : '🤍'}
          </button>
        }
      />

      {provider.verified && (
        <div className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-success">
          ✓ {t('verifiedProvider')}
        </div>
      )}

      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{t('workPhotos')}</h2>
        {provider.photos.length === 0 ? (
          <EmptyState>{t('noWorkPhotosPublic')}</EmptyState>
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {provider.photos.map((ph) => (
              <button
                key={ph.id}
                type="button"
                onClick={() => setLightbox(ph.url)}
                className="aspect-square overflow-hidden rounded-base border border-gray-200 transition hover:opacity-90 dark:border-gray-700"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={ph.url} alt={ph.caption ?? t('workPhotos')} className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </section>

      <a href={`/${locale}/book`}>
        <Button className="w-full">{t('bookAgain')}</Button>
      </a>

      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setLightbox(null)}
          role="dialog"
          aria-modal="true"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={lightbox} alt="" className="max-h-full max-w-full rounded-base" />
        </div>
      )}
    </div>
  );
}
