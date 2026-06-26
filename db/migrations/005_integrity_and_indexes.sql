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
