# Requirements — Service Booking (EPIC BOOK)

**Spec:** `03-service-booking` · **Status:** Template (seeded — finish before Sprint 3)
**Traces to PRD:** BOOK-01..08 · **SRS:** FR-B1..B8
**Steering:** `.kiro/steering/*` · **Pattern reference:** `01-authentication-otp`

## Introduction
A customer describes an issue (text + photos/video), shares location, sees ranked matched
providers, books one; the provider accepts/rejects; both communicate via masked chat and
the customer tracks live status through to completion.

## Requirement 1 — Create booking request
**User story:** As a customer, I describe my issue and upload media, so that the provider understands the job. *(BOOK-01, BOOK-02)*
**Acceptance criteria (EARS):**
1. WHEN a customer submits `{ categoryId, description, location, media[] }`, THE SYSTEM SHALL create a `booking` with status `requested`.
2. THE media SHALL be uploaded to Cloudinary via signed URLs; the API stores only URLs.
3. IF location is missing, THEN THE SYSTEM SHALL return `400 VALIDATION_ERROR`.

## Requirement 2 — View matches & book
**User story:** As a customer, I view ranked providers and book one. *(BOOK-03, BOOK-04)*
**Acceptance criteria (EARS):**
1. WHEN a customer requests matches, THE SYSTEM SHALL return ranked providers (see Matching spec).
2. IF no provider is in radius, THEN THE SYSTEM SHALL return `MATCH_NONE_IN_RADIUS` and offer to widen radius / notify later.
3. WHEN a customer assigns a provider, THE SYSTEM SHALL set status `matched` and notify the provider.

## Requirement 3 — Provider response
**User story:** As a provider, I accept or reject a job. *(BOOK-05)*
**Acceptance criteria (EARS):**
1. WHEN a provider accepts within the response window, THE SYSTEM SHALL set status `accepted`.
2. WHEN a provider rejects or the window expires, THE SYSTEM SHALL revert the booking to `requested` for re-matching.

## Requirement 4 — Masked chat
**User story:** As a user, I chat in-app without exposing my number. *(BOOK-07)*
**Acceptance criteria (EARS):**
1. THE SYSTEM SHALL provide chat per booking; real phone numbers SHALL NEVER be exposed or stored in messages.

## Requirement 5 — Live status & cancel
**User story:** As a customer, I track status and can cancel under policy. *(BOOK-06, BOOK-08)*
**Acceptance criteria (EARS):**
1. WHEN status changes, THE SYSTEM SHALL emit a `status` event to the booking room.
2. WHEN a customer cancels within policy, THE SYSTEM SHALL set status `cancelled` and apply any policy fee.

## Non-functional acceptance
Envelope; i18n keys; WebSocket auth via JWT; status transitions validated (no illegal jumps).

## TODO before build
- [ ] Finalize EARS; define legal status state machine.
- [ ] Write `design.md` (status FSM, Socket.IO rooms) and `tasks.md`.
