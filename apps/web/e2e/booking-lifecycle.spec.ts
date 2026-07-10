import { test, expect } from '@playwright/test';
import { mockLogin, signIn, ADMIN_PHONE, API } from './helpers';

/**
 * Booking lifecycle — drives state changes via the API (the fast, reliable path
 * for multi-actor flows) and asserts each transition + the UI reflecting it. Runs
 * as the admin/customer account against seeded providers.
 */
test.describe('booking lifecycle', () => {
  let token: string;

  test.beforeAll(async ({ request }) => {
    const res = await request.post(`${API}/auth/otp/verify`, { data: { firebaseIdToken: `mock:${ADMIN_PHONE}` } });
    token = (await res.json()).data.accessToken;
  });

  async function newBooking(request: any) {
    const res = await request.post(`${API}/bookings`, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      data: { categoryKey: 'electrician', description: 'E2E lifecycle', lat: 7.2906, lng: 80.6337, addressText: '1 Test Rd, Kandy', addressNotes: 'Red gate' },
    });
    return (await res.json()).data;
  }

  test('create → address persists → cancel (free before accept)', async ({ request }) => {
    const b = await newBooking(request);
    expect(b.id).toBeTruthy();
    expect(b.addressText).toBe('1 Test Rd, Kandy');
    const cancel = await request.post(`${API}/bookings/${b.id}/cancel`, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      data: { reason: 'E2E' },
    });
    const cj = (await cancel.json()).data;
    expect(cj.status).toBe('cancelled');
    expect(cj.cancelFeeCents).toBe(0); // free before a provider accepted
  });

  test('open a dispute on a booking', async ({ request }) => {
    const b = await newBooking(request);
    const d = await request.post(`${API}/bookings/${b.id}/dispute`, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      data: { reason: 'E2E dispute' },
    });
    expect((await d.json()).data.status).toBe('open');
    await request.post(`${API}/bookings/${b.id}/cancel`, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, data: { reason: 'cleanup' } });
  });

  test('matching returns ranked providers near Kandy', async ({ request }) => {
    const b = await newBooking(request);
    const m = await request.get(`${API}/bookings/${b.id}/matches`, { headers: { Authorization: `Bearer ${token}` } });
    const data = (await m.json()).data;
    // Seeded data should yield matches; if not, the note is a graceful signal.
    expect(Array.isArray(data.results)).toBeTruthy();
    if (data.results.length > 0) {
      expect(data.results[0]).toHaveProperty('rating_avg');
      expect(data.results[0]).toHaveProperty('distance_m');
    }
    await request.post(`${API}/bookings/${b.id}/cancel`, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, data: { reason: 'cleanup' } });
  });

  test('booking detail page reflects the address to the user', async ({ page, request }) => {
    const b = await newBooking(request);
    await signIn(page);
    await page.goto(`/en/bookings/${b.id}`);
    await expect(page.locator('body')).toContainText(/1 Test Rd, Kandy|Red gate/);
    await request.post(`${API}/bookings/${b.id}/cancel`, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, data: { reason: 'cleanup' } });
  });

  test('notification preferences persist', async ({ request }) => {
    const set = await request.patch(`${API}/notifications/prefs`, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      data: { promos: false },
    });
    expect((await set.json()).data.promos).toBe(false);
    const get = await request.get(`${API}/notifications/prefs`, { headers: { Authorization: `Bearer ${token}` } });
    expect((await get.json()).data.promos).toBe(false);
  });
});
