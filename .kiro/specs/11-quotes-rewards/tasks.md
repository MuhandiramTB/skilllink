# Tasks — Quotes, Hybrid Payment & Rewards

**Spec:** `11-quotes-rewards` · See [design.md](./design.md)

## DB
- [ ] T1. Migration `008_quotes_rewards.sql`: `quote_status` enum + col on bookings; `wallet_balance_cents` on providers; `payment_method` enum + `method` on payments; `wallet_ledger`, `reward_points`, `reward_ledger` tables (+ indexes, idempotency unique). Apply to DB.
- [ ] T2. Mirror in `schema.prisma`; `prisma generate`.

## API — quotes
- [ ] T3. `PATCH /bookings/:id/quote` (provider) + `POST /bookings/:id/accept-quote` (customer) + DTOs.
- [ ] T4. Guard: `accepted → in_progress` only when `quote_status='accepted'`.

## API — payment + wallet
- [ ] T5. `POST /payments/settle` { bookingId, method }: in_app → gateway path; cash → paid + wallet commission debit. Transactional. Award reward points on paid.
- [ ] T6. WalletService + `GET /providers/me/wallet`, `POST /providers/me/wallet/topup`.
- [ ] T7. Matching: exclude providers below wallet threshold (env `WALLET_MIN_CENTS`, default -200000).

## API — reviews + rewards
- [ ] T8. RewardsService (award on completion + on review, idempotent) + `GET /rewards/me`.
- [ ] T9. Hook reward award into reviews.create and into payment settle.

## Web
- [ ] T10. Provider: set/edit quote on a job; customer: accept quote (booking detail).
- [ ] T11. Customer: cash / in-app choice at completion → then review.
- [ ] T12. Provider dashboard: wallet balance + top-up + low-balance warning.
- [ ] T13. Customer: reward points balance + ledger (profile/dashboard).
- [ ] T14. i18n (en/si/ta) for all new strings.

## Verify
- [ ] T15. API tsc + jest; web tsc; end-to-end: quote→accept→complete→(cash|in_app)→points→review.
