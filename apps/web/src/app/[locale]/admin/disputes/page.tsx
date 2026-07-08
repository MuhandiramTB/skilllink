'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { adminApi, type Dispute } from '@/lib/admin-api';
import { Button, Card, EmptyState, ErrorBanner, StatusBadge, PageHeader } from '@/components/ui';
import { ICONS } from '@/components/nav-config';
import { Reveal } from '@/components/Reveal';

export default function AdminDisputesPage() {
  const t = useTranslations('admin');
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [err, setErr] = useState('');

  async function load() {
    try { setDisputes(await adminApi.disputes()); } catch (e) { setErr((e as Error).message); }
  }
  useEffect(() => { void load(); }, []);

  async function resolve(id: string) {
    const resolution = prompt(t('disputes.resolutionPrompt')) ?? '';
    if (resolution.length < 3) return;
    try { await adminApi.resolveDispute(id, resolution); await load(); } catch (e) { setErr((e as Error).message); }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title={t('disputes.title')}
        subtitle={t('disputes.subtitle')}
        action={disputes.length > 0 ? <span className="rounded-full bg-surface px-2.5 py-1 text-xs font-semibold tabular-nums text-slate dark:bg-gray-800">{disputes.length}</span> : undefined}
      />

      {err && <ErrorBanner message={err} />}
      {disputes.length === 0 && !err && <EmptyState>{t('disputes.empty')}</EmptyState>}

      {disputes.length > 0 && (
        <ul className="space-y-2.5">
          {disputes.map((d, i) => (
            <li key={d.id}>
              <Reveal delay={i * 40}>
              <Card>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface text-slate dark:bg-gray-800" aria-hidden="true">{ICONS.flag}</span>
                    <div className="min-w-0">
                      <p className="flex items-center gap-2 text-sm font-medium text-ink dark:text-gray-100">
                        {t('disputes.booking')} <code className="tabular-nums text-slate">{d.booking_id.slice(0, 8)}</code>
                        <StatusBadge status={d.status} />
                      </p>
                      <p className="mt-1 text-xs text-slate">{d.resolution ?? t('disputes.noResolution')}</p>
                    </div>
                  </div>
                  <Button
                    onClick={() => resolve(d.id)}
                    className="min-h-[44px] w-full sm:w-auto"
                  >
                    {t('disputes.resolve')}
                  </Button>
                </div>
              </Card>
              </Reveal>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
