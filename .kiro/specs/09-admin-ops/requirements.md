# Requirements — Admin Operations (Disputes & Analytics)

**Spec:** `09-admin-ops` · **Status:** Ready (Sprint 5)
**Traces to PRD:** ADMIN-02 (disputes), ADMIN-03 (analytics) · **SRS:** FR-AD2, FR-AD3
**Depends on:** Auth/Admin, Bookings, Payments

## Introduction
The operations team handles disputes raised on bookings and views business analytics
(bookings, revenue, providers, KPIs) — completing the admin console.

## Requirement 1 — Raise a dispute
**User story:** As a customer or provider on a booking, I raise a dispute. *(ADMIN-02)*
**Acceptance criteria (EARS):**
1. WHEN a participant (booking customer or provider) opens a dispute `{ bookingId, reason }`, THE SYSTEM SHALL create a dispute (status=open).
2. IF the user is not a participant of the booking, THEN `403`.
3. IF an open dispute already exists for the booking, THEN `409 DISPUTE_EXISTS`.

## Requirement 2 — Resolve a dispute (admin)
**Acceptance criteria (EARS):**
1. WHEN an admin resolves a dispute `{ resolution }`, THE SYSTEM SHALL set status=resolved, store resolution + resolver, and audit it.
2. THE dispute queue + resolve SHALL be admin-only (403 otherwise).

## Requirement 3 — Analytics (admin)
**User story:** As an owner/admin, I view business analytics. *(ADMIN-03)*
**Acceptance criteria (EARS):**
1. WHEN an admin requests analytics, THE SYSTEM SHALL return: total/by-status bookings, completed jobs, gross revenue, commission earned, provider counts (approved/pending), customer count, active districts.
2. Analytics SHALL be admin-only.

## Non-functional
Envelope; admin endpoints role-guarded; mutations audited.

## Out of scope
Refund processing within disputes, advanced cohort analytics, fraud ML (ADMIN-04 later).
