# Database — SkillLink LK (v1: Kandy district)

PostgreSQL 18 + PostGIS 3.x. This folder holds the raw SQL to create the database,
schema, and seed data. (The NestJS app will later manage migrations via Prisma; these
scripts mirror that schema and let us stand the DB up immediately.)

## Prerequisite: install PostGIS (one time)
PostGIS is NOT bundled with PostgreSQL. Install it via:
**Start menu → PostgreSQL 18 → Application Stack Builder → Spatial Extensions → PostGIS Bundle.**
(During the PostGIS installer, uncheck "Create spatial database" — we make our own below.)

## Run order
```powershell
$env:PGPASSWORD = "<your postgres password>"
$psql = "C:\Program Files\PostgreSQL\18\bin\psql.exe"

# 1. Create the database + app role (run once, as postgres on the default 'postgres' db)
& $psql -U postgres -d postgres -f db/migrations/000_create_database.sql

# 2. Create schema (extensions, tables, indexes) in the new DB
& $psql -U postgres -d skilllink -f db/migrations/001_init.sql

# 3. Seed Kandy district + categories (incl. Solar)
& $psql -U postgres -d skilllink -f db/seeds/001_seed_kandy_and_categories.sql

# 4. Verify
& $psql -U postgres -d skilllink -f db/verify.sql
```

## What gets created
- Database `skilllink`, app role `skilllink_app`.
- Extensions: `postgis`, `pgcrypto`.
- All tables from [docs/04-architecture/database-design.md](../docs/04-architecture/database-design.md) **plus** the `districts` table for v1 geo-phasing.
- Seed: **Kandy active**, Colombo/Gampaha inactive; 12 trades + 7 Solar sub-categories (trilingual names).

## v1 → nationwide expansion
No schema change needed. To launch a new district:
```sql
UPDATE districts SET is_active = true, launched_at = now() WHERE name_en = 'Gampaha';
```
Then onboard providers there. The matching query already filters by location + radius.

## Connection string (for apps/api .env)
```
DATABASE_URL="postgresql://skilllink_app:<password>@localhost:5432/skilllink"
```
