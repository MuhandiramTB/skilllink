-- ============================================================================
-- Render one-shot DB setup for SkillLink LK.
-- Render already created the database, so we SKIP 000_create_database.sql.
-- Runs migrations 001..008 (they self-create the postgis/pgcrypto extensions)
-- + seeds categories/districts + admin. Paste this whole file into the Render
-- DB Shell (or: psql <External Database URL> -f render-db-setup.sql).
-- ============================================================================

-- ===== migrations/001_init.sql =====
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

-- ===== migrations/002_user_active.sql =====
-- ============================================================================
-- 002: user account suspension (OTP-appropriate "reset access").
-- Admin can suspend (block login) / reactivate a user; force-logout = revoke sessions.
-- ============================================================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

-- ===== migrations/003_notifications.sql =====
-- ============================================================================
-- 003: in-app notifications. Each row is one notification for one user.
-- type = machine key (e.g. 'booking.accepted'); body = i18n-key or rendered text.
-- ============================================================================
CREATE TABLE IF NOT EXISTS notifications (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type        text NOT NULL,
  title       text NOT NULL,
  body        text,
  link        text,                       -- optional in-app deep link (e.g. /bookings/:id)
  read_at     timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications (user_id) WHERE read_at IS NULL;

-- ===== migrations/004_registration_fields.sql =====
-- ============================================================================
-- 004: fields for the registration flows (ADR-0004 / spec 10).
-- ============================================================================

-- Customer: district on the profile (full_name + default_location already exist).
ALTER TABLE customer_profiles ADD COLUMN IF NOT EXISTS district_id uuid REFERENCES districts(id);
ALTER TABLE customer_profiles ADD COLUMN IF NOT EXISTS email text;

-- Provider: experience + availability detail.
ALTER TABLE providers ADD COLUMN IF NOT EXISTS years_experience int;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS working_days     text;   -- e.g. 'Mon-Sat'
ALTER TABLE providers ADD COLUMN IF NOT EXISTS working_hours    text;   -- e.g. '08:00-18:00'
ALTER TABLE providers ADD COLUMN IF NOT EXISTS emergency_service boolean NOT NULL DEFAULT false;

-- ===== migrations/005_integrity_and_indexes.sql =====
-- ============================================================================
-- 005: data-integrity hardening + missing FK / query indexes.
-- Adds B-tree indexes on un-indexed foreign keys, a composite chat index,
-- money CHECK constraints + NOT NULL/DEFAULT on bookings, ON DELETE CASCADE
-- fixes for disputes/payouts, and a UNIQUE constraint on verifications.
-- Fully idempotent: safe to re-run (IF NOT EXISTS for indexes; DO blocks that
-- swallow duplicate_object/duplicate_table for constraints).
-- Target: PostgreSQL 18 + PostGIS 3.x. See db/README.md for run order.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Missing FK / query indexes.
--    001 created GIST geo indexes + a few btrees, but the foreign-key columns
--    below are unindexed, which makes joins and ON DELETE CASCADE scans slow.
--    (service_areas.center already has a GIST index; here we add the btree on
--    the provider_id FK. messages had no index at all.)
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_bookings_customer       ON bookings (customer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_provider       ON bookings (provider_id);
CREATE INDEX IF NOT EXISTS idx_bookings_category       ON bookings (category_id);
CREATE INDEX IF NOT EXISTS idx_service_areas_provider  ON service_areas (provider_id);
-- Chat: list a conversation's messages newest-first without a sort.
CREATE INDEX IF NOT EXISTS idx_messages_conversation   ON messages (conversation_id, created_at DESC);

-- ----------------------------------------------------------------------------
-- 2. Notifications unread index.
--    003 created idx_notifications_unread as a partial index on (user_id)
--    WHERE read_at IS NULL. The unread list is always ordered newest-first, so
--    recreate it as (user_id, created_at DESC) to serve the ORDER BY directly.
-- ----------------------------------------------------------------------------
DROP INDEX IF EXISTS idx_notifications_unread;
CREATE INDEX IF NOT EXISTS idx_notifications_unread
    ON notifications (user_id, created_at DESC)
    WHERE read_at IS NULL;

-- ----------------------------------------------------------------------------
-- 3. Money integrity.
--    bookings.price_cents / commission_cents were nullable in 001. Make them
--    NOT NULL DEFAULT 0 (only if still nullable, so re-runs are no-ops), then
--    add CHECK constraints so amounts can never go negative and commission can
--    never exceed price. payments.amount_cents / commission_cents are already
--    NOT NULL in 001; here we only add the non-negative CHECKs.
-- ----------------------------------------------------------------------------
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'bookings' AND column_name = 'price_cents'
          AND is_nullable = 'YES'
    ) THEN
        UPDATE bookings SET price_cents = 0 WHERE price_cents IS NULL;
        ALTER TABLE bookings ALTER COLUMN price_cents SET DEFAULT 0;
        ALTER TABLE bookings ALTER COLUMN price_cents SET NOT NULL;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'bookings' AND column_name = 'commission_cents'
          AND is_nullable = 'YES'
    ) THEN
        UPDATE bookings SET commission_cents = 0 WHERE commission_cents IS NULL;
        ALTER TABLE bookings ALTER COLUMN commission_cents SET DEFAULT 0;
        ALTER TABLE bookings ALTER COLUMN commission_cents SET NOT NULL;
    END IF;
