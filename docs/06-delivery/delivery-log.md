# Delivery Log — SkillLink LK

Running record of what each sprint actually shipped (BMAD delivery record).
One entry per sprint; newest at top.

---

## Tier-1 worth-it features (geolocation, uploads, notifications) · ✅ Closed 2026-06-24

After a 3-dimension completeness audit (backend/frontend/ops), built the highest-value
"showstopper" gaps that need no external accounts.

### Shipped
| Area | Deliverable |
|------|-------------|
| Geolocation | `LocationPicker` (browser GPS + manual lat/lng fallback) wired into booking + provider registration — replaces hardcoded Kandy coords |
| File upload | `FileUpload` (real file input, camera/gallery `capture`, image preview) in the provider verification step |
| Notifications | `notifications` table + Prisma model; `NotifierService` (global) + endpoints (list, unread-count, read, read-all); emits on booking requested/accepted/rejected/completed + provider approve/reject; web `NotificationBell` (badge + dropdown, 30s poll) |
| Docs | corrected inconsistencies: Prisma-migrate (raw SQL today), OpenAPI (hand-written), E2E (manual for now) |

### Verification
API build clean; web build clean; 33/33 unit tests pass (fixed auth/verification specs for new constructor args + suspension check).

### Still mock (need external accounts — the remaining Tier-1 items)
Real OTP (Firebase), real file storage (Cloudinary), real payments (PayHere). The
LocationPicker/FileUpload/notification UIs are real now; only the transport swaps in later.

### Known remaining gaps (from audit, for later tiers)
Provider discovery/search UI, public provider profiles, editable profiles, real Messages
inbox, full i18n (only ~homepage translated), PWA manifest/offline, webhook HMAC, self-review
guard, double-booking guard, pagination on some lists, E2E/frontend tests, deploy/Docker/Redis.

---

## Auth & Registration Flow + UX polish · ✅ Closed 2026-06-23

**Spec:** `10-auth-registration-flow` (ADR-0004). Implemented the owner's auth/registration
spec, reconciled against the built system (OTP admin via hidden URL, no Google, teal kept).

### Shipped
| Area | Deliverable |
|------|-------------|
| Login | Single `/login` (OTP, one-tap demo accounts), role-aware redirect via `homeForRole()` |
| Customer reg | `/register` — name, district, language, optional email (<30s); new customers routed here |
| Provider reg | `/provider/register` — 5-step wizard (basic/service/area/verification/availability) → pending |
| Admin | hidden `/admin/login` (OTP, admin-only); layout exempts it from the guard |
| Nav | mobile-first `BottomNav` — customer (Home/Bookings/Messages/Profile), provider (Jobs/Earnings/Messages/Profile) |
| Provider dash | floating "Go Online" availability button (approved providers) |
| Admin sidebar | completed: Dashboard/Users/Providers/Bookings/Payments/Categories/Districts/Reports/Disputes/Audit/Settings |
| API | `PATCH /auth/profile`, `GET /districts/public`, `PATCH /providers/me/details`, `GET /admin/bookings`, `GET /admin/payments`; migration 004 (customer district/email, provider experience/availability) |

### Verification
API `tsc` clean; web `next build` clean (exit 0) — all new routes compile and prerender.
Role redirect confirmed earlier against live API (admin/customer/provider resolve correctly).
Demo logins seeded (005): admin +94770000000, customer +94776665544, provider +94772223333.

### Deferred (owner decisions, documented in ADR-0004)
Google sign-in; admin email/password+MFA (using OTP); blue theme (teal kept); Calendar tab
(no scheduling yet); WhatsApp OTP. Real Firebase OTP per real-integrations.md.

---

## Sprint 0 — Foundations · ✅ Closed 2026-06-19

**Goal:** stand up a runnable, DB-backed full stack.

