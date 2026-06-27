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
| Docker Compose | `docker-compose.yml` |
| CI/CD workflow | `.github/workflows/deploy.yml` |
| Cloud deploy (IaC) | `render.yaml` |
| Logging | `apps/api/src/common/logger.ts` |
| Health check | `apps/api/src/health/health.controller.ts` |
| Setup guide | `SETUP-DEPLOY.md` |

## Notes
- HTTPS is automatic on Render (`*.onrender.com`).
- Blue-green / zero-downtime via Render health-check-gated rollouts.
- Logs are structured JSON (Render Logs tab); metrics in the Render Metrics tab.
