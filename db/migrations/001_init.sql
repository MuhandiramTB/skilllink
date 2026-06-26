-- ============================================================================
-- SkillLink LK — Initial schema (v1: Kandy district focus)
-- Target: PostgreSQL 18 + PostGIS 3.x
-- Run as a superuser-created database. See db/README.md for run order.
-- ============================================================================

-- Geo + UUID support
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- gen_random_uuid()

-- ----------------------------------------------------------------------------
-- ENUM types
-- ----------------------------------------------------------------------------
CREATE TYPE user_role        AS ENUM ('customer', 'provider', 'admin');
CREATE TYPE app_language      AS ENUM ('si', 'ta', 'en');
CREATE TYPE provider_status   AS ENUM ('pending', 'approved', 'rejected', 'suspended');
CREATE TYPE verification_type AS ENUM ('nic', 'selfie', 'certificate', 'police_clearance');
CREATE TYPE verification_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE booking_status    AS ENUM ('requested','matched','accepted','rejected','in_progress','completed','cancelled');
CREATE TYPE media_kind        AS ENUM ('photo','video','completion_photo');
CREATE TYPE payment_provider  AS ENUM ('payhere','genie');
CREATE TYPE payment_status    AS ENUM ('pending','paid','failed','refunded');
CREATE TYPE payout_status     AS ENUM ('pending','paid');
CREATE TYPE dispute_status    AS ENUM ('open','resolved');

