'use client';

import { getToken, setToken, clearToken } from './session';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

// Re-export the single source of truth for the token so existing imports keep working.
export { getToken, setToken, clearToken };

export interface AdminCategory {
  id: string;
  parent_id: string | null;
  key: string;
  name_en: string;
  name_si: string;
  name_ta: string;
  is_active: boolean;
  sort_order: number;
}

export interface AdminDistrict {
  id: string;
  name_en: string;
  name_si?: string;
  name_ta?: string;
  is_active: boolean;
  launched_at: string | null;
}

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
  });
  const body = await res.json().catch(() => ({ data: null, error: { code: 'PARSE', message: 'bad response' } }));
  if (!res.ok || body.error) {
    const err = body.error ?? { code: String(res.status), message: 'error' };
    throw new Error(`${err.code}: ${err.message}`);
  }
  return body.data as T;
}

/** Dev mock login → returns true if the account holds the admin role. */
export async function mockLogin(phone: string): Promise<boolean> {
  const data = await req<{ accessToken: string; user: { roles: string[] } }>(`/auth/otp/verify`, {
    method: 'POST',
    body: JSON.stringify({ firebaseIdToken: `mock:${phone}` }),
  });
  if (!data.user.roles?.includes('admin')) return false;
  setToken(data.accessToken);
  return true;
}

export const adminApi = {
  listCategories: () => req<AdminCategory[]>(`/admin/categories`),
  createCategory: (c: Partial<AdminCategory>) =>
    req<AdminCategory>(`/admin/categories`, { method: 'POST', body: JSON.stringify(c) }),
  updateCategory: (id: string, c: Partial<AdminCategory>) =>
    req<AdminCategory>(`/admin/categories/${id}`, { method: 'PATCH', body: JSON.stringify(c) }),
  deactivateCategory: (id: string) =>
    req<AdminCategory>(`/admin/categories/${id}`, { method: 'DELETE' }),
  listDistricts: () => req<AdminDistrict[]>(`/admin/districts`),
  setDistrictActive: (id: string, is_active: boolean) =>
    req<AdminDistrict>(`/admin/districts/${id}`, { method: 'PATCH', body: JSON.stringify({ is_active }) }),
  verificationQueue: () => req<VerificationQueueItem[]>(`/admin/verifications?status=pending`),
  decideVerification: (providerId: string, decision: 'approve' | 'reject', reason?: string) =>
    req(`/admin/providers/${providerId}/verification`, { method: 'PATCH', body: JSON.stringify({ decision, reason }) }),
  disputes: () => req<Dispute[]>(`/admin/disputes`),
  resolveDispute: (id: string, resolution: string) =>
    req(`/admin/disputes/${id}`, { method: 'PATCH', body: JSON.stringify({ resolution }) }),
  analytics: () => req<Analytics>(`/admin/analytics`),
  audit: (limit = 50, offset = 0) =>
    req<{ total: number; rows: AuditRow[] }>(`/admin/audit?limit=${limit}&offset=${offset}`),
  adminBookings: () => req<AdminBooking[]>(`/admin/bookings`),
  adminPayments: () => req<AdminPayment[]>(`/admin/payments`),
  users: (search = '') => req<{ total: number; rows: AdminUser[] }>(`/admin/users?limit=100&search=${encodeURIComponent(search)}`),
  setUserActive: (id: string, isActive: boolean) =>
    req(`/admin/users/${id}/active`, { method: 'PATCH', body: JSON.stringify({ isActive }) }),
  forceLogout: (id: string) => req(`/admin/users/${id}/force-logout`, { method: 'POST' }),
};

export interface AdminBooking {
  id: string; status: string; categoryKey: string | null; price_cents: number | null; created_at: string;
}
export interface AdminPayment {
  id: string; amount_cents: number; commission_cents: number; status: string; provider: string; created_at: string;
}

export interface AdminUser {
  id: string;
  phone: string;
  role: string;
  is_active: boolean;
  language: string;
  created_at: string;
}

export interface AuditRow {
  id: string;
  actor_id: string | null;
  action: string;
  entity: string;
  entity_id: string | null;
  meta: Record<string, unknown> | null;
  created_at: string;
}

export interface Dispute {
  id: string;
  booking_id: string;
  opened_by: string;
  status: string;
  resolution: string | null;
}
export interface Analytics {
  bookings: { total: number; byStatus: Record<string, number>; completed: number };
  revenue: { grossCents: number; commissionCents: number; paidPayments: number };
  providers: { approved: number; pending: number };
  customers: number;
  activeDistricts: number;
}

export interface VerificationQueueItem {
  providerId: string;
  businessName: string | null;
  status: string;
  documents: { id: string; type: string; media_url: string }[];
}
