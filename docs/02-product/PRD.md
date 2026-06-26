# Product Requirements Document (PRD) — SkillLink LK MVP

**BMAD Agent:** `pm`
**Owner:** Product Manager
**Status:** Approved for build
**Inputs:** [Project Brief](../01-analyst/project-brief.md)
**Output consumed by:** Architect, Scrum Master, QA
**Version:** 1.0 (includes Solar Services)

---

## 1. Goals & background
Deliver a trust-centric, location-based, multilingual PWA marketplace for skilled
services in Sri Lanka. MVP must let a customer find → book → pay → review a verified
provider, and let a provider onboard → get verified → accept jobs → get paid, with
admins managing verification, disputes, and analytics.

## 2. MVP scope (in / out)
**In:** customer auth, provider auth + onboarding/verification, service catalog,
geo-search & matching, booking lifecycle, in-app chat (masked), live job tracking,
payments, ratings/reviews, admin console. Trilingual (si/ta/en). Solar category included.
**Out:** native apps, video calls, subscriptions, ad platform, fixed-price catalog (Phase 4).

## 3. Non-functional requirements (NFRs)
- **Performance:** First Contentful Paint < 2.5s on 3G; API p95 < 400ms.
- **Availability:** 99.5% MVP target.
- **Security:** OWASP Top 10; PII encrypted at rest; call masking; rate-limited auth.
- **Accessibility:** WCAG 2.1 AA for core flows.
- **i18n:** all user copy via i18n keys (si/ta/en).
- **Scalability:** geo-queries via PostGIS indexes; ready for 10k providers.

## 4. Personas (detail in BA docs)
Nimal (customer/homeowner), Priya (overseas owner), Sunil (provider/electrician),
Ayesha (admin/ops). See [personas](../03-business-analysis/personas.md).

---

## 5. Epics & user stories

Story format: `As a <role>, I want <goal>, so that <benefit>.`
Each story carries an ID, priority (P0=MVP-critical), and a link to its Kiro spec.

### EPIC AUTH — Authentication & Identity  → spec: `.kiro/specs/01-authentication-otp/`
| ID | Story | Priority |
|----|-------|----------|
| AUTH-01 | As a customer, I register and log in via phone OTP, so that I can use the app quickly. | P0 |
| AUTH-02 | As a user, I select my language (si/ta/en) at first launch, so that the app speaks my language. | P0 |
| AUTH-03 | As a returning user, I stay logged in via secure session, so that I don't re-auth constantly. | P0 |
| AUTH-04 | As a user, I can log out and revoke sessions, so that my account is secure. | P1 |

### EPIC PROV — Provider Onboarding & Verification  → spec: `.kiro/specs/02-provider-onboarding/`
| ID | Story | Priority |
|----|-------|----------|
| PROV-01 | As a provider, I register and submit NIC + selfie, so that I can be verified. | P0 |
| PROV-02 | As a provider, I upload trade/skill certificates, so that I build trust. | P1 |
| PROV-03 | As a provider, I set service categories, service area & radius, so that I get relevant jobs. | P0 |
| PROV-04 | As an admin, I review and approve/reject provider verification, so that only trusted providers go live. | P0 |
| PROV-05 | As a provider, I manage my availability, so that I only receive jobs when working. | P0 |

### EPIC CAT — Service Catalog  → spec: `.kiro/specs/(catalog)`
| ID | Story | Priority |
|----|-------|----------|
| CAT-01 | As a customer, I browse service categories (incl. Solar sub-categories), so that I pick the right service. | P0 |
| CAT-02 | As an admin, I manage categories and sub-categories, so that the catalog stays current. | P0 |

### EPIC BOOK — Service Booking  → spec: `.kiro/specs/03-service-booking/`
| ID | Story | Priority |
|----|-------|----------|
| BOOK-01 | As a customer, I describe my issue and upload photos/videos, so that the provider understands the job. | P0 |
| BOOK-02 | As a customer, I share my location, so that nearby providers are matched. | P0 |
| BOOK-03 | As a customer, I view matched providers ranked by proximity/rating/price, so that I can choose. | P0 |
| BOOK-04 | As a customer, I book a provider, so that the job is scheduled. | P0 |
| BOOK-05 | As a provider, I accept or reject a job request, so that I control my workload. | P0 |
| BOOK-06 | As a customer, I track job status live, so that I know progress. | P1 |
| BOOK-07 | As a user, I chat in-app with call masking, so that I communicate without exposing my number. | P0 |
| BOOK-08 | As a customer, I cancel a booking under policy, so that I'm not stuck. | P1 |

