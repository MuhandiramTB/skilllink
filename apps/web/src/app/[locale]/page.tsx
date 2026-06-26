import { getTranslations, setRequestLocale } from 'next-intl/server';
import { fetchCategories, type CategoryNode } from '@/lib/api';

type Locale = 'en' | 'si' | 'ta';

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

  return (
    <div className="space-y-6">
      {/* Hero — customer-first thesis */}
      <section className="rounded-2xl bg-primary p-6 text-white">
        <p className="text-xs font-semibold uppercase tracking-widest text-white/70">{t('near')}</p>
        <h1 className="mt-2 font-display text-2xl font-semibold leading-snug">{t('tagline')}</h1>
        <a
          href={`/${locale}/login`}
          className="mt-4 inline-block rounded-base bg-white px-5 py-2.5 text-sm font-semibold text-primary"
        >
          {t('signIn')}
        </a>
      </section>

      <div>
        <h2 className="mb-3 text-lg font-semibold">{t('chooseCategory')}</h2>
        {failed && <p className="rounded-base bg-red-50 p-3 text-danger">{t('error')}</p>}
        <ul className="grid grid-cols-2 gap-3">
          {categories.map((c) => (
            <li key={c.id}>
              <a
                href={`/${locale}/category/${c.key}`}
                className="block rounded-base border bg-white p-4 text-center shadow-sm transition hover:border-primary hover:shadow dark:border-gray-700 dark:bg-gray-800"
              >
                <span className="block font-medium">{c.name[locale]}</span>
                {c.children.length > 0 && (
                  <span className="mt-1 block text-xs text-gray-500">{c.children.length}+ services</span>
                )}
              </a>
            </li>
          ))}
        </ul>
      </div>

      {/* Become a provider — the deliberate "switch hat" path */}
      <a
        href={`/${locale}/login?intent=provider&next=/${locale}/provider/register`}
        className="block rounded-2xl border border-dashed border-accent/50 bg-accent/5 p-5 hover:border-accent dark:bg-accent/10"
      >
        <p className="font-display text-base font-semibold">{t('providerCta')}</p>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t('providerCtaSub')}</p>
      </a>

      <nav className="flex justify-center border-t pt-4 text-xs dark:border-gray-700">
        <a href={`/${locale}/admin`} className="text-gray-400 hover:underline">Staff / Admin sign in</a>
      </nav>
    </div>
  );
}
