import { defineConfig, devices } from '@playwright/test';

/**
 * SkillLink E2E — Playwright. Drives the real web app (auto-started below) against
 * a running API + the Neon DB. Auth uses the dev mock verifier (mock:<phone>), so
 * tests can sign in without real OTP.
 *
 * PREREQ: the API must be running on :4000 with AUTH_VERIFIER=mock. Start it with:
 *   cd apps/api && AUTH_VERIFIER=mock JWT_ACCESS_SECRET=dev-access-secret-change-me \
 *     DATABASE_URL="<neon url>" npm run start:dev
 * Then: npm run e2e   (from apps/web)
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [['list'], ['html', { open: 'never' }]],
  timeout: 30_000,
  expect: { timeout: 8_000 },

  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    locale: 'en',
  },

  projects: [
    { name: 'desktop-chrome', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile-safari', use: { ...devices['iPhone 13'] } },
  ],

  // Auto-start the web app. Reuses an already-running dev server locally.
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000/en',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
