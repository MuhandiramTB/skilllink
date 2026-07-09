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
    if (isSessionError(err)) emitSessionExpired();
    throw new Error(friendlyError(err));
  }
  return body.data as T;
}

export interface TrustedContact { id: string; name: string; phone: string }
export interface SafetyAlertResult { id: string; contacts: { name: string; phone: string }[] }

/** Trust & Safety client (SOS, report-a-provider, trusted contacts). */
export const safetyApi = {
  raiseAlert: (p: { bookingId?: string; lat?: number; lng?: number; note?: string }) =>
    req<SafetyAlertResult>(`/safety/alert`, { method: 'POST', body: JSON.stringify(p) }),
  resolveAlert: (id: string) =>
    req<{ ok: boolean }>(`/safety/alert/${id}/resolve`, { method: 'PATCH' }),
  report: (p: { providerId: string; bookingId?: string; reason: string; detail?: string }) =>
    req<{ id: string; status: string }>(`/safety/report`, { method: 'POST', body: JSON.stringify(p) }),
  listContacts: () => req<TrustedContact[]>(`/safety/contacts`),
  addContact: (name: string, phone: string) =>
    req<TrustedContact>(`/safety/contacts`, { method: 'POST', body: JSON.stringify({ name, phone }) }),
  removeContact: (id: string) =>
    req<{ ok: boolean }>(`/safety/contacts/${id}`, { method: 'DELETE' }),
  // Admin trust queue
  adminReports: () => req<AdminReport[]>(`/admin/safety/reports`),
  adminAlerts: () => req<AdminAlert[]>(`/admin/safety/alerts`),
};

export interface AdminReport { id: string; provider_id: string; reporter_id: string; booking_id: string | null; reason: string; detail: string | null; status: string; created_at: string }
export interface AdminAlert { id: string; user_id: string; booking_id: string | null; lat: number | null; lng: number | null; note: string | null; status: string; created_at: string }