### EPIC MATCH — Matching Engine  → spec: `.kiro/specs/04-matching-engine/`
| ID | Story | Priority |
|----|-------|----------|
| MATCH-01 | As the system, I rank providers by proximity, availability, rating, response time, and price. | P0 |
| MATCH-02 | As a customer, I filter results by rating/price/distance, so that I refine matches. | P1 |

### EPIC PAY — Payments  → spec: `.kiro/specs/(payments)`
| ID | Story | Priority |
|----|-------|----------|
| PAY-01 | As a customer, I pay securely via PayHere/Genie, so that I complete the booking. | P0 |
| PAY-02 | As the platform, I take a 10–15% commission, so that we earn revenue. | P0 |
| PAY-03 | As a provider, I view my earnings dashboard, so that I track income. | P0 |

### EPIC REV — Ratings & Reviews  → spec: `.kiro/specs/(reviews)`
| ID | Story | Priority |
|----|-------|----------|
| REV-01 | As a customer, I rate and review after completion, so that quality is transparent. | P0 |
| REV-02 | As a provider, I respond to reviews, so that I manage my reputation. | P1 |

### EPIC ADMIN — Admin Console  → spec: `.kiro/specs/(admin)`
| ID | Story | Priority |
|----|-------|----------|
| ADMIN-01 | As an admin, I manage users and providers, so that the marketplace stays healthy. | P0 |
| ADMIN-02 | As an admin, I resolve disputes, so that conflicts are handled fairly. | P1 |
| ADMIN-03 | As an admin, I view analytics & revenue, so that I monitor the business. | P1 |
| ADMIN-04 | As an admin, I run fraud detection on bookings, so that we limit abuse. | P2 |

### EPIC ADMIN-MASTER — Owner Master-Data Console  → spec: `.kiro/specs/06-admin-master-data/`
> Pulled forward to Sprint 1.5 (ADR-0002) so the owner manages master data via UI, not SQL.

| ID | Story | Priority |
|----|-------|----------|
| MASTER-01 | As an owner/admin, I log into an admin area gated by my role, so that only staff access management tools. | P0 |
| MASTER-02 | As an owner, I add/edit/deactivate service categories, so that the catalog stays current without a developer. | P0 |
| MASTER-03 | As an owner, I add/edit sub-services under a category (e.g. Solar sub-types), so that offerings are granular. | P0 |
| MASTER-04 | As an owner, I reorder categories, so that the most-used appear first. | P1 |
| MASTER-05 | As an owner, I activate/deactivate a district (e.g. enable Gampaha), so that we expand coverage by clicks. | P0 |
| MASTER-06 | As an owner, I edit trilingual names (si/ta/en) for categories, so that all languages stay consistent. | P0 |

### EPIC SOLAR — Solar Services  → spec: `.kiro/specs/05-solar-services/`
| ID | Story | Priority |
|----|-------|----------|
| SOLAR-01 | As a customer, I select Solar sub-categories (install, maintenance, cleaning, inverter repair, battery, net-metering, EV charger), so that I book the right solar work. | P1 |
| SOLAR-02 | As a solar provider, I declare solar certifications & equipment, so that I'm matched for complex jobs. | P1 |
| SOLAR-03 | As a customer, I capture system details (capacity kW, panel/inverter brand), so that the provider quotes accurately. | P2 |

---

## 6. Release plan mapping
- **Pilot (Phase 3):** AUTH-*, PROV-01/03/04/05, CAT-01/02, BOOK-01..07, MATCH-01, PAY-01/02/03, REV-01, ADMIN-01.
- **Scale (Phase 4):** remaining P1/P2 incl. full SOLAR-*, ADMIN-02/03/04, MATCH-02.

## 7. Acceptance & traceability
Every story's detailed, testable acceptance criteria live in its Kiro `requirements.md`
(EARS notation). QA traces tests back to those IDs. See [SRS](../03-business-analysis/SRS.md)
for the requirements catalog.
