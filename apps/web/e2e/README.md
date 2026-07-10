# SkillLink E2E (Playwright)

End-to-end tests that drive the real web UI against a running API + the Neon DB.

## What's covered
- **smoke** — every key public/authed/admin page renders (desktop + mobile), no crashes, branded 404.
- **auth** — protected-route redirect, mock OTP token, signed-in access.
- **booking-journey** — the full customer flow: category → describe → find providers → assign → confirmation.
- **booking-lifecycle** — create (with address), cancel + fee policy, dispute, matching ranking, detail reflects address, notification prefs persist.
- **dashboards** — provider / customer / admin dashboards + admin users table.
- **safety-reviews** — trusted contacts, report-a-provider, admin trust queue, provider reviews section.

Two projects run every spec: **desktop-chrome** and **mobile-safari (iPhone 13)**.

## Prerequisites
1. **API running** on `:4000` with the mock verifier + Neon DB:
   ```bash
   cd apps/api
   AUTH_VERIFIER=mock JWT_ACCESS_SECRET=dev-access-secret-change-me \
   DATABASE_URL="postgresql://…neon…?sslmode=require" npm run start:dev
   ```
2. **Seeded providers** on the DB (already applied): `db/seeds/004_realistic_kandy.sql`.
3. **Browsers** (first run only): `npm run e2e:install`

## Run
```bash
cd apps/web
npm run e2e            # headless, both projects
npm run e2e:ui         # interactive UI mode (great for debugging)
npm run e2e:report     # open the HTML report after a run
```
Playwright auto-starts the web dev server (`npm run dev`) and reuses one if already running.

## Notes
- Auth uses the dev **mock** verifier (`mock:<phone>`), so no real OTP is needed. This works only while the API runs with `AUTH_VERIFIER=mock` (dev). It will not work against a production API where the mock is disabled.
- Lifecycle tests create + then cancel their own bookings to keep the DB tidy; a few tagged `E2E` rows may remain and can be swept manually.
- `E2E_BASE_URL` env var points the suite at a different origin (e.g. a preview deploy).
