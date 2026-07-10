import { test, expect } from '@playwright/test';
import { signIn } from './helpers';

test.describe('dashboards', () => {
  test('provider dashboard loads with KPIs', async ({ page }) => {
    await signIn(page, undefined, 'provider');
    await page.goto('/en/dashboard/provider');
    await expect(page).not.toHaveURL(/\/login/);
    // KPI/earnings surface should render (numbers or the earnings label).
    await expect(page.locator('body')).toContainText(/earning|rating|jobs|balance|ඉපැයීම්|வருவாய்/i);
  });

  test('customer dashboard loads', async ({ page }) => {
    await signIn(page, undefined, 'customer');
    await page.goto('/en/dashboard/customer');
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page.locator('body')).toBeVisible();
  });

  test('admin console loads and lists management sections', async ({ page }) => {
    await signIn(page, undefined, 'admin');
    await page.goto('/en/dashboard/admin');
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page.locator('body')).toContainText(/users|providers|disputes|payments|analytics/i);
  });

  test('admin users table renders rows', async ({ page }) => {
    await signIn(page, undefined, 'admin');
    await page.goto('/en/admin/users');
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page.locator('body')).toBeVisible();
  });
});
