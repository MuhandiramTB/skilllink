'use client';

import { useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { TOWNS } from '@/lib/towns';
import { ICONS } from '@/components/nav-config';
import { CategoryIcon } from '@/components/category-icon';

/**
 * Landing hero search — the page's centerpiece. A service picker (real categories)
 * + a Kandy-area location field with live suggestions. On submit it hands off to
 * the REAL authenticated match flow: /{locale}/category/{key}?loc={townKey}, where
 * the category page pre-fills the location and the matches API returns nearby
 * providers. No fabricated data — this is the true entry point to booking.
 */
export interface SearchCategory { key: string; name: string }

export function LandingSearch({ locale, categories }: { locale: string; categories: SearchCategory[] }) {
  const t = useTranslations('home');
  const router = useRouter();

  const [catKey, setCatKey] = useState(categories[0]?.key ?? '');
  const [locQuery, setLocQuery] = useState('');
  const [townKey, setTownKey] = useState<string | null>(null);
  const [openList, setOpenList] = useState<'cat' | 'loc' | null>(null);
  const catBtn = useRef<HTMLDivElement>(null);

  // Town suggestions filtered by what the user types — matches town OR district
  // (island-wide), capped so the dropdown stays tidy.
  const townMatches = useMemo(() => {
    const q = locQuery.trim().toLowerCase();
    const base = q
      ? TOWNS.filter((tn) => tn.name.toLowerCase().includes(q) || tn.district.toLowerCase().includes(q))
      : TOWNS;
    return base.slice(0, 8);
  }, [locQuery]);

  const selectedCat = categories.find((c) => c.key === catKey);

  function go() {
    if (!catKey) return;
    // Resolve the typed/selected town to a key; default to Kandy if left blank.
    const resolved =
      townKey ??
      TOWNS.find((tn) => tn.name.toLowerCase() === locQuery.trim().toLowerCase())?.key ??
      (locQuery.trim() ? null : 'kandy');
    const params = new URLSearchParams();
    if (resolved) params.set('loc', resolved);
    router.push(`/${locale}/category/${catKey}?${params.toString()}`);
  }

  return (
    <div className="relative">
      <div className="flex flex-col gap-2 rounded-xl2 border border-line bg-white p-2 shadow-lift dark:border-gray-800 dark:bg-gray-900 sm:flex-row sm:items-stretch">
        {/* Service picker */}
        <div className="relative flex-1" ref={catBtn}>
          <button
            type="button"
            onClick={() => setOpenList(openList === 'cat' ? null : 'cat')}
            className="flex w-full items-center gap-2.5 rounded-base px-3 py-3 text-left transition-colors hover:bg-surface dark:hover:bg-gray-800"
            aria-haspopup="listbox"
            aria-expanded={openList === 'cat'}
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary dark:bg-primary/15" aria-hidden="true">
              {selectedCat ? <CategoryIcon keyName={selectedCat.key} className="h-4 w-4" /> : <span className="[&>svg]:h-4 [&>svg]:w-4">{ICONS.grid}</span>}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[11px] font-semibold uppercase tracking-wide text-slate-2">{t('searchWhat')}</span>
              <span className="block truncate text-sm font-semibold text-ink dark:text-gray-100">{selectedCat?.name ?? t('searchWhat')}</span>
            </span>
            <span className={`text-slate transition-transform ${openList === 'cat' ? 'rotate-180' : ''}`} aria-hidden="true">▾</span>
          </button>
          {openList === 'cat' && (
            <ul role="listbox" className="absolute left-0 top-full z-30 mt-2 max-h-64 w-full overflow-auto rounded-xl2 border border-line bg-white p-1.5 shadow-lift dark:border-gray-800 dark:bg-gray-900">
              {categories.map((c) => (
                <li key={c.key}>
                  <button
                    type="button"
                    onClick={() => { setCatKey(c.key); setOpenList(null); }}
                    className={`flex w-full items-center gap-2.5 rounded-base px-2.5 py-2 text-left text-sm transition-colors hover:bg-surface dark:hover:bg-gray-800 ${c.key === catKey ? 'font-semibold text-primary' : 'text-ink dark:text-gray-100'}`}
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-surface text-slate dark:bg-gray-800"><CategoryIcon keyName={c.key} className="h-4 w-4" /></span>
                    <span className="truncate">{c.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Divider */}
        <span className="hidden w-px self-stretch bg-line dark:bg-gray-800 sm:block" aria-hidden="true" />

        {/* Location field with suggestions */}
        <div className="relative flex-1">
          <div className="flex items-center gap-2.5 rounded-base px-3 py-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary [&>svg]:h-4 [&>svg]:w-4 dark:bg-primary/15" aria-hidden="true">{ICONS.map}</span>
            <span className="min-w-0 flex-1">
              <span className="block text-[11px] font-semibold uppercase tracking-wide text-slate-2">{t('searchWhere')}</span>
              <input
                value={locQuery}
                onChange={(e) => { setLocQuery(e.target.value); setTownKey(null); setOpenList('loc'); }}
                onFocus={() => setOpenList('loc')}
                placeholder="Kandy"
                className="w-full border-none bg-transparent p-0 text-sm font-semibold text-ink placeholder:font-normal placeholder:text-slate/60 focus:outline-none focus:ring-0 dark:text-gray-100"
                type="text"
                autoComplete="off"
              />
            </span>
          </div>
          {openList === 'loc' && townMatches.length > 0 && (
            <ul role="listbox" className="absolute left-0 top-full z-30 mt-2 max-h-64 w-full overflow-auto rounded-xl2 border border-line bg-white p-1.5 shadow-lift dark:border-gray-800 dark:bg-gray-900">
              {townMatches.map((tn) => (
                <li key={tn.key}>
                  <button
                    type="button"
                    onClick={() => { setTownKey(tn.key); setLocQuery(tn.name); setOpenList(null); }}
                    className="flex w-full items-center gap-2.5 rounded-base px-2.5 py-2 text-left text-sm text-ink transition-colors hover:bg-surface dark:text-gray-100 dark:hover:bg-gray-800"
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-surface text-slate [&>svg]:h-4 [&>svg]:w-4 dark:bg-gray-800" aria-hidden="true">{ICONS.map}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{tn.name}</span>
                      <span className="block truncate text-xs text-slate-2">{tn.district}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Submit */}
        <button
          type="button"
          onClick={go}
          className="flex shrink-0 items-center justify-center gap-2 rounded-base bg-primary px-6 py-3 text-sm font-bold text-white shadow-card transition-all duration-150 hover:bg-primary-600 focus-visible:shadow-ring active:translate-y-px"
        >
          <span className="[&>svg]:h-4 [&>svg]:w-4" aria-hidden="true">{ICONS.search}</span>
          {t('search')}
        </button>
      </div>

      {/* Click-away backdrop when a list is open */}
      {openList && <button type="button" aria-hidden="true" tabIndex={-1} className="fixed inset-0 z-20 cursor-default" onClick={() => setOpenList(null)} />}
    </div>
  );
}
