-- ============================================================================
-- 017: live job tracking. While a provider is en route (accepted / in_progress),
-- their app posts GPS periodically; the customer sees the pin move + an ETA. We
-- store only the LATEST point on the booking (no history needed for v1) — cheap,
-- and cleared when the job completes. Idempotent. PostgreSQL 18.
-- ============================================================================

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS provider_lat        double precision;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS provider_lng        double precision;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS provider_loc_at     timestamptz;   -- when the point was reported
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS provider_eta_minutes int;          -- provider-estimated / computed ETA