END $$;

-- bookings money CHECKs (named, so the DO block can guard re-runs).
DO $$
BEGIN
    ALTER TABLE bookings
        ADD CONSTRAINT bookings_price_cents_nonneg CHECK (price_cents >= 0);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    ALTER TABLE bookings
        ADD CONSTRAINT bookings_commission_cents_valid
        CHECK (commission_cents >= 0 AND commission_cents <= price_cents);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- payments money CHECKs.
DO $$
BEGIN
    ALTER TABLE payments
        ADD CONSTRAINT payments_amount_cents_nonneg CHECK (amount_cents >= 0);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    ALTER TABLE payments
        ADD CONSTRAINT payments_commission_cents_nonneg CHECK (commission_cents >= 0);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ----------------------------------------------------------------------------
-- 4. Cascade fixes.
--    In 001 these FKs were declared inline without an ON DELETE clause, so they
--    default to NO ACTION (RESTRICT) and use system-generated names. Deleting a
--    booking should remove its disputes; removing a provider should remove their
--    payouts. We discover the existing FK constraint name (the column it sits on
--    is unique enough), drop it, and re-add it with ON DELETE CASCADE under an
--    explicit name. Guarded so re-runs are no-ops.
-- ----------------------------------------------------------------------------

-- disputes.booking_id -> bookings(id) ON DELETE CASCADE
DO $$
DECLARE
    con_name text;
BEGIN
    -- Already converted on a prior run? Then nothing to do.
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'disputes_booking_id_fkey_cascade') THEN
        RETURN;
    END IF;

    SELECT c.conname INTO con_name
    FROM pg_constraint c
    JOIN pg_attribute a
      ON a.attrelid = c.conrelid AND a.attnum = ANY (c.conkey)
    WHERE c.conrelid = 'disputes'::regclass
      AND c.contype = 'f'
      AND a.attname = 'booking_id';

    IF con_name IS NOT NULL THEN
        EXECUTE format('ALTER TABLE disputes DROP CONSTRAINT %I', con_name);
    END IF;

    ALTER TABLE disputes
        ADD CONSTRAINT disputes_booking_id_fkey_cascade
        FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE;
END $$;

-- payouts.provider_id -> providers(user_id) ON DELETE CASCADE (only if payouts exists)
DO $$
DECLARE
    con_name text;
BEGIN
    IF to_regclass('public.payouts') IS NULL THEN
        RETURN;
    END IF;

    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payouts_provider_id_fkey_cascade') THEN
        RETURN;
    END IF;

    SELECT c.conname INTO con_name
    FROM pg_constraint c
    JOIN pg_attribute a
      ON a.attrelid = c.conrelid AND a.attnum = ANY (c.conkey)
    WHERE c.conrelid = 'payouts'::regclass
      AND c.contype = 'f'
      AND a.attname = 'provider_id';

    IF con_name IS NOT NULL THEN
        EXECUTE format('ALTER TABLE payouts DROP CONSTRAINT %I', con_name);
    END IF;

    ALTER TABLE payouts
        ADD CONSTRAINT payouts_provider_id_fkey_cascade
        FOREIGN KEY (provider_id) REFERENCES providers(user_id) ON DELETE CASCADE;
