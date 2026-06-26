'use client';

import { getToken, setToken } from './admin-api';

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
    throw new Error(`${err.code}: ${err.message}`);
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
}
export interface Booking {
  id: string;
  status: string;
  providerId: string | null;
  description: string | null;
}
export interface Message { sender_id: string; body: string; created_at: string }

export interface BookingListItem {
  id: string;
  status: string;
  categoryKey: string | null;
  description: string | null;
  created_at: string;
}

export const bookingApi = {
  create: (categoryKey: string, description: string, lat: number, lng: number) =>
    req<Booking>(`/bookings`, { method: 'POST', body: JSON.stringify({ categoryKey, description, lat, lng }) }),
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
  review: (bookingId: string, rating: number, comment: string) =>
    req(`/bookings/${bookingId}/review`, { method: 'POST', body: JSON.stringify({ rating, comment }) }),
  respond: (id: string, action: 'accept' | 'reject') =>
    req<Booking>(`/bookings/${id}/respond`, { method: 'PATCH', body: JSON.stringify({ action }) }),
  advance: (id: string, status: 'in_progress' | 'completed') =>
    req<Booking>(`/bookings/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  cancel: (id: string) => req<Booking>(`/bookings/${id}/cancel`, { method: 'POST' }),
};
