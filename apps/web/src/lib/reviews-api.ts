'use client';

import { getToken } from './admin-api';
import { friendlyError, isSessionError, emitSessionExpired } from './api-error';

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
    if (res.status === 401 || isSessionError(err.code)) emitSessionExpired();
    throw new Error(friendlyError(err.code, err.message));
  }
  return body.data as T;
}

export interface ProviderReview {
  id: string;
  rating: number;
  comment: string | null;
  provider_response: string | null;
  created_at: string;
}

export const reviewsApi = {
  /** Public: a provider's reviews (rating + comment + any provider reply). */
  listForProvider: (providerId: string) => req<ProviderReview[]>(`/providers/${providerId}/reviews`),
  /** Provider replies to a review they received. */
  respond: (reviewId: string, response: string) =>
    req<{ id: string }>(`/reviews/${reviewId}/response`, { method: 'POST', body: JSON.stringify({ response }) }),
};
