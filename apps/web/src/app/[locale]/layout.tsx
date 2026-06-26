import type { ReactNode } from 'react';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { ThemeToggle } from '@/components/ThemeToggle';
import { HeaderAuth } from '@/components/HeaderAuth';
import { NotificationBell } from '@/components/NotificationBell';

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
    <html lang={locale}>
      <head><script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} /></head>
      <body>
        <NextIntlClientProvider messages={messages}>
          {/* Mobile-first shell; widens on desktop so the admin sidebar has room.
              Customer/provider pages stay readable via their own max-width wrappers. */}
          <div className="mx-auto min-h-screen max-w-[480px] bg-white shadow-sm md:max-w-6xl dark:bg-gray-900">
            <header className="flex items-center justify-between border-b px-4 py-3 dark:border-gray-700">
              <a href={`/${locale}`} className="font-display text-lg font-bold text-primary">SkillLink LK</a>
              <div className="flex items-center gap-3">
                <NotificationBell />
                <HeaderAuth />
                <LanguageSwitcher />
                <ThemeToggle />
              </div>
            </header>
            {/* Content centers narrow by default (phone-first pages); when an admin
                sidebar (<aside>) is present, the area uses full width. */}
            <main className="px-4 py-5 [&>*:not(:has(aside))]:mx-auto [&>*:not(:has(aside))]:max-w-md">{children}</main>
          </div>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
