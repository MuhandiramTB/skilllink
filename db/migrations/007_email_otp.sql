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
