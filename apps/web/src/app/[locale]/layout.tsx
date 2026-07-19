import type { ReactNode } from 'react';
import { Sora, Plus_Jakarta_Sans } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';

// Display: Sora (tight, confident grotesk). Body/UI: Plus Jakarta Sans (humanist).
// Loaded via next/font so they self-host (no CDN, no flash, no silent fallback).
const display = Sora({ subsets: ['latin'], weight: ['600', '700', '800'], variable: '--font-display', display: 'swap' });
const body = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-body', display: 'swap' });
import { routing } from '@/i18n/routing';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { ThemeToggle } from '@/components/ThemeToggle';
import { NotificationBell } from '@/components/NotificationBell';
import { AppBottomNav } from '@/components/AppBottomNav';
import { AppSidebar } from '@/components/AppSidebar';
import { AppMobileMenu } from '@/components/AppMobileMenu';
import { AvatarButton } from '@/components/AvatarButton';
import { ToastProvider } from '@/components/Toast';
import { SessionExpiredModal } from '@/components/SessionExpiredModal';
import { Onboarding } from '@/components/Onboarding';
import { InstallPrompt } from '@/components/InstallPrompt';

// Inline script: apply saved theme before paint to avoid a flash of light mode.
const THEME_SCRIPT = `try{var t=localStorage.getItem('skilllink_theme');if(t==='dark')document.documentElement.classList.add('dark');}catch(e){}`;

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

// SEO + social + PWA metadata. Localised titles/descriptions per locale so shares
// and search results read right in Sinhala/Tamil/English.
const META: Record<string, { title: string; description: string }> = {
  en: { title: 'SkillLink — Trusted home services in Sri Lanka', description: 'Book verified electricians, plumbers, cleaners and more near you. Rated pros, clear pricing, secure booking.' },
  si: { title: 'SkillLink — ශ්‍රී ලංකාවේ විශ්වාසනීය ගෘහ සේවා', description: 'ඔබ අසල සත්‍යාපිත විදුලි කාර්මික, ජලනල, පිරිසිදු කිරීම් වෘත්තිකයන් වෙන්කරවා ගන්න.' },
  ta: { title: 'SkillLink — இலங்கையில் நம்பகமான வீட்டு சேவைகள்', description: 'உங்கள் அருகில் சரிபார்க்கப்பட்ட மின்வினைஞர்கள், குழாய் பணியாளர்கள், சுத்தம் செய்பவர்களை பதிவு செய்யுங்கள்.' },
};

export async function generateMetadata({ params }: { params: { locale: string } }) {
  const m = META[params.locale] ?? META.en;
  return {
    title: { default: m.title, template: '%s · SkillLink' },
    description: m.description,
    applicationName: 'SkillLink',
    manifest: '/manifest.webmanifest',
    themeColor: '#0B0D12',
    appleWebApp: { capable: true, statusBarStyle: 'default' as const, title: 'SkillLink' },
    openGraph: { title: m.title, description: m.description, siteName: 'SkillLink', type: 'website' as const, locale: params.locale },
    twitter: { card: 'summary_large_image' as const, title: m.title, description: m.description },
    icons: { icon: '/icon.svg', apple: '/icon.svg' },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: { locale: string };
}) {
  const { locale } = params;
  if (!routing.locales.includes(locale as never)) notFound();
  setRequestLocale(locale);

  const messages = await getMessages();

  return (
    <html lang={locale} className={`${display.variable} ${body.variable}`}>
      <head><script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} /></head>
      <body className="font-body">
        <NextIntlClientProvider messages={messages}>
        <ToastProvider>
          {/* Single app shell.
              Mobile (<md): full-width column — top bar (hamburger + logo + mode +
                utilities) → content → fixed bottom tab bar. Full menu via the drawer.
              Desktop (md+): top bar spans the width, then [left sidebar | content].
              No page renders its own header/sidebar. */}
          {/* Full-bleed shell. Mobile: single column on the surface ground. Desktop:
              the whole viewport is used — sidebar + a content area that spans the
              canvas. Pages control their own inner max-width (dashboards go wide via
              PageShell 'wide'; forms/detail stay centered via PageShell 'narrow'). */}
          <div className="flex min-h-screen flex-col bg-surface dark:bg-[#0A0B0F]">
            <header className="sticky top-0 z-30 flex items-center justify-between gap-2 border-b border-line bg-white/80 px-4 py-3 backdrop-blur-md dark:border-gray-800 dark:bg-[#0A0B0F]/80 md:px-6">
              <div className="flex min-w-0 items-center gap-2.5">
                <AppMobileMenu />
                <a href={`/${locale}`} className="flex shrink-0 items-center gap-2 font-display text-lg font-extrabold tracking-tightest text-ink dark:text-gray-50">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand text-sm font-black text-brand-ink shadow-brand">S</span>
                  SkillLink
                </a>
              </div>
              {/* Utilities — always reachable, including on mobile when signed out
                  (theme + language must never disappear). ModeSwitch/bell render only
                  when signed in, so the row stays compact otherwise. */}
              <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
                <NotificationBell />
                <LanguageSwitcher />
                <ThemeToggle />
                <AvatarButton />
              </div>
            </header>

            <div className="flex flex-1">
              {/* Desktop left rail (role-aware); hidden on mobile (drawer + tabs cover it). */}
              <AppSidebar />
              {/* Content. Full width; each page sizes itself with PageShell. pb-24 on
                  mobile clears the fixed tab bar. Wide max so 2K screens don't sprawl. */}
              <main className="mx-auto min-w-0 w-full max-w-[1400px] flex-1 px-4 py-5 pb-24 sm:px-6 md:py-7 md:pb-10">{children}</main>
            </div>

            {/* Role-aware bottom tabs — signed-in, mobile only. */}
            <AppBottomNav />
          </div>
          <SessionExpiredModal />
          <Onboarding />
          <InstallPrompt />
        </ToastProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
