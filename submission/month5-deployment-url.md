# Month 5 — Production Deployment URL

**Project:** SkillLink LK (Next.js + NestJS + PostgreSQL/PostGIS)

## Live production URLs (HTTPS)
> Stack: **Vercel** (web) + **Azure Container Apps** (API) + **Neon** (Postgres).
> Fill these in after deploying (see `AZURE-STEPS.md`).

- **API (backend):**  https://skilllink-api.whitesand-ba9ed9eb.southeastasia.azurecontainerapps.io/api/v1  ✅ LIVE
- **Health check:**   https://skilllink-api.whitesand-ba9ed9eb.southeastasia.azurecontainerapps.io/api/v1/health  ✅ healthy
- **Web (frontend):** https://skilllink-web-dusky.vercel.app  ✅ LIVE

## Demo admin login
- Phone: `+94770000000` · OTP: any 6 digits (dev mock verifier)

## Infrastructure artifacts (in this repo)
| Deliverable | File |
|---|---|
| Dockerfiles | `apps/api/Dockerfile`, `apps/web/Dockerfile` |
| Docker Compose (multi-container) | `docker-compose.yml` |
| CI/CD workflow | `.github/workflows/deploy.yml` |
| API deploy script (Azure) | `deploy-api.ps1` |
| Prod DB schema/migrations | `db/migrations/*.sql`, `submission/render-db-setup.sql` |
| Logging | `apps/api/src/common/logger.ts` |
| Health check | `apps/api/src/health/health.controller.ts` |
| Setup guide | `AZURE-STEPS.md` |

## Notes
- **Stack:** Vercel (web) + Azure Container Apps (API) + Neon (PostgreSQL/PostGIS). HTTPS is automatic on both Vercel (`*.vercel.app`) and Azure Container Apps (`*.azurecontainerapps.io`).
- **Blue-green / zero-downtime:** Azure Container Apps keeps the old revision serving until the new revision passes its health check, then shifts 100% traffic.
- **Logs & metrics:** structured JSON logs via the Azure Container Apps Log Analytics workspace; metrics in the Azure portal. Web logs/metrics in the Vercel dashboard.
- **Redeploy:** push to `main` → Vercel auto-deploys the web; run `./deploy-api.ps1` to roll the API. Apply any new `db/migrations/0NN_*.sql` (idempotent) in the Neon SQL editor.
