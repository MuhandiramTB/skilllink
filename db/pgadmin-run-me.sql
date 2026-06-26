-- ============================================================================
-- RUN THIS IN pgAdmin — Query Tool
-- How to: pgAdmin (left tree) → Servers → PostgreSQL 18 → Databases → postgres
--         → right-click → Query Tool → paste this → press F5 (or the ▶ button)
-- ============================================================================

-- STEP 1 — Is PostGIS installed on the server?
-- If this returns a row, PostGIS is available and you can skip Stack Builder.
-- If it returns 0 rows, you must install PostGIS first (Stack Builder), then retry.
SELECT name, default_version, installed_version
FROM pg_available_extensions
WHERE name = 'postgis';

-- ----------------------------------------------------------------------------
-- STEP 2 — Create the application database (run only if STEP 1 found postgis).
-- NOTE: CREATE DATABASE cannot run together with other statements in pgAdmin.
--       Run STEP 2 ALONE (select just these lines, then F5), or use
--       right-click Databases → Create → Database… named 'skilllink'.
-- ----------------------------------------------------------------------------
-- CREATE DATABASE skilllink;

-- After the database exists:
--   1. In the left tree, click the new 'skilllink' database.
--   2. Open a NEW Query Tool ON 'skilllink' (not on 'postgres').
--   3. Run db/migrations/001_init.sql      (creates extensions + tables)
--   4. Run db/seeds/001_seed_kandy_and_categories.sql
--   5. Run db/verify.sql                   (confirms it all works)
