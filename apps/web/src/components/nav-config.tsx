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

/**
 * Icons are authentic Bootstrap Icons (https://icons.getbootstrap.com), inlined
 * as their raw path data — no runtime dependency, no icon web-font, works offline.
 * Bootstrap Icons are filled glyphs on a 16×16 viewBox, so we render with
 * `fill="currentColor"` and let text color drive them. `bi()` is the renderer.
 */
const bi = (d: string) => (
  <svg viewBox="0 0 16 16" fill="currentColor" className="h-5 w-5 shrink-0" aria-hidden="true">
    <path d={d} />
  </svg>
);

export const ICONS = {
  // bi-house-door-fill
  home: bi('M6.5 14.5v-3.505c0-.245.25-.495.5-.495h2c.25 0 .5.25.5.5v3.5a.5.5 0 0 0 .5.5h4a.5.5 0 0 0 .5-.5v-7a.5.5 0 0 0-.146-.354L13 5.793V2.5a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 0-.5.5v1.293L8.354 1.146a.5.5 0 0 0-.708 0l-6 6A.5.5 0 0 0 1.5 7.5v7a.5.5 0 0 0 .5.5h4a.5.5 0 0 0 .5-.5'),
  // bi-search
  search: bi('M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0'),
  // bi-chat-square-text-fill
  chat: bi('M2 0a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2v3.5a.5.5 0 0 0 .854.354L8.207 12H14a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2zm1.5 4h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1 0-1m0 2.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1 0-1m0 2.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1 0-1'),
  // bi-person-fill
  user: bi('M3 14s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1zm5-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6'),
  // bi-briefcase-fill
  briefcase: bi('M6.5 1A1.5 1.5 0 0 0 5 2.5V3H1.5A1.5 1.5 0 0 0 0 4.5v1.384l7.614 2.03a1.5 1.5 0 0 0 .772 0L16 5.884V4.5A1.5 1.5 0 0 0 14.5 3H11v-.5A1.5 1.5 0 0 0 9.5 1zm0 1h3a.5.5 0 0 1 .5.5V3H6v-.5a.5.5 0 0 1 .5-.5m1.038 6.855L0 6.855V12.5A1.5 1.5 0 0 0 1.5 14h13a1.5 1.5 0 0 0 1.5-1.5V6.855l-7.538 2.01a2.5 2.5 0 0 1-.924 0z'),
  // bi-wallet2
  wallet: bi('M12.136.326A1.5 1.5 0 0 1 14 1.78V3h.5A1.5 1.5 0 0 1 16 4.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 0 13.5v-9a1.5 1.5 0 0 1 1.432-1.499zM5.562 3H13V1.78a.5.5 0 0 0-.621-.484zM1.5 4a.5.5 0 0 0-.5.5v9a.5.5 0 0 0 .5.5h13a.5.5 0 0 0 .5-.5v-9a.5.5 0 0 0-.5-.5z'),
  // bi-grid-fill
  grid: bi('M1 2.5A1.5 1.5 0 0 1 2.5 1h3A1.5 1.5 0 0 1 7 2.5v3A1.5 1.5 0 0 1 5.5 7h-3A1.5 1.5 0 0 1 1 5.5zm8 0A1.5 1.5 0 0 1 10.5 1h3A1.5 1.5 0 0 1 15 2.5v3A1.5 1.5 0 0 1 13.5 7h-3A1.5 1.5 0 0 1 9 5.5zm-8 8A1.5 1.5 0 0 1 2.5 9h3A1.5 1.5 0 0 1 7 10.5v3A1.5 1.5 0 0 1 5.5 15h-3A1.5 1.5 0 0 1 1 13.5zm8 0A1.5 1.5 0 0 1 10.5 9h3a1.5 1.5 0 0 1 1.5 1.5v3a1.5 1.5 0 0 1-1.5 1.5h-3A1.5 1.5 0 0 1 9 13.5z'),
  // bi-star-fill
  star: bi('M3.612 15.443c-.386.198-.824-.149-.746-.592l.83-4.73L.173 6.765c-.329-.314-.158-.888.283-.95l4.898-.696L7.538.792c.197-.39.73-.39.927 0l2.184 4.327 4.898.696c.441.062.612.636.283.95l-3.523 3.356.83 4.73c.078.443-.36.79-.746.592L8 13.187l-4.389 2.256'),
  // bi-shield-fill-check
  shield: bi('M8 0c-.69 0-1.843.265-2.928.56-1.11.3-2.229.655-2.887.87a1.54 1.54 0 0 0-1.044 1.262c-.596 4.477.787 7.795 2.465 9.99a11.8 11.8 0 0 0 2.517 2.453c.386.273.744.482 1.048.625.28.132.581.24.829.24s.548-.108.829-.24a7 7 0 0 0 1.048-.625 11.8 11.8 0 0 0 2.517-2.453c1.678-2.195 3.061-5.513 2.465-9.99a1.54 1.54 0 0 0-1.044-1.263 63 63 0 0 0-2.887-.87C9.843.266 8.69 0 8 0m2.146 5.146a.5.5 0 0 1 .708.708l-3 3a.5.5 0 0 1-.708 0l-1.5-1.5a.5.5 0 1 1 .708-.708L7.5 7.793z'),
  // bi-geo-alt-fill
  map: bi('M8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10m0-7a3 3 0 1 1 0-6 3 3 0 0 1 0 6'),
  // bi-receipt
  receipt: bi('M1.92.506a.5.5 0 0 1 .434.14L3 1.293l.646-.647a.5.5 0 0 1 .708 0L5 1.293l.646-.647a.5.5 0 0 1 .708 0L7 1.293l.646-.647a.5.5 0 0 1 .708 0L9 1.293l.646-.647a.5.5 0 0 1 .708 0l.646.647.646-.647a.5.5 0 0 1 .708 0l.646.647.646-.647a.5.5 0 0 1 .866.354v14a.5.5 0 0 1-.866.354l-.646-.647-.646.647a.5.5 0 0 1-.708 0L11 14.707l-.646.647a.5.5 0 0 1-.708 0L9 14.707l-.646.647a.5.5 0 0 1-.708 0L7 14.707l-.646.647a.5.5 0 0 1-.708 0L5 14.707l-.646.647a.5.5 0 0 1-.708 0L3 14.707l-.646.647A.5.5 0 0 1 1.5 15V1a.5.5 0 0 1 .42-.494M3 4.5a.5.5 0 0 0 .5.5h9a.5.5 0 0 0 0-1h-9a.5.5 0 0 0-.5.5M3 7a.5.5 0 0 0 .5.5h9A.5.5 0 0 0 13 7zm0 2.5a.5.5 0 0 0 .5.5h9a.5.5 0 0 0 0-1h-9a.5.5 0 0 0-.5.5'),
  // bi-flag-fill
  flag: bi('M14.778.085A.5.5 0 0 1 15 .5V8a.5.5 0 0 1-.314.464L14.5 8l.186.464-.003.001-.006.003-.023.009a12 12 0 0 1-.397.15c-.264.095-.631.223-1.047.35-.816.252-1.879.523-2.71.523-.847 0-1.548-.28-2.158-.525l-.028-.01C7.68 8.71 7.14 8.5 6.5 8.5c-.7 0-1.638.23-2.437.477A20 20 0 0 0 3 9.342V15.5a.5.5 0 0 1-1 0V.5a.5.5 0 0 1 1 0v.282c.226-.079.496-.17.79-.26C4.606.272 5.67 0 6.5 0c.847 0 1.548.28 2.158.525l.028.01C9.32.79 9.86 1 10.5 1c.7 0 1.638-.23 2.437-.477a20 20 0 0 0 1.11-.376l.017-.006.003-.001h.001'),
  // bi-bell-fill
  bell: bi('M8 16a2 2 0 0 0 2-2H6a2 2 0 0 0 2 2m.995-14.901a1 1 0 1 0-1.99 0A5 5 0 0 0 3 6c0 1.098-.5 6-2 7h14c-1.5-1-2-5.902-2-7 0-2.42-1.72-4.44-4.005-4.901'),
  // bi-heart (outline, so hover/active can swap to fill)
  heart: bi('m8 2.748-.717-.737C5.6.281 2.514.878 1.4 3.053c-.523 1.023-.641 2.5.314 4.385.92 1.815 2.834 3.989 6.286 6.357 3.452-2.368 5.365-4.542 6.286-6.357.955-1.886.838-3.362.314-4.385C13.486.878 10.4.28 8.717 2.01zM8 15C-7.333 4.868 3.279-3.04 7.824 1.143q.09.083.176.171a3 3 0 0 1 .176-.17C12.72-3.042 23.333 4.867 8 15'),
  // bi-tools
  tools: bi('M1 0 0 1l2.2 3.081a1 1 0 0 0 .815.419h.07a1 1 0 0 1 .708.293l2.675 2.675-2.617 2.654A3.003 3.003 0 0 0 0 13a3 3 0 1 0 5.878-.851l2.654-2.617.968.968-.305.914a1 1 0 0 0 .242 1.023l3.27 3.27a.997.997 0 0 0 1.414 0l1.586-1.586a.997.997 0 0 0 0-1.414l-3.27-3.27a1 1 0 0 0-1.023-.242L10.5 9.5l-.96-.96 2.68-2.643A3.005 3.005 0 0 0 16 3q0-.405-.102-.777l-2.14 2.141L12 4l-.364-1.757L13.777.102a3 3 0 0 0-3.675 3.68L7.462 6.46 4.793 3.793a1 1 0 0 1-.293-.707v-.071a1 1 0 0 0-.419-.814zm9.646 10.646a.5.5 0 0 1 .708 0l2.914 2.915a.5.5 0 0 1-.707.707l-2.915-2.914a.5.5 0 0 1 0-.708M3 11l.471.242.529.026.287.445.445.287.026.529L5 13l-.242.471-.026.529-.445.287-.287.445-.529.026L3 15l-.471-.242L2 14.732l-.287-.445L1.268 14l-.026-.529L1 13l.242-.471.026-.529.445-.287.287-.445.529-.026z'),
  // bi-lightning-charge-fill
  bolt: bi('M11.251.068a.5.5 0 0 1 .227.58L9.677 6.5H13a.5.5 0 0 1 .364.843l-8 8.5a.5.5 0 0 1-.842-.49L6.323 9.5H3a.5.5 0 0 1-.364-.843l8-8.5a.5.5 0 0 1 .615-.09z'),
  // bi-gear-fill
  settings: bi('M9.405 1.05c-.413-1.4-2.397-1.4-2.81 0l-.1.34a1.464 1.464 0 0 1-2.105.872l-.31-.17c-1.283-.698-2.686.705-1.987 1.987l.169.311c.446.82.023 1.841-.872 2.105l-.34.1c-1.4.413-1.4 2.397 0 2.81l.34.1a1.464 1.464 0 0 1 .872 2.105l-.17.31c-.698 1.283.705 2.686 1.987 1.987l.311-.169a1.464 1.464 0 0 1 2.105.872l.1.34c.413 1.4 2.397 1.4 2.81 0l.1-.34a1.464 1.464 0 0 1 2.105-.872l.31.17c1.283.698 2.686-.705 1.987-1.987l-.169-.311a1.464 1.464 0 0 1 .872-2.105l.34-.1c1.4-.413 1.4-2.397 0-2.81l-.34-.1a1.464 1.464 0 0 1-.872-2.105l.17-.31c.698-1.283-.705-2.686-1.987-1.987l-.311.169a1.464 1.464 0 0 1-2.105-.872zM8 10.93a2.929 2.929 0 1 1 0-5.86 2.929 2.929 0 0 1 0 5.858z'),
} as const;

/** Filled heart (bi-heart-fill) — for the toggled/favourited state. */
export function iconFilled(_d: string, className = 'h-5 w-5') {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" className={`${className} shrink-0`} aria-hidden="true">
      <path d="M8 1.314C12.438-3.248 23.534 4.735 8 15-7.534 4.736 3.562-3.248 8 1.314" />
    </svg>
  );
}
/** bi-heart-fill path (16×16 viewBox) — the favourited/on state. */
export const HEART_PATH = 'M8 1.314C12.438-3.248 23.534 4.735 8 15-7.534 4.736 3.562-3.248 8 1.314';
/** bi-heart outline path (16×16 viewBox) — the not-favourited/off state. */
export const HEART_OUTLINE_PATH = 'm8 2.748-.717-.737C5.6.281 2.514.878 1.4 3.053c-.523 1.023-.641 2.5.314 4.385.92 1.815 2.834 3.989 6.286 6.357 3.452-2.368 5.365-4.542 6.286-6.357.955-1.886.838-3.362.314-4.385C13.486.878 10.4.28 8.717 2.01zM8 15C-7.333 4.868 3.279-3.04 7.824 1.143q.09.083.176.171a3 3 0 0 1 .176-.17C12.72-3.042 23.333 4.867 8 15';

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
