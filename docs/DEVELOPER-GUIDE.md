# Developer Guide — How to build SkillLink LK step by step

This is the *one document a developer reads to start building*. It connects the BMAD
planning docs to the Kiro specs and shows the exact loop to follow.

---

## 0. Before you write any code
Read, in order:
1. `.kiro/steering/product.md`, `tech.md`, `structure.md` — the rules you must follow.
2. [docs/00-vision/vision.md](00-vision/vision.md) — why we exist.
3. [docs/02-product/PRD.md](02-product/PRD.md) — the epics & stories.
4. [docs/04-architecture/](04-architecture/) — system, DB, API.

## 1. Set up the workspace (Sprint 0)
```bash
# monorepo
apps/web   → Next.js PWA (App Router, TS, Tailwind, next-intl)
apps/api   → NestJS (modular monolith)

# infra
PostgreSQL 18 + PostGIS   (CREATE EXTENSION postgis)
Redis                     (sessions, rate limits, sockets)
Prisma                    (schema from docs/04-architecture/database-design.md)
Firebase project          (Phone Auth / OTP)
Cloudinary, Google Maps, FCM, PayHere/Genie  (keys in env/secret manager)
```
CI/CD: GitHub Actions → lint → test → build → migrate → deploy (Vercel + AWS/DO).

## 2. The build loop (repeat per story)
```
1. Open the sprint plan → pick the next story (e.g., AUTH-01).
2. Open its Kiro spec:  .kiro/specs/<NN-feature>/
3. Read requirements.md (EARS acceptance criteria) and design.md.
4. Work tasks.md top-to-bottom:
      implement task → write its tests → run them → check the box.
5. When all tasks done → verify EVERY acceptance criterion passes.
6. Run the Definition of Done checklist (docs/06-delivery/definition-of-done.md).
7. Update API spec + traceability matrix.
8. PR → review → QA verifies against test-plan → merge → demo.
```

## 3. Worked example: build AUTH now
The Auth spec is **fully written** as the reference:
- [requirements.md](../.kiro/specs/01-authentication-otp/requirements.md) — 6 requirements in EARS.
- [design.md](../.kiro/specs/01-authentication-otp/design.md) — Firebase→JWT flow, components.
- [tasks.md](../.kiro/specs/01-authentication-otp/tasks.md) — 14 ordered tasks.

Start at task 1, finish at task 14, then hand to QA ([test-plan-auth.md](07-qa/test-plan-auth.md)).

## 4. Creating a NEW feature spec
```bash
cp -r templates/kiro-spec-template .kiro/specs/NN-your-feature
# fill requirements.md (EARS) → design.md → tasks.md
# add the story to PRD if missing, and a row to the traceability matrix
```
Tip with an AI agent (Kiro/Claude): *"Act as BMAD `dev`. Read
`.kiro/specs/NN-your-feature/` and the steering files. Implement tasks.md task-by-task,
writing tests; stop after each task for review."*

## 5. Golden rules (don't skip)
- A story isn't "Ready" until it has a Kiro spec with acceptance criteria.
- A task isn't "done" until its tests pass.
- A story isn't "Done" until the DoD checklist passes and QA signs off.
- Never bypass steering rules (envelope, UTC, cents, geo, authZ, i18n).

## 6. Order to build the MVP
Auth → Catalog → Provider onboarding/verification → Booking → Matching → Payments →
Reviews → Admin → hardening. (Matches [sprint-plan.md](06-delivery/sprint-plan.md).)

## 7. Who to ask (RACI)
See [docs/08-management/raci.md](08-management/raci.md): Architect for design questions,
PM for scope, QA for acceptance, Eng Mgr for delivery/risk.
