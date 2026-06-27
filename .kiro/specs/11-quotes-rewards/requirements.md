# Requirements — Quotes, Hybrid Payment & Rewards (EPIC QPR)

**Spec:** `11-quotes-rewards` · **Status:** Ready to build (Sprint 5)
**Traces to PRD:** PAY-04..06, REV-01, LOY-01 · **SRS:** FR-PAY4..6, FR-LOY1
**Steering:** `.kiro/steering/*` · **Depends on:** `03-service-booking`, `07-payments`, `08-reviews`

## Introduction
A provider quotes a price in-app; the customer accepts it; the job runs; at completion
the customer pays **cash or in-app**. The platform's commission (default 12%) is captured
**either way** — auto-deducted on in-app payments, or charged to the provider's **wallet
balance** on cash jobs. Completed+paid jobs earn the customer **reward points** (loyalty).
All money is integer LKR cents. This is the real-world Sri Lankan trade-services flow.

---

## Requirement 1 — Provider quotes a price
**User story:** As a provider, I quote a price for a job in the app so the customer knows the cost before work starts. *(PAY-04)*
**Acceptance criteria (EARS):**
1. WHEN a provider sets a quote (price in LKR cents) on a booking assigned to them in status `matched` or `accepted`, THE SYSTEM SHALL store `price_cents` and set `quote_status = 'quoted'`.
2. IF the requester is not the assigned provider, THEN THE SYSTEM SHALL return `403`.
3. IF the quote amount is ≤ 0, THEN THE SYSTEM SHALL return `400` (`VALIDATION_ERROR`).
4. THE provider MAY re-quote (update the price) while `quote_status` is `quoted` (not yet accepted).

## Requirement 2 — Customer accepts the quote
**User story:** As a customer, I accept the provider's quoted price before the job proceeds. *(PAY-04)*
**Acceptance criteria (EARS):**
1. WHEN the customer accepts a `quoted` booking they own, THE SYSTEM SHALL set `quote_status = 'accepted'`.
2. IF the booking has no quote yet, THEN THE SYSTEM SHALL return `400` (`NO_QUOTE`).
3. IF the requester is not the booking's customer, THEN THE SYSTEM SHALL return `403`.
4. A provider SHALL only advance a job to `in_progress` after the quote is `accepted`.

## Requirement 3 — Payment method choice (cash or in-app)
**User story:** As a customer, at completion I choose to pay cash or in-app. *(PAY-05)*
**Acceptance criteria (EARS):**
1. WHEN a customer settles a `completed` booking, THE SYSTEM SHALL accept `method ∈ {cash, in_app}` and use the accepted quote amount.
2. WHEN `method = in_app`, THE SYSTEM SHALL create a payment (status `pending` → `paid` via gateway/webhook), retain commission, and credit the provider net.
3. WHEN `method = cash`, THE SYSTEM SHALL record a `payments` row with `method=cash`, `status=paid`, and **charge the commission to the provider's wallet** (Requirement 4).
4. IF the booking is not `completed`, THEN THE SYSTEM SHALL return `400` (`PAYMENT_BOOKING_NOT_COMPLETED`).
5. Payment SHALL be idempotent per booking (one payment row).

## Requirement 4 — Provider wallet & commission capture
**User story:** As the platform, I capture commission on cash jobs via a provider wallet balance. *(PAY-06)*
**Acceptance criteria (EARS):**
1. THE SYSTEM SHALL maintain a `wallet_balance_cents` per provider (may go negative = owes the platform).
2. WHEN a cash payment is recorded, THE SYSTEM SHALL debit the provider wallet by the commission and write a `wallet_ledger` entry (`type=commission`, negative).
3. WHEN a provider tops up their wallet, THE SYSTEM SHALL credit the balance and write a ledger entry (`type=topup`, positive).
4. WHEN a provider's `wallet_balance_cents` is below a configured threshold (default `-LKR 2,000`), THE SYSTEM SHALL exclude them from matching until they top up. *(anti-leakage lever)*
5. THE wallet ledger SHALL be append-only and queryable by the provider.

## Requirement 5 — Customer review & rating (confirm existing + reward link)
**User story:** As a customer, I rate and review a provider after a completed job. *(REV-01)*
**Acceptance criteria (EARS):**
1. WHEN a customer reviews a `completed` booking they own (once), THE SYSTEM SHALL store the review and recompute the provider's `rating_avg`/`rating_count`. *(already built in `08-reviews`)*
2. WHEN a review is created, THE SYSTEM SHALL award the customer reward points (Requirement 6).
3. THE rating SHALL be 1–5; a second review of the same booking SHALL return `409` (`REVIEW_EXISTS`).

## Requirement 6 — Customer rewards / loyalty
**User story:** As a customer, I earn points for completed bookings and reviews, redeemable for discounts. *(LOY-01)*
**Acceptance criteria (EARS):**
1. WHEN a booking the customer owns reaches `completed` **and** is paid, THE SYSTEM SHALL award **base points = floor(amount_cents / 10000)** (1 point per LKR 100) into the customer's points balance, with a `reward_ledger` entry (`reason=booking_completed`).
2. WHEN the customer leaves a review, THE SYSTEM SHALL award a flat **+20 points** (`reason=review`), once per booking.
3. THE SYSTEM SHALL expose the customer's current points balance and ledger.
4. WHEN a customer redeems points at booking time (future), THE SYSTEM SHALL deduct points and apply a discount; redemption is out of scope for v1 but the ledger SHALL support negative `redeem` entries.
5. Points awards SHALL be idempotent per (booking, reason) — no double-award.

---

## Non-functional
- All amounts integer LKR cents; points are integers.
- Wallet & reward ledgers are append-only (audit trail).
- Reuses existing auth (JwtAuthGuard), envelope, and matching filters.
- Mock payment gateway stays for dev; real gateway (PayHere) swaps via env.
