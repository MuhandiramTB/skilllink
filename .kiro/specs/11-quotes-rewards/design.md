# Design — Quotes, Hybrid Payment & Rewards

**Spec:** `11-quotes-rewards` · See [requirements.md](./requirements.md)

## Data model changes (migration `008_quotes_rewards.sql`)

### bookings (alter)
- `quote_status` enum `quote_status` (`none` | `quoted` | `accepted`) default `none`.
- `price_cents` already exists (set by the provider's quote).

### providers (alter)
- `wallet_balance_cents` int NOT NULL default 0. Negative = owes platform.

### payments (alter)
- `method` enum `payment_method` (`cash` | `in_app`) default `in_app`.

### wallet_ledger (new) — append-only provider wallet movements
```
id uuid pk, provider_id uuid → providers(user_id) ON DELETE CASCADE,
type text ('commission'|'topup'|'adjustment'), amount_cents int (signed),
booking_id uuid null, note text null, created_at timestamptz
```

### reward_points + reward_ledger (new) — customer loyalty
```
reward_points: user_id uuid pk → users(id) ON DELETE CASCADE, points int NOT NULL default 0
reward_ledger: id uuid pk, user_id uuid, points int (signed),
               reason text ('booking_completed'|'review'|'redeem'),
               booking_id uuid null, created_at timestamptz,
               UNIQUE(user_id, booking_id, reason)   -- idempotency
```

## API surface (all under `/api/v1`, JwtAuthGuard unless noted)

### Quotes (bookings module)
- `PATCH /bookings/:id/quote`  body `{ amountCents }` — provider sets/updates the quote.
- `POST  /bookings/:id/accept-quote` — customer accepts.
- Guard in `updateStatus`: provider can only go `accepted → in_progress` when `quote_status='accepted'`.

### Payment (payments module)
- `POST /payments/settle` body `{ bookingId, method }` — unified completion settle.
  - `in_app` → existing initiate/gateway path (commission auto).
  - `cash`   → record paid + debit provider wallet commission + reward points.
- Existing `/payments/initiate` + `/payments/webhook` retained for the in-app gateway path.

### Wallet (providers module)
- `GET  /providers/me/wallet` — balance + ledger.
- `POST /providers/me/wallet/topup` body `{ amountCents }` — mock top-up (real gateway later).

### Rewards (new rewards module)
- `GET /rewards/me` — customer points balance + ledger.
- Points awarded internally on paid-completion and on review (not a public mutation).

## Service logic

### QuoteService (in bookings)
- `setQuote(providerId, bookingId, amountCents)` → assert assigned + status in {matched,accepted} + amount>0 → set price_cents, quote_status='quoted'.
- `acceptQuote(customerId, bookingId)` → assert owner + quote_status='quoted' → set 'accepted'.

### PaymentsService.settle(customerId, bookingId, method)
- Assert owner + booking.status='completed' + quote_status='accepted' (price known).
- amount = booking.price_cents; commission = round(amount × rate); net = amount − commission.
- in_app: create/return payment (pending→gateway), method='in_app'.
- cash: create payment(status='paid', method='cash'); wallet debit commission (ledger); 
- Both paths (on `paid`): award customer reward points (idempotent).

### WalletService (providers)
- `debitCommission(providerId, bookingId, commissionCents)` → balance -= commission, ledger row.
- `topup(providerId, amountCents)` → balance += amount, ledger row.
- `isBelowThreshold(providerId)` → used by matching to exclude (Req 4.4).
- **Matching change:** add `AND p.wallet_balance_cents >= :threshold` to the match query.

### RewardsService
- `awardBookingCompletion(userId, bookingId, amountCents)` → points = floor(amount/10000); idempotent on (user,booking,'booking_completed').
- `awardReview(userId, bookingId)` → +20; idempotent on (user,booking,'review').
- `balance(userId)`, `ledger(userId)`.

## Web
- **Provider** (booking detail / jobs): "Set your price" input → `quote`. After customer accepts, "Start job".
- **Customer** (booking detail): see quote → "Accept quote". At completion → choose **Cash / Pay in app** → then review.
- **Provider dashboard**: wallet balance card + top-up + low-balance warning.
- **Customer dashboard / profile**: reward points balance + ledger.

## Idempotency & safety
- Reward awards unique per (user,booking,reason). Payment unique per booking.
- Wallet/reward ledgers append-only. Commission rate config-driven (existing env).
- All in transactions where multiple writes must be atomic (payment+wallet+points).
