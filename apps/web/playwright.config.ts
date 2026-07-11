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
  // Serial by default: the suite shares one test account + one DB, so parallel
  // runs race on that shared state. One worker keeps results deterministic.
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: 1,
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

  // Run against a PRODUCTION build on port 3000 (matches the API's default
  // CORS_ORIGIN so browser fetches aren't blocked) via `next start` (all routes
  // precompiled — no dev cold-compile race). reuseExistingServer:false so a stale
  // Docker container on 3000 can't shadow us.
  // ⚠️ Stop any Docker web container first (it proxies 3000): `docker compose stop web`.
  // Prereq: API on :4000 with AUTH_VERIFIER=mock and CORS_ORIGIN=http://localhost:3000.
  webServer: {
    command: 'npm run start -- -p 3000',
    url: 'http://localhost:3000/en',
    reuseExistingServer: false,
    timeout: 180_000,
  },
});
