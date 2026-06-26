'use client';

import { useState } from 'react';
import { useParams, usePathname } from 'next/navigation';
import { clearToken } from '@/lib/session';

/** Grouped admin navigation — left sidebar on desktop, collapsible drawer on mobile. */
const GROUPS: { title: string; items: { label: string; path: string }[] }[] = [
  { title: 'Overview', items: [
    { label: 'Dashboard', path: '/admin' },
    { label: 'Reports', path: '/admin/reports' },
    { label: 'Audit Log', path: '/admin/audit' },
  ]},
  { title: 'Marketplace', items: [
    { label: 'Users', path: '/admin/users' },
    { label: 'Providers', path: '/admin/verifications' },
    { label: 'Bookings', path: '/admin/bookings' },
    { label: 'Payments', path: '/admin/payments' },
  ]},
  { title: 'Catalog', items: [
    { label: 'Categories', path: '/admin/categories' },
    { label: 'Districts', path: '/admin/districts' },
  ]},
  { title: 'Support', items: [
    { label: 'Disputes', path: '/admin/disputes' },
    { label: 'Settings', path: '/admin/settings' },
  ]},
];

export function AdminSidebar() {
  const locale = (useParams().locale as string) ?? 'en';
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const Nav = (
    <nav className="space-y-5">
      {GROUPS.map((g) => (
        <div key={g.title}>
          <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400">{g.title}</p>
          <ul className="space-y-0.5">
            {g.items.map((it) => {
              const href = `/${locale}${it.path}`;
              const active = pathname === href;
              return (
                <li key={it.path}>
                  <a
                    href={href}
                    onClick={() => setOpen(false)}
                    className={`block rounded-base px-3 py-2 text-sm transition ${
                      active
                        ? 'bg-primary/10 font-medium text-primary dark:bg-primary/20'
                        : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                    }`}
                  >
                    {it.label}
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
      <button
        onClick={() => { clearToken(); window.location.href = `/${locale}`; }}
        className="mt-2 px-3 text-sm text-gray-500 hover:text-danger"
      >
        Sign out
      </button>
    </nav>
  );

  return (
    <>
      {/* Mobile top bar with menu toggle */}
      <div className="flex items-center justify-between border-b px-4 py-3 md:hidden dark:border-gray-700">
        <span className="font-display font-semibold text-primary">Admin</span>
        <button onClick={() => setOpen((o) => !o)} className="rounded-base border px-3 py-1 text-sm dark:border-gray-600">
          {open ? 'Close' : 'Menu'}
        </button>
      </div>
      {open && <div className="border-b px-4 py-4 md:hidden dark:border-gray-700">{Nav}</div>}

      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 border-r p-4 md:block dark:border-gray-700">
        <p className="mb-5 px-3 font-display text-lg font-bold text-primary">SkillLink Admin</p>
        {Nav}
      </aside>
    </>
  );
}
