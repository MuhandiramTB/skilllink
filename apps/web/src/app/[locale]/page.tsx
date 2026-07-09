import { getTranslations, setRequestLocale } from 'next-intl/server';
import { fetchCategories, type CategoryNode } from '@/lib/api';
import { LandingGate } from '@/components/LandingGate';
import { HeroSlider } from '@/components/HeroSlider';
import { Reveal } from '@/components/Reveal';
import { ICONS } from '@/components/nav-config';
import { CategoryIcon } from '@/components/category-icon';
import { LandingSearch } from '@/components/LandingSearch';
import { PriceHint } from '@/components/PriceHint';

type Locale = 'en' | 'si' | 'ta';

export default async function HomePage({ params }: { params: { locale: string } }) {
  const locale = params.locale as Locale;
  setRequestLocale(locale);
  const t = await getTranslations('home');
  const td = await getTranslations('dash');

  let categories: CategoryNode[] = [];
  let failed = false;
  try {
    categories = await fetchCategories();
  } catch {
    failed = true;
  }
  const top = categories.slice(0, 8);
  const searchCats = categories.map((c) => ({ key: c.key, name: c.name[locale] }));

  // Split the headline so the last word gets the accent color.
  const tagline = t('tagline');
  const lastSpace = tagline.lastIndexOf(' ');
  const taglineHead = lastSpace > 0 ? tagline.slice(0, lastSpace) : tagline;
  const taglineTail = lastSpace > 0 ? tagline.slice(lastSpace + 1) : '';

  const stats = [
    { value: '1,240+', label: t('statsJobs') },
    { value: '4.9★', label: t('statsRating') },
    { value: '320', label: t('statsPros') },
    { value: '10', label: t('statsAreas') },
  ];

  const how = [
    { n: '01', title: t('how1Title'), body: t('how1Body'), icon: ICONS.search },
    { n: '02', title: t('how2Title'), body: t('how2Body'), icon: ICONS.shield },
    { n: '03', title: t('how3Title'), body: t('how3Body'), icon: ICONS.star },
  ];

  return (
    <LandingGate>
    <div className="-mx-4 -my-5 sm:-mx-6 md:-my-7">
      {/* ===== Hero ===== */}
      <section className="relative overflow-hidden px-4 pb-10 pt-12 sm:px-6 md:pb-16 md:pt-20">
        {/* Ambient accent glows */}
        <div className="pointer-events-none absolute -right-24 top-0 h-80 w-80 rounded-full bg-primary/10 blur-3xl" aria-hidden="true" />
        <div className="pointer-events-none absolute -left-24 bottom-0 h-72 w-72 rounded-full bg-primary/5 blur-3xl" aria-hidden="true" />

        <div className="relative z-10 mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-2">
          {/* Left: copy + search + social proof */}
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-3 py-1 text-xs font-semibold text-slate shadow-card dark:border-gray-800 dark:bg-gray-900">
              <span className="flex h-1.5 w-1.5 rounded-full bg-success" aria-hidden="true" />
              {t('trustLocal')}
            </span>
            <h1 className="mt-4 font-display text-[34px] font-extrabold leading-[1.05] tracking-tightest text-ink dark:text-gray-50 sm:text-5xl md:text-[56px]" style={{ textWrap: 'balance' } as React.CSSProperties}>
              {taglineHead} {taglineTail && <span className="text-primary">{taglineTail}</span>}
            </h1>
            <p className="mt-4 max-w-md text-base leading-relaxed text-slate sm:text-lg">{t('heroSub')}</p>

            {/* Smart location + service search — the page's centerpiece. Real handoff
                to the authenticated match flow. */}
            <div className="mt-7">
              {failed ? (
                <p className="rounded-base border border-red-200 bg-red-50 p-3 text-sm font-medium text-danger dark:border-red-500/30 dark:bg-red-950/40">{t('error')}</p>
              ) : (
                <LandingSearch locale={locale} categories={searchCats} />
              )}
            </div>

            {/* Popular quick-chips */}
            {top.length > 0 && (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium text-slate-2">{t('popularSub')}</span>
                {top.slice(0, 4).map((c) => (
                  <a key={c.id} href={`/${locale}/category/${c.key}`} className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1.5 text-xs font-semibold text-ink transition-all hover:-translate-y-0.5 hover:border-primary hover:text-primary hover:shadow-card dark:border-gray-800 dark:bg-gray-900 dark:text-gray-100">
                    <CategoryIcon keyName={c.key} className="h-3.5 w-3.5" />
                    {c.name[locale]}
                  </a>
                ))}
              </div>
            )}

            {/* Social proof */}
            <div className="mt-6 flex items-center gap-3">
              <div className="flex -space-x-3" aria-hidden="true">
                {[
                  { c: 'bg-primary', icon: 'bolt' as const },
                  { c: 'bg-ink', icon: 'tools' as const },
                  { c: 'bg-success', icon: 'shield' as const },
                ].map((a, n) => (
                  <span key={n} className={`flex h-9 w-9 items-center justify-center rounded-full border-2 border-white text-white ${a.c} dark:border-gray-900 [&>svg]:h-4 [&>svg]:w-4`}>
                    {ICONS[a.icon]}
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

        {/* Stats band */}
        <Reveal>
        <div className="mx-auto mt-12 grid max-w-6xl grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          {stats.map((s) => (
            <div key={s.label} className="rounded-xl2 border border-line bg-white p-4 text-center shadow-card dark:border-gray-800 dark:bg-gray-900 sm:p-5">
              <div className="font-display text-2xl font-extrabold tracking-tightest text-ink dark:text-gray-50 sm:text-3xl">{s.value}</div>
              <div className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-slate sm:text-xs">{s.label}</div>
            </div>
          ))}
        </div>
        </Reveal>
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
            <span className="[&>svg]:h-4 [&>svg]:w-4" aria-hidden="true">{ICONS.search}</span>
          </a>
        </div>
        {failed && <p className="rounded-base border border-red-200 bg-red-50 p-3 text-sm font-medium text-danger dark:border-red-500/30 dark:bg-red-950/40">{t('error')}</p>}
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {top.slice(0, 6).map((c, i) => (
            <li key={c.id}>
              <Reveal delay={i * 50}>
              <a
                href={`/${locale}/category/${c.key}`}
                className="group flex h-full flex-col items-center gap-3 rounded-xl2 border border-line bg-white p-5 text-center shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-primary hover:shadow-lift dark:border-gray-800 dark:bg-gray-900"
              >
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                  <CategoryIcon keyName={c.key} className="h-6 w-6" />
                </span>
                <span className="text-sm font-semibold text-ink dark:text-gray-100">{c.name[locale]}</span>
                {c.price && (
                  <PriceHint price={c.price} fromLabel={td('priceFrom')} rangeLabel={td('priceRange')} className="justify-center" />
                )}
              </a>
              </Reveal>
            </li>
          ))}
        </ul>
      </section>
      </Reveal>

      {/* ===== How it works ===== */}
      <Reveal>
      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 md:py-14">
        <div className="mb-10 max-w-2xl">
          <h2 className="font-display text-2xl font-extrabold tracking-tightest text-ink dark:text-gray-50 sm:text-[32px]">{t('howTitle')}</h2>
          <p className="mt-2 text-base text-slate">{t('howSub')}</p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {how.map((s, i) => (
            <Reveal key={s.n} delay={i * 80}>
            <div className="relative flex h-full flex-col gap-3 rounded-xl2 border border-line bg-white p-6 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-lift dark:border-gray-800 dark:bg-gray-900">
              <div className="flex items-center justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-soft text-primary [&>svg]:h-5 [&>svg]:w-5 dark:bg-primary/15" aria-hidden="true">{s.icon}</span>
                <span className="font-display text-3xl font-extrabold tracking-tightest text-line dark:text-gray-800">{s.n}</span>
              </div>
              <h3 className="font-display text-lg font-bold text-ink dark:text-gray-50">{s.title}</h3>
              <p className="text-sm leading-relaxed text-slate">{s.body}</p>
            </div>
            </Reveal>
          ))}
        </div>
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
              // Bootstrap Icons (16×16 fill): shield-check, cash-coin, patch-check-fill
              { title: t('whyVerifiedTitle'), body: t('whyVerifiedBody'), d: 'M5.338 1.59a61 61 0 0 0-2.837.856.48.48 0 0 0-.328.39c-.554 4.157.726 7.19 2.253 9.188a10.7 10.7 0 0 0 2.287 2.233c.346.244.652.42.893.533q.18.085.293.118a1 1 0 0 0 .101.025 1 1 0 0 0 .1-.025q.114-.034.294-.118c.24-.113.547-.29.893-.533a10.7 10.7 0 0 0 2.287-2.233c1.527-1.997 2.807-5.031 2.253-9.188a.48.48 0 0 0-.328-.39c-.651-.213-1.75-.56-2.837-.855C9.552 1.29 8.531 1.067 8 1.067c-.53 0-1.552.223-2.662.524zM5.072.56C6.157.265 7.31 0 8 0s1.843.265 2.928.56c1.11.3 2.229.655 2.887.87a1.54 1.54 0 0 1 1.044 1.262c.596 4.477-.787 7.795-2.465 9.99a11.8 11.8 0 0 1-2.517 2.453 7 7 0 0 1-1.048.625c-.28.132-.581.24-.829.24s-.548-.108-.829-.24a7 7 0 0 1-1.048-.625 11.8 11.8 0 0 1-2.517-2.453C1.928 10.487.545 7.169 1.141 2.692A1.54 1.54 0 0 1 2.185 1.43 63 63 0 0 1 5.072.56M10.854 5.146a.5.5 0 0 1 0 .708l-3 3a.5.5 0 0 1-.708 0l-1.5-1.5a.5.5 0 1 1 .708-.708L7.5 7.793l2.646-2.647a.5.5 0 0 1 .708 0' },
              { title: t('whyPricingTitle'), body: t('whyPricingBody'), d: 'M11 15a4 4 0 1 0 0-8 4 4 0 0 0 0 8m5-4a5 5 0 1 1-10 0 5 5 0 0 1 10 0M9.438 5.482a5 5 0 0 0-.35.13 2.6 2.6 0 0 1 .567.518 3 3 0 0 1 .453-.083l-.72-.565zM11 3.5A3.5 3.5 0 0 0 7.5 0a3.5 3.5 0 0 0-3.482 3.16A3.5 3.5 0 0 0 4 3.5c0 .316.041.622.12.913a5.5 5.5 0 0 1 1.416-.647A2.5 2.5 0 0 1 7.5 1a2.5 2.5 0 0 1 2.474 2.85q.5.06.966.201A3.5 3.5 0 0 0 11 3.5m-6.633 4.7a3 3 0 0 1-.4.313 5 5 0 0 1-.437-.166l-.017.006L1.5 9.146A3.5 3.5 0 0 1 4.02 5.16a5.5 5.5 0 0 0 .347 3.04' },
              { title: t('whyGuaranteeTitle'), body: t('whyGuaranteeBody'), d: 'M10.067.87a2.89 2.89 0 0 0-4.134 0l-.622.638-.89-.011a2.89 2.89 0 0 0-2.924 2.924l.01.89-.636.622a2.89 2.89 0 0 0 0 4.134l.637.622-.011.89a2.89 2.89 0 0 0 2.924 2.924l.89-.01.622.636a2.89 2.89 0 0 0 4.134 0l.622-.637.89.011a2.89 2.89 0 0 0 2.924-2.924l-.01-.89.636-.622a2.89 2.89 0 0 0 0-4.134l-.637-.622.011-.89a2.89 2.89 0 0 0-2.924-2.924l-.89.01zm.287 5.984-3 3a.5.5 0 0 1-.708 0l-1.5-1.5a.5.5 0 1 1 .708-.708L7 8.293l2.646-2.647a.5.5 0 0 1 .708.708' },
            ].map((f, i) => (
              <Reveal key={f.title} delay={i * 80}>
              <div className="flex flex-col items-start gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-white shadow-card">
                  <svg viewBox="0 0 16 16" fill="currentColor" className="h-6 w-6" aria-hidden="true"><path d={f.d} /></svg>
                </span>
                <h3 className="font-display text-xl font-bold text-ink dark:text-gray-50">{f.title}</h3>
                <p className="text-sm leading-relaxed text-slate">{f.body}</p>
              </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
      </Reveal>

      {/* ===== Become a Provider CTA (ink panel) ===== */}
      <Reveal>
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl bg-ink p-8 sm:p-12 md:p-16">
          <div className="pointer-events-none absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '20px 20px' }} aria-hidden="true" />
          <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-primary/30 blur-3xl" aria-hidden="true" />
          <div className="relative z-10 flex flex-col items-start gap-10 md:flex-row md:items-center">
            <div className="md:w-3/5">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary-fixed-dim">{t('providerEyebrow')}</p>
              <h2 className="mt-3 font-display text-2xl font-extrabold tracking-tightest text-white sm:text-[32px]">{t('providerCta')}</h2>
              <p className="mt-3 max-w-lg text-base leading-relaxed text-white/70">{t('providerCtaSub')}</p>
              <div className="mt-7 flex flex-wrap gap-3">
                <a href={`/${locale}/login?intent=provider&next=/${locale}/provider/register`} className="rounded-lg bg-white px-6 py-3 text-sm font-bold text-ink transition-all duration-150 hover:bg-white/90 active:scale-95">
                  {t('providerButton')}
                </a>
                <a href="#services" className="rounded-lg border-2 border-white/30 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-white/10">
                  {t('browseAll')}
                </a>
              </div>
            </div>
            {/* Light "earnings" card, rotated. */}
            <div className="flex w-full justify-center md:w-2/5">
              <div className="w-full max-w-xs rotate-3 rounded-2xl border border-line bg-white p-4 shadow-2xl">
                <div className="mb-4 flex items-center gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-white [&>svg]:h-5 [&>svg]:w-5">{ICONS.wallet}</span>
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
