# Apps — running the SkillLink LK stack locally

Monorepo with two workspaces:
- `apps/api` — NestJS API (REST, `/api/v1`), Prisma → PostgreSQL/PostGIS
- `apps/web` — Next.js PWA, trilingual (si/ta/en) via next-intl

## Prerequisites
- Node 20+ (you have v22)
- PostgreSQL 18 + PostGIS, with the `skilllink` database built & seeded
  (see [../db/README.md](../db/README.md))

## One-time setup
```powershell
# from repo root
npm install                       # installs both workspaces
npm run prisma:generate           # generates Prisma client for the API
```
Copy env templates if needed:
- `apps/api/.env`        ← from `.env.example` (DATABASE_URL etc.)
- `apps/web/.env.local`  ← `NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1`

## Run (two terminals)
```powershell
# Terminal 1 — API on http://localhost:4000
npm run dev:api

# Terminal 2 — Web on http://localhost:3000
npm run dev:web
```

## Verify the API
```
GET http://localhost:4000/api/v1/health       -> { data: { status: "ok", postgis: "3.6.2" }, error: null }
GET http://localhost:4000/api/v1/categories    -> trilingual category tree (incl. Solar)
GET http://localhost:4000/api/v1/match?categoryKey=electrician&lat=7.2906&lng=80.6350
                                                -> ranked Kandy providers
```

## Verify the web
Open http://localhost:3000 → redirects to `/en`. Use the language selector to switch
to සිංහල / தமிழ். The category grid is loaded live from the API.

## What's built (Sprint 0)
- ✅ Monorepo + workspaces + CI
- ✅ API: envelope, health, categories, matching (geo via PostGIS)
- ✅ Web: trilingual shell, language switcher, category grid from API
- ⏭️ Next (Sprint 1): Authentication & OTP — spec at `.kiro/specs/01-authentication-otp/`
