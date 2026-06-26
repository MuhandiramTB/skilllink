# Requirements — Authentication & OTP (EPIC AUTH)

**Spec:** `01-authentication-otp` · **Status:** Ready to build (reference example)
**Traces to PRD:** AUTH-01..04 · **SRS:** FR-A1..A4
**Steering:** `.kiro/steering/{product,tech,structure}.md`

> Requirements use **EARS** notation: `WHEN <trigger> THE SYSTEM SHALL <response>`,
> or `WHILE <state>` / `IF <condition>` variants. Each is independently testable.

---

## Introduction
Users (customers and providers) authenticate using their Sri Lankan mobile number via
OTP (delivered through Firebase Phone Auth). On success the system issues its own
short-lived JWT access token plus a refresh token, and remembers the user's chosen
language (Sinhala/Tamil/English).

## Glossary
- **OTP** — one-time passcode delivered by SMS.
- **Firebase ID token** — token returned by Firebase after client-side OTP verification.
- **Access token** — our JWT, 15-minute lifetime.
- **Refresh token** — our long-lived (30-day) rotating token.

---

## Requirement 1 — Request OTP
**User story:** As a user, I want to request an OTP to my phone number, so that I can log in without a password. *(AUTH-01)*

**Acceptance criteria (EARS):**
1. WHEN a user submits a valid Sri Lankan phone number in E.164 format, THE SYSTEM SHALL trigger OTP delivery via Firebase and return `202 Accepted`.
2. IF the phone number is not a valid E.164 LK number, THEN THE SYSTEM SHALL return `400 VALIDATION_ERROR` and SHALL NOT trigger an OTP.
3. WHEN a user requests more than 5 OTPs for the same number within 15 minutes, THE SYSTEM SHALL return `429 AUTH_RATE_LIMIT`.
4. THE SYSTEM SHALL NOT reveal whether the phone number already has an account (no account enumeration).

## Requirement 2 — Verify OTP & issue session
**User story:** As a user, I want to verify my OTP, so that I become logged in. *(AUTH-01, AUTH-03)*

**Acceptance criteria (EARS):**
1. WHEN the client submits a valid Firebase ID token (obtained after correct OTP entry), THE SYSTEM SHALL verify it with Firebase, create the user if none exists, and return `200` with `{ accessToken, refreshToken, user }`.
2. THE access token SHALL expire 15 minutes after issuance; THE refresh token SHALL expire 30 days after issuance.
3. IF the Firebase ID token is invalid or expired, THEN THE SYSTEM SHALL return `401 AUTH_OTP_INVALID`.
4. WHEN a new user is created, THE SYSTEM SHALL default `role = customer` and `language = en`.
5. THE refresh token SHALL be stored only as a hash in `sessions`; the raw token SHALL never be persisted.

## Requirement 3 — Language selection
**User story:** As a user, I want to choose my language at first launch, so that the app speaks my language. *(AUTH-02)*

**Acceptance criteria (EARS):**
1. WHEN a user sets language to one of `si | ta | en`, THE SYSTEM SHALL persist it to `users.language` and return the updated profile.
2. IF an unsupported language code is sent, THEN THE SYSTEM SHALL return `400 VALIDATION_ERROR`.
3. WHILE a user has a stored language preference, THE SYSTEM SHALL include it in `/me` and the login response.

## Requirement 4 — Maintain session (refresh)
**User story:** As a returning user, I want my session refreshed silently, so that I stay logged in. *(AUTH-03)*

**Acceptance criteria (EARS):**
1. WHEN a client submits a valid, unexpired, non-revoked refresh token, THE SYSTEM SHALL issue a new access token and a rotated refresh token, and SHALL revoke the old refresh token.
2. IF the refresh token is expired, revoked, or unknown, THEN THE SYSTEM SHALL return `401` and require re-login.
3. WHEN a refresh token is reused after rotation (token replay), THE SYSTEM SHALL revoke all sessions for that user.

## Requirement 5 — Logout & revocation
**User story:** As a user, I want to log out, so that my session can no longer be used. *(AUTH-04)*

**Acceptance criteria (EARS):**
1. WHEN an authenticated user logs out, THE SYSTEM SHALL revoke the current refresh token and return `204`.
2. WHEN a user requests "log out of all devices", THE SYSTEM SHALL revoke all of that user's sessions.

## Requirement 6 — Authorization context
**User story:** As the platform, I want every request to carry a role, so that endpoints are protected. *(cross-cutting)*

**Acceptance criteria (EARS):**
1. WHEN a request includes a valid access token, THE SYSTEM SHALL attach `{ userId, role }` to the request context.
2. IF a protected endpoint is called without a valid access token, THEN THE SYSTEM SHALL return `401`.
3. IF a user's role is insufficient for an endpoint, THEN THE SYSTEM SHALL return `403 FORBIDDEN`.

---

## Non-functional acceptance
- OTP request and verify endpoints SHALL be rate-limited (Req 1.3).
- All responses SHALL use the standard envelope `{ data, error }`.
- All user-facing error messages SHALL be returned as i18n keys, not literals.
- p95 latency for verify SHALL be < 400ms excluding Firebase round-trip.

## Out of scope
Email/password login, social login, MFA beyond OTP, native-app token storage.
