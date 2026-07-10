import { Page, expect } from '@playwright/test';

/**
 * Shared E2E helpers. Auth uses the dev mock verifier: POST /auth/otp/verify with
 * { firebaseIdToken: "mock:<phone>" } returns a JWT, which we inject into the
 * same localStorage key the app reads (skilllink_admin_token) + a session object.
 */

export const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

// Known seeded accounts (db/seeds). The admin has customer+admin roles.
export const ADMIN_PHONE = '+94770000000';

const TOKEN_KEY = 'skilllink_admin_token';
const SESSION_KEY = 'skilllink_session';

/** Fetch a real JWT from the API for a phone (mock OTP). */
export async function mockLogin(page: Page, phone: string): Promise<{ token: string; user: any }> {
  const res = await page.request.post(`${API}/auth/otp/verify`, {
    data: { firebaseIdToken: `mock:${phone}` },
  });
  expect(res.ok(), `mock login for ${phone} should succeed (is the API running with AUTH_VERIFIER=mock?)`).toBeTruthy();
  const body = await res.json();
  return { token: body.data.accessToken, user: body.data.user };
}

/** Sign a page in by injecting the token + session into localStorage, then reload. */
export async function signIn(page: Page, phone = ADMIN_PHONE, mode?: string) {
  const { token, user } = await mockLogin(page, phone);
  // Must set storage on the right origin — visit first.
  await page.goto('/en');
  await page.evaluate(
    ([tk, sess, tokenKey, sessKey]) => {
      localStorage.setItem(tokenKey as string, tk as string);
      localStorage.setItem(sessKey as string, sess as string);
      localStorage.setItem('skilllink_onboarded', '1'); // skip onboarding overlay in tests
    },
    [token, JSON.stringify({ userId: user.id, phone: user.phone, roles: user.roles, mode: mode ?? user.mode }), TOKEN_KEY, SESSION_KEY],
  );
  await page.reload();
  return user;
}

/**
 * Sign in as a PROVIDER: ensure the account has the provider role (become-provider
 * is safe to call repeatedly), switch its mode to provider, then inject that token.
 * The mock admin account is customer+admin only, so provider views need this.
 */
export async function signInAsProvider(page: Page, phone = ADMIN_PHONE) {
  const { token } = await mockLogin(page, phone);
  const auth = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  // Make sure the account is a provider (idempotent enough for tests).
  await page.request.post(`${API}/providers`, { headers: auth, data: { businessName: 'E2E Provider' } }).catch(() => {});
  // Switch active mode → returns a fresh token in provider mode.
  const switchRes = await page.request.post(`${API}/auth/mode`, { headers: auth, data: { mode: 'provider' } });
  const sj = await switchRes.json();
  const provToken = sj.data?.accessToken ?? token;
  const provUser = sj.data?.user ?? { id: '', phone, roles: ['customer', 'provider'], mode: 'provider' };
  await page.goto('/en');
  await page.evaluate(
    ([tk, sess]) => {
      localStorage.setItem('skilllink_admin_token', tk as string);
      localStorage.setItem('skilllink_session', sess as string);
      localStorage.setItem('skilllink_onboarded', '1');
    },
    [provToken, JSON.stringify({ userId: provUser.id, phone: provUser.phone, roles: provUser.roles, mode: 'provider' })],
  );
  await page.reload();
}

/** Create a booking via the API (fast path for lifecycle tests). Returns its id. */
export async function apiCreateBooking(token: string, opts: { categoryKey?: string; description?: string } = {}) {
  const res = await fetch(`${API}/bookings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      categoryKey: opts.categoryKey ?? 'electrician',
      description: opts.description ?? 'E2E test booking',
      lat: 7.2906, lng: 80.6337,
    }),
  });
  const b = await res.json();
  return b.data?.id as string | undefined;
}

/** Delete E2E-created bookings so the DB stays clean (best-effort, direct is not
 *  available from the browser, so we tag descriptions with 'E2E' and clean via API
 *  where possible; otherwise left to a manual sweep). */
export const E2E_TAG = 'E2E test booking';
