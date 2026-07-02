'use client';

import { getToken } from './session';
import { friendlyError } from './api-error';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(init?.headers ?? {}) },
  });
  const body = await res.json().catch(() => ({ data: null, error: { code: 'PARSE', message: 'bad response' } }));
  if (!res.ok || body.error) throw new Error(friendlyError(body.error?.code ?? String(res.status), body.error?.message ?? 'error'));
  return body.data as T;
}

export interface Favourite {
  providerId: string;
  businessName: string | null;
  ratingAvg: number;
  ratingCount: number;
  verified: boolean;
  coverPhoto: string | null;
}

export const favouritesApi = {
  list: () => req<Favourite[]>(`/favourites`),
  ids: () => req<string[]>(`/favourites/ids`),
  toggle: (providerId: string) => req<{ favourited: boolean }>(`/favourites/${providerId}`, { method: 'POST' }),
  remove: (providerId: string) => req<{ ok: boolean }>(`/favourites/${providerId}`, { method: 'DELETE' }),
};

export interface PublicProvider {
  id: string;
  businessName: string | null;
  ratingAvg: number;
  ratingCount: number;
  verified: boolean;
  photos: { id: string; url: string; caption: string | null }[];
}

/** Public provider profile (no auth required) — shows the work-photos gallery. */
export const publicProviderApi = {
  profile: (id: string) => req<PublicProvider>(`/providers/${id}`),
};