-- ----------------------------------------------------------------------------
-- DISTRICTS  (v1 = Kandy only active; expansion = insert rows + flip is_active)
-- ----------------------------------------------------------------------------
CREATE TABLE districts (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name_en     text NOT NULL,
    name_si     text NOT NULL,
    name_ta     text NOT NULL,
    -- approximate centre + service polygon; polygon optional for v1
    center      geography(Point, 4326) NOT NULL,
    boundary    geography(Polygon, 4326),
    is_active   boolean NOT NULL DEFAULT false,
    launched_at timestamptz,
    created_at  timestamptz NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- USERS  &  SESSIONS
-- ----------------------------------------------------------------------------
CREATE TABLE users (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    phone        text UNIQUE NOT NULL,            -- E.164, +94...
    role         user_role NOT NULL DEFAULT 'customer',
    language     app_language NOT NULL DEFAULT 'en',
    firebase_uid text UNIQUE,
    district_id  uuid REFERENCES districts(id),   -- derived from GPS at signup
    created_at   timestamptz NOT NULL DEFAULT now(),
    updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE sessions (
    id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id            uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    refresh_token_hash text NOT NULL,
    expires_at         timestamptz NOT NULL,
    revoked_at         timestamptz,
    created_at         timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE customer_profiles (
    user_id          uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    full_name        text,
    default_location geography(Point, 4326),
    default_address  text
);

-- ----------------------------------------------------------------------------
-- CATEGORIES (self-referential; supports Solar sub-categories)
-- ----------------------------------------------------------------------------
CREATE TABLE categories (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id  uuid REFERENCES categories(id),
    key        text UNIQUE NOT NULL,   -- i18n key, e.g. 'solar.inverter_repair'
    name_en    text NOT NULL,
    name_si    text NOT NULL,
    name_ta    text NOT NULL,
    is_active  boolean NOT NULL DEFAULT true,
    sort_order int NOT NULL DEFAULT 0
);

-- ----------------------------------------------------------------------------
-- PROVIDERS  +  service areas, categories, verifications
-- ----------------------------------------------------------------------------
CREATE TABLE providers (
    user_id              uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    business_name        text,
    status               provider_status NOT NULL DEFAULT 'pending',
    base_location        geography(Point, 4326),
    district_id          uuid REFERENCES districts(id),
    is_available         boolean NOT NULL DEFAULT false,
    rating_avg           numeric(2,1) NOT NULL DEFAULT 0.0,
    rating_count         int NOT NULL DEFAULT 0,
    avg_response_seconds int NOT NULL DEFAULT 0,
    created_at           timestamptz NOT NULL DEFAULT now(),
    updated_at           timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE service_areas (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id   uuid NOT NULL REFERENCES providers(user_id) ON DELETE CASCADE,
    center        geography(Point, 4326) NOT NULL,
    radius_meters int NOT NULL CHECK (radius_meters > 0)
);

CREATE TABLE provider_categories (
    provider_id uuid NOT NULL REFERENCES providers(user_id) ON DELETE CASCADE,
    category_id uuid NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    PRIMARY KEY (provider_id, category_id)
);

CREATE TABLE verifications (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id uuid NOT NULL REFERENCES providers(user_id) ON DELETE CASCADE,
    type        verification_type NOT NULL,
    media_url   text NOT NULL,
    status      verification_status NOT NULL DEFAULT 'pending',
    reviewed_by uuid REFERENCES users(id),
    reason      text,
    reviewed_at timestamptz,
    created_at  timestamptz NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- BOOKINGS  +  media, payments, payouts, reviews, chat
-- ----------------------------------------------------------------------------
CREATE TABLE bookings (
    id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id      uuid NOT NULL REFERENCES users(id),
    provider_id      uuid REFERENCES providers(user_id),
    category_id      uuid NOT NULL REFERENCES categories(id),
    district_id      uuid REFERENCES districts(id),
    description      text,
    location         geography(Point, 4326) NOT NULL,
    status           booking_status NOT NULL DEFAULT 'requested',
    price_cents      int,                      -- LKR cents
    commission_cents int,
    solar_specs      jsonb,                    -- {capacity_kw, panel_brand, inverter_brand}
    created_at       timestamptz NOT NULL DEFAULT now(),
    updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE booking_media (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id uuid NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    kind       media_kind NOT NULL,
    url        text NOT NULL
);

CREATE TABLE payments (
    id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id       uuid UNIQUE NOT NULL REFERENCES bookings(id),
    provider         payment_provider NOT NULL,
    amount_cents     int NOT NULL,
    commission_cents int NOT NULL,
    status           payment_status NOT NULL DEFAULT 'pending',
    gateway_ref      text,
    idempotency_key  text UNIQUE,
    created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE payouts (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id  uuid NOT NULL REFERENCES providers(user_id),
    amount_cents int NOT NULL,
    period       text,
    status       payout_status NOT NULL DEFAULT 'pending',
    created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE reviews (
    id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id        uuid UNIQUE NOT NULL REFERENCES bookings(id),
    customer_id       uuid NOT NULL REFERENCES users(id),
    provider_id       uuid NOT NULL REFERENCES providers(user_id),
    rating            int NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment           text,
    provider_response text,
    created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE conversations (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id uuid UNIQUE NOT NULL REFERENCES bookings(id) ON DELETE CASCADE
);

CREATE TABLE messages (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id       uuid NOT NULL REFERENCES users(id),
    body            text NOT NULL,            -- no phone numbers (call masking)
    created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE disputes (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id  uuid NOT NULL REFERENCES bookings(id),
    opened_by   uuid NOT NULL REFERENCES users(id),
    status      dispute_status NOT NULL DEFAULT 'open',
    resolution  text,
    resolved_by uuid REFERENCES users(id),
    created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE audit_log (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id   uuid REFERENCES users(id),
    action     text NOT NULL,
    entity     text NOT NULL,
    entity_id  uuid,
    meta       jsonb,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- INDEXES (geo = GIST; the rest = btree)
-- ----------------------------------------------------------------------------
CREATE INDEX idx_districts_boundary    ON districts   USING GIST (boundary);
CREATE INDEX idx_providers_base_loc    ON providers   USING GIST (base_location);
CREATE INDEX idx_service_areas_center  ON service_areas USING GIST (center);
CREATE INDEX idx_bookings_location     ON bookings    USING GIST (location);

CREATE INDEX idx_users_phone           ON users (phone);
CREATE INDEX idx_providers_status      ON providers (status);
CREATE INDEX idx_providers_available   ON providers (is_available);
CREATE INDEX idx_bookings_status       ON bookings (status);
CREATE INDEX idx_districts_active      ON districts (is_active);
