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

// Inline script: apply saved theme before paint to avoid a flash of light mode.
const THEME_SCRIPT = `try{var t=localStorage.getItem('skilllink_theme');if(t==='dark')document.documentElement.classList.add('dark');}catch(e){}`;

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
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
          <div className="mx-auto flex min-h-screen max-w-[520px] flex-col bg-surface md:max-w-7xl md:bg-white dark:bg-[#0B0D12] dark:md:bg-gray-900">
            <header className="sticky top-0 z-30 flex items-center justify-between gap-2 border-b border-line bg-white/80 px-4 py-3 backdrop-blur-md dark:border-gray-800 dark:bg-[#0B0D12]/80">
              <div className="flex min-w-0 items-center gap-2.5">
                <AppMobileMenu />
                <a href={`/${locale}`} className="flex shrink-0 items-center gap-2 font-display text-lg font-extrabold tracking-tightest text-ink dark:text-gray-50">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-sm font-black text-white">S</span>
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
              {/* Content. Narrow pages stay centered & readable; pb-24 on mobile clears
                  the fixed tab bar. */}
              <main className="min-w-0 flex-1 px-4 py-5 pb-24 md:pb-8 [&>*:not(:has(aside))]:mx-auto [&>*:not(:has(aside))]:max-w-3xl">{children}</main>
            </div>

            {/* Role-aware bottom tabs — signed-in, mobile only. */}
            <AppBottomNav />
          </div>
          <SessionExpiredModal />
        </ToastProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
