'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { adminApi, type Dispute } from '@/lib/admin-api';
import { Button, Card, EmptyState, ErrorBanner, StatusBadge, PageHeader } from '@/components/ui';

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
      <PageHeader title={t('disputes.title')} subtitle={t('disputes.subtitle')} />

      {err && <ErrorBanner message={err} />}
      {disputes.length === 0 && !err && <EmptyState>{t('disputes.empty')}</EmptyState>}

      {disputes.length > 0 && (
        <ul className="space-y-3">
          {disputes.map((d) => (
            <li key={d.id}>
              <Card>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 text-sm font-medium text-ink dark:text-gray-100">
                      {t('disputes.booking')} <code className="tabular-nums text-slate">{d.booking_id.slice(0, 8)}</code>
                      <StatusBadge status={d.status} />
                    </p>
                    <p className="mt-1 text-xs text-slate">{d.resolution ?? t('disputes.noResolution')}</p>
                  </div>
                  <Button
                    onClick={() => resolve(d.id)}
                    className="min-h-[44px] w-full sm:w-auto"
                  >
                    {t('disputes.resolve')}
                  </Button>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
