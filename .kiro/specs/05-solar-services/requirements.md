# Requirements — Solar Services (EPIC SOLAR)

**Spec:** `05-solar-services` · **Status:** Template (seeded — Phase 4)
**Traces to PRD:** SOLAR-01..03 · **SRS:** FR-S1..S2
**Steering:** `.kiro/steering/*`

## Introduction
Solar is a higher-value, spec-sensitive category. It extends the catalog with solar
sub-categories, lets solar providers declare certifications/equipment, and lets customers
capture system specs (capacity, brands) so providers can quote accurately.

**Solar sub-categories:** Solar Installation · Solar Maintenance · Solar Cleaning ·
Inverter Repair · Battery Replacement · Net Metering Support · EV Charger Installation.

## Requirement 1 — Solar catalog & spec capture
**User story:** As a customer, I select a solar sub-category and enter system details, so providers quote accurately. *(SOLAR-01, SOLAR-03)*
**Acceptance criteria (EARS):**
1. THE SYSTEM SHALL seed the Solar parent category with the seven sub-categories (i18n keys si/ta/en).
2. WHEN a customer books a solar service, THE SYSTEM SHALL capture `solar_specs` jsonb `{ capacity_kw, panel_brand, inverter_brand }` on the booking.
3. THE solar spec fields SHALL be optional but encouraged via UI prompts.

## Requirement 2 — Solar provider qualifications
**User story:** As a solar provider, I declare certifications/equipment, so I'm matched for complex jobs. *(SOLAR-02)*
**Acceptance criteria (EARS):**
1. WHEN a solar provider uploads solar certifications, THE SYSTEM SHALL store them as `verifications` of type `certificate` and surface a "solar certified" indicator once approved.

## Cross-document updates required (from research doc)
This feature requires updating: PRD ✅, Personas ✅ (Fathima), SRS ✅ (FR-S1/S2),
Database Design ✅ (categories self-ref + `solar_specs`), API spec ✅ (solarSpecs on booking),
Sprint Plan ✅ (Phase 4), GTM ✅ (Solar section). All done in this repo.

## Non-functional acceptance
Envelope; i18n keys for all sub-categories; specs validated when present.

## TODO before build
- [ ] Confirm full spec field list with solar SMEs.
- [ ] Write `design.md` + `tasks.md`.
