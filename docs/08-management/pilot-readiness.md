# Pilot Readiness Checklist — Gate G1 → G2 (Kandy)

**Owner:** Engineering Manager + Business Owner · **Target:** launch the Kandy pilot.

## Feature completeness (MVP) — ✅ built & verified
- [x] Auth (phone OTP, JWT sessions, rotation, replay defense, role authZ)
- [x] Catalog (trilingual, Solar sub-categories) + admin management
- [x] Provider onboarding + verification (admin queue, trust gate)
- [x] Geo-matching (PostGIS, verified+available only, ranked)
- [x] Booking lifecycle (request→match→accept→in_progress→completed, state-machine guarded)
- [x] Masked in-app chat (phone numbers scrubbed)
- [x] Payments (commission, idempotent webhook, earnings)
- [x] Reviews (post-completion, rating recalc feeds matching)
- [x] Admin console (categories, districts, verification, disputes, analytics)
- [x] District-phased coverage (Kandy active; expansion = config flip)

## Before going live — required
- [ ] **Real Firebase OTP** wired (`AUTH_VERIFIER=firebase`) + SMS quota for LK volume
- [ ] **Real Cloudinary** uploads (`MEDIA_UPLOADER=cloudinary`)
- [ ] **Real PayHere/Genie** + merchant onboarding (`PAYMENT_GATEWAY=payhere`)
- [ ] Web login UI (replace per-area mock sign-in; httpOnly cookie for refresh token)
- [ ] Geolocation picker on web booking (replace Kandy-town default)
- [ ] Deploy: web→Vercel, API+DB+Redis→AWS/DigitalOcean; run `db/migrations` on prod
- [ ] Secrets in a secret manager (rotate dev creds; current `postgres/postgres` is dev-only)
- [ ] Move OTP rate-limit + throttler store to **Redis** (multi-instance)
See [real-integrations.md](../04-architecture/real-integrations.md).

## NFR / quality gate (QA)
- [ ] Lighthouse mobile: FCP < 2.5s on simulated 3G (core flows)
- [ ] axe: 0 critical a11y violations on core flows
- [ ] i18n QA: all flows render in si/ta/en (native review of Sinhala/Tamil)
- [ ] Security: OWASP ZAP baseline clean; helmet ✅; auth/payment rate-limited ✅; PII access-controlled
- [ ] Payments: sandbox end-to-end incl. webhook idempotency ✅ (mock) → repeat on real gateway
- [ ] Load: matching p95 < 300ms at target provider volume

## Operational readiness
- [ ] Seed initial Kandy providers (target 30+ from GTM) and verify them
- [ ] Support process for disputes (admin console ready ✅)
- [ ] Monitoring (Sentry + uptime), DB backups
- [ ] Analytics dashboard reviewed by owner ✅ (endpoint built)

## Success metrics to watch (pilot)
Completed bookings/week (North Star), MAU, response time, retention, CSAT, revenue/booking,
verified-provider ratio. (Dashboard: `/admin/analytics`.)

## Gate decision
G1→G2 (start pilot) when: required-before-go-live items done + NFR gate green +
30+ verified Kandy providers seeded. G2→G3 (scale) per [roadmap.md](roadmap.md): 100 providers,
1,000 customers, 500 completed jobs.
