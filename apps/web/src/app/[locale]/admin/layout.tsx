'use client';

import { useEffect, useState } from 'react';
import { useParams, usePathname } from 'next/navigation';
import { getSession } from '@/lib/session';

/**
 * Admin route guard. Navigation (the role-aware sidebar / mobile drawer / bottom tabs)
 * is owned by the global app shell, so this layout only enforces access: the hidden
 * /admin/login page is exempt; otherwise redirect to /admin/login if signed out and
 * bounce non-admins home. The API independently enforces role=admin.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const locale = (useParams().locale as string) ?? 'en';
  const pathname = usePathname();
  const isLoginPage = pathname.endsWith('/admin/login');
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    if (isLoginPage) return;
    const s = getSession();
    if (!s) { window.location.href = `/${locale}/admin/login`; return; }
    if (!s.roles.includes('admin')) { window.location.href = `/${locale}`; return; }
    setAuthed(true);
  }, [locale, isLoginPage]);

  if (isLoginPage) return <>{children}</>;
  if (!authed) return null;

  return <>{children}</>;
}
