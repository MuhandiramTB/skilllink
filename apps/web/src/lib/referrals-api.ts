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

export interface ReferralInfo {
  code: string | null;
  referredCount: number;
  referrerPoints: number;
  refereePoints: number;
}

export const referralsApi = {
  me: () => req<ReferralInfo>(`/referrals/me`),
  apply: (code: string) => req<{ applied: boolean; pointsEarned: number }>(`/referrals/apply`, { method: 'POST', body: JSON.stringify({ code }) }),
};
