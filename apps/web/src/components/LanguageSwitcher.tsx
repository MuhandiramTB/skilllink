'use client';

import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/routing';
import { routing } from '@/i18n/routing';

export function LanguageSwitcher() {
  const locale = useLocale();
  const t = useTranslations('lang');
  const router = useRouter();
  const pathname = usePathname();

  return (
    <label className="flex items-center">
      <span className="sr-only">{t('label')}</span>
      <select
        aria-label={t('label')}
        value={locale}
        onChange={(e) => router.replace(pathname, { locale: e.target.value })}
        className="h-9 rounded-base border bg-transparent px-2 text-sm text-gray-600 dark:border-gray-600 dark:text-gray-300"
      >
        {routing.locales.map((l) => (
          <option key={l} value={l}>
            {t(l)}
          </option>
        ))}
      </select>
    </label>
  );
}
