import { test, expect } from '@playwright/test';
import { signIn, mockLogin, ADMIN_PHONE } from './helpers';

test.describe('auth', () => {
  test('protected page redirects to login when signed out', async ({ page }) => {
    await page.context().clearCookies();
    await page.goto('/en/profile');
    await expect(page).toHaveURL(/\/login/);
  });

  test('mock OTP issues a valid token', async ({ page }) => {
    const { token, user } = await mockLogin(page, ADMIN_PHONE);
    expect(token.length).toBeGreaterThan(50);
    expect(user.phone).toBe(ADMIN_PHONE);
    expect(user.roles).toContain('admin');
  });

  test('signed-in user reaches a protected page', async ({ page }) => {
    await signIn(page);
    await page.goto('/en/profile');
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page.locator('body')).toContainText(/profile|account|ගිණුම|சுயவிவரம்/i);
  });

  test('login page shows the phone entry', async ({ page }) => {
    await page.goto('/en/login');
    await expect(page.locator('input')).toBeVisible();
  });
});
