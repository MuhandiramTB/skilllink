---
inclusion: always
---

# Structure Steering — Repository layout

```
/
├── README.md                      # Master index — start here
├── docs/                          # BMAD planning artifacts (human-readable)
│   ├── 00-vision/                 # Owner: Business Owner
│   ├── 01-analyst/                # Owner: Analyst/BA  (Project Brief, market research)
│   ├── 02-product/                # Owner: PM          (PRD, epics, stories)
│   ├── 03-business-analysis/      # Owner: BA          (SRS, personas, journeys)
│   ├── 04-architecture/           # Owner: Architect   (architecture, DB, API, ADRs)
│   ├── 05-design/                 # Owner: UX/UI
│   ├── 06-delivery/               # Owner: Scrum Master (sprint plan, DoD)
│   ├── 07-qa/                     # Owner: QA          (test strategy/plans)
│   └── 08-management/             # Owner: Eng Manager (roadmap, RACI, risks)
├── .bmad/                         # BMAD agent persona definitions & workflow
│   └── agents/
├── .kiro/                         # Kiro spec-driven dev
│   ├── steering/                  # Always-loaded project rules (this folder)
│   └── specs/<NN>-<feature>/      # requirements.md + design.md + tasks.md
├── templates/                     # Copy these to create new docs/specs
└── apps/                          # (Future) actual source code
    ├── web/                       #   Next.js PWA
    └── api/                       #   NestJS API
```

## Naming rules
- Spec folders: `NN-kebab-case-feature` (e.g., `03-service-booking`).
- Story IDs: `EPIC-STORY` (e.g., `BOOK-04`). Each story links to its spec.
- ADRs: `docs/04-architecture/decisions/NNNN-title.md`.

## Where things live (so nobody guesses)
- "What & why" of a feature → BMAD story in `docs/02-product/`.
- "Exactly how" of a feature → Kiro spec in `.kiro/specs/`.
- Cross-cutting rules → `.kiro/steering/`.

## UI routing map (one PWA, role-based — ADR-0002)
```
apps/web/src/app/[locale]/
├── page.tsx              /                 Customer home (category grid + nav)
├── category/[key]/       /category/[key]   Customer: describe issue → matches → book
├── bookings/             /bookings         Customer: booking history
│   └── [id]/             /bookings/[id]    Customer: status, chat, pay, review
├── provider/             /provider         Provider: dashboard (status, availability, earnings)
│   └── jobs/             /provider/jobs    Provider: jobs inbox (accept/advance)
└── admin/                /admin            Admin/Owner console (role = admin)
    ├── categories/       master data: categories & sub-services
    ├── districts/        district activation (v1 expansion)
    ├── verifications/    provider verification queue
    ├── disputes/         dispute resolution
    ├── analytics/        KPI dashboard
    └── audit/            audit log viewer
```
Shared UI primitives: `apps/web/src/components/ui.tsx` (Button, Card, StatusBadge,
Spinner, EmptyState, ErrorBanner, SuccessBanner) + `LanguageSwitcher.tsx`.
API clients: `lib/{admin,provider,booking}-api.ts`.
- Role from the authenticated session decides what's shown (UI gate).
- The API enforces role on every endpoint (security boundary).
- Owner master-data management lives under `/admin` (spec `06-admin-master-data`).
