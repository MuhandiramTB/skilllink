# Roadmap — SkillLink LK

**Owner:** Engineering Manager (reports to Business Owner)

## Phases (from research → execution)
| Phase | Duration | Outcome | Gate |
|-------|----------|---------|------|
| 0 — Research & validation | 2–4 wk | 50+50 interviews, landing page, manual WhatsApp bookings | G0: 100+ users, 30+ providers |
| 1 — MVP planning & design | 2 wk | PRD, design system, prototype, architecture | — |
| 2 — Build MVP PWA | 8–12 wk (Sprints 0–5) | Customer/Provider/Admin modules, prod DB | G1: pilot-ready |
| ↳ **Sprint 0** | ✅ done 2026-06-19 | Monorepo, DB+PostGIS, catalog & matching API, trilingual web | — |
| ↳ **Sprint 1** | ⏳ next | Authentication & OTP (AUTH-01..04) | — |
| 3 — Pilot (**Kandy district, v1**) | 4 wk | Kandy only; Electricians/Plumbers/AC | G2: 100 prov, 1k cust, 500 jobs |
| 4 — Scale (nationwide) | 3–12 mo | Activate Gampaha/Colombo/… (`districts.is_active`), more categories, corporate, full Solar, subscriptions | G3: PMF |

> **v1 strategy: Kandy first.** Win one district (density solves the marketplace
> chicken-and-egg) before expanding. Expansion is config-driven via the `districts`
> table — no rebuild. See [database-design.md](../04-architecture/database-design.md).
| 5 — Native apps | — | Android/iOS (React Native/Flutter) | — |

## Build sequence (Phase 2 = sprint plan)
See [sprint-plan.md](../06-delivery/sprint-plan.md). Critical path: Auth → Provider/Verify
→ Booking/Matching → Payments/Reviews → Admin/hardening.

## Reporting cadence
Weekly status to owner: burndown, gate progress, top risks, metric trends.

## Dependencies / external
Firebase quota (SMS), PayHere/Genie merchant onboarding, Google Maps billing,
Cloudinary account — secure these during Phase 1.
