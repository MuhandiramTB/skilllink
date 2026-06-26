# Sri Lanka On-Demand Skilled Services Platform — "SkillLink LK"

> An "Uber for Skilled Workers" — a location-based marketplace connecting customers with verified, nearby skilled service providers (electricians, plumbers, AC technicians, solar technicians, and more) across Sri Lanka.

This repository is the **single source of truth** for the entire product, organized as a **real software-industry workflow** combining two complementary methodologies:

- **BMAD Method** (Breakthrough Method of Agile AI-Driven Development) — drives the *planning* phase through specialized agent roles (Analyst → PM → Architect → Scrum Master), producing a PRD and Architecture that get *sharded* into epics and stories.
- **Kiro Spec-Driven Development** — drives the *building* phase. Each feature gets a `requirements.md` (EARS notation), `design.md`, and `tasks.md` so any developer can implement it deterministically.

---

## How the two methods fit together

```
        BMAD (PLANNING)                         KIRO (BUILDING)
  ┌────────────────────────────┐        ┌──────────────────────────────┐
  │ Analyst  → Project Brief   │        │  For each feature:           │
  │ PM       → PRD + Epics     │  ───▶  │   .kiro/specs/<feature>/     │
  │ Architect→ Architecture    │        │     ├── requirements.md      │
  │ SM       → Sharded Stories │        │     ├── design.md            │
  └────────────────────────────┘        │     └── tasks.md             │
              │                          └──────────────────────────────┘
              ▼                                       │
        docs/ (human docs)                            ▼
              │                              Developer implements
              └──────────────────────────▶  task-by-task, QA verifies
```

**Golden rule:** A BMAD *story* (the "what & why") points to a Kiro *spec* (the "exactly how"). Planning lives in `docs/`, executable specs live in `.kiro/specs/`.

---

## Role-by-role map (who owns what)

| Role | BMAD Agent | Primary Deliverables | Location |
|------|-----------|----------------------|----------|
| **Business Owner / Stakeholder** | — | Vision, success metrics, funding gates | [docs/00-vision/](docs/00-vision/) · [docs/08-management/](docs/08-management/) |
| **Business Analyst / Analyst** | `analyst` | Project Brief, Market Research, SRS, Personas, Journeys | [docs/01-analyst/](docs/01-analyst/) · [docs/03-business-analysis/](docs/03-business-analysis/) |
| **Product Manager** | `pm` | PRD, Epics, User Stories, Prioritization | [docs/02-product/](docs/02-product/) |
| **Software Architect** | `architect` | System Architecture, Tech Stack, DB Design, API Spec | [docs/04-architecture/](docs/04-architecture/) |
| **UX/UI Designer** | `ux-expert` | Design system, wireframes, prototype notes | [docs/05-design/](docs/05-design/) |
| **Scrum Master / Delivery Manager** | `sm` | Sprint Plan, Story breakdown, Definition of Done | [docs/06-delivery/](docs/06-delivery/) |
| **Fullstack Developer** | `dev` | Kiro specs implementation, code | [.kiro/specs/](.kiro/specs/) |
| **Quality Assurance** | `qa` | Test Strategy, Test Plans, Acceptance gates | [docs/07-qa/](docs/07-qa/) |
| **Engineering Manager** | — | Roadmap, RACI, risk register, reporting | [docs/08-management/](docs/08-management/) |

---

## The end-to-end workflow (do this in order)

1. **Read the vision** → [docs/00-vision/vision.md](docs/00-vision/vision.md)
2. **Analyst** confirms the market & scope → [docs/01-analyst/project-brief.md](docs/01-analyst/project-brief.md)
3. **PM** writes the PRD with epics & stories → [docs/02-product/PRD.md](docs/02-product/PRD.md)
4. **BA** details requirements → [docs/03-business-analysis/SRS.md](docs/03-business-analysis/SRS.md), [personas.md](docs/03-business-analysis/personas.md), [user-journeys.md](docs/03-business-analysis/user-journeys.md)
5. **Architect** designs the system → [docs/04-architecture/system-architecture.md](docs/04-architecture/system-architecture.md), [database-design.md](docs/04-architecture/database-design.md), [api-specification.md](docs/04-architecture/api-specification.md)
6. **SM** breaks epics into a sprint plan → [docs/06-delivery/sprint-plan.md](docs/06-delivery/sprint-plan.md)
7. **Developer** picks a story, opens its Kiro spec, implements task-by-task → [.kiro/specs/](.kiro/specs/)
8. **QA** verifies against acceptance criteria → [docs/07-qa/test-strategy.md](docs/07-qa/test-strategy.md)
9. **Manager** tracks progress & reports to the owner → [docs/08-management/roadmap.md](docs/08-management/roadmap.md)