### Shipped
| Area | Deliverable | Evidence |
|------|-------------|----------|
| Infra | PostgreSQL 18 + **PostGIS 3.6.2** installed; `skilllink` DB | `/health` → `postgis: 3.6.2` |
| DB | Schema (18 tables, 12 enums, 9 indexes incl. 4 GIST) | `db/migrations/001_init.sql` |
| DB | `districts` model for v1 Kandy phasing | seeded: Kandy active, Colombo/Gampaha inactive |
| DB | Seeds: 12 trades + 7 Solar sub-categories (trilingual) | `db/seeds/001_*`, `002_*` (demo providers) |
| API | NestJS monorepo workspace, `{data,error}` envelope, global validation | `apps/api/` |
| API | `GET /health`, `GET /categories`, `GET /match` | all verified via HTTP |
| API | Matching engine (raw PostGIS, config-driven weights) | ranked Kandy electricians, excluded offline/unverified |
| Web | Next.js PWA, Tailwind, next-intl (si/ta/en) | `apps/web/` |
| Web | Language switcher + category grid from API | verified rendering in en/si/ta |
| CI | GitHub Actions with PostGIS service container | `.github/workflows/ci.yml` |

### Specs touched
- `00-catalog` — Req 1 built (Req 2 admin CRUD deferred to Sprint 5)
- `04-matching-engine` — Req 1 built (Req 2 filtering deferred to Sprint 3)

### Verification snapshot
```
/health     → { data:{ status:"ok", postgis:"3.6.2" }, error:null }
/categories → 12 roots, solar has 7 children
/match electrician @Kandy → Sunil(913m,4.8,0.63) > Nuwan(5.9km,4.6,0.41) > Kamal(4km,4.3,0.39)
            (Ravi=offline and Pradeep=unverified correctly excluded)
web /en /si /ta → all render category grid from API
```

### Deferred (carried forward)
- Firebase OTP wiring → **Sprint 1** (build with mock verifier first).
- Cloud deploy (Vercel/AWS) → later; local-first for v1 build.
- Admin category CRUD → Sprint 5.
- Matching filters + load test → Sprint 3.

### Deviations from plan
- Used npm workspaces (no pnpm on machine) — no impact.
- Geo columns modeled as Prisma `Unsupported(...)`; matching via raw SQL (expected; documented in `tech-decisions.md`).

---

## Sprint 1 — Authentication & OTP · ✅ Closed 2026-06-19

**Goal:** phone-OTP auth with JWT sessions, language, and role-based authZ.
**Approach:** built with a **mock Firebase verifier** (`AUTH_VERIFIER=mock`) so the full
flow is testable locally; real Firebase creds drop into the same `FirebaseVerifier`
interface later with no caller changes.

### Shipped (`apps/api/src/auth/`)
| Component | Purpose | Req |
|-----------|---------|-----|
| `TokenService` (jose) | access JWT 15m {sub,role}; refresh 256-bit, SHA-256 hash stored | 2.2, 2.5 |
| `SessionService` | create/rotate/revoke; **replay defense** (revoked-token reuse → revoke all) | 4, 5 |
| `AuthService` | verify→upsert(role=customer,lang=en)→issue; language; me | 2, 3 |
| `AuthController` | `/auth/otp/request|verify`, `/refresh`, `/logout`, `/language`, `/me` | 1–5 |
| `JwtAuthGuard` + `RolesGuard` + `@CurrentUser` | authZ context, role enforcement | 6 |
| `OtpRateLimitGuard` | 5/15min/phone (in-memory; Redis later) | 1.3 |
| `MockFirebaseVerifier` (+ `FirebaseVerifier` abstraction) | dev OTP without SMS | 2 |

### Verification
- **Unit:** 10 tests pass (token sign/verify, refresh hashing, rotation, replay-all-revoke, upsert defaults, invalid-token 401).
- **Live API (mock):** request→202; bad phone→400 VALIDATION_ERROR; verify→tokens+role=customer; bad token→401 AUTH_OTP_INVALID; /me ok; /me no-token→401; set language=si persisted; refresh→new pair; **replay old refresh→401 + new token also revoked**.

### Deferred / notes
- Real Firebase wiring + `RealFirebaseVerifier` → before pilot (needs project + SMS quota).
- Web login UI + Playwright E2E (T-E2E) → in the web-auth UI sprint.
- Rate-limit store is in-memory → Redis when API scales horizontally.
- `/me` is mounted at `/auth/me` (grouped under auth) vs the PRD's bare `/me` — minor, documented in API spec.

### Deviations
- Used a custom `JwtAuthGuard` (jose verify) instead of passport-jwt (cleaner with jose-signed tokens).
- jose v6 is ESM-only → Jest `transformIgnorePatterns` allows transforming it.

---

## Sprint 1.5 — Admin/Owner Master-Data Console · ✅ Closed 2026-06-19

**Goal:** owner manages catalog + district coverage via UI, not SQL (ADR-0002).

