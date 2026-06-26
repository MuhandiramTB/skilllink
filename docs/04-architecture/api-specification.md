# API Specification — SkillLink LK

**Owner:** Software Architect · **Style:** REST + WebSocket · **Base:** `/api/v1`
**Consumed by:** Dev, QA · **Version:** 1.0 (Solar included)

> Conventions: envelope `{ "data": ..., "error": null }`; Bearer JWT in `Authorization`;
> all roles guarded; timestamps UTC ISO-8601; money in LKR cents.

---

## Auth  — ✅ BUILT (Sprint 1), spec `01-authentication-otp`
| Method | Path | Role | Purpose | Status |
|--------|------|------|---------|--------|
| POST | `/auth/otp/request` | public | Request OTP (rate-limited 5/15min/phone, no enumeration) `{ phone }` → 202 | ✅ |
| POST | `/auth/otp/verify` | public | Verify Firebase ID token → issue JWT + user `{ firebaseIdToken }` | ✅ |
| POST | `/auth/refresh` | public | Refresh (rotation + replay-revoke) `{ refreshToken }` | ✅ |
| POST | `/auth/logout` | auth | Revoke session `{ refreshToken?, allDevices? }` → 204 | ✅ |
| PATCH | `/auth/language` | auth | Set language `{ language: si\|ta\|en }` | ✅ |
| GET | `/auth/me` | auth | Current profile (incl. language) | ✅ |

> **Dev/mock auth:** with `AUTH_VERIFIER=mock`, the client sends `firebaseIdToken="mock:+94XXXXXXXXX"`
> to `/auth/otp/verify` (no SMS). Swap to `AUTH_VERIFIER=firebase` + creds for real OTP.
> Access JWT = 15m, refresh = 30d (rotating; reuse of a revoked token revokes all sessions).

## Users
| GET | `/me` | auth | Current profile |
| PATCH | `/me` | auth | Update profile |

## Providers — ✅ BUILT (Sprint 2), spec `02-provider-onboarding`
| Method | Path | Role | Purpose |
|--------|------|------|---------|
| POST | `/providers` | auth | Become a provider (status=pending; idempotent) |
| GET | `/providers/me` | provider | Own profile + verification status |
| POST | `/providers/me/uploads/:kind` | provider | Presign media upload (mock returns fileUrl) |
| POST | `/providers/me/verifications` | provider | Add `{ type: nic\|selfie\|certificate, mediaUrl }` |
| PUT | `/providers/me/service-area` | provider | `{ lat, lng, radiusMeters }` (PostGIS point) |
| PUT | `/providers/me/categories` | provider | `{ categoryIds[] }` |
| PATCH | `/providers/me/availability` | provider | `{ isAvailable }` |
| GET | `/providers/:id` | public | Public profile (verified flag = status approved; no PII) |
| GET | `/admin/verifications?status=pending` | admin | Verification queue |
| PATCH | `/admin/providers/:id/verification` | admin | `{ decision: approve\|reject, reason? }` (audited) |

> **Trust gate (verified end-to-end):** a provider is excluded from `/match` and shows
> `verified:false` until an admin approves. Media via `MEDIA_UPLOADER=mock\|cloudinary`.

## Admin — user management (OTP access control, ADR-0003)
| GET | `/admin/users?search=&limit=` | admin | List users |
| PATCH | `/admin/users/:id/active` | admin | `{ isActive }` suspend/reactivate (suspend revokes sessions; login → 401 ACCOUNT_SUSPENDED) |
| POST | `/admin/users/:id/force-logout` | admin | Revoke all sessions (user re-logs in via fresh OTP) |

> No passwords (ADR-0003): "password reset" = request a new OTP. Admin "reset access" = suspend/reactivate/force-logout.

## Admin — ops (disputes & analytics) — ✅ BUILT (Sprint 5), spec `09-admin-ops`
| POST | `/bookings/:id/dispute` | participant | `{ reason }` open dispute (409 if open exists) |
| GET | `/admin/disputes` | admin | Open dispute queue |
| PATCH | `/admin/disputes/:id` | admin | `{ resolution }` → resolved (audited) |
| GET | `/admin/analytics` | admin | bookings/revenue/providers/customers/districts snapshot |

> Security hardening (Sprint 5): `helmet` headers on all responses; global throttler
> (120 req/min/IP) via `@nestjs/throttler` in addition to the OTP-specific limit.

