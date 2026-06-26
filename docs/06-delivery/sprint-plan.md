# Sprint Plan — SkillLink LK MVP

**BMAD Agent:** `sm` (Scrum Master) · **Owner:** Scrum Master / Delivery Manager
**Inputs:** [PRD](../02-product/PRD.md), [Architecture](../04-architecture/system-architecture.md)
**Cadence:** 2-week sprints · **Target:** MVP build = Phase 2 (8–12 weeks ≈ 5 sprints)

> The SM "shards" the PRD epics into ordered, buildable stories. Each story points to a
> Kiro spec that the developer executes task-by-task.

## Team (lean MVP squad)
1 Fullstack Dev (or 2), 1 QA (part-time), 1 PM/BA (shared), 1 Architect (advisory), 1 Designer (front-loaded).

## Sprint 0 — Foundations ✅ DONE (2026-06-19)
**Goal:** repo, CI/CD, DB+PostGIS, i18n, runnable stack.
- [x] Monorepo (`apps/web`, `apps/api`) via npm workspaces; CI workflow (PostGIS service)
- [x] PostgreSQL 18 + **PostGIS 3.6.2** installed; `skilllink` DB created via `db/migrations/001_init.sql`
- [x] `districts` model added (Kandy v1; expansion = config flip); Kandy + categories seeded
- [x] Prisma wired to DB (geo cols as `Unsupported`, raw SQL for matching)
- [x] API: `{data,error}` envelope, `/health`, `/categories`, `/match` (geo ranking) — all verified
- [x] Web: Next.js + Tailwind + next-intl (si/ta/en); language switcher + category grid from API — verified in all 3 languages
- [ ] Firebase OTP wiring — **deferred to Sprint 1** (build with mock verifier, real creds later)
- [ ] Vercel/AWS deploy — deferred (local-first for v1 build)
**Exit:** ✅ Runnable full stack; DB-backed matching proven end-to-end. See [delivery-log.md](delivery-log.md).

## Sprint 1 — Identity & Catalog ✅ DONE (2026-06-19)
**Stories:** AUTH-01..04 ✅ (CAT-01/02 already shipped in Sprint 0)
**Specs:** `01-authentication-otp` ✅
**Exit:** ✅ OTP auth (mock), JWT sessions w/ rotation+replay defense, language, role authZ.
10 unit tests + live API verified. Real Firebase + web login UI deferred (see delivery-log).

## Sprint 1.5 — Admin/Owner Master-Data Console ✅ DONE (2026-06-19) (ADR-0002)
**Stories:** MASTER-01..06 ✅ (+ CAT-02 admin CRUD)
**Spec:** `06-admin-master-data` ✅
**Exit:** ✅ admin signs in → adds/edits categories & sub-services (trilingual) → appear in
customer grid; deactivate hides them; district activation works (Gampaha); audit logged;
403/401/409 enforced. API + web verified end-to-end. Automated admin tests deferred.

## Sprint 2 — Provider onboarding & verification ✅ DONE (2026-06-19)
**Stories:** PROV-01..05 ✅
**Specs:** `02-provider-onboarding` ✅
**Exit:** ✅ provider onboards (mock uploads) + admin approves; verified gate proven —
only approved+available providers are matchable & show verified=true. 16 unit tests + live E2E.

## Sprint 3 — Booking & Matching ✅ DONE (2026-06-19)
**Stories:** BOOK-01..08 ✅ (MATCH-01 reused from Sprint 0)
**Specs:** `03-service-booking` ✅
**Exit:** ✅ customer creates request → ranked verified matches → books → provider accepts →
masked chat (phones scrubbed) → status to completed. State-machine guarded; authZ enforced.
21 unit tests + live E2E. Realtime/payments/reviews deferred to their sprints.

## Sprint 4 — Payments & Reviews ✅ DONE (2026-06-19)
**Stories:** PAY-01..03, REV-01/02 ✅
**Specs:** `07-payments`, `08-reviews` ✅
**Exit:** ✅ book → pay (12% commission) → earnings → review → rating recalc feeds matching.
30 unit tests + live E2E. Real PayHere + refunds deferred.

## Sprint 5 — Admin ops & hardening ✅ DONE (2026-06-19)
**Stories:** ADMIN-02 (disputes), ADMIN-03 (analytics) ✅ (ADMIN-01 done Sprint 1.5; BOOK-08/REV-02 earlier)
**Specs:** `09-admin-ops` ✅
**Exit:** ✅ admin console complete (disputes + analytics); helmet + throttler hardening.
33 unit tests + live verify. **Pre-pilot productionizing tracked in pilot-readiness.md** (real
integrations, deploy, NFR QA) — no new core features needed for G1.

## Phase 4 backlog (post-pilot)
Full SOLAR-01/02/03, ADMIN-02/03/04, MATCH-02, subscriptions/fixed-price, native apps.

## Ceremonies
Planning (start of sprint) · daily standup · review/demo (end) · retro · backlog refinement (mid-sprint).

## Definitions
- **Ready** (a story can enter a sprint): has a Kiro spec with `requirements.md` acceptance criteria + `design.md`.
- **Done:** see [definition-of-done.md](definition-of-done.md).

## Board columns
Backlog → Ready → In Progress → In Review → QA → Done.
