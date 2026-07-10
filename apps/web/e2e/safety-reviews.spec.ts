import { test, expect } from '@playwright/test';
import { signIn, mockLogin, ADMIN_PHONE, API } from './helpers';

/** Discover a seeded provider id (via a throwaway booking's matches). */
async function findProviderId(request: any, token: string): Promise<string | null> {
  const bk = await request.post(`${API}/bookings`, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    data: { categoryKey: 'electrician', description: 'E2E discover provider', lat: 7.2906, lng: 80.6337 },
  });
  const booking = (await bk.json()).data;
  const m = await request.get(`${API}/bookings/${booking.id}/matches`, { headers: { Authorization: `Bearer ${token}` } });
  const matches = (await m.json()).data?.results ?? [];
  // Clean up the throwaway booking.
  await request.post(`${API}/bookings/${booking.id}/cancel`, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, data: { reason: 'cleanup' } }).catch(() => {});
  return matches[0]?.provider_id ?? null;
}

test.describe('trust & safety', () => {
  test('trusted contacts section is on the profile', async ({ page }) => {
    await signIn(page);
    await page.goto('/en/profile');
    await page.waitForTimeout(500);
    await expect(page.locator('body')).toContainText(/safety|trusted|contact|ආරක්ෂ|பாதுகாப்பு|நம்பக/i);
  });

  test('report-a-provider control exists on a provider profile', async ({ page, request }) => {
    const { token } = await mockLogin(page, ADMIN_PHONE);
    const pid = await findProviderId(request, token);
    test.skip(!pid, 'no seeded providers to open a profile for');
    await signIn(page);
    await page.goto(`/en/providers/${pid}`);
    await page.waitForTimeout(500);
    await expect(page.getByRole('button', { name: /report/i })).toBeVisible();
  });

  test('admin trust queue page loads', async ({ page }) => {
    await signIn(page);
    await page.goto('/en/admin/safety');
    await page.waitForTimeout(400);
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page.locator('body')).toContainText(/safety|alert|report|ආරක්ෂ|பாதுகாப்பு/i);
  });
});

test.describe('reviews', () => {
  test('provider profile shows a reviews section', async ({ page, request }) => {
    const { token } = await mockLogin(page, ADMIN_PHONE);
    const pid = await findProviderId(request, token);
    test.skip(!pid, 'no seeded providers');
    await signIn(page);
    await page.goto(`/en/providers/${pid}`);
    await page.waitForTimeout(500);
    await expect(page.locator('body')).toContainText(/review|rating|මතය|மதிப்/i);
  });
});