---

## Feature specs already scaffolded (`.kiro/specs/`)

| # | Spec | Status |
|---|------|--------|
| 00 | [Service Catalog](.kiro/specs/00-catalog/) | 🟢 **Built** (Sprint 0) — Req 1 done, admin CRUD pending |
| 01 | [Authentication & OTP](.kiro/specs/01-authentication-otp/) | ✅ Fully written — **next to build (Sprint 1)** |
| 02 | [Provider Onboarding & Verification](.kiro/specs/02-provider-onboarding/) | 📝 Seeded template |
| 03 | [Service Booking](.kiro/specs/03-service-booking/) | 📝 Seeded template |
| 04 | [Matching Engine](.kiro/specs/04-matching-engine/) | 🟢 **Core built** (Sprint 0) — filtering pending |
| 05 | [Solar Services](.kiro/specs/05-solar-services/) | 📝 Seeded template |

## Current build state

- **Stack is runnable.** See [apps/README.md](apps/README.md) to run API + web locally.
- **Sprint 0 closed** — DB + PostGIS, catalog & matching APIs, trilingual web shell. Record: [delivery-log.md](docs/06-delivery/delivery-log.md).
- **v1 target: Kandy district** (expansion is config-driven via the `districts` table).
- Copy [templates/kiro-spec-template/](templates/) to create new specs.

```
apps/api   NestJS API  → http://localhost:4000/api/v1   (health, categories, match)
apps/web   Next.js PWA → http://localhost:3000          (en/si/ta)
db/        SQL migrations + seeds for the skilllink database
```

---

## Tech stack (decided in Architecture)

| Layer | Choice |
|-------|--------|
| Frontend | Next.js (App Router) · React · TypeScript · Tailwind CSS (PWA) |
| Backend | Node.js · NestJS (or Express) · REST + WebSockets |
| Database | PostgreSQL + PostGIS (geo-matching) · Prisma ORM |
| Auth | Firebase Authentication (Phone/OTP) + JWT session |
| Maps | Google Maps Platform / OpenStreetMap |
| Storage | Cloudinary / AWS S3 |
| Notifications | Firebase Cloud Messaging |
| Payments | PayHere · Genie Business |
| Hosting | Vercel (web) · AWS/DigitalOcean (API + DB) |

See the full rationale in [docs/04-architecture/tech-decisions.md](docs/04-architecture/tech-decisions.md).

---

## Quick start for a new developer

```bash
# 1. Read the steering docs (project-wide rules Kiro/AI agents must follow)
cat .kiro/steering/*.md

# 2. Pick a story from the sprint plan
open docs/06-delivery/sprint-plan.md

# 3. Open its Kiro spec and work through tasks.md top-to-bottom
open .kiro/specs/01-authentication-otp/tasks.md

# 4. Each completed task → check against requirements.md acceptance criteria
# 5. Hand to QA → docs/07-qa/test-strategy.md
```

---

## Glossary

- **EARS** — Easy Approach to Requirements Syntax. Structured `WHEN <trigger> THE SYSTEM SHALL <response>` requirements used in Kiro specs.
- **Epic** — A large body of work (e.g., "Booking") split into stories.
- **Story** — A small, independently shippable slice ("As a customer I can book a provider").
- **Sharding** — BMAD term for breaking a big PRD/Architecture into small story files.
- **Steering** — Kiro term for project-wide context (conventions, stack, structure) auto-loaded into every AI session.
