'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { providerApi, type WorkPhoto } from '@/lib/provider-api';
import { fileToDataUrl, ImageError } from '@/lib/image';
import { Button, Card, Spinner, EmptyState, ErrorBanner } from '@/components/ui';

const MAX_PHOTOS = 12;

/**
 * Provider work-photos portfolio manager (spec 12). Upload validated images
 * (JPEG/PNG/WebP, ≤5 MB, downscaled via lib/image.ts) + delete. These photos
 * show to customers on the public profile + match card — the #1 trust signal.
 */
export default function WorkPhotosManager() {
  const t = useTranslations('dash');
  const [photos, setPhotos] = useState<WorkPhoto[] | null>(null);
  const [err, setErr] = useState('');
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null); // optimistic thumbnail while uploading
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    providerApi.listPhotos().then(setPhotos).catch((e) => setErr((e as Error).message));
  }, []);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-picking the same file
    if (!file) return;
    setErr('');
    setUploading(true);
    try {
      // Downscale + validate on the client, then show the result instantly while
      // it persists — the provider sees their photo appear with no perceived wait.
      const dataUrl = await fileToDataUrl(file, 1200); // keep work photos sharp
      setPreview(dataUrl);
      const created = await providerApi.addPhoto(dataUrl);
      setPhotos((prev) => [created, ...(prev ?? [])]);
    } catch (e) {
      // Specific, actionable messages: ImageError already carries a user-facing
      // reason (type/size); a rejected large payload surfaces as a clear hint
      // rather than a raw status string.
      if (e instanceof ImageError) {
        setErr(e.message);
      } else {
        const msg = (e as Error).message ?? '';
        setErr(/413|payload|large|entity too/i.test(msg) ? t('uploadTooLargeServer') : t('uploadFailed'));
      }
    } finally {
      setUploading(false);
      setPreview(null);
    }
  }

  async function remove(id: string) {
    setDeletingId(id);
    setErr('');
    try {
      await providerApi.removePhoto(id);
      setPhotos((prev) => (prev ?? []).filter((p) => p.id !== id));
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setDeletingId(null);
    }
  }

  const count = photos?.length ?? 0;
  const atLimit = count >= MAX_PHOTOS;

  return (
    <section>
      <div className="mb-2 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate">
          {t('workPhotos')}
        </h2>
        <span className="text-xs tabular-nums text-slate">{count}/{MAX_PHOTOS}</span>
      </div>
      <p className="mb-3 text-xs text-slate">{t('workPhotosHint')}</p>

      {err && <div className="mb-3"><ErrorBanner message={err} /></div>}

      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={onPick}
      />

      {photos === null && !err ? (
        <Spinner label={t('loading')} />
      ) : count === 0 ? (
        <EmptyState>
          <div className="space-y-3">
            <p>{t('noWorkPhotos')}</p>
            <Button onClick={() => fileRef.current?.click()} disabled={uploading}>
              {uploading ? t('uploading') : t('addPhoto')}
            </Button>
          </div>
        </EmptyState>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {/* Optimistic preview of the photo currently uploading. */}
            {uploading && preview && (
              <div className="relative aspect-square overflow-hidden rounded-base border border-primary/40">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={preview} alt="" className="h-full w-full object-cover opacity-60" />
                <div className="absolute inset-0 flex items-center justify-center bg-ink/20">
                  <span className="h-6 w-6 animate-spin rounded-full border-2 border-white/50 border-t-white" aria-hidden="true" />
                </div>
              </div>
            )}
            {photos!.map((p) => (
              <div key={p.id} className="group relative aspect-square overflow-hidden rounded-base border border-line dark:border-gray-800">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.url} alt={p.caption ?? t('workPhotos')} className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => remove(p.id)}
                  disabled={deletingId === p.id}
                  aria-label={t('delete')}
                  className="absolute right-1 top-1 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white opacity-0 transition group-hover:opacity-100 focus:opacity-100 disabled:opacity-50"
                >
                  {deletingId === p.id ? '…' : '✕'}
                </button>
              </div>
            ))}
            {!atLimit && (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="flex aspect-square items-center justify-center rounded-base border-2 border-dashed border-line text-sm text-slate transition-all hover:border-primary hover:text-primary disabled:opacity-50 dark:border-gray-700"
              >
                {uploading ? t('uploading') : `+ ${t('addPhoto')}`}
              </button>
            )}
          </div>
          {atLimit && <p className="mt-2 text-xs text-slate">{t('workPhotosFull')}</p>}
        </>
      )}
    </section>
  );
}