### Shipped
| Area | Deliverable |
|------|-------------|
| API `admin/` | `AdminGuard` (role=admin), categories CRUD, districts activate, `AuditService` |
| API | endpoints: `GET/POST/PATCH/DELETE /admin/categories`, `GET/PATCH /admin/districts` |
| DB | `audit_log` added to Prisma; `003_seed_admin.sql` (dev admin `+94770000000`) |
| Web `/admin` | layout gate (mock sign-in), dashboard, categories page (add/nest/deactivate, trilingual), districts page (activate toggle) |
| Web | `lib/admin-api.ts` token client |

### Verification (api + web, live)
- Admin sign-in (mock) → role=admin; **non-admin → 403, no token → 401**.
- Create category → **appears in customer grid (EN + Sinhala name)**; via public API too.
- Sub-service nests under Solar (7→8 children); duplicate key → **409 CATEGORY_KEY_EXISTS**.
- Deactivate → **hidden from public tree**.
- Districts list shows Kandy active; **activating Gampaha** sets is_active + launched_at.
- `audit_log` rows written for create/deactivate/activate.
- Admin pages render (200) with no SSR crash.

### Deferred / notes
- Automated admin tests (unit/integration) → add next (verified manually this sprint).
- Web admin uses client-side localStorage token + mock sign-in; replace with real login UI + httpOnly cookie when web-auth ships.
- Reorder UI (MASTER-04) supported by API (`sort_order`); drag-reorder UI is minimal (edit value) — enhance later.

---

## Sprint 2 — Provider Onboarding & Verification · ✅ Closed 2026-06-19

**Goal:** providers onboard, get verified, become matchable; admins run the verification queue.
**Approach:** mock `MediaUploader` (like the Firebase pattern) → testable without Cloudinary.

### Shipped
| Area | Deliverable |
|------|-------------|
| Spec | completed `design.md` (state machine, uploader abstraction) + `tasks.md` |
| API `providers/` | become-provider, verifications, service-area (PostGIS), categories, availability, public profile |
| API | admin verification queue + approve/reject (AdminGuard + AuditService) |
| API | `MediaUploader` abstraction + `MockMediaUploader` |
| DB | Prisma `verifications` model + `verification_type/status` enums added |
| Web | `/provider` onboarding + dashboard (become, upload docs, category, area, availability toggle) |
| Web | `/admin/verifications` queue (approve/reject with reason) |
| Tests | +6 provider unit tests (16 total passing) |

### Verification (live E2E)
onboard (status=pending) → upload NIC+selfie (mock) → set electrician + Kandy area + available
→ **NOT in /match while pending, verified=false** → admin queue shows provider → **approve**
→ **now appears in /match (distance 0), verified=true**. Reject path + 404 covered by unit tests.

### Deferred / notes
- Real Cloudinary uploader + signed uploads → before pilot.
- Approval/rejection notifications (FCM/SMS) → notifications sprint.
- Provider web uses mock login + client token (same as admin) → real login UI later.
- One service area per provider in UI (schema supports many).

### Deviations
- `verifications` table already existed in `db/migrations/001_init.sql`; only the Prisma model was missing — added.

---

## Sprint 3 — Service Booking · ✅ Closed 2026-06-19

**Goal:** customer books a verified provider end-to-end with masked chat & status tracking.

### Shipped
| Area | Deliverable |
|------|-------------|
| Spec | completed `design.md` (state machine, chat masking) + `tasks.md` |
| API `bookings/` | create (PostGIS point), matches (reuse engine), assign, respond, status, cancel, history, detail |
| API | masked chat (`ChatService` + `scrubPhones`), conversation per booking |
| Logic | `booking-status` state machine + `canTransition` guard |
| DB/Prisma | `booking_media`, `conversations`, `messages` models; `booking_status` + `media_kind` enums |
| Web | `/category/[key]` full flow: describe issue → matches → book → track + chat |
| Infra | `AllExceptionsFilter` now logs unexpected errors (caught the enum bugs) |
| Tests | +5 (booking state machine, chat scrub) → 21 total passing |

### Verification (live E2E)
create(+photo)=requested → matches=4 (verified only) → assign=matched → accept=accepted →
**chat: "Call me 0771234567" stored as "Call me [hidden]"** → in_progress → completed.
Illegal transition (matched→completed) → **400 BOOKING_INVALID_TRANSITION**. Cross-customer → **403**.

