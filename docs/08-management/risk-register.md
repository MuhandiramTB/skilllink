# Risk Register — SkillLink LK

**Owner:** Engineering Manager · Reviewed weekly.

| ID | Risk | Likelihood | Impact | Mitigation | Owner |
|----|------|-----------|--------|-----------|-------|
| R1 | Provider supply shortage at launch | High | High | Pre-seed via FB/WhatsApp groups, hardware stores, trade colleges; pilot 3 categories only | PM/Owner |
| R2 | Trust & safety failures | Med | High | NIC+selfie+cert verification, reviews, call masking, completion photos | Architect/QA |
| R3 | Fake bookings | Med | Med | OTP gating, fraud flags (ADMIN-04), provider accept window | Dev/Admin |
| R4 | Pricing disputes | Med | Med | Transparent pricing, dispute tooling, evidence (chat+photos) | PM |
| R5 | Low retention | Med | High | Fast matching, warranties, follow-up, quality monitoring | PM/Owner |
| R6 | Payment integration delays (PayHere/Genie onboarding) | Med | High | Start merchant onboarding in Phase 1; sandbox early | Eng Mgr |
| R7 | OTP/SMS cost & deliverability | Med | Med | Firebase quotas, rate limits, monitor delivery | Architect |
| R8 | Low-bandwidth UX failures | Med | Med | 3G perf budget, Lighthouse gate, lazy media | UX/Dev |
| R9 | i18n gaps (Tamil/Sinhala) | Med | Med | i18n keys mandatory, native review, QA renders all 3 | QA |
| R10 | Geo-matching accuracy/perf | Low | High | PostGIS indexes, configurable weights, load test | Architect/QA |
| R11 | Scope creep beyond MVP | High | Med | PO gate; out-of-scope list in PRD; gate-based funding | PM/Owner |

**Escalation:** any Sev-1 (security/data/payment) → immediate owner notification.
