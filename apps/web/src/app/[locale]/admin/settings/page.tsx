'use client';

import { useTranslations } from 'next-intl';
import { PageHeader, Card } from '@/components/ui';

/** Platform settings overview. Read-only for v1 — values come from server config/env. */
export default function AdminSettingsPage() {
  const t = useTranslations('admin');
  const rows: [string, string][] = [
    [t('settings.commissionRate'), t('settings.commissionRateValue')],
    [t('settings.currency'), t('settings.currencyValue')],
    [t('settings.activeRegion'), t('settings.activeRegionValue')],
    [t('settings.languages'), t('settings.languagesValue')],
    [t('settings.authentication'), t('settings.authenticationValue')],
    [t('settings.paymentGateway'), t('settings.paymentGatewayValue')],
  ];
  return (
    <div className="space-y-5">
      <PageHeader
        title={t('settings.title')}
        subtitle={t('settings.subtitle')}
      />

      <p className="text-sm text-gray-500 dark:text-gray-400">
        {t.rich('settings.intro', {
          districts: (chunks) => (
            <a href="districts" className="font-medium text-primary underline">{chunks}</a>
          ),
        })}
      </p>

      <Card className="rounded-2xl divide-y dark:divide-gray-700">
        {rows.map(([k, v]) => (
          <div key={k} className="flex items-center justify-between gap-3 py-3 text-sm">
            <span className="text-gray-500 dark:text-gray-400">{k}</span>
            <span className="text-right font-medium">{v}</span>
          </div>
        ))}
      </Card>
    </div>
  );
}
