# Tasks — Payments

**Spec:** `07-payments` · **Status: ✅ BUILT (Sprint 4, 2026-06-19)** with mock gateway.
API `apps/api/src/payments/`. Verified: 12% commission, idempotent webhook (no double-credit),
earnings net = 8800 on LKR100. Web pay button on completed booking. Refunds/payouts deferred.

- [ ] **1. Prisma** — `payments` model (+ enums payment_provider/status). _Req: 1,3_
- [ ] **2. PaymentGateway abstraction** + `MockGateway` (env-selected). _Req: 1,3_
- [ ] **3. Initiate** — `POST /payments/initiate` {bookingId, amountCents}; completed-only; commission calc; idempotent on booking. _Req: 1,2_
- [ ] **4. Webhook** — `POST /payments/webhook`; signature; idempotency key; set paid once. _Req: 3_
- [ ] **5. Earnings** — `GET /providers/me/earnings` net totals + recent. _Req: 4_
- [ ] **6. Tests** — commission math, idempotency, completed-gate. _Req: all_
- [ ] **7. Web** — pay button on completed booking; provider earnings view. _Req: 1,4_
- [ ] **8. Close** — API spec + traceability + delivery-log.
