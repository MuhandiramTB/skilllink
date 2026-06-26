'use client';

import { useEffect, useState } from 'react';
import { useParams, usePathname } from 'next/navigation';
import { getSession } from '@/lib/session';
import { AdminSidebar } from '@/components/AdminSidebar';

/**
 * Admin shell — grouped left sidebar (desktop) / drawer (mobile) + content.
 * The hidden /admin/login page is exempt (it IS the sign-in). Otherwise: redirect
 * to /admin/login if not signed in, bounce non-admins home. API enforces role=admin.
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

  return (
    <div className="md:flex md:gap-6">
      <AdminSidebar />
      <div className="min-w-0 flex-1 py-2 md:py-0">{children}</div>
    </div>
  );
}
