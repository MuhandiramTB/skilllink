-- ============================================================================
-- 012: referral program. Each user gets a shareable code; applying someone's code
-- links referred_by and awards both via the reward ledger. See spec 15.
-- Idempotent. Target: PostgreSQL 18.
-- ============================================================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_code text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS referred_by   uuid REFERENCES users(id) ON DELETE SET NULL;

-- Backfill a unique code for any user that doesn't have one. SK + 6 base36 chars
-- derived from a random uuid (collision-checked by the unique index below).
UPDATE users
   SET referral_code = 'SK' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6))
 WHERE referral_code IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_users_referral_code ON users (referral_code);
