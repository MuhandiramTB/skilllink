import { test, expect } from '@playwright/test';
import { signIn, mockLogin, ADMIN_PHONE, API } from './helpers';

/** Discover a seeded provider id (via a throwaway booking's matches). */
async function findProviderId(request: any, token: string): Promise<string | null> {
  const bk = await request.post(`${API}/bookings`, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    data: { categoryKey: 'electrician', description: 'E2E discover', lat: 7.2906, lng: 80.6337 },
  });
  const booking = (await bk.json()).data;
  const m = await request.get(`${API}/bookings/${booking.id}/matches`, { headers: { Authorization: `Bearer ${token}` } });
  const pid = (await m.json()).data?.results?.[0]?.provider_id ?? null;
  await request.post(`${API}/bookings/${booking.id}/cancel`, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, data: { reason: 'cleanup' } }).catch(() => {});
  return pid;
}

test.describe('trust & safety (UI)', () => {
  test('trusted contacts section is on the profile', async ({ page }) => {
    await signIn(page);
    await page.goto('/en/profile');
    await expect(page.getByRole('heading', { name: /safety|trusted/i })).toBeVisible({ timeout: 10000 });
  });

  test('report-a-provider control exists on a provider profile', async ({ page, request }) => {
    const { token } = await mockLogin(page, ADMIN_PHONE);
    const pid = await findProviderId(request, token);
    test.skip(!pid, 'no seeded providers');
    await signIn(page);
    await page.goto(`/en/providers/${pid}`);
    await expect(page.getByRole('button', { name: /report/i })).toBeVisible({ timeout: 10000 });
  });

  test('admin trust queue page shows a heading', async ({ page }) => {
    await signIn(page);
    await page.goto('/en/admin/safety');
    await expect(page.getByRole('heading').first()).toBeVisible({ timeout: 10000 });
  });
});

test.describe('reviews (UI)', () => {
  test('provider profile shows a reviews section', async ({ page, request }) => {
    const { token } = await mockLogin(page, ADMIN_PHONE);
    const pid = await findProviderId(request, token);
    test.skip(!pid, 'no seeded providers');
    await signIn(page);
    await page.goto(`/en/providers/${pid}`);
    await expect(page.getByRole('heading', { name: /review/i })).toBeVisible({ timeout: 10000 });
  });
});

/** The backends for these DO work (verified separately) — assert them at the API
 *  layer so we still have real coverage while the UI bugs are fixed. */
test.describe('trust & safety (API — verified working)', () => {
  test('safety contacts + report endpoints work', async ({ request }) => {
    const login = await request.post(`${API}/auth/otp/verify`, { data: { firebaseIdToken: `mock:${ADMIN_PHONE}` } });
    const token = (await login.json()).data.accessToken;
    const auth = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

    // Trusted contacts CRUD.
    const add = await request.post(`${API}/safety/contacts`, { headers: auth, data: { name: 'E2E Contact', phone: '+94771234567' } });
    expect(add.ok()).toBeTruthy();
    const cid = (await add.json()).data.id;
    const list = await request.get(`${API}/safety/contacts`, { headers: auth });
    expect((await list.json()).data.some((c: any) => c.id === cid)).toBeTruthy();
    await request.delete(`${API}/safety/contacts/${cid}`, { headers: auth });

    // Reporting a non-existent provider is a clean 404 (not a 500).
    const bad = await request.post(`${API}/safety/report`, { headers: auth, data: { providerId: '00000000-0000-0000-0000-000000000000', reason: 'quality' } });
    expect(bad.status()).toBe(404);
  });

  test('provider reviews endpoint returns comments', async ({ request }) => {
    const login = await request.post(`${API}/auth/otp/verify`, { data: { firebaseIdToken: `mock:${ADMIN_PHONE}` } });
    const token = (await login.json()).data.accessToken;
    const auth = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
    const bk = await request.post(`${API}/bookings`, { headers: auth, data: { categoryKey: 'electrician', description: 'E2E rev', lat: 7.2906, lng: 80.6337 } });
    const booking = (await bk.json()).data;
    const m = await request.get(`${API}/bookings/${booking.id}/matches`, { headers: auth });
    const pid = (await m.json()).data.results?.[0]?.provider_id;
    await request.post(`${API}/bookings/${booking.id}/cancel`, { headers: auth, data: { reason: 'cleanup' } });
    test.skip(!pid, 'no seeded providers');
    const rev = await request.get(`${API}/providers/${pid}/reviews`);
    expect(rev.ok()).toBeTruthy();
    expect(Array.isArray((await rev.json()).data)).toBeTruthy();
  });
});
