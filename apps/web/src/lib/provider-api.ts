'use client';

import { getToken, setToken } from './admin-api';
import { friendlyError } from './api-error';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

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
    throw new Error(friendlyError(err.code, err.message));
  }
  return body.data as T;
}

/** Mock login for a provider/customer phone (stores token; any role allowed). */
export async function login(phone: string): Promise<{ roles: string[]; mode: string }> {
  const data = await req<{ accessToken: string; user: { roles: string[]; mode: string } }>(`/auth/otp/verify`, {
    method: 'POST',
    body: JSON.stringify({ firebaseIdToken: `mock:${phone}` }),
  });
  setToken(data.accessToken);
  return { roles: data.user.roles, mode: data.user.mode };
}

export const providerApi = {
  become: (businessName?: string) =>
    req(`/providers`, { method: 'POST', body: JSON.stringify({ businessName }) }),
  me: () => req<ProviderMe>(`/providers/me`),
  presign: (kind: string) =>
    req<{ uploadUrl: string; fileUrl: string }>(`/providers/me/uploads/${kind}`, { method: 'POST' }),
  addVerification: (type: string, mediaUrl: string) =>
    req(`/providers/me/verifications`, { method: 'POST', body: JSON.stringify({ type, mediaUrl }) }),
  setServiceArea: (lat: number, lng: number, radiusMeters: number) =>
    req(`/providers/me/service-area`, { method: 'PUT', body: JSON.stringify({ lat, lng, radiusMeters }) }),
  setServiceAreas: (areas: { lat: number; lng: number; radiusMeters: number; label?: string }[]) =>
    req<{ ok: boolean; count: number }>(`/providers/me/service-areas`, { method: 'PUT', body: JSON.stringify({ areas }) }),
  setCategories: (categoryIds: string[]) =>
    req(`/providers/me/categories`, { method: 'PUT', body: JSON.stringify({ categoryIds }) }),
  setAvailability: (isAvailable: boolean) =>
    req(`/providers/me/availability`, { method: 'PATCH', body: JSON.stringify({ isAvailable }) }),
  earnings: () => req<{ totalNetCents: number; paidJobs: number }>(`/providers/me/earnings`),
  setDetails: (d: { yearsExperience?: number; workingDays?: string; workingHours?: string; emergencyService?: boolean }) =>
    req(`/providers/me/details`, { method: 'PATCH', body: JSON.stringify(d) }),
  // Spec 11: provider wallet (commission balance for cash jobs).
  wallet: () => req<WalletSummary>(`/providers/me/wallet`),
  topup: (amountCents: number) =>
    req<WalletSummary>(`/providers/me/wallet/topup`, { method: 'POST', body: JSON.stringify({ amountCents }) }),
  // Spec 12: provider work-photos portfolio.
  listPhotos: () => req<WorkPhoto[]>(`/providers/me/photos`),
  addPhoto: (url: string, caption?: string) =>
    req<WorkPhoto>(`/providers/me/photos`, { method: 'POST', body: JSON.stringify({ url, caption }) }),
  removePhoto: (photoId: string) =>
    req<{ ok: boolean }>(`/providers/me/photos/${photoId}`, { method: 'DELETE' }),
};

export interface WorkPhoto { id: string; url: string; caption: string | null; created_at?: string }

export interface WalletLedgerEntry { id: string; type: string; amount_cents: number; booking_id: string | null; note: string | null; created_at: string }
export interface WalletSummary { balanceCents: number; ledger: WalletLedgerEntry[] }

export interface ProviderMe {
  status: string;
  businessName: string | null;
  isAvailable: boolean;
  ratingAvg: number;
  categories: number;
  verifications: { type: string; status: string }[];
}
