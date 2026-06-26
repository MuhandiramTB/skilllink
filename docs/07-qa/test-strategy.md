# Test Strategy — SkillLink LK

**BMAD Agent:** `qa` · **Owner:** Quality Assurance
**Inputs:** PRD, SRS, Kiro `requirements.md` per feature · **Consumed by:** Dev, Manager

---

## 1. Philosophy
QA verifies against the **acceptance criteria in each Kiro `requirements.md`** (EARS).
A story passes only when every criterion has a passing test. We test the **testing
pyramid**: many unit, fewer integration, few E2E.

## 2. Test levels & tools
| Level | Scope | Tool |
|-------|-------|------|
| Unit | Business logic, pure functions | Jest |
| Integration | API endpoints + DB (test container) | Jest + Supertest + Testcontainers (Postgres/PostGIS) |
| Contract | API ↔ client envelope shape | OpenAPI validation |
| E2E | User journeys in the PWA | Playwright |
| Non-functional | perf, a11y, i18n, security | Lighthouse, axe, k6, OWASP ZAP |

## 3. What QA checks per feature
1. Every EARS criterion → at least one test (positive + negative).
2. Envelope `{ data, error }` and correct error codes.
3. AuthZ: 401 without token, 403 wrong role.
4. i18n: strings render in si/ta/en (no missing keys, no overflow).
5. Mobile/3G performance budget.
6. Security checks relevant to the feature (rate limits, PII, masking).

## 4. Environments
Local (emulators/stubs) → CI (Testcontainers) → Staging (full integrations, sandbox payment) → Production (smoke tests only).

## 5. Entry / exit criteria
- **Entry to QA:** story meets "Ready", code merged to staging, dev tests green.
- **Exit (pass):** all acceptance criteria pass, no Sev-1/Sev-2 open, DoD met.

## 6. Defect severity
| Sev | Meaning | SLA |
|-----|---------|-----|
| 1 | Blocker / data loss / security | fix before release |
| 2 | Major flow broken | fix before release |
| 3 | Minor / workaround exists | next sprint |
| 4 | Cosmetic | backlog |

## 7. Non-functional gates (pre-pilot G1→G2)
- Lighthouse mobile: FCP < 2.5s on simulated 3G.
- axe: 0 critical a11y violations on core flows.
- Security: OWASP ZAP baseline clean; auth endpoints rate-limited; PII access-controlled.
- Payments: sandbox end-to-end incl. webhook idempotency.

## 8. Per-feature test plans
Each feature has a `test-plan-<feature>.md` here (see [Auth test plan](test-plan-auth.md)),
and tests live beside code. Traceability in [traceability-matrix.md](traceability-matrix.md).

## 9. Regression
Automated suite runs on every PR (unit+integration) and nightly (E2E + non-functional).
