# Tasks — Admin Operations

**Spec:** `09-admin-ops` · **Status: ✅ BUILT (Sprint 5, 2026-06-19)**.
API `apps/api/src/admin-ops/`; web `/admin/disputes` + `/admin/analytics`. Verified: participant
opens dispute → admin resolves; non-participant 403; analytics admin-only with real aggregates.
Plus security hardening (helmet headers, global throttler 120/min). 33 unit tests pass.

- [ ] **1. Prisma** — `disputes` model. _Req: 1,2_
- [ ] **2. Open dispute** — `POST /bookings/:id/dispute`; participant-only; 409 if open exists. _Req: 1_
- [ ] **3. Queue + resolve** — `GET/PATCH /admin/disputes`; admin-only; audited. _Req: 2_
- [ ] **4. Analytics** — `GET /admin/analytics` aggregate snapshot. _Req: 3_
- [ ] **5. Web** — `/admin/disputes`, `/admin/analytics`. _Req: all_
- [ ] **6. Tests + close** — unit/integration; API spec + traceability + delivery-log.
