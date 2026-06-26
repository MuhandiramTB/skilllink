# Tasks — Provider Onboarding & Verification

**Spec:** `02-provider-onboarding` · **Status: ✅ BUILT (Sprint 2, 2026-06-19)** with mock uploader.

**Implementation:** API `apps/api/src/providers/` (ProvidersService, VerificationService,
MediaUploader mock, controllers + AdminVerificationController). Web `provider/page.tsx`
(onboarding + dashboard) and `admin/verifications/page.tsx`. Prisma `verifications` model added.
Verified E2E: onboard→docs→category/area/availability→**not matchable while pending**→admin
approve→**matchable + verified=true**. 16 unit tests pass (incl. 6 provider). Real Cloudinary
uploader + notifications deferred.

- [ ] **1. MediaUploader abstraction**
  - `MediaUploader` interface + `MockUploader` (presign → fake/local fileUrl).
  - Selected by env `MEDIA_UPLOADER`.
  - _Req: 1.2_

- [ ] **2. Become a provider**
  - [ ] 2.1 `POST /providers` — customer→provider, create providers row (status=pending), set users.role=provider.
  - [ ] 2.2 Idempotent if already a provider.
  - _Req: 1.3_

- [ ] **3. Verifications**
  - [ ] 3.1 `POST /providers/me/verifications` `{ type, mediaUrl }` → pending row.
  - [ ] 3.2 PII access control (owner + admin only).
  - _Req: 1.1, 1.2, 5_

- [ ] **4. Profile setup**
  - [ ] 4.1 `PUT /providers/me/service-area` `{ lat, lng, radiusMeters }` (PostGIS point).
  - [ ] 4.2 `PUT /providers/me/categories` `{ categoryIds[] }` (validate exist/active).
  - [ ] 4.3 `PATCH /providers/me/availability` `{ isAvailable }`.
  - [ ] 4.4 `GET /providers/me`.
  - _Req: 2, 3_

- [ ] **5. Admin verification queue**
  - [ ] 5.1 `GET /admin/verifications?status=pending` (AdminGuard).
  - [ ] 5.2 `PATCH /admin/providers/:id/verification` `{ decision, reason? }` → approve sets status=approved; reject sets rejected+reason. Audited.
  - _Req: 4_

- [ ] **6. Public provider profile**
  - `GET /providers/:id` → business name, rating, **verified flag** (status=approved). No PII.
  - _Req: 4 (trust)_

- [ ] **7. Web — provider area**
  - [ ] 7.1 `/provider/onboarding` wizard: identity (mock upload) → certs → categories → area → submit.
  - [ ] 7.2 `/provider/dashboard`: availability toggle + verification status.
  - _Req: 1,2,3,5_

- [ ] **8. Web — admin verification queue**
  - `/admin/verifications`: list pending, approve/reject with reason.
  - _Req: 4_

- [ ] **9. Tests**
  - Unit: status transitions, matchable gate, only-customer-can-become.
  - Integration: full onboard→approve→matchable; reject; 403 non-owner; non-admin cannot approve.
  - _Req: all_

- [ ] **10. Cross-cutting + E2E + close**
  - Envelope; i18n; update API spec + traceability; delivery-log entry.
  - E2E: onboard (mock) → admin approve → provider appears in `/match`.
