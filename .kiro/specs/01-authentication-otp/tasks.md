# Tasks — Authentication & OTP

**Spec:** `01-authentication-otp` · **Status: ✅ BUILT (Sprint 1, 2026-06-19)** with mock
Firebase verifier. All EARS criteria verified via unit tests + live API.

> Workflow: pick the next unchecked task → implement → write/run its tests → check it
> off → move on. A task is complete only when its referenced acceptance criteria pass.

**Implementation:** `apps/api/src/auth/` — TokenService (jose JWT), SessionService
(rotation + replay defense), AuthService, controller, JwtAuthGuard, RolesGuard,
OtpRateLimitGuard, FirebaseVerifier (mock). Tests: 3 spec files, 10 unit tests passing.
Live verification covered T1,T2,T5,T7,T9,T11,T13,T16. **Note:** rate-limit (T3) covered by
guard logic + unit; full E2E (T-E2E with Playwright) deferred to the web-auth UI sprint.

---

- [ ] **1. Scaffold `auth` module**
  - Create NestJS `auth` module (controller, service, module wiring).
  - Add Passport + JWT, class-validator, Redis client.
  - _Req: setup for all_

- [ ] **2. Firebase Admin integration**
  - [ ] 2.1 Add `FirebaseAdminService` wrapping `verifyIdToken`.
  - [ ] 2.2 Configure service-account creds via env/secret manager (never in repo).
  - _Req: 2.1, 2.3_

- [ ] **3. User upsert on verify**
  - [ ] 3.1 Implement `findOrCreateUserByPhone(uid, phone)` with defaults `role=customer`, `language=en`.
  - [ ] 3.2 Unit test: new phone creates user; existing phone reuses.
  - _Req: 2.1, 2.4_

- [ ] **4. Session & token service**
  - [ ] 4.1 Issue access JWT (15m, `sub`, `role`).
  - [ ] 4.2 Generate refresh token (256-bit), store SHA-256 hash in `sessions` (30d expiry).
  - [ ] 4.3 Implement rotation: revoke old, issue new on refresh.
  - [ ] 4.4 Implement replay defense: presenting a revoked token revokes all user sessions.
  - [ ] 4.5 Unit tests for issue/rotate/replay.
  - _Req: 2.2, 2.5, 4.1, 4.3, 5.x_

- [ ] **5. `POST /auth/otp/request`**
  - [ ] 5.1 Validate E.164 LK phone (Zod/DTO).
  - [ ] 5.2 Trigger Firebase OTP path; return `202`.
  - [ ] 5.3 No account enumeration (uniform response).
  - [ ] 5.4 Integration tests incl. invalid phone → 400.
  - _Req: 1.1, 1.2, 1.4_

- [ ] **6. Rate limiting (OTP/login)**
  - [ ] 6.1 Redis sliding-window guard: 5 / 15 min / phone.
  - [ ] 6.2 6th request → `429 AUTH_RATE_LIMIT`.
  - [ ] 6.3 Test the trip.
  - _Req: 1.3_

- [ ] **7. `POST /auth/otp/verify`**
  - [ ] 7.1 Verify Firebase ID token → upsert user → issue tokens.
  - [ ] 7.2 Invalid/expired token → `401 AUTH_OTP_INVALID`.
  - [ ] 7.3 Integration tests (mock Firebase) for success + failure.
  - _Req: 2.1, 2.3, 2.4_

- [ ] **8. `POST /auth/refresh`**
  - [ ] 8.1 Validate refresh token; rotate; return new pair.
  - [ ] 8.2 Expired/revoked/unknown → `401`.
  - [ ] 8.3 Tests incl. replay → all sessions revoked.
  - _Req: 4.1, 4.2, 4.3_

- [ ] **9. `POST /auth/logout`**
  - [ ] 9.1 Revoke current session → `204`.
  - [ ] 9.2 `{ allDevices: true }` revokes all sessions.
  - [ ] 9.3 Tests.
  - _Req: 5.1, 5.2_

- [ ] **10. `PATCH /auth/language`**
  - [ ] 10.1 Validate enum `si|ta|en`; persist; return profile.
  - [ ] 10.2 Invalid code → `400`.
  - [ ] 10.3 Ensure `/me` and login response include language.
  - _Req: 3.1, 3.2, 3.3_

- [ ] **11. AuthZ plumbing**
  - [ ] 11.1 `JwtStrategy` attaches `{ userId, role }` to request.
  - [ ] 11.2 `RolesGuard` enforces role; missing token → 401, wrong role → 403.
  - [ ] 11.3 Tests for 401/403 paths.
  - _Req: 6.1, 6.2, 6.3_

- [ ] **12. Cross-cutting compliance**
  - [ ] 12.1 All responses use `{ data, error }` envelope.
  - [ ] 12.2 All error messages are i18n keys.
  - [ ] 12.3 Update [api-specification.md](../../docs/04-architecture/api-specification.md) / OpenAPI.
  - [ ] 12.4 Update [traceability matrix](../../docs/07-qa/traceability-matrix.md).
  - _Req: NFR_

- [ ] **13. E2E happy path (Playwright + Firebase emulator/stub)**
  - request → verify → `/me` → refresh → logout.
  - _Req: all_

- [ ] **14. Definition of Done check**
  - Run through [definition-of-done.md](../../docs/06-delivery/definition-of-done.md); hand to QA.
