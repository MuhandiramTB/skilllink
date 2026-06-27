# Month 5 — Production Deployment URL

**Project:** SkillLink LK (Next.js + NestJS + PostgreSQL/PostGIS)

## Live production URLs (HTTPS)
> Fill these in after running the Render Blueprint (see `SETUP-DEPLOY.md`).

- **Web (frontend):** https://skilllink-web.onrender.com
- **API (backend):**  https://skilllink-api.onrender.com/api/v1
- **Health check:**   https://skilllink-api.onrender.com/api/v1/health

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
