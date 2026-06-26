-- ============================================================================
-- 004: fields for the registration flows (ADR-0004 / spec 10).
-- ============================================================================

-- Customer: district on the profile (full_name + default_location already exist).
ALTER TABLE customer_profiles ADD COLUMN IF NOT EXISTS district_id uuid REFERENCES districts(id);
ALTER TABLE customer_profiles ADD COLUMN IF NOT EXISTS email text;

-- Provider: experience + availability detail.
ALTER TABLE providers ADD COLUMN IF NOT EXISTS years_experience int;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS working_days     text;   -- e.g. 'Mon-Sat'
ALTER TABLE providers ADD COLUMN IF NOT EXISTS working_hours    text;   -- e.g. '08:00-18:00'
ALTER TABLE providers ADD COLUMN IF NOT EXISTS emergency_service boolean NOT NULL DEFAULT false;
