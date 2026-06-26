# Traceability Matrix — SkillLink LK

**Owner:** QA · Keeps the chain **PRD story → SRS FR → Kiro spec → tests** intact.
Update on every story completion.

| PRD Story | SRS FR | Kiro Spec | Test Plan | Status |
|-----------|--------|-----------|-----------|--------|
| AUTH-01 | FR-A1 | 01-authentication-otp | test-plan-auth (T1–T8) | 🟢 built (Sprint 1) |
| AUTH-02 | FR-A2 | 01-authentication-otp | test-plan-auth (T9–T10) | 🟢 built (Sprint 1) |
| AUTH-03 | FR-A3 | 01-authentication-otp | test-plan-auth (T11–T13) | 🟢 built (Sprint 1) |
| AUTH-04 | FR-A4 | 01-authentication-otp | test-plan-auth (T14–T15) | 🟢 built (Sprint 1) |
| MASTER-01..06 | FR-MD* | 06-admin-master-data | manual (api+web verified) | 🟢 built (Sprint 1.5) |
| CAT-02 (admin CRUD) | FR-C2 | 06-admin-master-data | manual (api verified) | 🟢 built (Sprint 1.5) |
| PROV-01 | FR-P1 | 02-provider-onboarding | unit + E2E verified | 🟢 built (Sprint 2) |
| PROV-02 | FR-P2 | 02-provider-onboarding | E2E (certificate upload) | 🟢 built (Sprint 2) |
| PROV-03 | FR-P3 | 02-provider-onboarding | E2E (area/categories) | 🟢 built (Sprint 2) |
| PROV-04 | FR-P4 | 02-provider-onboarding | unit + E2E (approve/reject) | 🟢 built (Sprint 2) |
| PROV-05 | FR-P5 | 02-provider-onboarding | E2E (availability gate) | 🟢 built (Sprint 2) |
| CAT-01 | FR-C1 | 00-catalog | manual (api verified) | 🟢 built (Sprint 0) |
| CAT-02 | FR-C2 | 06-admin-master-data | manual (api verified) | 🟢 built (Sprint 1.5) |
| BOOK-01..07 | FR-B1..B7 | 03-service-booking | unit + E2E verified | 🟢 built (Sprint 3) |
| BOOK-08 (cancel) | FR-B8 | 03-service-booking | unit (transition) | 🟢 built (Sprint 3) |
| MATCH-01 | FR-M1 | 04-matching-engine | manual (api verified) | 🟢 built (Sprint 0) |
| MATCH-02 | FR-M2 | 04-matching-engine | _tbd_ | ⚪ filtering pending |
| PAY-01..03 | FR-PAY1..3 | 07-payments | unit + E2E verified | 🟢 built (Sprint 4) |
| REV-01 | FR-R1 | 08-reviews | unit + E2E verified | 🟢 built (Sprint 4) |
| REV-02 | FR-R2 | 08-reviews | provider response endpoint | 🟢 built (Sprint 4) |
| ADMIN-01 | FR-AD1 | 06-admin-master-data | api verified | 🟢 built (Sprint 1.5) |
| ADMIN-02 | FR-AD2 | 09-admin-ops | unit + E2E (disputes) | 🟢 built (Sprint 5) |
| ADMIN-03 | FR-AD3 | 09-admin-ops | E2E (analytics) | 🟢 built (Sprint 5) |
| SOLAR-01..03 | FR-S1..S2 | 05-solar-services | _tbd_ | ⚪ template |

**Legend:** 🟢 done & passing · 🟡 spec ready, tests pending · ⚪ not yet built.
