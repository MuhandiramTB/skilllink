# SkillLink — QA Handoff & Test Guide

**Product:** SkillLink — an on-demand skilled-services marketplace for Sri Lanka (v1: Kandy).
Customers book verified tradespeople (electricians, plumbers, cleaners, AC techs, etc.); providers accept jobs, quote, complete, and get paid.

**Audience:** QA engineer / tester picking up the system for the first time.
**Last updated:** 2026-07-11.

---

## 1. System at a glance

| Layer | Tech | Where |
|---|---|---|
| **Web app** | Next.js 14 (App Router), Tailwind, next-intl (en/si/ta) | `apps/web` |
| **API** | NestJS, Prisma | `apps/api` |
| **Database** | PostgreSQL 18 + PostGIS (hosted on **Neon**) | `db/migrations`, `db/seeds` |
| **Maps/geo** | Leaflet + OpenStreetMap tiles; OSM Nominatim for address search | — |
| **Auth (dev)** | Mock OTP (`mock:<phone>`) | prod uses Firebase (not yet enabled) |

**Live deployments:**
- Web → Vercel: `https://skilllink-web-dusky.vercel.app`
- API → Azure: `https://skilllink-api.whitesand-ba9ed9eb.southeastasia.azurecontainerapps.io/api/v1`

> ⚠️ **Prod may lag the code.** The DB (Neon) is current, but the deployed API/web can be behind the latest commits. Confirm the version under test before filing bugs against prod.

---

## 2. Roles & how the app is structured

One account can hold multiple **roles** and switch **mode** (Customer ⇄ Provider), plus Admin for staff.

- **Customer** — searches, books, tracks, pays, reviews, disputes, SOS.
- **Provider** — sets service area + schedule, accepts jobs, quotes, shares live location, replies to reviews, tops up commission wallet.
- **Admin** — users, verifications, bookings, payments, disputes, categories, districts, analytics, trust-&-safety queue, settings (commission %, match weights).

**Trilingual:** every screen is available in **English / Sinhala (සිංහල) / Tamil (தமிழ்)** via the language switcher. QA should spot-check all three.

---

## 3. Local test environment setup

### Prerequisites
- Node 20+, the repo cloned, PostgreSQL 18 client tools (for direct DB checks).
- Access to the Neon `DATABASE_URL` (ask the team; it is **not** in the repo).

### ⚠️ CRITICAL — stop Docker first
Docker Desktop may run an **old compose stack** that hijacks ports 3000/4000 and serves **stale builds**. This has caused hours of phantom "bugs." Always:
```bash
docker compose stop        # or: docker compose down
docker ps                  # confirm nothing is on 3000/4000
```

### Start the API (terminal 1)
```bash
cd apps/api
# inline env (Git Bash):
DATABASE_URL="postgresql://…neon…?sslmode=require" \
AUTH_VERIFIER=mock \
JWT_ACCESS_SECRET=dev-access-secret-change-me \
NODE_ENV=development \
CORS_ORIGIN=http://localhost:3000 \
npm run start:dev
# wait for: "SkillLink API listening on http://localhost:4000/api/v1"
```
- `AUTH_VERIFIER=mock` enables the mock login (below). **Never use mock against prod.**
- `CORS_ORIGIN` **must match** the web origin or the browser's API calls are blocked (pages hang on "Loading…").

### Start the web app (terminal 2)
```bash
cd apps/web
npm run dev            # http://localhost:3000
# NEXT_PUBLIC_API_URL is read from apps/web/.env.local (default http://localhost:4000/api/v1)
```

### Health check
- API: open `http://localhost:4000/api/v1/health` → `{"status":"healthy", … "postgis":"3.6.0"}`
- Web: open `http://localhost:3000/en` → landing page renders.

---

## 4. Test accounts & data

Auth is **mock OTP** in dev: on the login screen, enter the phone, then **any 6 digits** as the code. (Under the hood the app sends `mock:<phone>`.)

| Account | Phone | Roles | Use for |
|---|---|---|---|
| **Admin / customer** | `+94770000000` | customer + admin | Admin console, customer flows |
| **Seeded providers** | `+9477SEED01` … `SEED08` | provider | *Exist in DB but CANNOT mock-login* — used only as match targets |

