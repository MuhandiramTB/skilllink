'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { safetyApi, type AdminReport, type AdminAlert } from '@/lib/safety-api';
import { Card, EmptyState, ErrorBanner, StatusBadge, PageHeader, Section } from '@/components/ui';
import { ICONS } from '@/components/nav-config';
import { Reveal } from '@/components/Reveal';

/** Admin Trust & Safety queue: active SOS alerts + open provider reports. */
export default function AdminSafetyPage() {
  const t = useTranslations('admin');
  const [alerts, setAlerts] = useState<AdminAlert[]>([]);
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [err, setErr] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const [a, r] = await Promise.all([safetyApi.adminAlerts(), safetyApi.adminReports()]);
        setAlerts(a);
        setReports(r);
      } catch (e) {
        setErr((e as Error).message);
      }
    })();
  }, []);

  const fmtDate = (iso: string) => new Date(iso).toLocaleString();

  return (
    <div className="space-y-6">
      <PageHeader title={t('safety.adminSafetyTitle')} subtitle={t('safety.subtitle')} />

      {err && <ErrorBanner message={err} />}

      {/* Active safety alerts */}
      <Section title={t('safety.activeAlerts')}>
        {alerts.length === 0 ? (
          <EmptyState>{t('safety.noAlerts')}</EmptyState>
        ) : (
          <ul className="space-y-2.5">
            {alerts.map((a, i) => (
              <li key={a.id}>
                <Reveal delay={i * 40}>
                  <Card>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-100 text-danger dark:bg-red-500/15" aria-hidden="true">{ICONS.shield}</span>
                        <div className="min-w-0">
                          <p className="flex flex-wrap items-center gap-2 text-sm font-medium text-ink dark:text-gray-100">
                            <code className="tabular-nums text-slate">{a.user_id.slice(0, 8)}</code>
                            <StatusBadge status={a.status} />
                          </p>
                          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate">
                            {a.booking_id && <span>{t('safety.booking')} <code className="tabular-nums">{a.booking_id.slice(0, 8)}</code></span>}
                            {a.lat != null && a.lng != null && (
                              <span className="inline-flex items-center gap-1 tabular-nums">
                                <span className="[&>svg]:h-3.5 [&>svg]:w-3.5" aria-hidden="true">{ICONS.map}</span>
                                {a.lat.toFixed(4)}, {a.lng.toFixed(4)}
                              </span>
                            )}
                            {a.note && <span className="truncate">{a.note}</span>}
                          </p>
                        </div>
                      </div>
                      <time className="shrink-0 text-xs tabular-nums text-slate">{fmtDate(a.created_at)}</time>
                    </div>
                  </Card>
                </Reveal>
              </li>
            ))}
          </ul>
        )}
      </Section>

      {/* Open reports */}
      <Section title={t('safety.openReports')}>
        {reports.length === 0 ? (
          <EmptyState>{t('safety.noReports')}</EmptyState>
        ) : (
          <ul className="space-y-2.5">
            {reports.map((r, i) => (
              <li key={r.id}>
                <Reveal delay={i * 40}>
                  <Card>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface text-slate dark:bg-gray-800" aria-hidden="true">{ICONS.flag}</span>
                        <div className="min-w-0">
                          <p className="flex flex-wrap items-center gap-2 text-sm font-medium text-ink dark:text-gray-100">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate/10 px-2.5 py-1 text-xs font-semibold capitalize text-slate ring-1 ring-inset ring-slate/15">
                              <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
                              {r.reason.replace(/_/g, ' ')}
                            </span>
                            <StatusBadge status={r.status} />
                          </p>
                          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate">
                            <span>{t('safety.provider')} <code className="tabular-nums">{r.provider_id.slice(0, 8)}</code></span>
                            <span>{t('safety.reporter')} <code className="tabular-nums">{r.reporter_id.slice(0, 8)}</code></span>
                            {r.booking_id && <span>{t('safety.booking')} <code className="tabular-nums">{r.booking_id.slice(0, 8)}</code></span>}
                          </p>
                          {r.detail && <p className="mt-1 text-xs text-slate">{r.detail}</p>}
                        </div>
                      </div>
                      <time className="shrink-0 text-xs tabular-nums text-slate">{fmtDate(r.created_at)}</time>
                    </div>
                  </Card>
                </Reveal>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}
