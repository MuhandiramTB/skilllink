# Requirements — Ratings & Reviews (EPIC REV)

**Spec:** `08-reviews` · **Status:** Ready to build (Sprint 4)
**Traces to PRD:** REV-01, REV-02 · **SRS:** FR-R1, FR-R2
**Depends on:** Bookings (completed)

## Introduction
After a completed booking, the customer rates (1–5) and reviews the provider; the provider
may respond. A new review recalculates the provider's `rating_avg`/`rating_count`, which
**feeds the matching score** (closing the trust-quality loop).

## Requirement 1 — Leave a review
**User story:** As a customer, I rate & review after completion. *(REV-01)*
**Acceptance criteria (EARS):**
1. WHEN a customer submits `{ rating 1..5, comment? }` for a `completed` booking they own, THE SYSTEM SHALL create one review.
2. IF the booking is not completed, THEN THE SYSTEM SHALL return `400 REVIEW_BOOKING_NOT_COMPLETED`.
3. IF a review already exists for the booking, THEN THE SYSTEM SHALL return `409 REVIEW_EXISTS`.
4. WHEN a review is created, THE SYSTEM SHALL recalculate the provider's `rating_avg` and `rating_count`.

## Requirement 2 — Provider response
**User story:** As a provider, I respond to a review. *(REV-02)*
**Acceptance criteria (EARS):**
1. WHEN the assigned provider submits a response to a review of their booking, THE SYSTEM SHALL store it.
2. IF a non-owner provider attempts, THEN `403`.

## Requirement 3 — Public reviews
**Acceptance criteria (EARS):**
1. WHEN anyone requests a provider's reviews, THE SYSTEM SHALL return rating, comment, and response (no customer PII beyond a display marker).

## Non-functional
Envelope; rating bounded 1..5; recalculation atomic.

## Out of scope
Review moderation/flagging, photo reviews (later).