## Catalog
| GET | `/categories` | public | Tree incl. Solar sub-categories — ✅ built |

## Admin master-data — ✅ BUILT (Sprint 1.5), spec `06-admin-master-data`
| Method | Path | Role | Purpose |
|--------|------|------|---------|
| GET | `/admin/categories` | admin | List all (incl. inactive) |
| POST | `/admin/categories` | admin | Create `{ key, name_en, name_si, name_ta, parent_id?, sort_order? }` (409 on dup key) |
| PATCH | `/admin/categories/:id` | admin | Update names / is_active / sort_order |
| DELETE | `/admin/categories/:id` | admin | Soft-deactivate (hidden from public tree) |
| GET | `/admin/districts` | admin | List districts with active state |
| PATCH | `/admin/districts/:id` | admin | `{ is_active }` — activate stamps `launched_at` |

> All `/admin/*` require role=admin (AdminGuard): non-admin → 403, no token → 401.
> Every mutation writes an `audit_log` row. Dev admin login: `mock:+94770000000`.

## Bookings — ✅ BUILT (Sprint 3), spec `03-service-booking`
| POST | `/bookings` | customer | Create `{ categoryKey, description, lat, lng, media[]?, solarSpecs? }` → requested |
| GET | `/bookings/:id/matches` | customer(owner) | Ranked **verified** providers (reuses matching) |
| POST | `/bookings/:id/assign` | customer(owner) | Book a provider `{ providerId }` → matched |
| PATCH | `/bookings/:id/respond` | provider(assigned) | `{ action: accept\|reject }` |
| PATCH | `/bookings/:id/status` | provider(assigned) | `{ status: in_progress\|completed }` (state-machine guarded) |
| POST | `/bookings/:id/cancel` | customer(owner) | → cancelled |
| GET | `/bookings?role=customer\|provider` | auth | History |
| GET | `/bookings/:id` | owner/assigned | Detail |
| GET/POST | `/bookings/:id/messages` | owner/assigned | Masked chat (phone numbers scrubbed) |

> Status state machine: requested→matched→accepted→in_progress→completed (+ reject→requested,
> cancel from requested/matched/accepted). Illegal jumps → `400 BOOKING_INVALID_TRANSITION`.

## Matching (read)
| GET | `/match?categoryId=&lat=&lng=&radius=` | customer | Ranked candidates (proximity+rating+response+price) |

## Payments — ✅ BUILT (Sprint 4), spec `07-payments`
| POST | `/payments/initiate` | customer(owner) | `{ bookingId, amountCents }` (completed-only, idempotent); 12% commission |
| POST | `/payments/webhook` | gateway | Idempotent confirm (signature; no double-credit) |
| GET | `/providers/me/earnings` | provider | Net totals + recent |

> `PAYMENT_GATEWAY=mock\|payhere\|genie`; `PAYMENT_COMMISSION_RATE` default 0.12. Money in cents.

## Reviews — ✅ BUILT (Sprint 4), spec `08-reviews`
| POST | `/bookings/:id/review` | customer(owner) | `{ rating 1-5, comment? }` (completed-only, once) |
| POST | `/reviews/:id/response` | provider(owner) | `{ response }` |
| GET | `/providers/:id/reviews` | public | reviews + responses |

> Creating a review recalculates `providers.rating_avg/rating_count` → feeds the matching score (verified 0→5 live).

## Realtime (Socket.IO, namespace `/rt`)
| Event | Direction | Payload |
|-------|-----------|---------|
| `join` | client→server | `{ bookingId }` (authorized via JWT) |
| `message` | both | `{ bookingId, body }` (masked; no phone numbers) |
| `status` | server→client | `{ bookingId, status }` (live job tracking) |
| `typing`/`presence` | both | UX signals |

## Error codes (envelope `error.code`)
`AUTH_OTP_INVALID`, `AUTH_RATE_LIMIT`, `PROVIDER_NOT_VERIFIED`, `BOOKING_NOT_FOUND`,
`MATCH_NONE_IN_RADIUS`, `PAYMENT_FAILED`, `FORBIDDEN`, `VALIDATION_ERROR`.

## Standards
OpenAPI 3 spec to be generated from NestJS decorators and committed at
`apps/api/openapi.json`. Every endpoint requires a DTO with validation and an authZ guard.
