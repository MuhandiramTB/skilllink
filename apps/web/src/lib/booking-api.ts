'use client';

import { getToken, setToken } from './admin-api';
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
    if (res.status === 401 || isSessionError(err.code)) {
      emitSessionExpired(err.code === 'ACCOUNT_SUSPENDED' ? 'suspended' : 'expired');
    }
    throw new Error(friendlyError(err.code, err.message));
  }
  return body.data as T;
}

export async function loginCustomer(phone: string) {
  const data = await req<{ accessToken: string; user: { roles: string[]; mode: string } }>(`/auth/otp/verify`, {
    method: 'POST',
    body: JSON.stringify({ firebaseIdToken: `mock:${phone}` }),
  });
  setToken(data.accessToken);
  return data.user;
}

export interface Match {
  provider_id: string;
  business_name: string | null;
  distance_m: number;
  rating_avg: number;
  score: number;
  photo_count: number;
  cover_photo: string | null;
  rating_count: number;
  verified: boolean;
}
export interface Booking {
  id: string;
  status: string;
  providerId: string | null;
  description: string | null;
  quoteStatus?: 'none' | 'quoted' | 'accepted';
  priceCents?: number | null;
  acceptedAt?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  scheduledFor?: string | null;
}
export interface Message { sender_id: string; body: string; created_at: string; pending?: boolean }

export interface BookingListItem {
  id: string;
  status: string;
  categoryKey: string | null;
  description: string | null;
  created_at: string;
}

export const bookingApi = {
  create: (categoryKey: string, description: string, lat: number, lng: number, scheduledFor?: string) =>
    req<Booking>(`/bookings`, { method: 'POST', body: JSON.stringify({ categoryKey, description, lat, lng, scheduledFor }) }),
  reschedule: (id: string, scheduledFor: string) =>
    req<{ id: string; scheduledFor: string }>(`/bookings/${id}/reschedule`, { method: 'PATCH', body: JSON.stringify({ scheduledFor }) }),
  list: (role: 'customer' | 'provider' = 'customer') =>
    req<BookingListItem[]>(`/bookings?role=${role}`),
  providerJobs: () => req<BookingListItem[]>(`/bookings/provider/jobs`),
  detail: (id: string) => req<Booking>(`/bookings/${id}`),
  matches: (id: string) => req<{ results: Match[]; note: string | null }>(`/bookings/${id}/matches`),
  assign: (id: string, providerId: string) =>
    req<Booking>(`/bookings/${id}/assign`, { method: 'POST', body: JSON.stringify({ providerId }) }),
  messages: (id: string) => req<Message[]>(`/bookings/${id}/messages`),
  sendMessage: (id: string, body: string) =>
    req<Message>(`/bookings/${id}/messages`, { method: 'POST', body: JSON.stringify({ body }) }),
  pay: (bookingId: string, amountCents: number) =>
    req<{ paymentId: string; amountCents: number; commissionCents: number; netCents: number; redirectUrl: string }>(
      `/payments/initiate`, { method: 'POST', body: JSON.stringify({ bookingId, amountCents }) }),
  // Spec 11: provider quotes a price; customer accepts; settle cash or in-app.
  quote: (id: string, amountCents: number) =>
    req<{ id: string; priceCents: number; quoteStatus: string }>(
      `/bookings/${id}/quote`, { method: 'PATCH', body: JSON.stringify({ amountCents }) }),
  acceptQuote: (id: string) =>
    req<{ id: string; quoteStatus: string }>(`/bookings/${id}/accept-quote`, { method: 'POST' }),
  settle: (bookingId: string, method: 'cash' | 'in_app') =>
    req<{ paymentId: string; status: string; method: string; commissionCents: number; netCents: number }>(
      `/payments/settle`, { method: 'POST', body: JSON.stringify({ bookingId, method }) }),
  review: (bookingId: string, rating: number, comment: string) =>
    req(`/bookings/${bookingId}/review`, { method: 'POST', body: JSON.stringify({ rating, comment }) }),
  respond: (id: string, action: 'accept' | 'reject') =>
    req<Booking>(`/bookings/${id}/respond`, { method: 'PATCH', body: JSON.stringify({ action }) }),
  advance: (id: string, status: 'in_progress' | 'completed') =>
    req<Booking>(`/bookings/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  cancel: (id: string, reason?: string) =>
    req<{ id: string; status: string; cancelFeeCents: number }>(`/bookings/${id}/cancel`, { method: 'POST', body: JSON.stringify({ reason }) }),
  // Customer reports the assigned provider never arrived (terminal no-show).
  noShow: (id: string) => req<{ id: string; status: string }>(`/bookings/${id}/no-show`, { method: 'POST' }),
  // Provider self-reports a job settled in cash (disintermediation defense).
  reportCash: (id: string) => req<{ ok: boolean }>(`/bookings/${id}/report-cash`, { method: 'POST' }),
  // Customer or provider opens a dispute on a booking they're part of.
  openDispute: (id: string, reason: string) =>
    req<{ id: string; status: string }>(`/bookings/${id}/dispute`, { method: 'POST', body: JSON.stringify({ reason }) }),
};
