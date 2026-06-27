'use client';

import { getToken } from './session';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(init?.headers ?? {}) },
  });
  const body = await res.json().catch(() => ({ data: null, error: { code: 'PARSE', message: 'bad response' } }));
  if (!res.ok || body.error) throw new Error(`${body.error?.code ?? res.status}: ${body.error?.message ?? 'error'}`);
  return body.data as T;
}

export interface RewardLedgerEntry { id: string; points: number; reason: string; booking_id: string | null; created_at: string }
export interface RewardsSummary { points: number; ledger: RewardLedgerEntry[] }

export const rewardsApi = {
  me: () => req<RewardsSummary>(`/rewards/me`),
};
