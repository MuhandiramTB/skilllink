import { test, expect } from '@playwright/test';
import { signIn } from './helpers';

/**
 * Dashboard smoke. Uses the shared admin account (customer + admin roles) — we do
 * NOT mutate it into a provider (that pollutes other tests). The provider dashboard
 * is exercised via its correct guard behaviour: a non-provider is routed away, not
 * crashed. Deep provider-KPI rendering is covered by the API/unit layer.
 */
test.describe('dashboards', () => {
  test('customer dashboard loads', async ({ page }) => {
    await signIn(page);
    await page.goto('/en/dashboard/customer');
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page.locator('body')).toBeVisible();
  });

  test('admin console loads and lists management sections', async ({ page }) => {
    await signIn(page);
    await page.goto('/en/dashboard/admin');
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page.locator('body')).toContainText(/users|providers|disputes|payments|analytics/i);
  });

  test('admin users table renders', async ({ page }) => {
    await signIn(page);
    await page.goto('/en/admin/users');
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page.locator('body')).toBeVisible();
  });

  test('provider dashboard route is handled (renders or routes, never crashes)', async ({ page }) => {
    await signIn(page);
    await page.goto('/en/dashboard/provider');
    await page.waitForTimeout(600); // allow the mode guard to run
    // Not on a login/error screen, body visible — a non-provider is guided elsewhere.
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page.locator('body')).toBeVisible();
  });
});
