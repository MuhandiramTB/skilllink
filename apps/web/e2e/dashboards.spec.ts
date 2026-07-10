import { test, expect } from '@playwright/test';
import { signIn, signInAsProvider } from './helpers';

test.describe('dashboards', () => {
  test('provider dashboard loads with KPIs', async ({ page }) => {
    await signInAsProvider(page);
    await page.goto('/en/dashboard/provider');
    await page.waitForTimeout(500); // allow mode-guard + data load
    await expect(page).not.toHaveURL(/\/login/);
    // KPI/earnings surface should render (numbers or the earnings label).
    await expect(page.locator('body')).toContainText(/earning|rating|jobs|balance|available|ඉපැයීම්|வருவாய்/i);
  });

  test('customer dashboard loads', async ({ page }) => {
    await signIn(page); // admin account defaults to a valid customer surface
    await page.goto('/en/dashboard/customer');
    await page.waitForTimeout(400);
    await expect(page.locator('body')).toBeVisible();
  });

  test('admin console loads and lists management sections', async ({ page }) => {
    await signIn(page); // admin account, admin mode
    await page.goto('/en/dashboard/admin');
    await page.waitForTimeout(400);
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page.locator('body')).toContainText(/users|providers|disputes|payments|analytics/i);
  });

  test('admin users table renders', async ({ page }) => {
    await signIn(page);
    await page.goto('/en/admin/users');
    await page.waitForTimeout(400);
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page.locator('body')).toBeVisible();
  });
});
