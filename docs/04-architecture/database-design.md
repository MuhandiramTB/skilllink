# Database Design — SkillLink LK

**Owner:** Software Architect · **DB:** PostgreSQL 18 + PostGIS · **ORM:** Prisma
**Consumed by:** Dev, QA · **Version:** 1.0 (Solar included)

> Conventions (from steering): money = integer LKR cents; timestamps = UTC; geo =
> `geography(Point,4326)`; soft deletes via `deleted_at` where noted.

---

## 1. ER overview
```
users ─1:1─ customer_profiles
users ─1:1─ providers ─1:N─ provider_categories ─N:1─ categories
providers ─1:N─ service_areas
providers ─1:N─ verifications
users(customer) ─1:N─ bookings ─N:1─ providers
bookings ─1:N─ booking_media
bookings ─1:1─ payments
bookings ─1:1─ reviews
bookings ─1:1─ conversations ─1:N─ messages
categories ─1:N─ categories (self-ref: sub-categories, incl. Solar)
admins/users(admin) ─1:N─ disputes, audit_log
```

## 2. Core tables (key columns)

### districts  (v1 geo-phasing — Kandy first)
| col | type | notes |
|-----|------|-------|
| id | uuid PK | |
| name_en / name_si / name_ta | text | trilingual |
| center | geography(Point,4326) | district centre |
| boundary | geography(Polygon,4326) null | service polygon (optional v1) |
| is_active | boolean | **v1: only Kandy = true**; expansion = flip to true |
| launched_at | timestamptz null | |

> **Expansion model:** launching a new district is `UPDATE districts SET is_active=true …`
> — no schema or code change. `users.district_id` and `providers.district_id` are derived
> from the GPS point at signup.

### users
| col | type | notes |
|-----|------|-------|
| id | uuid PK | |
| phone | text unique | E.164, LK |
| role | enum(customer, provider, admin) | |
| language | enum(si, ta, en) | default 'en' |
| firebase_uid | text unique | from OTP auth |
| created_at / updated_at | timestamptz | UTC |

### sessions
`id, user_id FK, refresh_token_hash, expires_at, revoked_at, created_at`

### customer_profiles
`user_id PK/FK, full_name, default_location geography(Point,4326), default_address text`

### providers
| col | type | notes |
|-----|------|-------|
| user_id | uuid PK/FK | |
| business_name | text | |
| status | enum(pending, approved, rejected, suspended) | gate for matching |
| base_location | geography(Point,4326) | |
| is_available | boolean | matching filter |
| rating_avg | numeric(2,1) | denormalized |
| rating_count | int | |
| avg_response_seconds | int | for ranking |

### service_areas
`id, provider_id FK, center geography(Point,4326), radius_meters int`  → GIST index.

### categories (self-referential for sub-categories incl. Solar)
| col | type | notes |
|-----|------|-------|
| id | uuid PK | |
| parent_id | uuid FK null | null = top-level |
| key | text unique | i18n key, e.g. `solar.inverter_repair` |
| name_si / name_ta / name_en | text | display |
| is_active | boolean | |

**Seed (Solar):** parent `Solar Services` → children: Solar Installation, Solar
Maintenance, Solar Cleaning, Inverter Repair, Battery Replacement, Net Metering
Support, EV Charger Installation.

### provider_categories
`provider_id FK, category_id FK` (composite PK).

### verifications
`id, provider_id FK, type enum(nic, selfie, certificate, police_clearance), media_url text, status enum(pending,approved,rejected), reviewed_by FK users, reason text, reviewed_at`

### bookings
| col | type | notes |
|-----|------|-------|
| id | uuid PK | |
| customer_id | uuid FK | |
| provider_id | uuid FK null | null until matched/accepted |
| category_id | uuid FK | |
| description | text | |
| location | geography(Point,4326) | |
| status | enum(requested, matched, accepted, rejected, in_progress, completed, cancelled) | |
| price_cents | int | LKR cents |
| commission_cents | int | 10–15% |
| solar_specs | jsonb null | {capacity_kw, panel_brand, inverter_brand} |
| created_at / updated_at | timestamptz | |

### booking_media
`id, booking_id FK, kind enum(photo, video, completion_photo), url text`

### payments
`id, booking_id FK unique, provider enum(payhere, genie), amount_cents int, commission_cents int, status enum(pending, paid, failed, refunded), gateway_ref text, idempotency_key text unique`

### payouts
`id, provider_id FK, amount_cents int, period text, status enum(pending,paid), created_at`

### reviews
`id, booking_id FK unique, customer_id FK, provider_id FK, rating int(1-5), comment text, provider_response text, created_at`

### conversations / messages
`conversations: id, booking_id FK unique`
`messages: id, conversation_id FK, sender_id FK, body text, created_at` (no phone numbers stored)

### disputes
`id, booking_id FK, opened_by FK, status enum(open, resolved), resolution text, resolved_by FK, created_at`

### audit_log
`id, actor_id FK, action text, entity text, entity_id uuid, meta jsonb, created_at`

## 3. Indexes (performance-critical)
- GIST on `service_areas.center`, `providers.base_location`, `bookings.location`.
- B-tree on `users.phone`, `bookings.status`, `providers.status`, `providers.is_available`.
- Unique on `payments.idempotency_key`.

## 4. Geo-matching query (illustrative)
```sql
SELECT p.user_id,
       ST_Distance(p.base_location, :customer_pt) AS distance_m,
       p.rating_avg, p.avg_response_seconds
FROM providers p
JOIN service_areas sa ON sa.provider_id = p.user_id
JOIN provider_categories pc ON pc.provider_id = p.user_id
WHERE p.status = 'approved'
  AND p.is_available = true
  AND pc.category_id = :category_id
  AND ST_DWithin(sa.center, :customer_pt, sa.radius_meters)
ORDER BY (0.5 * (1.0 / (1 + distance_m/1000))   -- proximity
        + 0.3 * (p.rating_avg / 5.0)            -- quality
        + 0.2 * (1.0 / (1 + p.avg_response_seconds/60.0))) DESC  -- responsiveness
LIMIT 20;
```
Weights are configurable; see [Matching spec](../../.kiro/specs/04-matching-engine/).

## 5. Migrations
Prisma migrations committed; PostGIS extension enabled in an initial migration
(`CREATE EXTENSION IF NOT EXISTS postgis;`). Never edit a merged migration — add a new one.
