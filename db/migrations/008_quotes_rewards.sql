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
