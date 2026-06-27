# Deploy SkillLink LK — Render (compute) + Neon (database)

Goal: a live HTTPS URL on the **longest-lasting free** setup. ~20 min. You do the
dashboard clicks; I troubleshoot.

> Why two services: **Render** web services are free forever (they just sleep after
> ~15 min idle, cold-start ~30–60s). **Neon** gives free Postgres with **no expiry**
> (Render's free DB dies after 90 days), and supports PostGIS. So the DB lives on Neon.

---

## Step 1 — Create the database on Neon (free, no expiry)
1. Go to **https://neon.tech** → **Sign up** (use GitHub).
2. **Create project** → name `skilllink`, region nearest you (e.g. Singapore/Mumbai for LK).
3. After it's created, open the **SQL Editor** and run once:
   `CREATE EXTENSION IF NOT EXISTS postgis;` (Neon supports it).
   *(pgcrypto + the rest are created by the migration script in Step 3.)*
4. Click **Connect** → copy the **connection string** (looks like
   `postgresql://user:pass@ep-xxxx.<region>.aws.neon.tech/skilllink?sslmode=require`).
   **Keep this — you'll paste it into Render.** This is your `DATABASE_URL`.

## Step 2 — Sign up at Render + create the Blueprint
1. Go to **https://render.com** → **Get Started** → **Sign in with GitHub** → authorize.
2. Dashboard → **New +** → **Blueprint** → select repo **`MuhandiramTB/skilllink`** → **Connect**.
3. Render reads `render.yaml` and shows 2 services: **skilllink-api**, **skilllink-web**.
4. It will prompt for the env vars marked `sync: false` — set **`DATABASE_URL`** = your Neon
   connection string from Step 1. (You can also leave it and set it in Step 4.)
5. **Apply / Create resources.** The API image builds (npm ci + prisma + nest build — a few min).

> If a build fails, copy the error and paste it to me — we already fixed the likely culprits locally, so it *should* build.

## Step 3 — Load the schema into Neon (one-time)
Neon is empty. Load all tables + seed data:
1. Easiest: **Neon → SQL Editor**, open `submission/render-db-setup.sql` from the repo, copy ALL of it, paste, **Run**.
2. Or from your machine: `psql "<neon-connection-string>" -f submission/render-db-setup.sql`

Verify: in Neon's SQL editor run `\dt` (or `SELECT tablename FROM pg_tables WHERE schemaname='public';`) → ~20 tables (users, bookings, categories…).

## Step 4 — Wire the env values Render needs
After the services have URLs (e.g. `https://skilllink-api.onrender.com`):

1. **skilllink-api → Environment**:
   - `DATABASE_URL` = your Neon connection string (if not set during Step 2).
   - `CORS_ORIGIN` = your web URL, e.g. `https://skilllink-web.onrender.com`.
   - **Save** → it redeploys.
2. **skilllink-web → Settings → Build** → add **Docker build argument**:
   `NEXT_PUBLIC_API_URL` = `https://skilllink-api.onrender.com/api/v1` → **Save** →
   **Manual Deploy → Clear cache & deploy** (NEXT_PUBLIC_* is baked at build time).

## Step 5 — Test it 🎉
- Open `https://skilllink-web.onrender.com` → the landing page (HTTPS!).
- `https://skilllink-api.onrender.com/api/v1/health` → `{ "status":"healthy", ... }`.
- Sign in: phone `+94770000000`, any 6-digit code → admin dashboard.

## Step 6 — (Optional) auto-deploy on every push
1. **skilllink-api** → Settings → **Deploy Hook** → copy URL.
2. GitHub repo → **Settings → Secrets and variables → Actions → New repository secret**:
   - `RENDER_DEPLOY_HOOK_API` = the API hook URL
   - `RENDER_DEPLOY_HOOK_WEB` = the web service's hook URL
3. Now every push to `main` → CI tests → builds → triggers Render → zero-downtime rollout.

## Step 7 — Submission artifacts
- Screenshot **skilllink-api → Metrics** tab (CPU/mem/response time) **or Logs** tab (structured JSON) → save as `monitoring.png`.
- Put the real URLs into `submission/month5-deployment-url.md`.

---

## Common gotchas
- **API "degraded"/500** → Neon DB empty or `DATABASE_URL` wrong → run Step 3 / check Step 4.1.
- **Neon connection fails** → ensure the string ends with `?sslmode=require` (Neon needs SSL).
- **Web shows API errors** → `NEXT_PUBLIC_API_URL` build arg missing/wrong → Step 4.2 (must clear cache & redeploy).
- **CORS errors in browser console** → `CORS_ORIGIN` on the API ≠ the web URL → Step 4.1.
- **API won't start** → check Logs; the boot-guard needs `JWT_ACCESS_SECRET` (render.yaml auto-generates it) and `CORS_ORIGIN` ≠ `*`.
