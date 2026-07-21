-- ============================================================================
-- 015: KYC checks — provider identity verification via a pluggable KYC provider
-- (mock in dev; Onfido/Persona in prod). One row per verification attempt, holding
-- the individual signal results (document authenticity, face match, liveness) and
-- the vendor's opaque check id + raw payload. See spec 18. Idempotent. PG 18.
-- ============================================================================

DO $$ BEGIN
  CREATE TYPE kyc_status AS ENUM ('pending', 'verified', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS kyc_checks (
    id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id    uuid NOT NULL REFERENCES providers(user_id) ON DELETE CASCADE,
    vendor         text NOT NULL DEFAULT 'mock',      -- 'mock' | 'onfido' | 'persona' ...
    vendor_check_id text,                              -- the vendor's id for polling/webhook
    status         kyc_status NOT NULL DEFAULT 'pending',
    document_ok    boolean,                            -- NIC authenticity / OCR match
    face_match     boolean,                            -- selfie matches the ID photo
    liveness_ok    boolean,                            -- selfie is a live human (anti-spoof)
    score          numeric(4,3),                       -- overall confidence 0..1
    reason         text,                               -- rejection reason (if any)
    raw            jsonb,                              -- vendor's full response
    created_at     timestamptz NOT NULL DEFAULT now(),
    updated_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_kyc_checks_provider ON kyc_checks (provider_id, created_at DESC);
