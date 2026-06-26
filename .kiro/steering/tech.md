---
inclusion: always
---

# Technical Steering — Conventions every developer & AI agent must follow

## Stack (do not deviate without an ADR in docs/04-architecture/decisions/)
- **Frontend:** Next.js (App Router) + React + TypeScript + Tailwind CSS. PWA via `next-pwa`.
- **Backend:** Node.js + NestJS (modular monolith for MVP). REST for CRUD, WebSocket (Socket.IO) for live job tracking & chat.
- **DB:** PostgreSQL 18 + PostGIS extension. Prisma ORM. Migrations are committed, never edited after merge.
- **Auth:** Firebase Phone Auth (OTP) → exchanged for our own short-lived JWT access token + refresh token.
- **Files:** Cloudinary (images/video) with signed uploads. Never accept raw multipart to our API.
- **Payments:** PayHere primary, Genie Business secondary. Never store raw card data.

## Coding conventions
- TypeScript `strict: true`. No `any` without a `// eslint-disable` justification.
- API responses use a single envelope: `{ "data": ..., "error": null }` or `{ "data": null, "error": { code, message } }`.
- All timestamps are UTC ISO-8601 in the DB and API; convert to Asia/Colombo only in the UI.
- All money is stored in **cents (integer LKR)**, never floats.
- Geo coordinates use `geography(Point, 4326)` (WGS84). Distance via `ST_DWithin`.
- Validation at the edge with Zod (frontend) and class-validator (NestJS DTOs).
- User-facing strings come from i18n keys (`next-intl`), never inline literals.

## Security baseline (every feature)
- AuthZ checked on every endpoint (role: customer | provider | admin).
- Rate-limit OTP and login endpoints.
- Call masking: never expose real phone numbers between customer and provider.
- PII (NIC, selfie) is access-controlled and encrypted at rest.

## Testing baseline
- Unit tests for all business logic (Jest).
- Integration tests for every API endpoint.
- E2E happy-path per feature (Playwright).
- A feature is "done" only when its Kiro `requirements.md` acceptance criteria all pass.

## Definition of Done (link: docs/06-delivery/definition-of-done.md)
Code + tests + i18n keys + updated API spec + QA sign-off + meets steering rules.
