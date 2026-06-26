# Definition of Done (DoD) — SkillLink LK

A story is **Done** only when ALL of the following are true:

## Code
- [ ] Implements every task in the story's Kiro `tasks.md`.
- [ ] Satisfies every acceptance criterion in the story's Kiro `requirements.md` (EARS).
- [ ] Follows `.kiro/steering/tech.md` conventions (envelope, UTC, cents, geo, authZ).
- [ ] TypeScript strict; no unjustified `any`; lint passes.

## i18n & UX
- [ ] All user-facing strings use i18n keys (si/ta/en present).
- [ ] Works on a 3G profile; mobile-first layout verified.
- [ ] Meets WCAG 2.1 AA for the affected screens.

## Tests
- [ ] Unit tests for business logic.
- [ ] Integration tests for new/changed endpoints.
- [ ] E2E happy path for the story. *(Note: automated E2E/frontend tests are not yet set up — flows are currently verified manually via live API checks. Playwright E2E is a pre-pilot task.)*
- [ ] All tests green in CI.

## Security
- [ ] AuthZ guard on every new endpoint (role-checked).
- [ ] No PII or secrets logged; PII access-controlled.
- [ ] Rate limits on sensitive endpoints (OTP/login/payment).

## Docs & traceability
- [ ] API spec updated ([api-specification.md](../04-architecture/api-specification.md)). *(Hand-maintained markdown today; auto-generated Swagger/OpenAPI via `@nestjs/swagger` is a pre-pilot task.)*
- [ ] Traceability matrix updated ([../07-qa/traceability-matrix.md](../07-qa/traceability-matrix.md)).
- [ ] DB changes via committed migration (no edits to merged migrations).

## Sign-off
- [ ] QA verified against acceptance criteria.
- [ ] PR reviewed & approved.
- [ ] Deployed to preview/staging and demoed.
