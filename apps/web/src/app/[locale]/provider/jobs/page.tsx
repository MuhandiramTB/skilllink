'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { bookingApi, type BookingListItem } from '@/lib/booking-api';
import { getToken } from '@/lib/session';
import { Button, Card, Spinner, EmptyState, ErrorBanner, StatusBadge, PageHeader, MetricCard } from '@/components/ui';
import { Reveal } from '@/components/Reveal';
import { CountUp } from '@/components/charts';
import { ICONS } from '@/components/nav-config';

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

  // Summary counts computed from already-fetched data — no extra request.
  const active = jobs?.filter((j) => ['matched', 'accepted', 'in_progress'].includes(j.status)).length ?? 0;
  const completed = jobs?.filter((j) => j.status === 'completed').length ?? 0;

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <PageHeader
        title={t('myJobs')}
        subtitle={t('myJobsSubtitle')}
        action={jobs ? <span className="rounded-full bg-surface px-2.5 py-1 text-xs font-semibold tabular-nums text-slate dark:bg-gray-800">{jobs.length}</span> : undefined}
      />
      {err && <ErrorBanner message={err} />}
      {!jobs && !err && <Spinner />}
      {jobs && jobs.length === 0 && !err && <EmptyState>{t('noJobsAssigned')}</EmptyState>}
      {jobs && jobs.length > 0 && (
        <>
          <div className="grid grid-cols-3 gap-3">
            <MetricCard icon={ICONS.briefcase} label={t('myJobs')} value={<CountUp value={jobs.length} />} tone="primary" />
            <MetricCard icon={ICONS.bolt} label={t('stepInProgress')} value={<CountUp value={active} />} tone="warn" />
            <MetricCard icon={ICONS.star} label={t('stepCompleted')} value={<CountUp value={completed} />} tone="success" />
          </div>

          <div className="space-y-2.5">
            {jobs.map((j, i) => (
              <Reveal key={j.id} delay={i * 40}>
                <Card className="space-y-4 rounded-xl2 transition-all hover:-translate-y-0.5 hover:border-primary hover:shadow-lift">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface text-slate dark:bg-gray-800" aria-hidden="true">{ICONS.briefcase}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold capitalize text-ink dark:text-gray-50">{j.categoryKey?.replace(/[._]/g, ' ') ?? t('service')}</p>
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
              </Reveal>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
