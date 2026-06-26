-- ============================================================================
-- Realistic Kandy dataset — providers, customers, bookings, payments, reviews.
-- Makes analytics / bookings / jobs pages look lifelike. Idempotent: clears its
-- own rows (phones in the +9477SEED range) before re-inserting.
-- All providers are APPROVED + available so they appear in matching.
-- ============================================================================

-- ---- cleanup previous seed run (FK-safe order) ----------------------------
DELETE FROM reviews            WHERE customer_id IN (SELECT id FROM users WHERE phone LIKE '+9477SEED%');
DELETE FROM payments           WHERE booking_id IN (SELECT id FROM bookings WHERE customer_id IN (SELECT id FROM users WHERE phone LIKE '+9477SEED%'));
DELETE FROM messages           WHERE conversation_id IN (SELECT c.id FROM conversations c JOIN bookings b ON b.id=c.booking_id WHERE b.customer_id IN (SELECT id FROM users WHERE phone LIKE '+9477SEED%'));
DELETE FROM conversations      WHERE booking_id IN (SELECT id FROM bookings WHERE customer_id IN (SELECT id FROM users WHERE phone LIKE '+9477SEED%'));
DELETE FROM bookings           WHERE customer_id IN (SELECT id FROM users WHERE phone LIKE '+9477SEED%');
DELETE FROM verifications      WHERE provider_id IN (SELECT id FROM users WHERE phone LIKE '+9477SEED%');
DELETE FROM service_areas      WHERE provider_id IN (SELECT id FROM users WHERE phone LIKE '+9477SEED%');
DELETE FROM provider_categories WHERE provider_id IN (SELECT id FROM users WHERE phone LIKE '+9477SEED%');
DELETE FROM providers          WHERE user_id   IN (SELECT id FROM users WHERE phone LIKE '+9477SEED%');
DELETE FROM customer_profiles  WHERE user_id   IN (SELECT id FROM users WHERE phone LIKE '+9477SEED%');
DELETE FROM users              WHERE phone LIKE '+9477SEED%';

DO $$
DECLARE
  v_kandy uuid := (SELECT id FROM districts WHERE name_en = 'Kandy');
  -- category ids
  c_elec uuid := (SELECT id FROM categories WHERE key='electrician');
  c_plum uuid := (SELECT id FROM categories WHERE key='plumber');
  c_ac   uuid := (SELECT id FROM categories WHERE key='ac_tech');
  c_carp uuid := (SELECT id FROM categories WHERE key='carpenter');
  c_paint uuid := (SELECT id FROM categories WHERE key='painter');
  c_solar uuid := (SELECT id FROM categories WHERE key='solar.installation');

  -- working vars
  pid uuid; cid uuid; bid uuid; convid uuid;
  -- provider definitions: phone, name, lat, lng, rating, count, resp_sec, category
  provs text[][] := ARRAY[
    ['+9477SEED01','Bandara Electricals','7.2950','80.6420','4.8','142','90'],
    ['+9477SEED02','Perera Plumbing Services','7.2880','80.6360','4.6','98','180'],
    ['+9477SEED03','Cool Air AC Solutions','7.3010','80.6300','4.7','75','120'],
    ['+9477SEED04','Wijesinghe Carpentry','7.2790','80.6450','4.5','60','240'],
    ['+9477SEED05','Rajapaksa Painters','7.2930','80.6510','4.3','41','300'],
    ['+9477SEED06','Lanka Solar Tech','7.2860','80.6280','4.9','53','75'],
    ['+9477SEED07','Senanayake Electric','7.3050','80.6390','4.4','88','210'],
    ['+9477SEED08','Kandy Quick Plumbers','7.2820','80.6470','4.2','37','280']
  ];
  cats uuid[];
  i int;
