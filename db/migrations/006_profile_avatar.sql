-- ============================================================================
-- 006: profile avatar.
-- Adds an avatar image URL to customer profiles (the per-user account photo shown
-- in the header + profile page). Idempotent.
-- Target: PostgreSQL 18 + PostGIS 3.x. See db/README.md for run order.
-- ============================================================================

ALTER TABLE customer_profiles ADD COLUMN IF NOT EXISTS avatar_url text;
