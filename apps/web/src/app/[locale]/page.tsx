import { getTranslations, setRequestLocale } from 'next-intl/server';
import { fetchCategories, type CategoryNode } from '@/lib/api';
import { LandingGate } from '@/components/LandingGate';

type Locale = 'en' | 'si' | 'ta';

// Small inline glyphs keyed by category key prefix — gives the grid real visual
// identity instead of plain text tiles.
function categoryIcon(key: string) {
  const d: Record<string, string> = {
    electrician: 'M13 2L3 14h7l-1 8 10-12h-7z',
    plumber: 'M9 3v6a3 3 0 003 3 3 3 0 003-3V3M7 21h10M12 12v9',
    ac_tech: 'M3 7h18M3 12h18M3 17h18',
    welder: 'M12 2l2 7h7l-6 4 2 7-5-4-5 4 2-7-6-4h7z',
    carpenter: 'M2 20l6-6M14 4l6 6-9 9-6-6z',
    mechanic: 'M12 15a3 3 0 100-6 3 3 0 000 6zM19 12a7 7 0 01-1 3l2 2-2 2-2-2a7 7 0 01-3 1l-1 2-2-2',
    painter: 'M5 3h14v6H5zM9 9v3a3 3 0 003 3v6',
    mason: 'M3 8h7v4H3zM14 8h7v4h-7zM7 14h10v4H7z',
    cctv: 'M2 7l16-4 2 6-16 4zM6 13v6M12 11l3 8',
    cleaning: 'M19 3l-7 7M5 21l4-10 5 5-10 4zM14 8l2-2',
    solar: 'M4 14h16l-2-9H6zM2 18h20M9 5v9M15 5v9',
    auto_ac: 'M5 11l2-5h10l2 5M5 11h14v5H5zM7 16v2M17 16v2',
  };
  const match = Object.keys(d).find((k) => key.startsWith(k));
  return d[match ?? ''] ?? 'M4 6h16M4 12h16M4 18h10';
}

export default async function HomePage({ params }: { params: { locale: string } }) {
  const locale = params.locale as Locale;
  setRequestLocale(locale);
  const t = await getTranslations('home');

  let categories: CategoryNode[] = [];
  let failed = false;
  try {
    categories = await fetchCategories();
  } catch {
    failed = true;
  }
  const top = categories.slice(0, 8);

  return (
    <LandingGate>
    <div className="space-y-10">
      {/* ---- Hero: value prop + trust + primary action ---- */}
      <section className="overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-accent-2 p-7 text-white shadow-sm sm:p-10">
        <p className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur">
          <span className="h-1.5 w-1.5 rounded-full bg-white" /> {t('near')}
        </p>
        <h1 className="mt-4 max-w-xl font-display text-3xl font-bold leading-tight sm:text-4xl">
          {t('tagline')}
        </h1>
        <p className="mt-3 max-w-lg text-sm text-white/85 sm:text-base">{t('heroSub')}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <a
            href={`/${locale}/login`}
            className="rounded-base bg-white px-6 py-3 text-sm font-semibold text-primary shadow-sm transition hover:bg-white/90"
          >
            {t('getStarted')}
          </a>
          <a
            href="#services"
            className="rounded-base border border-white/40 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            {t('browseAll')}
          </a>
        </div>
        {/* Trust signals */}
        <ul className="mt-7 flex flex-wrap gap-x-6 gap-y-2 border-t border-white/20 pt-5 text-xs text-white/90">
          {[t('trustVerified'), t('trustRated'), t('trustLocal')].map((label) => (
            <li key={label} className="inline-flex items-center gap-1.5">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
                <path d="M20 6L9 17l-5-5" />
              </svg>
              {label}
            </li>
          ))}
        </ul>
      </section>

      {/* ---- Service categories ---- */}
      <section id="services">
        <div className="mb-4 flex items-end justify-between">
          <h2 className="font-display text-xl font-bold">{t('chooseCategory')}</h2>
        </div>
        {failed && <p className="rounded-base bg-red-50 p-3 text-sm text-danger dark:bg-red-950/40">{t('error')}</p>}
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {top.map((c) => (
            <li key={c.id}>
              <a
                href={`/${locale}/category/${c.key}`}
                className="group flex h-full flex-col gap-3 rounded-2xl border bg-white p-4 transition hover:-translate-y-0.5 hover:border-primary hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-white">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
                    <path d={categoryIcon(c.key)} />
                  </svg>
                </span>
                <span className="font-medium leading-tight">{c.name[locale]}</span>
                {c.children.length > 0 && (
                  <span className="-mt-1 text-xs text-gray-500 dark:text-gray-400">{c.children.length}+ services</span>
                )}
              </a>
            </li>
          ))}
        </ul>
      </section>

      {/* ---- Provider band: a designed two-column section, not a flat box ---- */}
      <section className="overflow-hidden rounded-2xl border bg-white dark:border-gray-700 dark:bg-gray-800">
        <div className="grid md:grid-cols-2">
          <div className="p-7 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-widest text-accent">{t('providerEyebrow')}</p>
            <h2 className="mt-2 font-display text-2xl font-bold">{t('providerCta')}</h2>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{t('providerCtaSub')}</p>
            <ul className="mt-5 space-y-2.5 text-sm">
              {[t('providerBenefit1'), t('providerBenefit2'), t('providerBenefit3')].map((b) => (
                <li key={b} className="flex items-center gap-2.5">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent/15 text-accent">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3" aria-hidden="true">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  </span>
                  {b}
                </li>
              ))}
            </ul>
            <a
              href={`/${locale}/login?intent=provider&next=/${locale}/provider/register`}
              className="mt-6 inline-block rounded-base bg-accent px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
            >
              {t('providerButton')}
            </a>
          </div>
          {/* Decorative accent panel (no external image needed) */}
          <div className="relative hidden bg-gradient-to-br from-accent/15 to-primary/10 md:block">
            <div className="absolute inset-0 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="h-40 w-40 text-accent/40" aria-hidden="true">
                <path d="M20 7H4a2 2 0 00-2 2v9a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2zM16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* ---- Discreet footer with staff entry ---- */}
      <footer className="border-t pt-6 text-center text-xs text-gray-400 dark:border-gray-700">
        <p>© SkillLink LK · Kandy</p>
        <a href={`/${locale}/admin/login`} className="mt-2 inline-block text-gray-400 hover:text-primary hover:underline">
          {t('staff')}
        </a>
      </footer>
    </div>
    </LandingGate>
  );
}
