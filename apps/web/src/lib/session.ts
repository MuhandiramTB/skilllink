'use client';

/**
 * Single source of truth for the signed-in session (client-side, v1).
 *
 * Multi-role model: an account holds a SET of roles (customer is always present;
 * provider is added after onboarding; admin is granted). The JWT carries roles[]
 * plus the currently-active `mode`. A person never switches accounts — they switch
 * mode, which re-issues the token. The dashboard follows `mode`.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';
const TOKEN_KEY = 'skilllink_admin_token'; // kept for back-compat with existing api clients

export type Role = 'customer' | 'provider' | 'admin';

export interface Session {
  userId: string;
  roles: Role[];
  mode: Role;
  phone?: string;
}

/** Fired (same-tab) whenever the token changes, so the header/nav re-read it live. */
const AUTH_EVENT = 'skilllink:auth';
function emitAuthChange() {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(AUTH_EVENT));
}
export function onAuthChange(handler: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener(AUTH_EVENT, handler);
  window.addEventListener('storage', handler); // cross-tab logout
  return () => {
    window.removeEventListener(AUTH_EVENT, handler);
    window.removeEventListener('storage', handler);
  };
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(TOKEN_KEY);
}
export function setToken(t: string) {
  window.localStorage.setItem(TOKEN_KEY, t);
  emitAuthChange();
}
export function clearToken() {
  window.localStorage.removeItem(TOKEN_KEY);
  emitAuthChange();
}

/** Decode roles/mode/userId from our JWT payload (no verification needed client-side). */
export function getSession(): Session | null {
  const t = getToken();
  if (!t) return null;
  try {
    const payload = JSON.parse(atob(t.split('.')[1]));
    const roles: Role[] = Array.isArray(payload.roles) ? payload.roles : ['customer'];
    const mode: Role = (payload.mode as Role) ?? roles[0] ?? 'customer';
    return { userId: payload.sub, roles, mode };
  } catch {
    return null;
  }
}

/** Where each mode lands. The system routes — the user doesn't choose a role to log in as. */
export function homeForMode(locale: string, mode: Role): string {
  switch (mode) {
    case 'admin': return `/${locale}/dashboard/admin`;
    case 'provider': return `/${locale}/dashboard/provider`;
    default: return `/${locale}/dashboard/customer`;
  }
}

interface AuthedReq { headers: Record<string, string>; }
function authed(extra: Record<string, string> = {}): AuthedReq {
  const t = getToken();
  return { headers: { 'Content-Type': 'application/json', ...(t ? { Authorization: `Bearer ${t}` } : {}), ...extra } };
}

async function unwrap<T>(r: Response): Promise<T> {
  const b = await r.json().catch(() => ({ error: { message: 'Bad response' } }));
  if (!r.ok || b.error) throw new Error(b.error?.message ?? `Request failed (${r.status})`);
  return b.data as T;
}

/** Verify an OTP credential (mock in dev) → store token → return the session. */
export async function verifyOtp(phone: string): Promise<Session> {
  const data = await unwrap<{ accessToken: string; user: { id: string; phone: string; roles: Role[]; mode: Role } }>(
    await fetch(`${API_URL}/auth/otp/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ firebaseIdToken: `mock:${phone}` }),
    }),
  );
  setToken(data.accessToken);
  return { userId: data.user.id, roles: data.user.roles, mode: data.user.mode, phone: data.user.phone };
}

/** Switch active dashboard mode (account must hold the role). Re-issues + stores the token. */
export async function switchMode(mode: Role): Promise<Session> {
  const data = await unwrap<{ accessToken: string; roles: Role[]; mode: Role }>(
    await fetch(`${API_URL}/auth/mode`, { method: 'POST', ...authed(), body: JSON.stringify({ mode }) }),
  );
  setToken(data.accessToken);
  return getSession()!;
}

/** Add the provider role to the current account; returns a token already in provider mode. */
export async function becomeProvider(businessName?: string): Promise<Session> {
  const data = await unwrap<{ accessToken: string; roles: Role[]; mode: Role }>(
    await fetch(`${API_URL}/auth/become-provider`, { method: 'POST', ...authed(), body: JSON.stringify({ businessName }) }),
  );
  setToken(data.accessToken);
  return getSession()!;
}

export interface District { id: string; name_en: string; name_si: string; name_ta: string; }

export async function fetchDistricts(): Promise<District[]> {
  const r = await fetch(`${API_URL}/districts/public`);
  const b = await r.json();
  return b.data ?? [];
}

/** Current account: roles, mode, and whether the customer profile is complete. */
export async function fetchMe(): Promise<{ roles: Role[]; mode: Role; profileComplete: boolean } | null> {
  const r = await fetch(`${API_URL}/auth/me`, authed());
  const b = await r.json().catch(() => ({ error: true }));
  if (!r.ok || b.error) return null;
  return { roles: b.data.roles, mode: b.data.mode, profileComplete: b.data.profileComplete };
}

export async function saveProfile(data: { fullName: string; districtId: string; language: 'si' | 'ta' | 'en'; email?: string }) {
  return unwrap(
    await fetch(`${API_URL}/auth/profile`, { method: 'PATCH', ...authed(), body: JSON.stringify(data) }),
  );
}
