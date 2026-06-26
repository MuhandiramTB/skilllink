-- ============================================================================
-- Demo login accounts — three clean, loginable roles for testing/demos.
--   +94770000000  admin     (from 003_seed_admin.sql)
--   +94776665544  customer
--   +94772223333  provider  (verified, available electrician in Kandy)
-- Idempotent.
-- ============================================================================

-- ---- Customer demo account --------------------------------------------------
INSERT INTO users (phone, role, language, firebase_uid, district_id)
SELECT '+94776665544','customer','en','mock-+94776665544',(SELECT id FROM districts WHERE name_en='Kandy')
WHERE NOT EXISTS (SELECT 1 FROM users WHERE phone='+94776665544');

INSERT INTO customer_profiles (user_id, full_name, default_location, default_address)
SELECT u.id,'Demo Customer', ST_SetSRID(ST_MakePoint(80.6350,7.2906),4326)::geography,'Kandy Town'
FROM users u WHERE u.phone='+94776665544'
  AND NOT EXISTS (SELECT 1 FROM customer_profiles cp WHERE cp.user_id=u.id);

-- ---- Provider demo account (verified + available) ---------------------------
DO $$
DECLARE
  v_kandy uuid := (SELECT id FROM districts WHERE name_en='Kandy');
  c_elec  uuid := (SELECT id FROM categories WHERE key='electrician');
  pid uuid;
BEGIN
  -- ensure the user exists and is a provider
  SELECT id INTO pid FROM users WHERE phone='+94772223333';
  IF pid IS NULL THEN
    INSERT INTO users (phone, role, language, firebase_uid, district_id)
    VALUES ('+94772223333','provider','si','mock-+94772223333', v_kandy) RETURNING id INTO pid;
  ELSE
    UPDATE users SET role='provider' WHERE id=pid;
  END IF;

  -- provider profile (approved + available)
  IF EXISTS (SELECT 1 FROM providers WHERE user_id=pid) THEN
    UPDATE providers SET status='approved', is_available=true,
           business_name='Demo Electricals',
           base_location=ST_SetSRID(ST_MakePoint(80.6360,7.2910),4326)::geography,
           district_id=v_kandy, rating_avg=4.7, rating_count=64, avg_response_seconds=120
    WHERE user_id=pid;
  ELSE
    INSERT INTO providers (user_id, business_name, status, base_location, district_id, is_available, rating_avg, rating_count, avg_response_seconds)
    VALUES (pid,'Demo Electricals','approved',
            ST_SetSRID(ST_MakePoint(80.6360,7.2910),4326)::geography, v_kandy, true, 4.7, 64, 120);
  END IF;

  -- service area + category + verified docs (idempotent)
  DELETE FROM service_areas WHERE provider_id=pid;
  INSERT INTO service_areas (provider_id, center, radius_meters)
  VALUES (pid, ST_SetSRID(ST_MakePoint(80.6360,7.2910),4326)::geography, 12000);

  INSERT INTO provider_categories (provider_id, category_id)
  VALUES (pid, c_elec) ON CONFLICT DO NOTHING;

  DELETE FROM verifications WHERE provider_id=pid;
  INSERT INTO verifications (provider_id, type, media_url, status, reviewed_at)
  VALUES (pid,'nic','https://mock-cdn.local/demo-nic.jpg','approved',now()),
         (pid,'selfie','https://mock-cdn.local/demo-selfie.jpg','approved',now());
END $$;

SELECT phone, role FROM users WHERE phone IN ('+94770000000','+94776665544','+94772223333') ORDER BY role;
