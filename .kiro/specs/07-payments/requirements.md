# Requirements — Payments (EPIC PAY)

**Spec:** `07-payments` · **Status:** Ready to build (Sprint 4)
**Traces to PRD:** PAY-01..03 · **SRS:** FR-PAY1..3
**Steering:** `.kiro/steering/*` · **Depends on:** Bookings (completed status)

## Introduction
On a completed booking, the customer pays via a gateway (PayHere/Genie; mock for dev).
The platform retains a 10–15% commission; the provider sees their earnings. Money is
integer LKR cents; webhooks are idempotent.

## Requirement 1 — Initiate payment
**User story:** As a customer, I pay for a completed booking. *(PAY-01)*
**Acceptance criteria (EARS):**
1. WHEN a customer initiates payment for a `completed` booking with an amount, THE SYSTEM SHALL create a `payments` row (status=pending) and return a gateway session reference.
2. IF the booking is not `completed`, THEN THE SYSTEM SHALL return `400` (`PAYMENT_BOOKING_NOT_COMPLETED`).
3. IF a payment already exists for the booking, THEN THE SYSTEM SHALL return the existing one (idempotent initiate).
4. THE amount SHALL be stored in integer LKR cents.

## Requirement 2 — Commission
**User story:** As the platform, I retain a commission per booking. *(PAY-02)*
**Acceptance criteria (EARS):**
1. WHEN a payment is created, THE SYSTEM SHALL compute commission = round(amount × rate) where rate is config (default 0.12) and store `commission_cents`.
2. THE provider net = amount − commission.

## Requirement 3 — Confirmation webhook (idempotent)
**Acceptance criteria (EARS):**
1. WHEN the gateway confirms payment (webhook with signature/idempotency key), THE SYSTEM SHALL set the payment `paid` and credit provider earnings exactly once.
2. WHEN the same webhook (same idempotency key) is received again, THE SYSTEM SHALL NOT double-credit.
3. IF signature/key invalid, THEN THE SYSTEM SHALL return `400`.

## Requirement 4 — Earnings dashboard
**User story:** As a provider, I view my earnings. *(PAY-03)*
**Acceptance criteria (EARS):**
1. WHEN a provider requests earnings, THE SYSTEM SHALL return total paid net, count of paid jobs, and recent payments.

## Non-functional
Envelope; money in cents; webhook idempotency via unique key; commission rate from config.

## Out of scope
Refunds/chargebacks, payouts scheduling, multi-currency (later).
