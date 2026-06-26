# Requirements — Provider Onboarding & Verification (EPIC PROV)

**Spec:** `02-provider-onboarding` · **Status:** Template (seeded — finish before Sprint 2)
**Traces to PRD:** PROV-01..05 · **SRS:** FR-P1..P5
**Steering:** `.kiro/steering/*` · **Pattern reference:** `01-authentication-otp`

> Seeded with the critical criteria. Expand using `templates/kiro-spec-template/`.

## Introduction
Providers register, submit identity (NIC + selfie) and certificates, set their service
categories/area/radius, and toggle availability. Admins review and approve/reject. Only
**approved + available** providers are matchable.

## Requirement 1 — Identity submission (NIC + selfie)
**User story:** As a provider, I want to submit my NIC and selfie, so that I can be verified. *(PROV-01)*
**Acceptance criteria (EARS):**
1. WHEN a provider uploads NIC + selfie via signed Cloudinary URLs, THE SYSTEM SHALL store secure URLs and create `verifications` rows with status `pending`.
2. THE SYSTEM SHALL access-control and (at rest) protect PII media; raw multipart SHALL NOT hit the API.
3. WHILE verification is `pending`, THE SYSTEM SHALL set provider `status = pending` and SHALL NOT make the provider matchable.

## Requirement 2 — Service area, categories, radius
**User story:** As a provider, I want to set categories, area, and radius, so that I get relevant jobs. *(PROV-03)*
**Acceptance criteria (EARS):**
1. WHEN a provider sets a center point + radius, THE SYSTEM SHALL persist `service_areas.center` (geography 4326) + `radius_meters`.
2. WHEN a provider selects categories (incl. Solar sub-categories), THE SYSTEM SHALL persist `provider_categories`.

## Requirement 3 — Availability
**User story:** As a provider, I want to toggle availability, so that I only get jobs when working. *(PROV-05)*
**Acceptance criteria (EARS):**
1. WHEN a provider sets `isAvailable=false`, THE SYSTEM SHALL exclude them from matching.

## Requirement 4 — Admin verification
**User story:** As an admin, I want to approve/reject providers, so that only trusted providers go live. *(PROV-04)*
**Acceptance criteria (EARS):**
1. WHEN an admin approves a provider, THE SYSTEM SHALL set provider `status=approved`; only then is the provider matchable.
2. WHEN an admin rejects, THE SYSTEM SHALL set `status=rejected` and store a reason; the provider SHALL be notified.
3. THE verification queue SHALL be admin-only (403 otherwise).

## Requirement 5 — Certificates (P1)
1. WHEN a provider uploads a trade certificate, THE SYSTEM SHALL store it as a `verifications` row of type `certificate`.

## Non-functional acceptance
Envelope `{ data, error }`; i18n keys; PII encrypted/access-logged; signed uploads only.

## Out of scope
Police-clearance automation, background-check integrations (later).

## TODO before build
- [ ] Finalize all EARS criteria for each requirement.
- [ ] Write `design.md` (copy template) — media signing flow, admin queue.
- [ ] Write `tasks.md` (copy template).
