# Requirements — Booking Tracking & Responsiveness Metrics (EPIC TRK)

**Spec:** `13-tracking-metrics` · **Status:** Ready to build (Sprint 6)
**Traces to PRD:** TRUST-02, MATCH-03 · **Depends on:** `03-service-booking`, `04-matching-engine`

## Introduction
Bookings record **lifecycle timestamps** (`accepted_at`, `started_at`, `completed_at`) so
customers can see job progress with real times, and so the platform can measure provider
responsiveness. The matching engine already weights `avg_response_seconds` — but nothing
wrote it, so it was always 0. This spec closes that loop: on accept, the provider's rolling
average response time updates from the actual accept latency.

---

## Requirement 1 — Lifecycle timestamps
**User story:** As a customer, I see when my job was accepted, started, and completed.
**Acceptance criteria (EARS):**
1. WHEN a provider accepts a booking, THE SYSTEM SHALL set `accepted_at = now()`.
2. WHEN a booking moves to `in_progress`, THE SYSTEM SHALL set `started_at = now()`.
3. WHEN a booking moves to `completed`, THE SYSTEM SHALL set `completed_at = now()`.
4. THE booking detail SHALL expose `acceptedAt`, `startedAt`, `completedAt` (nullable).

## Requirement 2 — Provider responsiveness
**User story:** As the platform, I rank responsive providers higher.
**Acceptance criteria (EARS):**
1. WHEN a provider accepts a booking, THE SYSTEM SHALL compute the accept latency `accepted_at − created_at` (clamped ≥ 0).
2. THE SYSTEM SHALL update `providers.avg_response_seconds` as an exponential moving average (α = 0.3); a never-measured provider (avg = 0) is seeded with the first sample.
3. The matching engine SHALL continue to use `avg_response_seconds` in its score (no change needed — it now receives real data).
