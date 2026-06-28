'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { bookingApi, type BookingListItem } from '@/lib/booking-api';
import { getToken } from '@/lib/session';
import { Button, Card, Spinner, EmptyState, ErrorBanner, StatusBadge, PageHeader } from '@/components/ui';

export default function ProviderJobsPage() {
  const locale = (useParams().locale as string) ?? 'en';
  const t = useTranslations('dash');
  const [jobs, setJobs] = useState<BookingListItem[] | null>(null);
  const [err, setErr] = useState('');

  async function load() {
    setErr('');
    try { setJobs(await bookingApi.providerJobs()); } catch (e) { setErr((e as Error).message); }
  }
  useEffect(() => {
    if (!getToken()) { window.location.href = `/${locale}/login?next=/${locale}/provider/jobs`; return; }
    void load();
  }, [locale]);

  async function act(id: string, fn: () => Promise<unknown>) {
    try { await fn(); await load(); } catch (e) { setErr((e as Error).message); }
  }

  return (
    <div className="space-y-5">
      <PageHeader title={t('myJobs')} subtitle={t('myJobsSubtitle')} />
      {err && <ErrorBanner message={err} />}
      {!jobs && !err && <Spinner />}
      {jobs && jobs.length === 0 && !err && <EmptyState>{t('noJobsAssigned')}</EmptyState>}
      {jobs && jobs.length > 0 && (
        <div className="space-y-4">
          {jobs.map((j) => (
            <Card key={j.id} className="space-y-4 rounded-xl2">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-medium capitalize text-ink dark:text-gray-50">{j.categoryKey?.replace(/[._]/g, ' ') ?? t('service')}</p>
                  <p className="mt-0.5 truncate text-xs text-slate">{j.description || '—'}</p>
                </div>
                <StatusBadge status={j.status} />
              </div>
              {(j.status === 'matched' || j.status === 'accepted' || j.status === 'in_progress') && (
                <div className="flex flex-wrap gap-2">
                  {j.status === 'matched' && (
                    <>
                      <Button variant="success" onClick={() => act(j.id, () => bookingApi.respond(j.id, 'accept'))}>{t('accept')}</Button>
                      <Button variant="danger" onClick={() => act(j.id, () => bookingApi.respond(j.id, 'reject'))}>{t('reject')}</Button>
                    </>
                  )}
                  {j.status === 'accepted' && (
                    <Button onClick={() => act(j.id, () => bookingApi.advance(j.id, 'in_progress'))}>{t('startJob')}</Button>
                  )}
                  {j.status === 'in_progress' && (
                    <Button variant="success" onClick={() => act(j.id, () => bookingApi.advance(j.id, 'completed'))}>{t('markComplete')}</Button>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
