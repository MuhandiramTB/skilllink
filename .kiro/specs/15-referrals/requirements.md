# Requirements — Referral Program (EPIC REF)

**Spec:** `15-referrals` · **Status:** Ready to build (Sprint 6)
**Traces to PRD:** LOY-02 · **Depends on:** `01-authentication-otp`, `11-quotes-rewards` (rewards)

## Introduction
Every user gets a shareable referral code (e.g. `SK4F9K2A`). A new user applies a
referrer's code once; both earn reward points via the existing rewards ledger. This
drives organic growth — the cheapest acquisition channel for a marketplace.

---

## Requirement 1 — Each user has a code
**Acceptance criteria (EARS):**
1. WHEN a user is created, THE SYSTEM SHALL assign a unique `referral_code`.
2. `GET /referrals/me` SHALL return the caller's code + how many users they've referred.

## Requirement 2 — Apply a referral code
**User story:** As a new user, I enter a friend's code so we both get points.
**Acceptance criteria (EARS):**
1. WHEN a user applies a valid code they haven't used, THE SYSTEM SHALL set their `referred_by`, award the referrer (default 50 pts) and the referee (default 30 pts), and record both in the reward ledger.
2. IF the user has already been referred (`referred_by` set), THEN THE SYSTEM SHALL return `400` (`REFERRAL_ALREADY_APPLIED`).
3. IF the code is the user's own, THEN THE SYSTEM SHALL return `400` (`REFERRAL_SELF`).
4. IF the code does not exist, THEN THE SYSTEM SHALL return `404` (`REFERRAL_CODE_INVALID`).
5. The award SHALL happen in a single transaction (link + both point grants).

## Non-functional
- Point values are config-driven (`REFERRAL_REFERRER_POINTS`, `REFERRAL_REFEREE_POINTS`).
- Idempotency is enforced by `referred_by` (settable once), not the ledger.
