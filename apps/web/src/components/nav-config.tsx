import type { Role } from '@/lib/session';

/**
 * Single source of truth for navigation across the app.
 *
 * Each role has:
 *  - `groups`: the full menu, shown in the desktop left sidebar and the mobile drawer.
 *  - `tabs`:  the 3 primary destinations surfaced in the mobile bottom bar (a "You"
 *             account tab is appended by the bottom nav itself).
 *
 * Paths are locale-relative (the caller prefixes `/${locale}`). One icon set drives
 * both surfaces so desktop and mobile never drift apart.
 */

// `labelKey`/`titleKey` resolve against the `nav` i18n namespace at render time, so
// the sidebar/drawer/bottom-nav all translate with the language switch.
export interface NavItem { labelKey: string; path: string; icon: keyof typeof ICONS }
export interface NavGroup { titleKey: string; items: NavItem[] }
export interface RoleNav { groups: NavGroup[]; tabs: NavItem[] }

const stroke = (d: string) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 shrink-0" aria-hidden="true">
    <path d={d} />
  </svg>
);

export const ICONS = {
  home: stroke('M3 11l9-8 9 8M5 10v10h14V10'),
  search: stroke('M11 19a8 8 0 100-16 8 8 0 000 16zM21 21l-4.3-4.3'),
  chat: stroke('M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z'),
  user: stroke('M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z'),
  briefcase: stroke('M20 7H4a2 2 0 00-2 2v9a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2zM16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2'),
  wallet: stroke('M21 12V7H5a2 2 0 010-4h14v4M3 5v14a2 2 0 002 2h16v-5M18 12a2 2 0 000 4h4v-4z'),
  grid: stroke('M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z'),
  star: stroke('M12 2l3 7 7 .5-5.3 4.6 1.7 6.9L12 17l-6.1 4 1.7-6.9L2 9.5 9 9z'),
  shield: stroke('M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z'),
  map: stroke('M9 3L4 5v16l5-2 6 2 5-2V3l-5 2-6-2z'),
  receipt: stroke('M5 3v18l2-1 2 1 2-1 2 1 2-1 2 1V3l-2 1-2-1-2 1-2-1-2 1z'),
  flag: stroke('M4 21V4a1 1 0 011-1h12l-2 4 2 4H5'),
  bell: stroke('M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 01-3.4 0'),
  settings: stroke('M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.6 1.6 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.6 1.6 0 00-2.7 1.1V21a2 2 0 11-4 0v-.1a1.6 1.6 0 00-2.7-1.1l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.6 1.6 0 00-1.1-2.7H3a2 2 0 110-4h.1a1.6 1.6 0 001.1-2.7l-.1-.1a2 2 0 112.8-2.8l.1.1a1.6 1.6 0 001.8.3 1.6 1.6 0 001-1.5V3a2 2 0 114 0v.1a1.6 1.6 0 001 1.5 1.6 1.6 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.6 1.6 0 00-.3 1.8 1.6 1.6 0 001.5 1H21a2 2 0 110 4h-.1a1.6 1.6 0 00-1.5 1z'),
} as const;

export const NAV: Record<Role, RoleNav> = {
  customer: {
    groups: [
      { titleKey: 'groupDashboard', items: [
        { labelKey: 'home', path: '/dashboard/customer', icon: 'home' },
        { labelKey: 'bookService', path: '/book', icon: 'search' },
      ]},
      { titleKey: 'groupActivity', items: [
        { labelKey: 'myBookings', path: '/bookings', icon: 'chat' },
        { labelKey: 'profile', path: '/register', icon: 'user' },
      ]},
    ],
    tabs: [
      { labelKey: 'home', path: '/dashboard/customer', icon: 'home' },
      { labelKey: 'book', path: '/book', icon: 'search' },
      { labelKey: 'bookings', path: '/bookings', icon: 'chat' },
    ],
  },
  provider: {
    groups: [
      { titleKey: 'groupDashboard', items: [
        { labelKey: 'home', path: '/dashboard/provider', icon: 'home' },
        { labelKey: 'jobRequests', path: '/provider/jobs', icon: 'briefcase' },
      ]},
      { titleKey: 'groupBusiness', items: [
        { labelKey: 'verification', path: '/provider/register', icon: 'shield' },
      ]},
    ],
    tabs: [
      { labelKey: 'home', path: '/dashboard/provider', icon: 'home' },
      { labelKey: 'jobs', path: '/provider/jobs', icon: 'briefcase' },
      { labelKey: 'profile', path: '/profile', icon: 'user' },
    ],
  },
  admin: {
    groups: [
      { titleKey: 'groupOverview', items: [
        { labelKey: 'dashboard', path: '/dashboard/admin', icon: 'home' },
        { labelKey: 'reports', path: '/admin/reports', icon: 'grid' },
        { labelKey: 'auditLog', path: '/admin/audit', icon: 'receipt' },
      ]},
      { titleKey: 'groupMarketplace', items: [
        { labelKey: 'users', path: '/admin/users', icon: 'user' },
        { labelKey: 'providers', path: '/admin/verifications', icon: 'shield' },
        { labelKey: 'bookings', path: '/admin/bookings', icon: 'chat' },
        { labelKey: 'payments', path: '/admin/payments', icon: 'wallet' },
      ]},
      { titleKey: 'groupCatalog', items: [
        { labelKey: 'categories', path: '/admin/categories', icon: 'grid' },
        { labelKey: 'districts', path: '/admin/districts', icon: 'map' },
      ]},
      { titleKey: 'groupSupport', items: [
        { labelKey: 'disputes', path: '/admin/disputes', icon: 'flag' },
        { labelKey: 'settings', path: '/admin/settings', icon: 'settings' },
      ]},
    ],
    tabs: [
      { labelKey: 'home', path: '/dashboard/admin', icon: 'home' },
      { labelKey: 'users', path: '/admin/users', icon: 'user' },
      { labelKey: 'catalog', path: '/admin/categories', icon: 'grid' },
    ],
  },
};
