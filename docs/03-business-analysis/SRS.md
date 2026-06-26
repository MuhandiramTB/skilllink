# Software Requirements Specification (SRS) — SkillLink LK

**Owner:** Business Analyst · **Standard:** IEEE 830-style, adapted
**Inputs:** [PRD](../02-product/PRD.md) · **Consumed by:** Architect, Dev, QA
**Version:** 1.0 (Solar included)

---

## 1. Introduction
### 1.1 Purpose
Define functional and non-functional requirements for the MVP so they are testable and traceable to PRD stories and Kiro specs.
### 1.2 Scope
Mobile-first PWA marketplace: customer app, provider app, admin console — single codebase, shared API.
### 1.3 Definitions
PWA, OTP, NIC (National Identity Card), PostGIS, call masking, commission. (See README glossary.)

## 2. Overall description
### 2.1 Product perspective
A modular monolith (NestJS API + Next.js PWA + PostgreSQL/PostGIS) integrating Firebase Auth, Cloudinary, Google Maps, FCM, PayHere/Genie.
### 2.2 User classes
Customer, Provider, Admin (see [personas](personas.md)).
### 2.3 Constraints
Low-bandwidth mobile; trilingual; local payment rails; PII regulations.
### 2.4 Assumptions
Users have a Sri Lankan mobile number; GPS available or manual pin allowed.

## 3. Functional requirements
Each FR traces to a PRD story ID and is expressed testably. Detailed EARS acceptance
criteria live in the feature's Kiro `requirements.md`.

| FR ID | Requirement | Trace |
|-------|-------------|-------|
| FR-A1 | The system shall authenticate users via phone-number OTP. | AUTH-01 |
| FR-A2 | The system shall let users choose language (si/ta/en) and persist it. | AUTH-02 |
| FR-A3 | The system shall maintain secure sessions with access + refresh tokens. | AUTH-03 |
| FR-A4 | The system shall allow logout and session revocation. | AUTH-04 |
| FR-P1 | The system shall capture provider NIC + selfie for verification. | PROV-01 |
| FR-P2 | The system shall accept provider certificate uploads. | PROV-02 |
| FR-P3 | The system shall let providers set categories, service area, and radius. | PROV-03 |
| FR-P4 | The system shall provide an admin verification queue with approve/reject + reason. | PROV-04 |
| FR-P5 | The system shall let providers toggle availability; only available providers are matched. | PROV-05 |
| FR-C1 | The system shall present categories and Solar sub-categories. | CAT-01, SOLAR-01 |
| FR-C2 | The system shall let admins manage categories/sub-categories. | CAT-02 |
| FR-B1 | The system shall capture issue description + photo/video uploads. | BOOK-01 |
| FR-B2 | The system shall capture customer location (GPS or manual pin). | BOOK-02 |
| FR-B3 | The system shall return ranked matched providers. | BOOK-03, MATCH-01 |
| FR-B4 | The system shall create a booking and notify the provider. | BOOK-04 |
| FR-B5 | The system shall let providers accept/reject within a time window. | BOOK-05 |
| FR-B6 | The system shall provide live job status updates. | BOOK-06 |
| FR-B7 | The system shall provide in-app chat with phone-number masking. | BOOK-07 |
| FR-B8 | The system shall support policy-based cancellation. | BOOK-08 |
| FR-M1 | The system shall rank providers by proximity, availability, rating, response time, price. | MATCH-01 |
| FR-M2 | The system shall support filtering by rating/price/distance. | MATCH-02 |
| FR-PAY1 | The system shall process payment via PayHere/Genie. | PAY-01 |
| FR-PAY2 | The system shall compute and retain a 10–15% commission. | PAY-02 |
| FR-PAY3 | The system shall present a provider earnings dashboard. | PAY-03 |
| FR-R1 | The system shall capture ratings + reviews post-completion. | REV-01 |
| FR-R2 | The system shall let providers respond to reviews. | REV-02 |
| FR-AD1 | The system shall let admins manage users/providers. | ADMIN-01 |
| FR-AD2 | The system shall provide dispute resolution tooling. | ADMIN-02 |
| FR-AD3 | The system shall present analytics & revenue dashboards. | ADMIN-03 |
| FR-AD4 | The system shall flag suspicious bookings (fraud). | ADMIN-04 |
| FR-S1 | The system shall offer Solar sub-categories and capture system specs (kW, brand). | SOLAR-01, SOLAR-03 |
| FR-S2 | The system shall let providers declare solar certifications/equipment. | SOLAR-02 |

## 4. Non-functional requirements
| NFR | Target |
|-----|--------|
| Performance | FCP < 2.5s on 3G; API p95 < 400ms |
| Availability | 99.5% |
| Security | OWASP Top 10; PII encrypted at rest; rate-limited auth; call masking |
| Accessibility | WCAG 2.1 AA core flows |
| i18n | si/ta/en for all user-facing copy |
| Scalability | PostGIS-indexed geo queries; 10k providers |
| Observability | Structured logs, request tracing, error tracking |
| Compliance | PDPA-aligned PII handling |

## 5. External interfaces
Firebase Auth (OTP), Cloudinary (media), Google Maps/OSM (geo), FCM (push), PayHere/Genie (payments), SMS provider (notifications/masking).

## 6. Traceability
PRD story → SRS FR → Kiro `requirements.md` (EARS) → tests (QA). Maintained in
[docs/07-qa/traceability-matrix.md](../07-qa/traceability-matrix.md).