BEGIN
  -- map providers to categories in order
  cats := ARRAY[c_elec,c_plum,c_ac,c_carp,c_paint,c_solar,c_elec,c_plum];

  FOR i IN 1..array_length(provs,1) LOOP
    INSERT INTO users (phone, role, language, district_id, firebase_uid)
    VALUES (provs[i][1],'provider', (ARRAY['si','ta','en'])[1+(i%3)]::app_language, v_kandy, 'mock-'||provs[i][1])
    RETURNING id INTO pid;

    INSERT INTO providers (user_id, business_name, status, base_location, district_id, is_available, rating_avg, rating_count, avg_response_seconds)
    VALUES (pid, provs[i][2], 'approved',
            ST_SetSRID(ST_MakePoint(provs[i][4]::float8, provs[i][3]::float8),4326)::geography,
            v_kandy, true, provs[i][5]::numeric, provs[i][6]::int, provs[i][7]::int);

    INSERT INTO service_areas (provider_id, center, radius_meters)
    VALUES (pid, ST_SetSRID(ST_MakePoint(provs[i][4]::float8, provs[i][3]::float8),4326)::geography, 12000);

    INSERT INTO provider_categories VALUES (pid, cats[i]);

    INSERT INTO verifications (provider_id, type, media_url, status, reviewed_at)
    VALUES (pid,'nic','https://mock-cdn.local/nic.jpg','approved', now()),
           (pid,'selfie','https://mock-cdn.local/selfie.jpg','approved', now());
  END LOOP;

  -- One pending provider (shows in verification queue)
  INSERT INTO users (phone, role, language, district_id, firebase_uid)
  VALUES ('+9477SEED09','provider','si',v_kandy,'mock-+9477SEED09') RETURNING id INTO pid;
  INSERT INTO providers (user_id, business_name, status, base_location, district_id, is_available)
  VALUES (pid,'Newcomer Services (pending)','pending',
          ST_SetSRID(ST_MakePoint(80.6400,7.2900),4326)::geography, v_kandy, false);
  INSERT INTO provider_categories VALUES (pid, c_elec);
  INSERT INTO verifications (provider_id, type, media_url, status)
  VALUES (pid,'nic','https://mock-cdn.local/nic9.jpg','pending');

  -- ---- customers + bookings in varied states -------------------------------
  -- customer 1: a completed+paid+reviewed AC job
  INSERT INTO users (phone, role, language, district_id, firebase_uid)
  VALUES ('+9477SEED20','customer','si',v_kandy,'mock-+9477SEED20') RETURNING id INTO cid;
  INSERT INTO customer_profiles (user_id, full_name, default_location, default_address)
  VALUES (cid,'Nimal Bandara', ST_SetSRID(ST_MakePoint(80.6350,7.2906),4326)::geography,'Kandy');
  SELECT user_id INTO pid FROM providers WHERE business_name='Cool Air AC Solutions';
  INSERT INTO bookings (customer_id, provider_id, category_id, district_id, description, location, status, price_cents, commission_cents)
  VALUES (cid,pid,c_ac,v_kandy,'AC not cooling, needs gas refill',
          ST_SetSRID(ST_MakePoint(80.6350,7.2906),4326)::geography,'completed',850000,102000) RETURNING id INTO bid;
  INSERT INTO payments (booking_id, provider, amount_cents, commission_cents, status, gateway_ref, idempotency_key)
  VALUES (bid,'payhere',850000,102000,'paid','seed_pay_1','seed_idem_1');
  INSERT INTO reviews (booking_id, customer_id, provider_id, rating, comment, provider_response)
  VALUES (bid,cid,pid,5,'Very professional, fixed it quickly.','Thank you!');
  INSERT INTO conversations (booking_id) VALUES (bid) RETURNING id INTO convid;
  INSERT INTO messages (conversation_id, sender_id, body) VALUES
    (convid,cid,'When can you come?'),(convid,pid,'I can be there by 3pm today.');

  -- customer 2: a completed+paid electrician job (no review yet)
  INSERT INTO users (phone, role, language, district_id, firebase_uid)
  VALUES ('+9477SEED21','customer','en',v_kandy,'mock-+9477SEED21') RETURNING id INTO cid;
  INSERT INTO customer_profiles (user_id, full_name, default_location)
  VALUES (cid,'Tharindu Silva', ST_SetSRID(ST_MakePoint(80.6300,7.2950),4326)::geography);
  SELECT user_id INTO pid FROM providers WHERE business_name='Bandara Electricals';
  INSERT INTO bookings (customer_id, provider_id, category_id, district_id, description, location, status, price_cents, commission_cents)
  VALUES (cid,pid,c_elec,v_kandy,'Power trip in kitchen circuit',
          ST_SetSRID(ST_MakePoint(80.6300,7.2950),4326)::geography,'completed',420000,50400) RETURNING id INTO bid;
  INSERT INTO payments (booking_id, provider, amount_cents, commission_cents, status, gateway_ref, idempotency_key)
  VALUES (bid,'payhere',420000,50400,'paid','seed_pay_2','seed_idem_2');

  -- customer 3: an in-progress plumbing job
  INSERT INTO users (phone, role, language, district_id, firebase_uid)
  VALUES ('+9477SEED22','customer','ta',v_kandy,'mock-+9477SEED22') RETURNING id INTO cid;
  INSERT INTO customer_profiles (user_id, full_name, default_location)
  VALUES (cid,'Fathima Razeen', ST_SetSRID(ST_MakePoint(80.6420,7.2880),4326)::geography);
  SELECT user_id INTO pid FROM providers WHERE business_name='Perera Plumbing Services';
  INSERT INTO bookings (customer_id, provider_id, category_id, district_id, description, location, status)
  VALUES (cid,pid,c_plum,v_kandy,'Leaking pipe under sink',
          ST_SetSRID(ST_MakePoint(80.6420,7.2880),4326)::geography,'in_progress') RETURNING id INTO bid;
  INSERT INTO conversations (booking_id) VALUES (bid) RETURNING id INTO convid;
  INSERT INTO messages (conversation_id, sender_id, body) VALUES (convid,cid,'It is getting worse, please hurry');

  -- customer 4: a matched (awaiting provider accept) solar job
  INSERT INTO users (phone, role, language, district_id, firebase_uid)
  VALUES ('+9477SEED23','customer','en',v_kandy,'mock-+9477SEED23') RETURNING id INTO cid;
  INSERT INTO customer_profiles (user_id, full_name, default_location)
  VALUES (cid,'Kasun Jayawardena', ST_SetSRID(ST_MakePoint(80.6280,7.2860),4326)::geography);
  SELECT user_id INTO pid FROM providers WHERE business_name='Lanka Solar Tech';
  INSERT INTO bookings (customer_id, provider_id, category_id, district_id, description, location, status, solar_specs)
  VALUES (cid,pid,c_solar,v_kandy,'Install 5kW rooftop solar',
          ST_SetSRID(ST_MakePoint(80.6280,7.2860),4326)::geography,'matched',
          '{"capacity_kw":5,"panel_brand":"Jinko","inverter_brand":"Huawei"}'::jsonb) RETURNING id INTO bid;

  -- customer 5: a fresh requested job (no provider yet) + a cancelled one
  INSERT INTO users (phone, role, language, district_id, firebase_uid)
  VALUES ('+9477SEED24','customer','si',v_kandy,'mock-+9477SEED24') RETURNING id INTO cid;
  INSERT INTO customer_profiles (user_id, full_name, default_location)
  VALUES (cid,'Dilani Wickrama', ST_SetSRID(ST_MakePoint(80.6360,7.2910),4326)::geography);
  INSERT INTO bookings (customer_id, category_id, district_id, description, location, status)
  VALUES (cid,c_paint,v_kandy,'Paint living room',
          ST_SetSRID(ST_MakePoint(80.6360,7.2910),4326)::geography,'requested');
  INSERT INTO bookings (customer_id, category_id, district_id, description, location, status)
  VALUES (cid,c_carp,v_kandy,'Fix wardrobe door (changed my mind)',
          ST_SetSRID(ST_MakePoint(80.6360,7.2910),4326)::geography,'cancelled');
END $$;

-- quick summary
SELECT 'providers' AS kind, count(*) FROM users WHERE phone LIKE '+9477SEED%' AND role='provider'
UNION ALL SELECT 'customers', count(*) FROM users WHERE phone LIKE '+9477SEED%' AND role='customer'
UNION ALL SELECT 'bookings', count(*) FROM bookings WHERE customer_id IN (SELECT id FROM users WHERE phone LIKE '+9477SEED%')
UNION ALL SELECT 'payments(paid)', count(*) FROM payments WHERE status='paid' AND gateway_ref LIKE 'seed_%'
UNION ALL SELECT 'reviews', count(*) FROM reviews WHERE customer_id IN (SELECT id FROM users WHERE phone LIKE '+9477SEED%');
