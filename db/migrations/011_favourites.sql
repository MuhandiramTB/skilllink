-- ============================================================================
-- 011: customer favourites (save a provider for 1-tap rebooking).
-- See .kiro/specs/14-favourites. Idempotent. Target: PostgreSQL 18.
-- ============================================================================

CREATE TABLE IF NOT EXISTS favourites (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id uuid NOT NULL REFERENCES users(id)        ON DELETE CASCADE,
    provider_id uuid NOT NULL REFERENCES providers(user_id) ON DELETE CASCADE,
    created_at  timestamptz NOT NULL DEFAULT now(),
    UNIQUE (customer_id, provider_id)
);
CREATE INDEX IF NOT EXISTS idx_favourites_customer ON favourites (customer_id);
