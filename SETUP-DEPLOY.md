# SkillLink LK — Production Deployment Guide (Month-5 CI/CD)

End-to-end: **containerize → test locally → CI/CD on push → deploy to cloud with HTTPS → monitor**.
This documents the infra in this repo and teaches the flow. Stack: **Next.js web · NestJS API · PostgreSQL/PostGIS**.

---

## The big picture

```
 git push main
      │
      ▼
 GitHub Actions  ──test──▶  typecheck + jest + lint
      │
      ├──build──▶  Docker images (web + api) → GHCR (ghcr.io)
      │
      └──deploy─▶  Render deploy hook
                       │
                       ▼
                 Render: build images → run health check → switch traffic
                 (zero-downtime / blue-green)  →  https://skilllink-*.onrender.com
```

---

## Part 1 — Containerization

Three images, all **multi-stage** (build deps stay out of the final image → small + secure):

| File | What it does |
|---|---|
| `apps/api/Dockerfile` | builder: `npm ci` + `prisma generate` + `nest build`; runner: prod-deps only + `dist` + Prisma client. Runs as non-root `node`. |
| `apps/web/Dockerfile` | builder: `next build` (uses `output:'standalone'`); runner: copies the self-contained server. Tiny image. |
| `docker-compose.yml` | web → api → db (PostGIS) on one network, healthchecks, named volume for DB. |

**`output: 'standalone'`** in `next.config.mjs` is what makes the web image small — Next emits only the files needed to run (`server.js` + traced deps), not the whole `node_modules`.

### Run it locally (do this before deploying)
```bash
docker compose up --build
# web → http://localhost:3000
# api → http://localhost:4000/api/v1/health
```
First boot, enable PostGIS + run migrations against the compose DB:
```bash
docker compose exec db psql -U skilllink -d skilllink -c "CREATE EXTENSION IF NOT EXISTS postgis; CREATE EXTENSION IF NOT EXISTS pgcrypto;"
# then apply db/migrations/*.sql in order (001 → 008)
```

`.dockerignore` in each app excludes `node_modules`, `.next`, `.env`, `.git` — smaller, faster, no secret leakage.

---

## Part 2 — CI/CD (`.github/workflows/deploy.yml`)

Three jobs:
1. **test** (every push + PR): `npm ci` → `prisma generate` → typecheck API & web → `jest` (API) → lint. **The gate** — build only runs if this passes.
2. **build** (main only): builds **both** images via a matrix and pushes to **GHCR** (`ghcr.io/<repo>-api`, `-web`), tagged `latest` + the commit SHA. Uses GitHub Actions cache for speed.
3. **deploy** (main only): POSTs to the **Render deploy hooks** (stored as repo secrets).

### Secrets/vars to set in GitHub (repo → Settings → Secrets and variables → Actions)
- `RENDER_DEPLOY_HOOK_API`, `RENDER_DEPLOY_HOOK_WEB` (secrets) — from each Render service → Settings → Deploy Hook.
- `NEXT_PUBLIC_API_URL` (variable) — your API's public URL + `/api/v1` (baked into the web build).
- `GITHUB_TOKEN` is automatic (used to push to GHCR).

---

## Part 3 — Cloud deployment on Render (HTTPS, free tier)

`render.yaml` is **infrastructure-as-code** — Render reads it and provisions everything.

### Steps
1. Push this repo to GitHub.
2. Render dashboard → **New → Blueprint** → connect the repo → it reads `render.yaml` and creates: `skilllink-db` (Postgres), `skilllink-api`, `skilllink-web`.
3. **One-time DB setup**: Render DB → Shell → `CREATE EXTENSION postgis; CREATE EXTENSION pgcrypto;` then run `db/migrations/*.sql` in order (+ optionally a seed).
4. **API env**: `DATABASE_URL` auto-wired from the DB; `JWT_ACCESS_SECRET`/`PAYMENT_MOCK_SECRET` auto-generated; set `CORS_ORIGIN` to the web URL.
5. **Web build arg**: set `NEXT_PUBLIC_API_URL` = the API's `https://…onrender.com/api/v1` (Docker build arg in the web service settings).
6. Render gives each service **auto-HTTPS** + a `*.onrender.com` URL. Done.

**Health checks** (`healthCheckPath`): Render only routes traffic to a new deploy once `/api/v1/health` returns 200 → that's the **blue-green / zero-downtime** behavior, for free.

> Tip: the API has a **boot guard** — in production it refuses to start unless `JWT_ACCESS_SECRET` is real and `CORS_ORIGIN` isn't `*`. Render's `generateValue` satisfies the secret automatically.

---

## Part 4 — Monitoring & logging

- **Structured logs** (`apps/api/src/common/logger.ts`): Winston, JSON in production (queryable in Render logs / any aggregator), pretty in dev. Wired app-wide via `app.useLogger()`.
- **Health endpoint** `GET /api/v1/health`: returns `status` (healthy/degraded), `uptime`, DB check (PostGIS version), and memory usage — used by Render's health checks and any uptime monitor.
- **Dashboard metrics** (request rate, latency, error rate, CPU/mem): Render's built-in **Metrics** tab shows CPU/memory/response time per service. For request-rate/error-rate + percentiles, point an uptime monitor (e.g. UptimeRobot, free) at `/health`, or add Prometheus later.

For the submission screenshot: open the Render service → **Metrics** tab (shows CPU, memory, response time) and/or the **Logs** tab (structured JSON lines) → screenshot that as `monitoring.png`.

---

## Blue-green deployment

Render's default rollout **is** blue-green: it builds the new version, waits for its health check to pass on a new instance, then swaps traffic — the old instance keeps serving until the new one is healthy, so there's no downtime and an instant rollback if health fails. No extra config beyond `healthCheckPath`.

(For a manual/self-hosted blue-green with docker-compose, you'd run two stacks `blue`/`green` behind a reverse proxy and flip the upstream — out of scope here since Render handles it.)

---

## Quick reference

| Task | Command |
|---|---|
| Run full stack locally | `docker compose up --build` |
| Build one image | `docker build -f apps/api/Dockerfile -t skilllink-api .` |
| API health | `curl localhost:4000/api/v1/health` |
| Trigger CI | `git push origin main` |
| Deploy | automatic on push to `main` (or hit the Render deploy hook) |
