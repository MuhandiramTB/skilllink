# Design — Payments

**Spec:** `07-payments` · **Module:** API `payments`

## 1. Overview
Customer initiates payment on a completed booking → `payments` row (pending) + commission
computed → gateway confirms via webhook (idempotent) → status `paid`. Provider earnings = sum
of net (amount − commission) over paid payments. Gateway is abstracted (mock for dev).

## 2. Gateway abstraction
```
PaymentGateway (abstract)
  ├── createSession(payment) -> { gatewayRef, redirectUrl }
  └── verifyWebhook(payload, signature) -> { gatewayRef, idempotencyKey, ok }
MockGateway: deterministic ref; verifyWebhook accepts a simple shared-secret header.
```
Select via env `PAYMENT_GATEWAY=mock|payhere|genie`.

## 3. API
| Method | Path | Role | Purpose |
|--------|------|------|---------|
| POST | `/payments/initiate` | customer(owner) | `{ bookingId, amountCents }` → session (idempotent) |
| POST | `/payments/webhook` | gateway (no auth, signature) | confirm payment idempotently |
| GET | `/providers/me/earnings` | provider | totals + recent |

## 4. Data
`payments` (booking_id unique, provider, amount_cents, commission_cents, status, gateway_ref,
idempotency_key unique). Earnings derived by summing paid payments per provider (via booking.provider_id).

## 5. Commission
`commission = Math.round(amount * rate)`, rate `PAYMENT_COMMISSION_RATE` default 0.12. Net = amount − commission.

## 6. Idempotency
`payments.idempotency_key` unique. Webhook upsert keyed on it; second delivery is a no-op
(status already paid). Initiate is idempotent on `booking_id` (unique).

## 7. Security
- initiate: only the booking's customer, only when completed.
- webhook: no JWT; verify a shared secret/signature header; never trust amount from webhook (use stored).

## 8. Errors
| Condition | HTTP | code |
|-----------|------|------|
| Booking not completed | 400 | PAYMENT_BOOKING_NOT_COMPLETED |
| Not owner | 403 | FORBIDDEN |
| Bad signature | 400 | PAYMENT_WEBHOOK_INVALID |

## 9. Testing
- Unit: commission math; idempotent webhook (double-deliver → single credit).
- Integration: initiate on non-completed → 400; initiate twice → same payment; webhook → paid; earnings reflect net.
- E2E: complete booking → initiate → webhook → provider earnings updates.
