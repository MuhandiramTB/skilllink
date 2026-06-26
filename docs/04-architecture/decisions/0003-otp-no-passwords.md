# ADR-0003: OTP-only auth (no passwords) — recovery & admin access control

**Status:** Accepted · **Date:** 2026-06-19 · **Deciders:** Architect, Owner

## Context
A request was raised for "forgot password", "reset password", and "admin sets a temporary
password → user re-logs in and resets" screens. The platform's auth (Sprint 1, FR-A1) is
**phone-number OTP** — there are no passwords anywhere.

## Decision
Stay **OTP-only**. Do not introduce passwords. Map the intent behind those requests to the
OTP equivalents:

| Password-world concept | OTP-world equivalent (what we built) |
|------------------------|--------------------------------------|
| Forgot / reset password | Request a new OTP — no password exists to reset |
| Admin sets temp password | Admin **suspend / reactivate** account + **force-logout** (revoke sessions) |
| User re-logs in with temp pw | User logs in normally via a fresh OTP |

**Admin access control endpoints** (`/admin/users`):
- `PATCH /admin/users/:id/active { isActive }` — suspend (blocks login via `users.is_active`,
  revokes sessions) / reactivate. A suspended user's OTP verify returns `401 ACCOUNT_SUSPENDED`.
- `POST /admin/users/:id/force-logout` — revoke all sessions; user re-logs in with a new OTP.
All audited via `audit_log`.

## Consequences
**Positive:** one auth system; no password storage/leak surface; matches PRD/SRS; account
recovery is inherent to OTP. Admin retains full control over access.
**Negative:** users without SMS access can't log in — mitigated later by optional email OTP if needed.

## Rejected alternative
Adding email+password as a second method → two auth systems, password-reset email
infrastructure, larger attack surface. Not justified for the MVP.