**Seeded data (already on Neon):**
- **25 districts** (only **Kandy** is active — matching only returns providers in active districts).
- **8 approved + available providers** around Kandy (electrician, plumber, AC, carpenter, painter, solar). A search near Kandy returns ranked matches.
- Service categories incl. Solar sub-categories, with price bands on electrician/plumber/cleaning.

> To test "no providers found", search a category with no seeded supply, or a far-off location.

---

## 5. Feature test matrix

Legend: **C** = Customer, **P** = Provider, **A** = Admin.

### 5.1 Auth & onboarding
| # | Test | Steps | Expected |
|---|---|---|---|
| A1 | First-run onboarding | Fresh browser → open `/en` | 3-slide intro appears once (what / trust / how); "Skip" and dots work; doesn't reappear after finishing |
| A2 | Mock login | `/login` → enter phone → any 6 digits | Signed in, lands on the role's home |
| A3 | Protected redirect | Signed out → open `/profile` | Redirects to `/login?next=…` |
| A4 | Sign out / all devices | Profile → Sign out / Sign out all | Session cleared, back to landing |
| A5 | Language switch | Header switcher → si / ta | All visible text changes; layout intact |

### 5.2 Customer booking journey (core — highest priority)
| # | Test | Steps | Expected |
|---|---|---|---|
| B1 | Landing search | Home → pick service + type a Kandy town → Search | Routes to `/category/{key}?loc=…`, map pre-centered |
| B2 | Address picker | On category page: search an address / "Use my location" / drag pin | Pin moves, reverse-geocode fills the address, "Detected area" shows nearest town |
| B3 | Address notes | Add house no. / landmark | Saved with the booking |
| B4 | Find providers | Describe the job (≥5 chars) → Find providers | Ranked provider cards (distance + rating + work photos), or a "no providers" note |
| B5 | Confirm booking | Tap "Book" on a provider | **Celebration animation** + haptic, then booking detail page |
| B6 | Booking list | `/bookings` | Shows the booking; empty state if none |
| B7 | Price transparency | Category with a price band | Shows "typical price" hint before booking + disclaimer |

### 5.3 Booking lifecycle & tracking
| # | Test | Role | Expected |
|---|---|---|---|
| L1 | Booking detail | C/P | Stepper (Requested→…→Completed), details, **address shown**, chat |
| L2 | Chat | C/P | Messages send (optimistic), auto-refresh ~4s, phone numbers masked |
| L3 | Quote | P | Provider sets a price → customer sees "quote ready" |
| L4 | Accept quote | C | Customer accepts → provider can start |
| L5 | **Live tracking** | C | On accepted/in-progress job: map shows provider's moving pin + ETA banner |
| L6 | Share location | P | "Share my live location" toggle → streams GPS |
| L7 | Reschedule | C/P | Change date/time before start |
| L8 | Cancel (free) | C | Cancel before provider accepts → fee = 0 |
| L9 | Cancel (fee) | C | Cancel an **accepted** job → cancellation fee shown |
| L10 | No-show | C | Report provider no-show → provider gets a strike |
| L11 | Cash report | P | On a completed job → "Settled in cash? Report it" |
| L12 | Review | C | Rate the pro → **celebration** + points; review text shows on provider profile |
| L13 | Provider reply | P | Provider replies to a review (dashboard) |
| L14 | Dispute | C/P | "Report a problem" → opens a dispute; admin sees it |

### 5.4 Trust & safety
| # | Test | Role | Expected |
|---|---|---|---|
| S1 | SOS | C | On an active job → SOS button → confirm → alerts trusted contacts + tel:119 quick call |
| S2 | Trusted contacts | C | Profile → add / list / remove contacts |
| S3 | Report a provider | C | Provider profile → "Report" → reason + detail → confirmation |
| S4 | Admin trust queue | A | `/admin/safety` lists active alerts + open reports |
| S5 | Verified badge | C | Provider profile shows verified status + work photos |

### 5.5 Provider tools
| # | Test | Role | Expected |
|---|---|---|---|
| P1 | Register | P | Multi-step: business, category, **service-area map + radius**, docs, availability |
| P2 | Coverage map | P | Selecting towns shows coverage circles |
| P3 | Availability | P | Online/offline toggle + "Busy 1h/3h/Rest of day / I'm free" |
| P4 | Edit details | P | Change working hours/days/emergency from dashboard |
| P5 | Earnings dashboard | P | KPI cards (animated), earnings chart from real data, wallet balance |
| P6 | Wallet top-up | P | Top up commission wallet |
| P7 | Work photos | P | Upload/delete portfolio photos (JPEG/PNG/WebP ≤5 MB) |