END $$;

-- ----------------------------------------------------------------------------
-- 5. Verifications uniqueness.
--    A provider should have at most one verification row per type (nic, selfie,
--    certificate, police_clearance) so re-submissions update rather than pile up.
-- ----------------------------------------------------------------------------
DO $$
BEGIN
    ALTER TABLE verifications
        ADD CONSTRAINT verifications_provider_id_type_key UNIQUE (provider_id, type);
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;

-- ===== migrations/006_profile_avatar.sql =====
-- ============================================================================
-- 006: profile avatar.
-- Adds an avatar image URL to customer profiles (the per-user account photo shown
-- in the header + profile page). Idempotent.
-- Target: PostgreSQL 18 + PostGIS 3.x. See db/README.md for run order.
-- ============================================================================

ALTER TABLE customer_profiles ADD COLUMN IF NOT EXISTS avatar_url text;

-- ===== migrations/007_email_otp.sql =====
-- ============================================================================
-- 007: email OTP login.
-- Stores short-lived email verification codes (hashed). A row per request; the
-- newest unexpired row for an email is the active one. Codes expire and cap attempts.
-- Idempotent. Target: PostgreSQL 18.
-- ============================================================================

CREATE TABLE IF NOT EXISTS email_otps (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email       text        NOT NULL,
    code_hash   text        NOT NULL,           -- SHA-256 of the 6-digit code
    expires_at  timestamptz NOT NULL,
    attempts    int         NOT NULL DEFAULT 0, -- wrong-code tries, capped
    consumed_at timestamptz,                    -- set once successfully used
    created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_otps_email ON email_otps (email, created_at DESC);

-- ===== migrations/008_quotes_rewards.sql =====
-- ============================================================================
-- 008: quotes, hybrid (cash/in-app) payment, provider wallet, customer rewards.
-- See .kiro/specs/11-quotes-rewards. Idempotent. Target: PostgreSQL 18.
-- ============================================================================

-- ---- enums (guarded) ----
DO $$ BEGIN
  CREATE TYPE quote_status AS ENUM ('none','quoted','accepted');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE payment_method AS ENUM ('cash','in_app');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---- bookings: quote status ----
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS quote_status quote_status NOT NULL DEFAULT 'none';

-- ---- providers: wallet balance (negative = owes platform) ----
ALTER TABLE providers ADD COLUMN IF NOT EXISTS wallet_balance_cents int NOT NULL DEFAULT 0;

-- ---- payments: cash vs in-app ----
ALTER TABLE payments ADD COLUMN IF NOT EXISTS method payment_method NOT NULL DEFAULT 'in_app';

-- ---- provider wallet ledger (append-only) ----
CREATE TABLE IF NOT EXISTS wallet_ledger (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id uuid NOT NULL REFERENCES providers(user_id) ON DELETE CASCADE,
    type        text NOT NULL,            -- 'commission' | 'topup' | 'adjustment'
    amount_cents int  NOT NULL,           -- signed: negative debits, positive credits
    booking_id  uuid,
    note        text,
    created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_wallet_ledger_provider ON wallet_ledger (provider_id, created_at DESC);

-- ---- customer reward points ----
CREATE TABLE IF NOT EXISTS reward_points (
    user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    points  int NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS reward_ledger (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    points     int  NOT NULL,             -- signed
    reason     text NOT NULL,             -- 'booking_completed' | 'review' | 'redeem'
    booking_id uuid,
    created_at timestamptz NOT NULL DEFAULT now()
);
-- idempotency: at most one award per (user, booking, reason)
CREATE UNIQUE INDEX IF NOT EXISTS uq_reward_ledger_award
    ON reward_ledger (user_id, booking_id, reason)
    WHERE booking_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_reward_ledger_user ON reward_ledger (user_id, created_at DESC);

-- ============================================================================
-- ===== migrations/009_provider_photos.sql =====
-- ============================================================================
-- 009: provider work-photos portfolio (the #1 trust signal). See spec 12.
CREATE TABLE IF NOT EXISTS provider_photos (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id uuid NOT NULL REFERENCES providers(user_id) ON DELETE CASCADE,
    url         text NOT NULL,
    caption     text,
    category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
    created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_provider_photos_provider
    ON provider_photos (provider_id, created_at DESC);

-- ============================================================================
-- ===== migrations/010_booking_timestamps.sql =====
-- ============================================================================
-- 010: booking lifecycle timestamps + responsiveness signal. See spec 13.
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS accepted_at  timestamptz;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS started_at   timestamptz;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS completed_at timestamptz;

-- ============================================================================
-- ===== migrations/011_favourites.sql =====
-- ============================================================================
-- 011: customer favourites (1-tap rebooking). See spec 14.
CREATE TABLE IF NOT EXISTS favourites (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id uuid NOT NULL REFERENCES users(id)          ON DELETE CASCADE,
    provider_id uuid NOT NULL REFERENCES providers(user_id) ON DELETE CASCADE,
    created_at  timestamptz NOT NULL DEFAULT now(),
    UNIQUE (customer_id, provider_id)
);
CREATE INDEX IF NOT EXISTS idx_favourites_customer ON favourites (customer_id);

-- ============================================================================
-- ===== migrations/012_referrals.sql =====
-- ============================================================================
-- 012: referral program. See spec 15.
ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_code text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS referred_by   uuid REFERENCES users(id) ON DELETE SET NULL;
UPDATE users
   SET referral_code = 'SK' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6))
 WHERE referral_code IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_users_referral_code ON users (referral_code);

-- ============================================================================
-- ===== migrations/013_app_settings.sql =====
-- ============================================================================
CREATE TABLE IF NOT EXISTS app_settings (
    key        text PRIMARY KEY,
    value      text NOT NULL,
    updated_at timestamptz NOT NULL DEFAULT now(),
    updated_by uuid REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================================================
-- ===== migrations/014_booking_scheduling.sql =====
-- ============================================================================
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS scheduled_for timestamptz;

-- ===== seeds/001_seed_kandy_and_categories.sql =====
-- ============================================================================
-- Seed data — v1 Kandy district + service categories (incl. Solar)
-- Idempotent: safe to re-run.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- DISTRICTS: Kandy active (v1). Others inserted but inactive (flip later).
-- Coordinates are approximate district centres (lng, lat) WGS84.
-- ---------------------------------------------------------------------------
INSERT INTO districts (name_en, name_si, name_ta, center, is_active, launched_at)
VALUES
  ('Kandy',   'මහනුවර',  'கண்டி',     ST_SetSRID(ST_MakePoint(80.6350, 7.2906), 4326)::geography, true,  now()),
  ('Colombo', 'කොළඹ',    'கொழும்பு', ST_SetSRID(ST_MakePoint(79.8612, 6.9271), 4326)::geography, false, NULL),
  ('Gampaha', 'ගම්පහ',   'கம்பஹா',   ST_SetSRID(ST_MakePoint(79.9990, 7.0917), 4326)::geography, false, NULL)
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- CATEGORIES — top-level trades
-- ---------------------------------------------------------------------------
INSERT INTO categories (key, name_en, name_si, name_ta, sort_order) VALUES
  ('electrician',   'Electrician',        'විදුලි කාර්මික',     'மின் கம்மியர்',    10),
  ('plumber',       'Plumber',            'ජල නල කාර්මික',      'குழாய் பணியாளர்',  20),
  ('ac_tech',       'AC Technician',      'වායුසමීකරණ කාර්මික', 'ஏசி தொழில்நுட்பர்', 30),
  ('welder',        'Welder',             'වෑල්ඩින් කාර්මික',   'வெல்டர்',          40),
  ('carpenter',     'Carpenter',          'වඩු කාර්මික',        'தச்சர்',            50),
  ('mechanic',      'Mechanic',           'යාන්ත්‍රික',          'இயந்திரவியலாளர்',  60),
  ('auto_ac',       'Auto AC Technician', 'වාහන වායුසමීකරණ',    'வாகன ஏசி',         70),
  ('painter',       'Painter',            'තීන්ත ආලේපක',        'ஓவியர்',           80),
  ('mason',         'Mason',              'පෙදරේරු',            'கொத்தனார்',        90),
  ('cctv',          'CCTV Installer',     'CCTV ස්ථාපක',        'சிசிடிவி நிறுவுநர்', 100),
  ('cleaning',      'Cleaning',           'පිරිසිදු කිරීම',      'சுத்தம்',           110),
  ('solar',         'Solar Services',     'සූර්ය සේවා',         'சூரிய சேவைகள்',     120)
ON CONFLICT (key) DO NOTHING;

-- ---------------------------------------------------------------------------
-- CATEGORIES — Solar sub-categories (parent = 'solar')
-- ---------------------------------------------------------------------------
INSERT INTO categories (parent_id, key, name_en, name_si, name_ta, sort_order)
SELECT s.id, v.key, v.en, v.si, v.ta, v.ord
FROM (SELECT id FROM categories WHERE key = 'solar') s,
     (VALUES
        ('solar.installation',   'Solar Installation',   'සූර්ය ස්ථාපනය',        'சூரிய நிறுவல்',         1),
        ('solar.maintenance',    'Solar Maintenance',    'සූර්ය නඩත්තුව',        'சூரிய பராமரிப்பு',      2),
        ('solar.cleaning',       'Solar Cleaning',       'සූර්ය පැනල පිරිසිදු',  'சூரிய சுத்தம்',         3),
        ('solar.inverter_repair','Inverter Repair',      'ඉන්වර්ටර් අලුත්වැඩියා','இன்வர்ட்டர் பழுது',     4),
        ('solar.battery',        'Battery Replacement',  'බැටරි ප්‍රතිස්ථාපනය',  'பேட்டரி மாற்றம்',       5),
        ('solar.net_metering',   'Net Metering Support', 'නෙට් මීටරින් සහාය',    'நெட் மீட்டரிங் ஆதரவு',  6),
        ('solar.ev_charger',     'EV Charger Installation','EV චාජර් ස්ථාපනය',   'EV சார்ஜர் நிறுவல்',    7)
     ) AS v(key, en, si, ta, ord)
ON CONFLICT (key) DO NOTHING;

-- ===== seeds/003_seed_admin.sql =====
-- ============================================================================
-- DEV admin user — so the /admin console is reachable.
-- Login (mock): POST /auth/otp/verify { firebaseIdToken: "mock:+94770000000" }
-- The mock verifier maps that phone to this user; role=admin grants /admin access.
-- Idempotent.
-- ============================================================================
INSERT INTO users (phone, role, language, firebase_uid, district_id)
SELECT '+94770000000', 'admin', 'en', 'mock-+94770000000',
       (SELECT id FROM districts WHERE name_en = 'Kandy')
WHERE NOT EXISTS (SELECT 1 FROM users WHERE phone = '+94770000000');

-- If the user already existed as a customer, promote to admin (dev convenience).
UPDATE users SET role = 'admin' WHERE phone = '+94770000000' AND role <> 'admin';


-- ============================================================================
-- ===== migrations/015_kyc_checks.sql =====
-- ============================================================================
DO $$ BEGIN
  CREATE TYPE kyc_status AS ENUM ('pending', 'verified', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
CREATE TABLE IF NOT EXISTS kyc_checks (
    id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id    uuid NOT NULL REFERENCES providers(user_id) ON DELETE CASCADE,
    vendor         text NOT NULL DEFAULT 'mock',
    vendor_check_id text,
    status         kyc_status NOT NULL DEFAULT 'pending',
    document_ok    boolean, face_match boolean, liveness_ok boolean,
    score          numeric(4,3), reason text, raw jsonb,
    created_at     timestamptz NOT NULL DEFAULT now(),
    updated_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_kyc_checks_provider ON kyc_checks (provider_id, created_at DESC);