### Bugs found & fixed (why we verify on a live DB)
- Prisma `status`/`kind` declared `String` but the Postgres columns are enums → read-back
  failed with "incompatible value". Fixed by declaring `booking_status` + `media_kind` Prisma enums.
- Added unexpected-error logging to the global exception filter (was swallowing stack traces).

### Deferred / notes
- Realtime (Socket.IO live status + typing) → polling for v1; realtime sprint later.
- Provider accept-timeout auto-revert → manual reject for now.
- Pricing/commission + reviews on completion → Payments + Reviews sprints.
- Web booking uses Kandy-town default location (geolocation picker later).

---

## Sprint 4 — Payments & Reviews · ✅ Closed 2026-06-19

**Goal:** money on completion (commission, earnings) + ratings that feed matching.
**Approach:** mock `PaymentGateway` → testable without PayHere.

### Shipped
| Area | Deliverable |
|------|-------------|
| Specs | `07-payments` + `08-reviews` (requirements/design/tasks) |
| API `payments/` | initiate (commission calc, idempotent), webhook (idempotent), earnings; `PaymentGateway` abstraction + mock |
| API `reviews/` | create (completed-only, once), provider response, public list, **rating recalc** |
| DB/Prisma | `payments` (+ enums), `reviews` models |
| Web | pay button + review form on completed booking |
| Tests | +9 (commission math, webhook idempotency, completed-gate, recalc) → 30 total |

### Verification (live E2E)
complete booking → **pay LKR100 → commission 1200 (12%), net 8800** → webhook confirm
(2nd delivery credited=false) → **earnings net 8800** → **review 5★ → provider rating 0→5**
→ **/match now shows rating 5, score 1.0** (trust-quality loop closed). Double review → 409.

### Deferred / notes
- Real PayHere/Genie gateway + signature scheme → before pilot.
- Refunds, payout scheduling, multi-currency → later.
- Review moderation/flagging → later.

### Deviations
- None significant. (E2E teardown initially hit a payments→bookings FK; cleanup order fixed — not a product issue.)

---

## MVP status after Sprint 4
End-to-end marketplace works: auth → onboard/verify provider → browse → book → accept →
masked chat → complete → pay (commission) → review → rating feeds matching. Admin manages
catalog + districts + verification queue. **Pilot-readiness (Gate G1) is close** — remaining
before pilot: real integrations (Firebase OTP, Cloudinary, PayHere), web auth UI polish,
NFR hardening (perf/security/i18n QA), deploy.

## Sprint 5 — Admin ops & hardening · ✅ Closed 2026-06-19

**Goal:** complete admin console (disputes + analytics) + security hardening + pilot prep.

### Shipped
| Area | Deliverable |
|------|-------------|
| Spec | `09-admin-ops` (disputes + analytics) |
| API `admin-ops/` | open dispute (participant), queue + resolve (admin, audited), analytics snapshot |
| Security | `helmet` headers; global `@nestjs/throttler` (120/min/IP) |
| DB/Prisma | `disputes` model |
| Web | `/admin/disputes` + `/admin/analytics` dashboard |
| Docs | [real-integrations.md](../04-architecture/real-integrations.md) (swap guide), [pilot-readiness.md](../08-management/pilot-readiness.md) (G1 checklist) |
| Tests | +3 (dispute participant/dup guards) → 33 total |

### Verification (live)
helmet headers present (nosniff, dns-prefetch off); analytics admin-only (customer→403) with
real aggregates (4 approved / 1 pending providers, 1 active district); dispute opened by
participant → admin queue → resolved; non-participant → 403.

### Deferred (documented, pre-pilot work — needs external accounts/deploy)
- Real Firebase/Cloudinary/PayHere wiring → [real-integrations.md](../04-architecture/real-integrations.md).
- Web login UI, geolocation picker, Redis-backed rate limit, deploy → [pilot-readiness.md](../08-management/pilot-readiness.md).
- Fraud ML (ADMIN-04), notifications → post-pilot.

---

## 🎯 MVP COMPLETE (Sprints 0–5)
All MVP epics built & verified against a live PostgreSQL/PostGIS DB. 33 unit tests; API + web
build clean. Remaining to launch the Kandy pilot is *productionizing* (real integrations,
deploy, NFR QA) — tracked in [pilot-readiness.md](../08-management/pilot-readiness.md). No new
core features required for G1.
