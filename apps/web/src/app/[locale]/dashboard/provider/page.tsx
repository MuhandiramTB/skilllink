'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getSession, homeForMode } from '@/lib/session';
import { providerApi, type ProviderMe } from '@/lib/provider-api';
import { bookingApi, type BookingListItem } from '@/lib/booking-api';
import { Button, Card, StatCard, StatusBadge, Spinner, EmptyState, ErrorBanner } from '@/components/ui';

function lkr(cents: number) {
  return `LKR ${(cents / 100).toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function ProviderDashboard() {
  const locale = (useParams().locale as string) ?? 'en';
  const [me, setMe] = useState<ProviderMe | null>(null);
  const [earnings, setEarnings] = useState<{ totalNetCents: number; paidJobs: number } | null>(null);
  const [jobs, setJobs] = useState<BookingListItem[] | null>(null);
  const [err, setErr] = useState('');
  const [savingAvail, setSavingAvail] = useState(false);

  useEffect(() => {
    const s = getSession();
    if (s && s.mode !== 'provider') {
      window.location.href = homeForMode(locale, s.mode);
      return;
    }
    if (s && !s.roles.includes('provider')) {
      window.location.href = homeForMode(locale, 'customer');
      return;
    }
    Promise.all([providerApi.me(), providerApi.earnings()])
      .then(([m, e]) => { setMe(m); setEarnings(e); })
      .catch((e) => setErr((e as Error).message));
    bookingApi.providerJobs().then(setJobs).catch((e) => setErr((e as Error).message));
  }, [locale]);

  async function toggleAvailability() {
    if (!me) return;
    setErr('');
    setSavingAvail(true);
    try {
      await providerApi.setAvailability(!me.isAvailable);
      setMe({ ...me, isAvailable: !me.isAvailable });
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setSavingAvail(false);
    }
  }

  const approved = me?.status === 'approved';
  const verificationIncomplete =
    !!me && (me.verifications.length === 0 || me.verifications.some((v) => v.status !== 'approved'));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-xl font-bold">Provider dashboard</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">{me?.businessName ?? 'Your services'}</p>
      </div>

      {err && <ErrorBanner message={err} />}

      {me === null && earnings === null && !err ? (
        <Spinner label="Loading your profile…" />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Card>
              <div className="text-sm"><StatusBadge status={me?.status ?? 'pending'} /></div>
              <div className="mt-1 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Status</div>
            </Card>
            <StatCard label="Rating" value={(me?.ratingAvg ?? 0).toFixed(1)} tone="primary" />
            <StatCard label="Paid jobs" value={earnings?.paidJobs ?? 0} />
            <StatCard label="Net earnings" value={lkr(earnings?.totalNetCents ?? 0)} tone="success" />
          </div>

          <section>
            <Card>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="font-medium">Availability</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {approved
                      ? me?.isAvailable
                        ? 'You are visible to new job requests.'
                        : 'You are hidden from new job requests.'
                      : 'Available once your account is approved.'}
                  </div>
                </div>
                <Button
                  variant={me?.isAvailable ? 'success' : 'ghost'}
                  disabled={!approved || savingAvail}
                  onClick={toggleAvailability}
                >
                  {savingAvail ? 'Saving…' : me?.isAvailable ? 'Available' : 'Unavailable'}
                </Button>
              </div>
            </Card>
          </section>

          {verificationIncomplete && (
            <a href={`/${locale}/provider/register`}>
              <Card className="border-amber-300 transition hover:border-primary dark:border-amber-700">
                <div className="text-sm font-medium text-amber-800 dark:text-amber-300">
                  Complete your verification to start receiving jobs →
                </div>
              </Card>
            </a>
          )}

          <section>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Verification
            </h2>
            {me && me.verifications.length === 0 ? (
              <EmptyState>No verification documents submitted yet.</EmptyState>
            ) : (
              <ul className="space-y-2">
                {me?.verifications.map((v) => (
                  <li key={v.type}>
                    <Card>
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-medium capitalize">{v.type.replace(/_/g, ' ')}</span>
                        <StatusBadge status={v.status} />
                      </div>
                    </Card>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Job requests
            </h2>
            {jobs === null && !err ? (
              <Spinner label="Loading jobs…" />
            ) : jobs && jobs.length === 0 ? (
              <EmptyState>No job requests yet.</EmptyState>
            ) : (
              <ul className="space-y-2">
                {jobs?.map((j) => (
                  <li key={j.id}>
                    <a href={`/${locale}/bookings/${j.id}`}>
                      <Card className="transition hover:border-primary">
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <div className="truncate font-medium">{j.categoryKey ?? 'Service'}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {new Date(j.created_at).toLocaleDateString()}
                            </div>
                          </div>
                          <StatusBadge status={j.status} />
                        </div>
                      </Card>
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}
