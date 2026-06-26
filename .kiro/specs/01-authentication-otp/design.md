# Design — Authentication & OTP

**Spec:** `01-authentication-otp` · **Reads:** [requirements.md](requirements.md), Architecture, DB design
**Module:** `auth` (NestJS)

---

## 1. Overview
Client performs OTP entirely with the Firebase SDK (Firebase sends/verifies the SMS code).
On success the client receives a **Firebase ID token** and posts it to our API, which
verifies it server-side via the Firebase Admin SDK, upserts the user, and issues our own
**JWT access token + rotating refresh token**. All subsequent requests use our access token.

```
[Client] --(1) request OTP--> Firebase --(SMS)--> phone
[Client] --(2) enter code--> Firebase --> Firebase ID token
[Client] --(3) POST /auth/otp/verify {firebaseIdToken}--> [API]
[API]    --verify w/ Firebase Admin--> upsert user --> issue {access, refresh}
```

## 2. Sequence — verify & login
```
Client            API (auth)            Firebase Admin        DB
  │  POST verify      │                       │                │
  │ {firebaseIdToken} │                       │                │
  │──────────────────▶│  verifyIdToken()      │                │
  │                   │──────────────────────▶│                │
  │                   │◀── uid, phone ────────│                │
  │                   │  upsert user by phone ─────────────────▶│
  │                   │  create session (hash refresh) ────────▶│
  │◀ {access,refresh,user} │                  │                │
```

## 3. Components (NestJS `auth` module)
| Component | Responsibility |
|-----------|----------------|
| `AuthController` | `/auth/*` routes, DTO validation |
| `AuthService` | verify Firebase token, issue/rotate JWTs |
| `FirebaseAdminService` | wraps Firebase Admin `verifyIdToken` |
| `SessionService` | create/rotate/revoke sessions; refresh-token hashing |
| `JwtStrategy` (Passport) | validate access token → request context |
| `RolesGuard` | enforce role on endpoints |
| `RateLimitGuard` | throttle OTP/login (Redis) |

## 4. Data
Uses `users` and `sessions` (see [database-design.md](../../docs/04-architecture/database-design.md)).
- Refresh token: random 256-bit, returned raw to client, stored as SHA-256 hash in `sessions.refresh_token_hash`.
- Rotation: on refresh, mark old session `revoked_at`, insert new; if a revoked token is presented → revoke all user sessions (replay defense, Req 4.3).

## 5. Tokens
| Token | Lifetime | Contents | Storage |
|-------|----------|----------|---------|
| Access (JWT) | 15 min | `sub=userId, role` | client memory |
| Refresh | 30 days | opaque random | client secure storage; hash in DB |

## 6. API contracts (envelope `{ data, error }`)
- `POST /auth/otp/request` `{ phone }` → `202 { data: { requested: true } }`
- `POST /auth/otp/verify` `{ firebaseIdToken }` → `200 { data: { accessToken, refreshToken, user } }`
- `POST /auth/refresh` `{ refreshToken }` → `200 { data: { accessToken, refreshToken } }`
- `POST /auth/logout` (auth) `{ allDevices? }` → `204`
- `PATCH /auth/language` (auth) `{ language }` → `200 { data: { user } }`

## 7. Validation (Zod / class-validator)
- `phone`: E.164, LK prefix (`+94`), regex-validated.
- `language`: enum `si|ta|en`.
- `firebaseIdToken`, `refreshToken`: non-empty strings.

## 8. Security design
- Rate limit: 5 OTP requests / 15 min / phone (Redis sliding window) → `429`.
- No account enumeration: identical response whether or not the number exists.
- Refresh rotation + replay revocation.
- Access tokens short-lived; revocation via session table on refresh path.
- All errors as i18n keys; never leak Firebase internals.

## 9. Error mapping
| Condition | HTTP | code |
|-----------|------|------|
| Bad phone/language | 400 | VALIDATION_ERROR |
| OTP rate exceeded | 429 | AUTH_RATE_LIMIT |
| Invalid Firebase token | 401 | AUTH_OTP_INVALID |
| Missing/expired access token | 401 | (unauthorized) |
| Wrong role | 403 | FORBIDDEN |

## 10. Testing approach
- **Unit:** token issue/rotate logic, hashing, replay detection, phone validation.
- **Integration:** each endpoint with a mocked `FirebaseAdminService`.
- **E2E:** request→verify→/me→refresh→logout happy path (Firebase emulator or stub).
- **Security tests:** rate-limit trips at 6th request; revoked-token reuse revokes all.

## 11. Open questions
- Confirm SMS sender ID / Firebase quota for LK volume (owner/ops).
- Decide refresh-token storage on web PWA (httpOnly cookie vs. secure storage) — default httpOnly cookie.
