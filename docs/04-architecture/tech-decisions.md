# Technology Decisions & Stack — SkillLink LK

**Owner:** Software Architect · **Consumed by:** Dev, Manager

This consolidates the stack and the *why*. Each significant choice has an ADR in
[decisions/](decisions/).

| Layer | Choice | Why |
|-------|--------|-----|
| Frontend | Next.js (App Router) + React + TS + Tailwind, PWA | Single codebase for customer/provider/admin; SSR for SEO; PWA = no app-store delay; works on all devices |
| State/data | TanStack Query + Zustand | Server-cache + light client state |
| i18n | next-intl | si/ta/en, mandatory |
| Backend | Node.js + NestJS | Modular structure, DI, guards/interceptors fit our cross-cutting needs |
| Realtime | Socket.IO + Redis adapter | Live tracking & masked chat |
| DB | PostgreSQL 18 + PostGIS | Relational integrity + first-class geo for matching |
| ORM | Prisma (client) | Typed queries. **Migrations are currently raw SQL** in `db/migrations/` (PostGIS needs SQL); `prisma migrate` is not yet wired — planned before pilot. |
| Cache/queue | Redis | Sessions, rate limits, job queue, socket scaling |
| Auth | Firebase Phone Auth + own JWT | Reliable OTP delivery in LK; we keep session control |
| Media | Cloudinary | Signed uploads, transforms, low-bandwidth delivery |
| Maps | Google Maps Platform (OSM fallback) | Geocoding, distance, map UI |
| Push | Firebase Cloud Messaging | Free, web + future native |
| Payments | PayHere (primary), Genie Business | Local rails Sri Lankan users trust |
| Hosting | Vercel (web), AWS/DigitalOcean (API/DB) | Cost-effective, scalable |
| CI/CD | GitHub Actions | Lint/test/build/migrate/deploy |
| Monitoring | Sentry + uptime checks | Error + availability visibility |

## Why a modular monolith, not microservices (MVP)
Lean team, fast iteration, low ops cost. Clear module boundaries preserve a future
extraction path. Full rationale: [ADR-0001](decisions/0001-modular-monolith.md).

## Decisions deferred to later phases
Native apps (React Native/Flutter), subscriptions billing, ad platform, search service
(Elasticsearch) — revisit at scale gate.
