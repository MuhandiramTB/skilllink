# Deploy SkillLink LK — Koyeb (API) + Vercel (Web) + Neon (DB)

The **all-free, no-credit-card** path. ~25 min. You do the dashboard clicks; I troubleshoot.

```
  Browser ──▶ Vercel (Next.js web)  ──API calls──▶  Koyeb (NestJS API)  ──▶  Neon (Postgres)
              https://…vercel.app                    https://…koyeb.app           (already set up)
```
All three: free tier, HTTPS, **no card required**.

---

## Step 0 — Generate two secrets (you'll paste them into Koyeb)
Run locally (or use any random string generator):
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"   # JWT_ACCESS_SECRET
node -e "console.log(require('crypto').randomBytes(24).toString('hex'))"   # PAYMENT_MOCK_SECRET
```
Keep both. You already have the **Neon connection string** (Step 1 earlier) — keep that too.

## Step 1 — Load the schema into Neon (one-time)
1. Neon → **SQL Editor**.
2. Open `submission/render-db-setup.sql` from the repo, copy ALL, paste, **Run**.
   (Runs migrations 001–008 + seeds categories/districts/admin. PostGIS you already enabled.)
3. Verify: `SELECT tablename FROM pg_tables WHERE schemaname='public';` → ~20 tables.

## Step 2 — Deploy the API to Koyeb
1. Go to **https://koyeb.com** → **Sign up with GitHub** (no card).
2. **Create Service** → **GitHub** → pick repo **`MuhandiramTB/skilllink`**, branch `main`.
3. **Build:** choose **Dockerfile**, set the Dockerfile path to **`apps/api/Dockerfile`**
   (build context = repo root — leave it default `/`).
4. **Instance:** Free. **Region:** Singapore (`sin`) or Frankfurt.
5. **Port / health check:** port **4000**, health path **`/api/v1/health`**.
6. **Environment variables** (add as **Secrets** where noted):
   - `NODE_ENV` = `production`
   - `API_PORT` = `4000`
   - `AUTH_VERIFIER` = `mock`
   - `DATABASE_URL` = *(secret)* your Neon string (ends with `?sslmode=require`)
   - `JWT_ACCESS_SECRET` = *(secret)* the hex from Step 0
   - `PAYMENT_MOCK_SECRET` = *(secret)* the other hex
   - `CORS_ORIGIN` = leave blank for now (set after Vercel gives a URL)
7. **Deploy.** First build takes a few min (npm ci + prisma + nest build).
8. When healthy, note the URL, e.g. `https://skilllink-api-<you>.koyeb.app`.
   Test: open `https://…koyeb.app/api/v1/health` → `{ "status":"healthy", … }`.

> Build fails? Paste the log to me — we already fixed the usual culprits (jose, Prisma/OpenSSL).

## Step 3 — Deploy the Web to Vercel
1. Go to **https://vercel.com** → **Sign up with GitHub** (no card).
2. **Add New → Project** → import **`MuhandiramTB/skilllink`**.
3. **IMPORTANT — Root Directory:** click **Edit** and set it to **`apps/web`**
   (so Vercel builds the Next.js app, not the monorepo root). Framework auto-detects as Next.js.
4. **Environment Variables** → add:
   - `NEXT_PUBLIC_API_URL` = `https://skilllink-api-<you>.koyeb.app/api/v1`  (your Koyeb URL + `/api/v1`)
5. **Deploy.** Vercel builds + gives `https://skilllink-<you>.vercel.app`.

## Step 4 — Connect the two (CORS)
1. Back in **Koyeb → skilllink-api → Environment** → set
   `CORS_ORIGIN` = your Vercel URL `https://skilllink-<you>.vercel.app` → **Save/Redeploy**.
   (The API's boot-guard needs a real origin in production.)

## Step 5 — Test it 🎉
- Open `https://skilllink-<you>.vercel.app` → landing page (HTTPS).
- Sign in: phone `+94770000000`, any 6-digit code → admin dashboard.
- API health: `https://…koyeb.app/api/v1/health`.

## Step 6 — Submission artifacts
- Screenshot **Koyeb → Metrics/Logs** (CPU/mem + structured JSON logs) → `monitoring.png`.
- Fill the real URLs into `submission/month5-deployment-url.md`.

---

## Gotchas
- **Browser CORS error** → `CORS_ORIGIN` on Koyeb ≠ your exact Vercel URL (Step 4).
- **Web shows API errors** → `NEXT_PUBLIC_API_URL` wrong/missing → fix in Vercel → redeploy.
- **API "degraded"/DB error** → Neon string wrong or schema not loaded → Steps 1 + 2.6.
- **Neon connect fails** → string must end with `?sslmode=require`.
- **CI/CD note:** the GitHub Actions pipeline still builds + pushes images to GHCR. The deploy
  job's Render hooks won't fire (we're on Koyeb now) — Koyeb auto-redeploys on push to `main`
  by default, so pushes still trigger a deploy.
