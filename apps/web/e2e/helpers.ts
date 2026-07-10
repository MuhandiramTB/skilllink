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

/** Fetch a real JWT from the API for a phone (mock OTP). */
export async function mockLogin(page: Page, phone: string): Promise<{ token: string; user: any }> {
  const res = await page.request.post(`${API}/auth/otp/verify`, {
    data: { firebaseIdToken: `mock:${phone}` },
  });
  expect(res.ok(), `mock login for ${phone} should succeed (is the API running with AUTH_VERIFIER=mock?)`).toBeTruthy();
  const body = await res.json();
  return { token: body.data.accessToken, user: body.data.user };
}

/**
 * Sign a page in. The app derives the whole session by DECODING the JWT (it does
 * not read a separate session object), so we only need to store the token. To test
 * a specific mode, pass a token already issued in that mode (see signInAsProvider).
 */
export async function signIn(page: Page, phone = ADMIN_PHONE, tokenOverride?: string) {
  let token = tokenOverride;
  let user: any = null;
  if (!token) { const r = await mockLogin(page, phone); token = r.token; user = r.user; }
  await page.goto('/en'); // set storage on the right origin
  await page.evaluate(
    ([tk, tokenKey]) => {
      localStorage.setItem(tokenKey as string, tk as string);
      localStorage.setItem('skilllink_onboarded', '1'); // skip the onboarding overlay in tests
    },
    [token, TOKEN_KEY],
  );
  // Reload can occasionally abort if a navigation is mid-flight; retry once.
  await page.reload({ waitUntil: 'domcontentloaded' }).catch(async () => {
    await page.waitForTimeout(300);
    await page.reload({ waitUntil: 'domcontentloaded' }).catch(() => {});
  });
  return user;
}

/** Scroll to the bottom so Reveal-on-scroll sections (IntersectionObserver) mount.
 *  Then wait a beat for the reveal + any data fetch. */
export async function revealAll(page: Page) {
  await page.evaluate(async () => {
    for (let y = 0; y <= document.body.scrollHeight; y += 400) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); }
    window.scrollTo(0, document.body.scrollHeight);
  });
  await page.waitForTimeout(400);
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
