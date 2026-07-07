-- ============================================================================
-- 014: booking scheduling. `scheduled_for` = the customer's preferred date/time
-- (NULL = ASAP / on-demand). Enables reschedule. See spec 17. Idempotent.
-- ============================================================================

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS scheduled_for timestamptz;
