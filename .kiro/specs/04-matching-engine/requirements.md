# Requirements — Matching Engine (EPIC MATCH)

**Spec:** `04-matching-engine` · **Status:** ✅ CORE BUILT (Sprint 0); filtering (Req 2) pending
**Traces to PRD:** MATCH-01..02 · **SRS:** FR-M1..M2
**Steering:** `.kiro/steering/*`

## Introduction
Given a customer location, category, and radius, rank eligible providers by proximity,
availability, rating, response time, and price. Implemented with PostGIS.

## Requirement 1 — Ranked matching
**User story:** As the system, I rank providers so customers see the best fit first. *(MATCH-01)*
**Acceptance criteria (EARS):**
1. WHEN matching runs, THE SYSTEM SHALL include only providers where `status=approved`, `is_available=true`, the category matches, AND `ST_DWithin(service_area, customer_point, radius)` is true.
2. THE SYSTEM SHALL rank by a weighted score of proximity (0.5), rating (0.3), and responsiveness (0.2); weights SHALL be configurable.
3. THE SYSTEM SHALL return at most 20 candidates with `distance_m`, `rating_avg`, and estimated price.
4. IF no providers qualify, THEN THE SYSTEM SHALL return an empty list with `MATCH_NONE_IN_RADIUS`.

## Requirement 2 — Filtering
**User story:** As a customer, I filter matches by rating/price/distance. *(MATCH-02, P1)*
**Acceptance criteria (EARS):**
1. WHEN a customer applies filters, THE SYSTEM SHALL re-rank within the constrained set.

## Non-functional acceptance
- GIST indexes on all geography columns (see database-design.md).
- Matching query p95 < 300ms at 10k providers (load test).
- Weights live in config, not hard-coded.

## Reference query
See the illustrative SQL in [database-design.md §4](../../docs/04-architecture/database-design.md).

## Status (as built, Sprint 0)
- Req 1 (ranked matching) ✅ built — `GET /api/v1/match` via `MatchingService` raw PostGIS SQL
  (`ST_DWithin` filter + weighted score 0.5/0.3/0.2, weights from env). Verified: Sunil
  (913m, 4.8) > Nuwan (5.9km, 4.6) > Kamal (4km, 4.3); offline/unverified excluded.
- Req 2 (filtering) ⬜ pending — add rating/price/distance filters (Sprint 3).

## TODO remaining
- [ ] Req 2 filters + re-rank.
- [ ] Load-test at 10k providers (QA, p95 < 300ms).
- [ ] Wire matching into the Booking flow (Sprint 3).
