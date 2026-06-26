-- ============================================================================
-- Verification — run after migration + seed to confirm everything works.
-- ============================================================================

\echo '=== PostGIS version ==='
SELECT postgis_full_version();

\echo '=== Active districts (v1 should be Kandy only) ==='
SELECT name_en, is_active FROM districts ORDER BY is_active DESC, name_en;

\echo '=== Category tree (top-level + solar sub-categories) ==='
SELECT c.key,
       COALESCE(p.key, '(top-level)') AS parent
FROM categories c
LEFT JOIN categories p ON p.id = c.parent_id
ORDER BY p.sort_order NULLS FIRST, c.sort_order;

\echo '=== Geo sanity check: distance from Kandy centre to Colombo centre (km) ==='
SELECT ROUND(
         (ST_Distance(
           (SELECT center FROM districts WHERE name_en = 'Kandy'),
           (SELECT center FROM districts WHERE name_en = 'Colombo')
         ) / 1000.0)::numeric, 1
       ) AS kandy_to_colombo_km;   -- expect ~94 km

\echo '=== Sample matching query shape (no providers yet, returns 0 rows) ==='
-- Demonstrates the real matching SQL the app will use.
WITH customer AS (
  SELECT ST_SetSRID(ST_MakePoint(80.6350, 7.2906),4326)::geography AS pt  -- Kandy
)
SELECT p.user_id,
       ROUND(ST_Distance(p.base_location, customer.pt)::numeric, 0) AS distance_m,
       p.rating_avg
FROM providers p
JOIN service_areas sa ON sa.provider_id = p.user_id
JOIN provider_categories pc ON pc.provider_id = p.user_id
JOIN categories cat ON cat.id = pc.category_id
CROSS JOIN customer
WHERE p.status = 'approved'
  AND p.is_available = true
  AND cat.key = 'ac_tech'
  AND ST_DWithin(sa.center, customer.pt, sa.radius_meters)
ORDER BY distance_m
LIMIT 20;
