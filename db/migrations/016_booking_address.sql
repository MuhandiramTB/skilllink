-- ============================================================================
-- 016: structured service address on bookings (Uber-style location flow).
-- Beyond the lat/lng point: the human-readable address (reverse-geocoded or
-- searched) + free-text notes (house/flat no., landmark, gate colour, directions)
-- so the provider can actually FIND the customer — GPS + street addresses are
-- often imprecise in Sri Lanka. Idempotent. PostgreSQL 18.
-- ============================================================================

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS address_text  text;  -- resolved place/address name
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS address_notes text;  -- house/flat no., landmark, directions
