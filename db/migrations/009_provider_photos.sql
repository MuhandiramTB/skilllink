-- ============================================================================
-- 009: provider work-photos portfolio. Real photos of past jobs shown on the
-- public profile + match card BEFORE booking — the #1 trust signal for home
-- services. See .kiro/specs/12-work-photos. Idempotent. Target: PostgreSQL 18.
-- ============================================================================

CREATE TABLE IF NOT EXISTS provider_photos (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id uuid NOT NULL REFERENCES providers(user_id) ON DELETE CASCADE,
    url         text NOT NULL,            -- data URL or CDN URL (validated, <=5MB)
    caption     text,
    category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
    created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_provider_photos_provider
    ON provider_photos (provider_id, created_at DESC);
