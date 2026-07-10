import { test, expect } from '@playwright/test';
import { signIn, mockLogin, ADMIN_PHONE, API } from './helpers';

test.describe('trust & safety', () => {
  test('trusted contacts section is on the profile', async ({ page }) => {
    await signIn(page);
    await page.goto('/en/profile');
    await expect(page.locator('body')).toContainText(/safety|trusted|contact|ආරක්ෂ|பாதுகாப்பு/i);
  });

  test('report-a-provider opens on a provider profile', async ({ page }) => {
    // Find a seeded provider id via the API, then open their public profile.
    const { token } = await mockLogin(page, ADMIN_PHONE);
    const res = await page.request.get(`${API}/admin/users`, { headers: { Authorization: `Bearer ${token}` } });
    // Fall back gracefully: this test only asserts the report control exists on a profile.
    await signIn(page);
    // Use the reviews API to discover a provider that exists.
    const provRes = await page.request.post(`${API}/bookings`, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      data: { categoryKey: 'electrician', description: 'E2E discover provider', lat: 7.2906, lng: 80.6337 },
    });
    const booking = (await provRes.json()).data;
    const matchRes = await page.request.get(`${API}/bookings/${booking.id}/matches`, { headers: { Authorization: `Bearer ${token}` } });
    const matches = (await matchRes.json()).data?.results ?? [];
    test.skip(matches.length === 0, 'no seeded providers to open a profile for');
    await page.goto(`/en/providers/${matches[0].provider_id}`);
    await expect(page.getByRole('button', { name: /report/i })).toBeVisible();
  });

  test('admin trust queue page loads', async ({ page }) => {
    await signIn(page, undefined, 'admin');
    await page.goto('/en/admin/safety');
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page.locator('body')).toContainText(/safety|alert|report/i);
  });
});

test.describe('reviews', () => {
  test('provider profile shows a reviews section', async ({ page }) => {
    const { token } = await mockLogin(page, ADMIN_PHONE);
    const provRes = await page.request.post(`${API}/bookings`, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      data: { categoryKey: 'electrician', description: 'E2E discover provider', lat: 7.2906, lng: 80.6337 },
    });
    const booking = (await provRes.json()).data;
    const matchRes = await page.request.get(`${API}/bookings/${booking.id}/matches`, { headers: { Authorization: `Bearer ${token}` } });
    const matches = (await matchRes.json()).data?.results ?? [];
    test.skip(matches.length === 0, 'no seeded providers');
    await signIn(page);
    await page.goto(`/en/providers/${matches[0].provider_id}`);
    await expect(page.locator('body')).toContainText(/review|rating|මතය|மதிப்/i);
  });
});
