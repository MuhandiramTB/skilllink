-- ============================================================================
-- Create the database + application role. Run as 'postgres' on the 'postgres' db.
-- (CREATE DATABASE cannot run inside a transaction / multi-statement block in
--  some clients; if your tool wraps it, run these two lines separately.)
-- ============================================================================

-- Application role (least privilege). Change the password before production.
DO $$
BEGIN
   IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'skilllink_app') THEN
      CREATE ROLE skilllink_app LOGIN PASSWORD 'change_me_in_env';
   END IF;
END$$;

-- Database (owned by postgres; app role granted below after schema is built)
SELECT 'CREATE DATABASE skilllink OWNER postgres'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'skilllink')\gexec

-- Grant connect; table grants are applied after 001_init.sql creates them.
GRANT CONNECT ON DATABASE skilllink TO skilllink_app;
