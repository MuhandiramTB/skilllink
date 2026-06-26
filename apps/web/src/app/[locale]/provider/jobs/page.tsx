'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { bookingApi, type BookingListItem } from '@/lib/booking-api';
import { getToken } from '@/lib/admin-api';
import { Button, Card, Spinner, EmptyState, ErrorBanner, StatusBadge } from '@/components/ui';

export default function ProviderJobsPage() {
  const locale = (useParams().locale as string) ?? 'en';
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
    <div className="space-y-4">
      <a href={`/${locale}/provider`} className="text-sm text-primary hover:underline">← Dashboard</a>
      <h1 className="text-xl font-semibold">My Jobs</h1>
      {err && <ErrorBanner message={err} />}
      {!jobs && !err && <Spinner />}
      {jobs && jobs.length === 0 && !err && <EmptyState>No jobs assigned yet.</EmptyState>}
      {jobs && jobs.map((j) => (
        <Card key={j.id} className="space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium capitalize">{j.categoryKey?.replace(/[._]/g, ' ') ?? 'Service'}</p>
              <p className="text-xs text-gray-500">{j.description || '—'}</p>
            </div>
            <StatusBadge status={j.status} />
          </div>
          <div className="flex flex-wrap gap-2">
            {j.status === 'matched' && (
              <>
                <Button variant="success" onClick={() => act(j.id, () => bookingApi.respond(j.id, 'accept'))}>Accept</Button>
                <Button variant="danger" onClick={() => act(j.id, () => bookingApi.respond(j.id, 'reject'))}>Reject</Button>
              </>
            )}
            {j.status === 'accepted' && (
              <Button onClick={() => act(j.id, () => bookingApi.advance(j.id, 'in_progress'))}>Start job</Button>
            )}
            {j.status === 'in_progress' && (
              <Button variant="success" onClick={() => act(j.id, () => bookingApi.advance(j.id, 'completed'))}>Mark complete</Button>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}
