import { getTranslations, setRequestLocale } from 'next-intl/server';
import { fetchCategories, type CategoryNode } from '@/lib/api';
import { LandingGate } from '@/components/LandingGate';
import { HeroSlider } from '@/components/HeroSlider';
import { Reveal } from '@/components/Reveal';

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

  // Split the headline so the last word gets the accent color (Stitch "minutes").
  const tagline = t('tagline');
  const lastSpace = tagline.lastIndexOf(' ');
  const taglineHead = lastSpace > 0 ? tagline.slice(0, lastSpace) : tagline;
  const taglineTail = lastSpace > 0 ? tagline.slice(lastSpace + 1) : '';

  return (
    <LandingGate>
    <div className="-mx-4 -my-5 md:-my-8">
      {/* ===== Hero ===== */}
      <section className="relative overflow-hidden px-4 py-12 sm:px-6 md:py-20">
        <div className="pointer-events-none absolute -right-24 top-10 h-72 w-72 rounded-full bg-primary/10 blur-3xl" aria-hidden="true" />

        <div className="relative z-10 mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-2">
          {/* Left: copy + search + social proof */}
          <div>
            <h1 className="font-display text-[34px] font-extrabold leading-[1.08] tracking-tightest text-ink dark:text-gray-50 sm:text-5xl md:text-[56px]" style={{ textWrap: 'balance' } as React.CSSProperties}>
              {taglineHead} {taglineTail && <span className="text-primary">{taglineTail}</span>}
            </h1>
            <p className="mt-4 max-w-md text-base leading-relaxed text-slate sm:text-lg">{t('heroSub')}</p>

            {/* Search bar — routes to /book?q=<what> which pre-filters services.
                Wraps cleanly instead of clipping on narrower widths. */}
            <form action={`/${locale}/book`} method="get" className="mt-7 flex flex-wrap items-center gap-2 rounded-xl2 border border-line bg-white p-2 shadow-lift dark:border-gray-800 dark:bg-gray-900 sm:flex-nowrap">
              <div className="flex min-w-[10rem] flex-1 items-center gap-2.5 rounded-base px-3 py-2.5 sm:border-r sm:border-line dark:sm:border-gray-800">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 shrink-0 text-primary" aria-hidden="true"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.3-4.3" /></svg>
                <input name="q" className="w-full border-none bg-transparent text-sm text-ink placeholder:text-slate/60 focus:outline-none focus:ring-0 dark:text-gray-100" placeholder={t('searchWhat')} type="text" />
              </div>
              <div className="flex min-w-[8rem] flex-1 items-center gap-2.5 rounded-base px-3 py-2.5">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 shrink-0 text-primary" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></svg>
                <input name="loc" className="w-full border-none bg-transparent text-sm text-ink placeholder:text-slate/60 focus:outline-none focus:ring-0 dark:text-gray-100" placeholder={t('searchWhere')} type="text" />
              </div>
              <button type="submit" className="w-full shrink-0 rounded-base bg-primary px-7 py-3 text-sm font-bold text-white transition-all duration-150 hover:bg-primary-700 active:translate-y-px sm:w-auto">
                {t('search')}
              </button>
            </form>

            {/* Social proof */}
            <div className="mt-6 flex items-center gap-3">
              <div className="flex -space-x-3" aria-hidden="true">
                {['bg-primary', 'bg-ink', 'bg-success'].map((c, n) => (
                  <span key={n} className={`flex h-9 w-9 items-center justify-center rounded-full border-2 border-white text-xs font-bold text-white ${c} dark:border-gray-900`}>
                    {['👷', '🔧', '⚡'][n]}
                  </span>
                ))}
              </div>
              <p className="text-sm text-slate"><span className="font-bold text-primary">4,500+</span> {t('prosReady')}</p>
            </div>
          </div>

          {/* Right: image slider in a browser-mockup frame */}
          <div className="lg:pl-6">
            <HeroSlider />
          </div>
        </div>
      </section>

      {/* ===== Popular services (bento grid) ===== */}
      <Reveal>
      <section id="services" className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="mb-6 flex items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl font-extrabold tracking-tightest text-ink dark:text-gray-50 sm:text-[32px]">{t('chooseCategory')}</h2>
            <p className="mt-1 text-sm text-slate">{t('popularSub')}</p>
          </div>
          <a href={`/${locale}/book`} className="flex shrink-0 items-center gap-1 text-sm font-semibold text-primary hover:underline">
            {t('viewAll')}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
          </a>
        </div>
        {failed && <p className="rounded-base border border-red-200 bg-red-50 p-3 text-sm font-medium text-danger dark:border-red-500/30 dark:bg-red-950/40">{t('error')}</p>}
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {top.slice(0, 6).map((c) => (
            <li key={c.id}>
              <a
                href={`/${locale}/category/${c.key}`}
                className="group flex h-full flex-col items-center gap-3 rounded-xl2 border border-line bg-white p-5 text-center shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift dark:border-gray-800 dark:bg-gray-900"
              >
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6" aria-hidden="true">
                    <path d={categoryIcon(c.key)} />
                  </svg>
                </span>
                <span className="text-sm font-semibold text-ink dark:text-gray-100">{c.name[locale]}</span>
              </a>
            </li>
          ))}
        </ul>
      </section>
      </Reveal>

      {/* ===== Why SkillLink ===== */}
      <Reveal>
      <section className="bg-white px-4 py-14 dark:bg-gray-900/40 sm:px-6 md:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="font-display text-2xl font-extrabold tracking-tightest text-ink dark:text-gray-50 sm:text-[32px]">{t('whyTitle')}</h2>
            <p className="mt-3 text-base text-slate sm:text-lg">{t('whySub')}</p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {[
              { title: t('whyVerifiedTitle'), body: t('whyVerifiedBody'), d: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z' },
              { title: t('whyPricingTitle'), body: t('whyPricingBody'), d: 'M21 12V7H5a2 2 0 010-4h14v4M3 5v14a2 2 0 002 2h16v-5M18 12a2 2 0 000 4h4v-4z' },
              { title: t('whyGuaranteeTitle'), body: t('whyGuaranteeBody'), d: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10zM9 12l2 2 4-4' },
            ].map((f) => (
              <div key={f.title} className="flex flex-col items-start gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-white">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6" aria-hidden="true"><path d={f.d} /></svg>
                </span>
                <h3 className="font-display text-xl font-bold text-ink dark:text-gray-50">{f.title}</h3>
                <p className="text-sm leading-relaxed text-slate">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      </Reveal>

      {/* ===== Become a Provider CTA (Stitch: deep-navy panel, white buttons) ===== */}
      <Reveal>
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl bg-[#131b2e] p-8 sm:p-12 md:p-16">
          <div className="pointer-events-none absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '20px 20px' }} aria-hidden="true" />
          <div className="relative z-10 flex flex-col items-start gap-10 md:flex-row md:items-center">
            <div className="md:w-3/5">
              <h2 className="font-display text-2xl font-extrabold tracking-tightest text-white sm:text-[32px]">{t('providerCta')}</h2>
              <p className="mt-3 max-w-lg text-base leading-relaxed text-white/70">{t('providerCtaSub')}</p>
              <div className="mt-7 flex flex-wrap gap-3">
                <a href={`/${locale}/login?intent=provider&next=/${locale}/provider/register`} className="rounded-lg bg-white px-6 py-3 text-sm font-bold text-[#131b2e] transition-all duration-150 hover:bg-white/90 active:scale-95">
                  {t('providerButton')}
                </a>
                <a href="#services" className="rounded-lg border-2 border-white/30 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-white/10">
                  {t('browseAll')}
                </a>
              </div>
            </div>
            {/* Light "dashboard" card, rotated — matches the Stitch tactile-card. */}
            <div className="flex w-full justify-center md:w-2/5">
              <div className="w-full max-w-xs rotate-3 rounded-2xl border border-line bg-white p-4 shadow-2xl">
                <div className="mb-4 flex items-center gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-white">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M3 3v18h18M7 14l4-4 3 3 5-6" /></svg>
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-ink">{t('providerBenefit3')}</p>
                    <p className="text-xs tabular-nums text-slate">LKR 124,050</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-2 w-full rounded-full bg-surface" />
                  <div className="h-2 w-4/5 rounded-full bg-surface" />
                  <div className="h-2 w-3/4 rounded-full bg-primary/30" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      </Reveal>

      {/* ===== Footer with staff entry ===== */}
      <footer className="border-t border-line px-4 py-8 text-center text-xs text-slate dark:border-gray-800">
        <p>© SkillLink · Kandy</p>
        <a href={`/${locale}/admin/login`} className="mt-2 inline-block text-slate hover:text-primary hover:underline">
          {t('staff')}
        </a>
      </footer>
    </div>
    </LandingGate>
  );
}