### 5.6 Admin console
| # | Test | Expected |
|---|---|---|
| M1 | Dashboard | KPIs (revenue, commission, bookings, providers), bookings-by-status |
| M2 | Users | Table (mobile cards + desktop table), suspend/reactivate/force-logout |
| M3 | Verifications | Approve/reject provider docs |
| M4 | Bookings / Payments | Tables with status pills, amounts, dates (scroll-safe) |
| M5 | Disputes | View + resolve |
| M6 | Categories / Districts | CRUD; **activate a district** (island-wide matching gate) |
| M7 | Settings | Edit commission % + match weights (proximity/rating/response) |
| M8 | Analytics / Reports / Audit | Charts, KPIs, audit log |

### 5.7 Cross-cutting UI/UX
| # | Test | Expected |
|---|---|---|
| U1 | Responsive | Test mobile / tablet / desktop — no horizontal scroll; tables scroll inside their container |
| U2 | Dark mode | Toggle theme — both light + dark styled |
| U3 | Error/404 | Unknown route (`/en/xyz`) → branded "Page not found"; a thrown error → branded error screen |
| U4 | Loading/empty states | Slow network → spinners/skeletons; no data → designed empty states |
| U5 | Notifications | Bell shows unread count; panel is a clear mobile sheet; mark-all-read |
| U6 | Notification prefs | Profile toggles persist server-side (turn off "Offers" → promos not delivered) |
| U7 | PWA install | Supported browser → "Add SkillLink to home screen" prompt |
| U8 | Haptics | On mobile, CTAs buzz on tap (Android/Chrome; iOS ignores silently) |

---

## 6. Automated E2E tests (Playwright)

A ready suite exists — run it before manual regression.

```bash
# 1) docker compose stop   (free ports!)
# 2) start the API on :4000 with AUTH_VERIFIER=mock and CORS_ORIGIN=http://localhost:3000
# 3):
cd apps/web
npm run e2e:install     # first time only (installs browsers)
npm run e2e             # builds + runs the full suite (28 tests, desktop + mobile)
npm run e2e:report      # open the HTML report
```
Covers: auth, smoke (all key pages render + 404), full booking journey, lifecycle (cancel/dispute/matching/address/notif prefs), dashboards, trust & safety, reviews. **Current state: 28/28 pass.**
See `apps/web/e2e/README.md` for details.

---

## 7. Known limitations / out of scope (do NOT file as bugs)

These are **intentionally deferred** — see `docs/DEFERRED-SETUP.md`:

1. **Payments gateway is mocked.** In-app payment doesn't move real money; recorded cancellation fees aren't collected. (PayHere/Genie not integrated.)
2. **OTP is mock in dev.** Real Firebase auth not enabled — anyone can "log in" as any phone locally/on the current prod build.
3. **Push / SMS notifications are stubbed.** Only in-app + (config-gated) email. A user not in the app won't get "provider accepted".
4. **Images stored as base64 in Postgres** (not object storage) — fine at current scale.
5. **Island-wide is UI-only until districts are activated.** Only Kandy is active; other districts return zero matches by design until an admin activates them.
6. **Geocoding uses free OSM Nominatim** (1 req/sec policy) — may rate-limit under heavy use.

---

## 8. How to file a bug

Include: **role + mode**, **language**, **device/viewport**, **exact URL**, steps, expected vs actual, and — importantly — **which environment** (local / Vercel-prod / a specific commit). For API errors, capture the network response (`{data, error}` envelope) and the API log line.

**Before filing a "stale/old behavior" or "fix didn't take" bug:** run `docker compose stop`, hard-refresh (Ctrl+Shift+R), and re-test. Docker serving an old build is the #1 false alarm here.

---

## 9. Quick reference — key files

| Thing | Path |
|---|---|
| Pages | `apps/web/src/app/[locale]/**/page.tsx` |
| API modules | `apps/api/src/{auth,bookings,providers,matching,safety,reviews,notifications,admin,payments,…}` |
| DB migrations | `db/migrations/001…017_*.sql` |
| Seeds | `db/seeds/*.sql` (004 = realistic Kandy providers) |
| i18n strings | `apps/web/messages/{en,si,ta}.json` |
| E2E tests | `apps/web/e2e/` |
| Deferred/setup notes | `docs/DEFERRED-SETUP.md` |
