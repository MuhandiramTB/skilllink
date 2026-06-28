-- ============================================================================
-- 010: booking lifecycle timestamps (customer-facing tracking + SLA metrics).
-- See .kiro/specs/13-tracking-metrics. Idempotent. Target: PostgreSQL 18.
-- accepted_at also drives the provider responsiveness signal (avg_response_seconds),
-- which the matching engine already weights but nothing previously wrote.
-- ============================================================================

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS accepted_at  timestamptz;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS started_at   timestamptz;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS completed_at timestamptz;
