# System Architecture — SkillLink LK

**BMAD Agent:** `architect` · **Owner:** Software Architect
**Inputs:** [PRD](../02-product/PRD.md), [SRS](../03-business-analysis/SRS.md)
**Consumed by:** Dev, SM, QA · **Version:** 1.0

---

## 1. Architecture style
**Modular monolith** for the MVP (one deployable NestJS API split into clear modules),
with a Next.js PWA frontend and PostgreSQL/PostGIS. This minimizes ops overhead now
while keeping clean seams so high-load modules (matching, chat) can be extracted into
services later. Rationale: [ADR-0001](decisions/0001-modular-monolith.md).

## 2. High-level diagram
```
                 ┌─────────────────────────────────────────────┐
                 │            Clients (PWA, one codebase)        │
                 │   Customer UI │ Provider UI │ Admin Console   │
                 │      Next.js (App Router) + Tailwind + i18n    │
                 └───────────────┬───────────────────────────────┘
                                 │ HTTPS (REST) + WSS (Socket.IO)
                                 ▼
                 ┌─────────────────────────────────────────────┐
                 │              API Gateway / NestJS             │
                 │  Auth │ Users │ Providers │ Catalog │ Booking │
                 │  Matching │ Chat │ Payments │ Reviews │ Admin │
                 └───┬───────┬───────┬───────┬───────┬───────────┘
                     │       │       │       │       │
        ┌────────────▼─┐ ┌───▼────┐ ┌▼─────┐ ┌▼──────┐ ┌▼─────────┐
        │ PostgreSQL   │ │ Redis  │ │Cloud │ │Firebase│ │ Payment  │
        │  + PostGIS   │ │(cache, │ │inary │ │ Auth   │ │ PayHere/ │
        │  (Prisma)    │ │ queue) │ │media │ │ (OTP)  │ │ Genie    │
        └──────────────┘ └────────┘ └──────┘ └────────┘ └──────────┘
                     │
              ┌──────▼──────┐   ┌─────────────┐   ┌─────────────┐
              │ Google Maps │   │ FCM (push)  │   │ SMS / Mask  │
              └─────────────┘   └─────────────┘   └─────────────┘
```

## 3. Modules (bounded contexts)
| Module | Responsibility | Key tables |
|--------|----------------|-----------|
| Auth | OTP login, JWT issue/refresh, sessions | users, sessions |
| Users | Customer profiles, language pref | users, customer_profiles |
| Providers | Onboarding, verification, availability, service areas | providers, verifications, service_areas |
| Catalog | Categories & sub-categories (incl. Solar) | categories |
| Booking | Booking lifecycle, media, status | bookings, booking_media |
| Matching | Geo + quality ranking | (reads providers, service_areas) |
| Chat | Masked messaging, presence | conversations, messages |
| Payments | Charge, commission, payouts, earnings | payments, payouts |
| Reviews | Ratings & responses | reviews |
| Admin | Verification queue, disputes, analytics, fraud | disputes, audit_log |

## 4. Key cross-cutting decisions
- **Auth flow:** Firebase verifies OTP → client gets Firebase ID token → API verifies it → issues our JWT (access 15m + refresh 30d). App authZ by role thereafter.
- **Geo-matching:** providers store `geography(Point,4326)` + radius; matching uses `ST_DWithin` + scoring SQL. See [Matching spec](../../.kiro/specs/04-matching-engine/).
- **Realtime:** Socket.IO rooms per booking for chat + live status; Redis adapter for scale.
- **Media:** signed direct-to-Cloudinary uploads; API stores only secure URLs.
- **Call masking:** proxy numbers via SMS/voice provider; real numbers never exposed.
- **Money:** integer LKR cents; commission computed server-side; idempotent payment webhooks.

## 5. Environments & deployment
- **Web (PWA):** Vercel.
- **API + DB + Redis:** AWS or DigitalOcean (containerized). Managed Postgres with PostGIS.
- **CI/CD:** GitHub Actions → lint, test, build, migrate, deploy. Preview deploys per PR.
- **Secrets:** environment vars / secret manager; never in repo.

## 6. Observability & resilience
Structured JSON logs, request IDs, error tracking (Sentry), uptime checks, DB backups,
payment-webhook retries with idempotency keys.

## 7. Security architecture
Role-based authZ guards on every endpoint; rate-limited OTP/login; PII (NIC/selfie)
encrypted at rest and access-logged; OWASP Top 10 controls; input validation via Zod/DTOs;
signed media URLs; least-privilege DB roles.

## 8. Scalability path (post-MVP)
Extract Matching and Chat into services; add read replicas; CDN for media; queue-based
notifications. Triggered at scale gate G2→G3.

## See also
- [Tech decisions & stack](tech-decisions.md)
- [Database design](database-design.md)
- [API specification](api-specification.md)
- [ADRs](decisions/)
