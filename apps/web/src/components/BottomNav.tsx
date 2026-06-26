'use client';

import { useParams, usePathname } from 'next/navigation';

/**
 * Mobile-first bottom navigation, role-aware (spec 10, Req 4).
 * Customer: Home · Bookings · Messages · Profile
 * Provider: Jobs · Earnings · Messages · Profile
 * (Messages links to the latest booking chat for v1; Profile → settings stub.)
 */
const ITEMS: Record<'customer' | 'provider', { label: string; path: string }[]> = {
  customer: [
    { label: 'Home', path: '' },
    { label: 'Bookings', path: '/bookings' },
    { label: 'Messages', path: '/bookings' },
    { label: 'Profile', path: '/register' },
  ],
  provider: [
    { label: 'Jobs', path: '/provider/jobs' },
    { label: 'Earnings', path: '/provider' },
    { label: 'Messages', path: '/provider/jobs' },
    { label: 'Profile', path: '/provider' },
  ],
};

export function BottomNav({ role }: { role: 'customer' | 'provider' }) {
  const locale = (useParams().locale as string) ?? 'en';
  const pathname = usePathname();
  const items = ITEMS[role];

  return (
    <nav className="sticky bottom-0 mt-6 flex border-t bg-white dark:border-gray-700 dark:bg-gray-900">
      {items.map((it) => {
        const href = `/${locale}${it.path}`;
        const active = pathname === href;
        return (
          <a
            key={it.label}
            href={href}
            className={`flex-1 py-3 text-center text-xs font-medium ${active ? 'text-primary' : 'text-gray-500 dark:text-gray-400'}`}
          >
            {it.label}
          </a>
        );
      })}
    </nav>
  );
}
