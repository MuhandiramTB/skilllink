# Design — Service Booking

**Spec:** `03-service-booking` · **Reads:** requirements.md, Architecture, Matching design, Provider design
**Module:** API `bookings` · Web `/category/[key]` + `/booking/[id]`

## 1. Overview
A customer describes an issue (+ optional photos via mock uploader), shares location, sees
**ranked verified providers** (reuses the Sprint-0 matching engine), books one; the provider
accepts/rejects; both exchange masked chat; the customer tracks status to completion.

## 2. Booking status state machine
```
requested ──assign(provider)──▶ matched ──provider accept──▶ accepted ──start──▶ in_progress ──complete──▶ completed
    │                              │                                                                  
    │                              └── provider reject / timeout ──▶ requested (re-match)
    └────────────── customer cancel (policy) ──▶ cancelled  (allowed from requested/matched/accepted)
```
A guard validates every transition; illegal jumps → 400 `BOOKING_INVALID_TRANSITION`.

## 3. API (NestJS `bookings` module)
| Method | Path | Role | Purpose |
|--------|------|------|---------|
| POST | `/bookings` | customer | Create `{ categoryKey, description, lat, lng, media[]?, solarSpecs? }` → status requested |
| GET | `/bookings/:id/matches` | customer(owner) | Ranked verified providers for this booking |
| POST | `/bookings/:id/assign` | customer(owner) | `{ providerId }` → matched, notify provider |
| PATCH | `/bookings/:id/respond` | provider(assigned) | `{ action: accept\|reject }` |
| PATCH | `/bookings/:id/status` | provider(assigned) | `{ status: in_progress\|completed }` |
| POST | `/bookings/:id/cancel` | customer(owner) | policy-checked → cancelled |
| GET | `/bookings?role=customer\|provider` | auth | History |
| GET | `/bookings/:id` | owner/assigned | Booking detail |
| GET | `/bookings/:id/messages` | owner/assigned | Chat history |
| POST | `/bookings/:id/messages` | owner/assigned | `{ body }` — masked, no phone numbers |

## 4. Components
| Component | Responsibility |
|-----------|----------------|
| `BookingsService` | lifecycle, state-machine guard, ownership checks |
| `BookingStatus` (enum/const) + `canTransition()` | legal transitions |
| `ChatService` | conversation-per-booking, messages, phone-number scrub |
| `MatchingService` (reused) | ranked providers |
| `MediaUploader` (reused) | booking photo uploads (mock) |
| Web `category/[key]` | issue capture + location + matches + book |
| Web `booking/[id]` | status + chat |

## 5. Data
Uses `bookings`, `booking_media`, `conversations`, `messages` (DB design). Booking
`location` is a PostGIS point (raw SQL insert). `solar_specs` jsonb when category under Solar.

## 6. Chat masking (Req 4)
Messages store only `{ sender_id, body }`. A scrub function strips anything that looks like a
phone number from `body` before persisting (defense-in-depth); real numbers are never stored
or returned. (Full call-masking via a telco proxy is later; in-app chat is the MVP channel.)

## 7. Validation & ownership
- Only the booking's customer may view matches/assign/cancel/chat.
- Only the assigned provider may respond/advance status/chat.
- Transition guard rejects illegal status changes.
- Location required (Req 1.3); category must exist.

## 8. Matching reuse
`GET /bookings/:id/matches` calls `MatchingService.match({categoryKey, lat, lng})` derived
from the booking. Returns `MATCH_NONE_IN_RADIUS` (empty) when nobody qualifies (Req 2.2).

## 9. Error mapping
| Condition | HTTP | code |
|-----------|------|------|
| Not owner / not assigned | 403 | FORBIDDEN |
| Illegal status change | 400 | BOOKING_INVALID_TRANSITION |
| No providers in radius | 200 (empty) | MATCH_NONE_IN_RADIUS (in body note) |
| Booking not found | 404 | NOT_FOUND |

## 10. Testing
- Unit: `canTransition()` matrix; chat scrub; ownership guards.
- Integration: create→matches→assign→accept→in_progress→complete; reject→re-match; cancel; 403 for non-owner/non-assigned; illegal transition → 400.
- E2E: customer books a verified Kandy electrician → provider accepts → chat → complete.

## 11. Open questions / deferred
- Realtime (Socket.IO live status + typing) → deferred; v1 uses polling on status.
- Provider accept timeout auto-revert → simple immediate model for now (manual reject).
- Pricing/commission set at completion → Payments sprint.
