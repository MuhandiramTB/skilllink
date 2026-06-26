# Design — Ratings & Reviews

**Spec:** `08-reviews` · **Module:** API `reviews`

## 1. Overview
One review per completed booking; creating it recalculates the provider aggregate
(`rating_avg`, `rating_count`) so the matching engine immediately reflects new quality.

## 2. API
| Method | Path | Role | Purpose |
|--------|------|------|---------|
| POST | `/bookings/:id/review` | customer(owner) | `{ rating, comment? }` (completed only, once) |
| POST | `/reviews/:id/response` | provider(owner of booking) | `{ response }` |
| GET | `/providers/:id/reviews` | public | list reviews + responses |

## 3. Data
`reviews` (booking_id unique, customer_id, provider_id, rating, comment, provider_response).
Recalc: `rating_avg = avg(rating)`, `rating_count = count` for the provider, written to `providers`.

## 4. Recalculation
On create, within a transaction: insert review → recompute aggregate from all reviews for
that provider → update `providers.rating_avg/rating_count`. Feeds `MatchingService` scoring (0.3 weight).

## 5. Security
- review: only booking's customer, only when completed, once (unique booking_id).
- response: only the booking's provider.

## 6. Errors
| Condition | HTTP | code |
|-----------|------|------|
| Not completed | 400 | REVIEW_BOOKING_NOT_COMPLETED |
| Already reviewed | 409 | REVIEW_EXISTS |
| Not owner / not provider | 403 | FORBIDDEN |

## 7. Testing
- Unit: recalc math (avg over N).
- Integration: review before completion → 400; double review → 409; create → provider rating_avg updates; response by non-owner → 403.
- E2E: complete booking → review 5★ → provider rating_avg rises → reflected in /match score.
