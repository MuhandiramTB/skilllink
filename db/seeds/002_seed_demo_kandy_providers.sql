-- ============================================================================
-- DEMO seed — sample Kandy providers + a customer, so the matching query
-- returns real ranked results. Safe to re-run (cleans its own demo rows first).
-- Coordinates are real points around Kandy town (lng, lat).
-- ============================================================================

-- Clean previous demo rows (idempotent) -------------------------------------
DELETE FROM provider_categories WHERE provider_id IN (SELECT id FROM users WHERE phone LIKE '+9477DEMO%');
DELETE FROM service_areas       WHERE provider_id IN (SELECT id FROM users WHERE phone LIKE '+9477DEMO%');
DELETE FROM providers           WHERE user_id   IN (SELECT id FROM users WHERE phone LIKE '+9477DEMO%');
DELETE FROM customer_profiles   WHERE user_id   IN (SELECT id FROM users WHERE phone LIKE '+9477DEMO%');
DELETE FROM users               WHERE phone LIKE '+9477DEMO%';

-- Helper values --------------------------------------------------------------
-- Kandy district id + a couple of category ids
DO $$
DECLARE
  v_kandy   uuid := (SELECT id FROM districts  WHERE name_en = 'Kandy');
  v_elec    uuid := (SELECT id FROM categories WHERE key = 'electrician');
  v_ac      uuid := (SELECT id FROM categories WHERE key = 'ac_tech');
  uid uuid;
BEGIN
  -- ----- Provider 1: Sunil — electrician, ~0.8 km from town, great rating -----
  INSERT INTO users (phone, role, language, district_id)
  VALUES ('+9477DEMO001', 'provider', 'si', v_kandy) RETURNING id INTO uid;
  INSERT INTO providers (user_id, business_name, status, base_location, district_id,
                         is_available, rating_avg, rating_count, avg_response_seconds)
  VALUES (uid, 'Sunil Electricals', 'approved',
          ST_SetSRID(ST_MakePoint(80.6420, 7.2950),4326)::geography, v_kandy,
          true, 4.8, 120, 90);
  INSERT INTO service_areas (provider_id, center, radius_meters)
  VALUES (uid, ST_SetSRID(ST_MakePoint(80.6420, 7.2950),4326)::geography, 10000);
  INSERT INTO provider_categories VALUES (uid, v_elec);

  -- ----- Provider 2: Kamal — electrician, ~3 km away, good rating, slower -----
  INSERT INTO users (phone, role, language, district_id)
  VALUES ('+9477DEMO002', 'provider', 'ta', v_kandy) RETURNING id INTO uid;
  INSERT INTO providers (user_id, business_name, status, base_location, district_id,
                         is_available, rating_avg, rating_count, avg_response_seconds)
  VALUES (uid, 'Kamal Power Solutions', 'approved',
          ST_SetSRID(ST_MakePoint(80.6650, 7.2700),4326)::geography, v_kandy,
          true, 4.3, 45, 300);
  INSERT INTO service_areas (provider_id, center, radius_meters)
  VALUES (uid, ST_SetSRID(ST_MakePoint(80.6650, 7.2700),4326)::geography, 8000);
  INSERT INTO provider_categories VALUES (uid, v_elec);

  -- ----- Provider 3: Nuwan — electrician + AC, ~6 km away --------------------
  INSERT INTO users (phone, role, language, district_id)
  VALUES ('+9477DEMO003', 'provider', 'en', v_kandy) RETURNING id INTO uid;
  INSERT INTO providers (user_id, business_name, status, base_location, district_id,
                         is_available, rating_avg, rating_count, avg_response_seconds)
  VALUES (uid, 'Nuwan Electric & Cooling', 'approved',
          ST_SetSRID(ST_MakePoint(80.6000, 7.2500),4326)::geography, v_kandy,
          true, 4.6, 80, 150);
  INSERT INTO service_areas (provider_id, center, radius_meters)
  VALUES (uid, ST_SetSRID(ST_MakePoint(80.6000, 7.2500),4326)::geography, 15000);
  INSERT INTO provider_categories VALUES (uid, v_elec), (uid, v_ac);

  -- ----- Provider 4: Ravi — electrician but NOT available (should be excluded) -
  INSERT INTO users (phone, role, language, district_id)
  VALUES ('+9477DEMO004', 'provider', 'si', v_kandy) RETURNING id INTO uid;
  INSERT INTO providers (user_id, business_name, status, base_location, district_id,
                         is_available, rating_avg, rating_count, avg_response_seconds)
  VALUES (uid, 'Ravi (Offline)', 'approved',
          ST_SetSRID(ST_MakePoint(80.6430, 7.2960),4326)::geography, v_kandy,
          false, 4.9, 200, 60);   -- is_available = false
  INSERT INTO service_areas (provider_id, center, radius_meters)
  VALUES (uid, ST_SetSRID(ST_MakePoint(80.6430, 7.2960),4326)::geography, 10000);
  INSERT INTO provider_categories VALUES (uid, v_elec);

  -- ----- Provider 5: Pradeep — electrician but PENDING (should be excluded) ---
  INSERT INTO users (phone, role, language, district_id)
  VALUES ('+9477DEMO005', 'provider', 'si', v_kandy) RETURNING id INTO uid;
  INSERT INTO providers (user_id, business_name, status, base_location, district_id,
                         is_available, rating_avg, rating_count, avg_response_seconds)
  VALUES (uid, 'Pradeep (Unverified)', 'pending',
          ST_SetSRID(ST_MakePoint(80.6410, 7.2940),4326)::geography, v_kandy,
          true, 0.0, 0, 0);       -- status = pending
  INSERT INTO service_areas (provider_id, center, radius_meters)
  VALUES (uid, ST_SetSRID(ST_MakePoint(80.6410, 7.2940),4326)::geography, 10000);
  INSERT INTO provider_categories VALUES (uid, v_elec);

  -- ----- A demo customer in Kandy town --------------------------------------
  INSERT INTO users (phone, role, language, district_id)
  VALUES ('+9477DEMO900', 'customer', 'en', v_kandy) RETURNING id INTO uid;
  INSERT INTO customer_profiles (user_id, full_name, default_location, default_address)
  VALUES (uid, 'Nimal Perera',
          ST_SetSRID(ST_MakePoint(80.6350, 7.2906),4326)::geography, 'Kandy Town');
END $$;
