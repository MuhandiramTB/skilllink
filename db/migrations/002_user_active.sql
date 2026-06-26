-- ============================================================================
-- 002: user account suspension (OTP-appropriate "reset access").
-- Admin can suspend (block login) / reactivate a user; force-logout = revoke sessions.
-- ============================================================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;
