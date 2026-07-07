-- ============================================================================
-- 013: app_settings — a small key-value store for admin-editable platform config
-- (commission rate, reward rates, matching weights). Services read live values
-- with env/hardcoded fallbacks. See spec 16. Idempotent. Target: PostgreSQL 18.
-- ============================================================================

CREATE TABLE IF NOT EXISTS app_settings (
    key        text PRIMARY KEY,
    value      text NOT NULL,           -- stored as text; parsed to number by callers
    updated_at timestamptz NOT NULL DEFAULT now(),
    updated_by uuid REFERENCES users(id) ON DELETE SET NULL
);
