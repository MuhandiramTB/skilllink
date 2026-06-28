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
      {/* ---- Hero: ink ground, one electric-blue pop, confident type ---- */}
      <section className="relative overflow-hidden rounded-xl2 bg-ink p-7 text-white sm:p-12">
        {/* Subtle dot-grid texture (not a gradient) — depth without the AI-default look. */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '22px 22px' }}
          aria-hidden="true"
        />
        {/* One ambient accent glow, top-right. */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/30 blur-3xl" aria-hidden="true" />

        <div className="relative">
          <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold ring-1 ring-inset ring-white/15">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" /> {t('near')}
          </p>
          <h1 className="mt-5 max-w-2xl font-display text-[34px] font-extrabold leading-[1.05] tracking-tightest sm:text-5xl" style={{ textWrap: 'balance' } as React.CSSProperties}>
            {t('tagline')}
          </h1>
          <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-white/70 sm:text-base">{t('heroSub')}</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a
              href={`/${locale}/login`}
              className="rounded-base bg-primary px-6 py-3 text-sm font-bold text-white transition-all duration-150 hover:bg-primary-700 active:translate-y-px"
            >
              {t('getStarted')}
            </a>
            <a
              href="#services"
              className="rounded-base bg-white/5 px-6 py-3 text-sm font-semibold text-white ring-1 ring-inset ring-white/20 transition hover:bg-white/10"
            >
              {t('browseAll')}
            </a>
          </div>
          {/* Trust signals */}
          <ul className="mt-8 flex flex-wrap gap-x-7 gap-y-2 border-t border-white/10 pt-5 text-[13px] font-medium text-white/75">
            {[t('trustVerified'), t('trustRated'), t('trustLocal')].map((label) => (
              <li key={label} className="inline-flex items-center gap-2">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-primary" aria-hidden="true">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
                {label}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ---- Service categories ---- */}
      <section id="services">
        <div className="mb-4 flex items-end justify-between">
          <h2 className="font-display text-xl font-bold text-ink dark:text-gray-50">{t('chooseCategory')}</h2>
        </div>
        {failed && <p className="rounded-base border border-red-200 bg-red-50 p-3 text-sm font-medium text-danger dark:border-red-500/30 dark:bg-red-950/40">{t('error')}</p>}
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {top.map((c) => (
            <li key={c.id}>
              <a
                href={`/${locale}/category/${c.key}`}
                className="group flex h-full flex-col gap-3 rounded-xl2 border border-line bg-white p-4 shadow-card transition-all duration-150 hover:-translate-y-0.5 hover:border-primary hover:shadow-lift dark:border-gray-800 dark:bg-gray-900"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
                    <path d={categoryIcon(c.key)} />
                  </svg>
                </span>
                <span className="font-semibold leading-tight text-ink dark:text-gray-100">{c.name[locale]}</span>
                {c.children.length > 0 && (
                  <span className="-mt-1 text-xs text-slate">{c.children.length}+ services</span>
                )}
              </a>
            </li>
          ))}
        </ul>
      </section>

      {/* ---- Provider band: two-column, ink-on-dark right panel ---- */}
      <section className="overflow-hidden rounded-xl2 border border-line bg-white shadow-card dark:border-gray-800 dark:bg-gray-900">
        <div className="grid md:grid-cols-2">
          <div className="p-7 sm:p-9">
            <p className="text-xs font-bold uppercase tracking-wider text-primary">{t('providerEyebrow')}</p>
            <h2 className="mt-2.5 font-display text-2xl font-extrabold tracking-tightest text-ink dark:text-gray-50">{t('providerCta')}</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate">{t('providerCtaSub')}</p>
            <ul className="mt-5 space-y-3 text-sm font-medium text-ink dark:text-gray-200">
              {[t('providerBenefit1'), t('providerBenefit2'), t('providerBenefit3')].map((b) => (
                <li key={b} className="flex items-center gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
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
              className="mt-7 inline-block rounded-base bg-ink px-6 py-3 text-sm font-bold text-white transition-all duration-150 hover:bg-black active:translate-y-px dark:bg-primary dark:hover:bg-primary-700"
            >
              {t('providerButton')}
            </a>
          </div>
          {/* Dark accent panel with dot texture — echoes the hero. */}
          <div className="relative hidden overflow-hidden bg-ink md:block">
            <div className="pointer-events-none absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '20px 20px' }} aria-hidden="true" />
            <div className="pointer-events-none absolute -bottom-16 -left-10 h-56 w-56 rounded-full bg-primary/30 blur-3xl" aria-hidden="true" />
            <div className="absolute inset-0 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="h-40 w-40 text-white/20" aria-hidden="true">
                <path d="M20 7H4a2 2 0 00-2 2v9a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2zM16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* ---- Discreet footer with staff entry ---- */}
      <footer className="border-t pt-6 text-center text-xs text-gray-400 dark:border-gray-700">
        <p>© SkillLink · Kandy</p>
        <a href={`/${locale}/admin/login`} className="mt-2 inline-block text-gray-400 hover:text-primary hover:underline">
          {t('staff')}
        </a>
      </footer>
    </div>
    </LandingGate>
  );
}
