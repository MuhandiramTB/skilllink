import { test, expect } from '@playwright/test';
import { signIn } from './helpers';

/**
 * Smoke: every key page renders without a crash or console error, on the current
 * project's viewport (desktop + mobile via the two config projects). This is the
 * cheap safety net that catches "white screen" regressions.
 */

const PUBLIC_PAGES = ['/en', '/en/login', '/en/register', '/en/book'];
const AUTHED_PAGES = [
  '/en/dashboard/customer',
  '/en/bookings',
  '/en/profile',
  '/en/dashboard/provider',
  '/en/provider/jobs',
];
const ADMIN_PAGES = [
  '/en/dashboard/admin',
  '/en/admin/users',
  '/en/admin/bookings',
  '/en/admin/safety',
  '/en/admin/analytics',
];

test.describe('smoke — public pages render', () => {
  for (const path of PUBLIC_PAGES) {
    test(`renders ${path}`, async ({ page }) => {
      const errors: string[] = [];
      page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
      const res = await page.goto(path);
      expect(res?.status(), `${path} should not be a server error`).toBeLessThan(500);
      await expect(page.locator('body')).toBeVisible();
      // No hard React/runtime errors (ignore benign network/tile noise).
      const fatal = errors.filter((e) => /is not a function|undefined is not|Minified React error|Cannot read/i.test(e));
      expect(fatal, `console errors on ${path}:\n${fatal.join('\n')}`).toHaveLength(0);
    });
  }
});

test.describe('smoke — authed pages render', () => {
  test('customer + provider + admin pages load signed in', async ({ page }) => {
    await signIn(page); // admin has customer+provider+admin surface via mode
    for (const path of [...AUTHED_PAGES, ...ADMIN_PAGES]) {
      await page.goto(path);
      await expect(page.locator('body')).toBeVisible();
      // Give a client-side auth-guard redirect a beat to settle, then assert we
      // stayed (a signed-in page must not bounce to /login).
      await page.waitForTimeout(400);
      expect(page.url(), `${path} should not redirect to login`).not.toContain('/login');
    }
  });
});

test('404 page shows for an unknown route', async ({ page }) => {
  await page.goto('/en/this-route-does-not-exist');
  await expect(page.getByText(/not found|404/i)).toBeVisible();
});
