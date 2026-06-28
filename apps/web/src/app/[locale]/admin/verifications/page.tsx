'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { adminApi, type VerificationQueueItem } from '@/lib/admin-api';
import { PageHeader, Card, Button, Spinner, EmptyState, ErrorBanner, SuccessBanner, StatusBadge } from '@/components/ui';
import { ICONS } from '@/components/nav-config';

/** A label/value pair in the details grid. */
function Detail({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] font-semibold uppercase tracking-wider text-slate">{label}</dt>
      <dd className="truncate font-medium text-ink dark:text-gray-100">{value ?? '—'}</dd>
    </div>
  );
}

/** Document thumbnail — falls back to a placeholder if the image can't load
 *  (e.g. legacy mock URLs from before real uploads were stored). */
function DocImage({ src, type }: { src: string; type: string }) {
  const [broken, setBroken] = useState(false);
  if (broken || !src) {
    return (
      <div className="flex h-28 w-full items-center justify-center bg-surface text-xs text-slate dark:bg-gray-800">
        no preview
      </div>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={type} className="h-28 w-full object-cover" onError={() => setBroken(true)} />;
}

export default function AdminVerificationsPage() {
  const t = useTranslations('admin');
  const [queue, setQueue] = useState<VerificationQueueItem[] | null>(null);
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');

  async function load() {
    setErr('');
    try { setQueue(await adminApi.verificationQueue()); }
    catch (e) { setErr((e as Error).message); }
  }
  useEffect(() => { void load(); }, []);

  async function decide(providerId: string, decision: 'approve' | 'reject') {
    setErr(''); setMsg('');
    try {
      const reason = decision === 'reject' ? (prompt(t('verifications.rejectReason')) ?? '') : undefined;
      await adminApi.decideVerification(providerId, decision, reason);
      setMsg(decision === 'approve' ? t('verifications.approved') : t('verifications.rejected'));
      await load();
    } catch (e) { setErr((e as Error).message); }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title={t('verifications.title')}
        subtitle={t('verifications.subtitle')}
        action={queue ? <span className="rounded-full bg-surface px-2.5 py-1 text-xs font-semibold tabular-nums text-slate dark:bg-gray-800">{queue.length}</span> : undefined}
      />

      {err && <ErrorBanner message={err} />}
      {msg && <SuccessBanner message={msg} />}

      {queue === null && !err ? (
        <Spinner label={t('verifications.loading')} />
      ) : queue && queue.length === 0 ? (
        <EmptyState>{t('verifications.empty')}</EmptyState>
      ) : (
        <ul className="space-y-3">
          {queue?.map((p) => (
            <Card key={p.providerId}>
              <li className="list-none space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface text-slate dark:bg-gray-800" aria-hidden="true">{ICONS.shield}</span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-semibold text-ink dark:text-gray-100">{p.businessName ?? p.fullName ?? t('verifications.noName')}</p>
                        <StatusBadge status={p.status} />
                      </div>
                      {p.fullName && p.businessName && (
                        <p className="text-sm text-slate">{p.fullName}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Full provider details for review */}
                <dl className="grid grid-cols-2 gap-x-4 gap-y-2 rounded-base bg-surface p-3 text-sm dark:bg-gray-800/40 sm:grid-cols-3">
                  <Detail label={t('verifications.phone')} value={p.phone} />
                  <Detail label={t('verifications.email')} value={p.email} />
                  <Detail label={t('verifications.district')} value={p.district} />
                  <Detail label={t('verifications.experience')} value={p.yearsExperience != null ? t('verifications.years', { n: p.yearsExperience }) : null} />
                  <Detail label={t('verifications.schedule')} value={[p.workingDays, p.workingHours].filter(Boolean).join(' · ') || null} />
                  <Detail label={t('verifications.emergency')} value={p.emergencyService ? t('verifications.yes') : t('verifications.no')} />
                  <Detail label={t('verifications.categories')} value={p.categories.length ? p.categories.join(', ') : null} />
                  <Detail label={t('verifications.applied')} value={p.appliedAt ? new Date(p.appliedAt).toLocaleDateString() : null} />
                </dl>

                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate">
                    {t('verifications.documents')}
                  </p>
                  {p.documents.length === 0 ? (
                    <p className="text-xs text-slate">{t('verifications.none')}</p>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {p.documents.map((d) => (
                          <a
                            key={d.id}
                            href={d.media_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group block overflow-hidden rounded-base border border-line bg-surface transition-all hover:-translate-y-0.5 hover:border-primary hover:shadow-lift dark:border-gray-800 dark:bg-gray-900"
                          >
                            <DocImage src={d.media_url} type={d.type} />
                            <span className="block truncate px-2 py-1.5 text-xs font-medium capitalize text-slate group-hover:text-primary dark:text-gray-300">
                              {d.type}
                            </span>
                          </a>
                        ))}
                      </div>
                      <p className="mt-1.5 text-xs text-slate">{t('verifications.viewFull')}</p>
                    </>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button variant="success" onClick={() => decide(p.providerId, 'approve')} className="min-h-[44px] flex-1 sm:flex-none">
                    {t('verifications.approve')}
                  </Button>
                  <Button variant="danger" onClick={() => decide(p.providerId, 'reject')} className="min-h-[44px] flex-1 sm:flex-none">
                    {t('verifications.reject')}
                  </Button>
                </div>
              </li>
            </Card>
          ))}
        </ul>
      )}
    </div>
  );
}
