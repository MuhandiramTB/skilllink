'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { getToken } from '@/lib/session';
import { fetchCategories, type CategoryNode } from '@/lib/api';
import { CategoryIcon } from '@/components/category-icon';
import { Spinner, ErrorBanner, EmptyState } from '@/components/ui';

type Locale = 'en' | 'si' | 'ta';

export default function BookPage() {
  const params = useParams();
  const locale = (params.locale as Locale) ?? 'en';
  const t = useTranslations('book');

  // Seed the search from the hero's ?q= so "what do you need" carries through.
  const sp = useSearchParams();
  const initialQ = sp.get('q') ?? '';
  const loc = sp.get('loc')?.trim() ?? '';
  const [cats, setCats] = useState<CategoryNode[] | null>(null);
  const [err, setErr] = useState('');
  const [q, setQ] = useState(initialQ);

  useEffect(() => {
    if (!getToken()) {
      window.location.href = `/${locale}/login?next=/${locale}/book`;
      return;
    }
    fetchCategories()
      .then(setCats)
      .catch(() => setErr(t('error')));
  }, [locale, t]);

  // Flatten top-level + sub-services into one searchable list of bookable items.
  const items = useMemo(() => {
    if (!cats) return [];
    const flat: { key: string; name: string; parent?: string }[] = [];
    for (const c of cats) {
      flat.push({ key: c.key, name: c.name[locale] });
      for (const child of c.children) flat.push({ key: child.key, name: child.name[locale], parent: c.name[locale] });
    }
    const term = q.trim().toLowerCase();
    return term ? flat.filter((i) => i.name.toLowerCase().includes(term) || i.key.includes(term)) : flat;
  }, [cats, locale, q]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl font-bold text-ink dark:text-gray-50">{t('title')}</h1>
        <p className="text-sm text-slate dark:text-gray-400">{t('subtitle')}</p>
        {loc && (
          <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></svg>
            {loc} · {t('confirmOnMap')}
          </p>
        )}
      </header>

      {/* Search */}
      <div className="relative">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate" aria-hidden="true">
          <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.3-4.3" />
        </svg>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t('searchPlaceholder')}
          aria-label={t('searchPlaceholder')}
          className="w-full rounded-base border border-line py-3 pl-11 pr-3 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 dark:border-gray-600 dark:bg-gray-900"
        />
      </div>

      {err && <ErrorBanner message={err} />}

      {cats === null && !err ? (
        <Spinner label={t('loading')} />
      ) : items.length === 0 ? (
        <EmptyState>{t('noResults')}</EmptyState>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((it) => (
            <li key={it.key}>
              <a
                href={`/${locale}/category/${it.key}`}
                className="group flex h-full flex-col gap-3 rounded-xl2 border border-line bg-white p-4 shadow-card transition-all hover:-translate-y-0.5 hover:border-primary hover:shadow-lift dark:border-gray-700 dark:bg-gray-800"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-white">
                  <CategoryIcon keyName={it.key} />
                </span>
                <span className="font-medium leading-tight">{it.name}</span>
                {it.parent && <span className="-mt-1 text-xs text-slate dark:text-gray-400">{it.parent}</span>}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
