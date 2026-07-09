-- ============================================================================
-- 015: Trust & Safety, cancellation/no-show policy, availability realism,
-- pricing transparency, and cash-job self-reporting. Idempotent. PostgreSQL 18.
--
-- Business context (see product analysis): these close the "marketplace killer"
-- gaps — disintermediation defenses (cash reporting), in-home trust & safety
-- (SOS + reports), fair cancellation rules, honest pricing, and real availability.
-- Payments gateway + OTP are intentionally out of scope here.
-- ============================================================================

-- ── Booking status: add 'no_show' as a terminal state ──────────────────────
-- (Enum values can't be dropped; adding is safe + idempotent via the guard.)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid
                 WHERE t.typname = 'booking_status' AND e.enumlabel = 'no_show') THEN
    ALTER TYPE booking_status ADD VALUE 'no_show';
  END IF;
END $$;

-- ── Cancellation / no-show policy fields on bookings ───────────────────────
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancelled_by   text;      -- 'customer' | 'provider' | 'admin'
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancel_reason  text;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancelled_at   timestamptz;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancel_fee_cents int NOT NULL DEFAULT 0;
-- Disintermediation: a job settled in cash off the booking flow, self-reported
-- by the provider so commission is still owed (feeds the wallet).
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cash_reported     boolean NOT NULL DEFAULT false;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cash_reported_at  timestamptz;

-- ── Provider availability realism ──────────────────────────────────────────
-- Beyond a binary toggle: working hours + a "busy until" timestamp so
-- "available" means genuinely reachable right now.
ALTER TABLE providers ADD COLUMN IF NOT EXISTS working_hours jsonb;  -- {days:[1..7], start:"08:00", end:"18:00"}
ALTER TABLE providers ADD COLUMN IF NOT EXISTS busy_until    timestamptz; -- occupied on a job until this time
ALTER TABLE providers ADD COLUMN IF NOT EXISTS accepts_emergency boolean NOT NULL DEFAULT false;
-- Trust: a strike counter for no-shows / policy violations (affects standing).
ALTER TABLE providers ADD COLUMN IF NOT EXISTS strikes int NOT NULL DEFAULT 0;

-- ── Pricing transparency: typical price band per category ──────────────────
-- Shown to customers BEFORE booking so there are no surprises. NULL = no guidance.
ALTER TABLE categories ADD COLUMN IF NOT EXISTS price_min_cents int;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS price_max_cents int;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS price_unit text; -- e.g. 'per visit', 'per hour', 'from'

-- ── Trust & Safety: provider reports (a customer flags a provider) ─────────
CREATE TABLE IF NOT EXISTS provider_reports (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id uuid NOT NULL REFERENCES providers(user_id) ON DELETE CASCADE,
    reporter_id uuid NOT NULL REFERENCES users(id),
    booking_id  uuid REFERENCES bookings(id) ON DELETE SET NULL,
    reason      text NOT NULL,            -- 'safety' | 'fraud' | 'no_show' | 'quality' | 'other'
    detail      text,
    status      text NOT NULL DEFAULT 'open',  -- 'open' | 'reviewing' | 'actioned' | 'dismissed'
    created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_provider_reports_provider ON provider_reports (provider_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_provider_reports_status   ON provider_reports (status);

-- ── Trust & Safety: SOS / safety alerts (customer raises an alarm on a job) ─
CREATE TABLE IF NOT EXISTS safety_alerts (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     uuid NOT NULL REFERENCES users(id),
    booking_id  uuid REFERENCES bookings(id) ON DELETE SET NULL,
    lat         double precision,
    lng         double precision,
    note        text,
    status      text NOT NULL DEFAULT 'active',  -- 'active' | 'resolved'
    created_at  timestamptz NOT NULL DEFAULT now(),
    resolved_at timestamptz
);
CREATE INDEX IF NOT EXISTS idx_safety_alerts_status ON safety_alerts (status, created_at DESC);

-- ── Trust & Safety: a trusted contact a customer can share a job with ──────
CREATE TABLE IF NOT EXISTS trusted_contacts (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name       text NOT NULL,
    phone      text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_trusted_contacts_user ON trusted_contacts (user_id);

-- ── Seed sensible price bands for the launch categories (safe upsert) ───────
-- Illustrative LKR guidance (cents). Admin can edit later via the categories UI.
UPDATE categories SET price_min_cents = 150000, price_max_cents = 500000, price_unit = 'from'
  WHERE key LIKE 'electrician%' AND price_min_cents IS NULL;
UPDATE categories SET price_min_cents = 200000, price_max_cents = 800000, price_unit = 'from'
  WHERE key LIKE 'plumber%' AND price_min_cents IS NULL;
UPDATE categories SET price_min_cents = 250000, price_max_cents = 600000, price_unit = 'per visit'
  WHERE key LIKE 'cleaning%' AND price_min_cents IS NULL;
