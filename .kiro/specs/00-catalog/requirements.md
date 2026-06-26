# Requirements — Service Catalog (EPIC CAT)

**Spec:** `00-catalog` · **Status:** ✅ BUILT (Sprint 0)
**Traces to PRD:** CAT-01, CAT-02, SOLAR-01 (catalog part) · **SRS:** FR-C1, FR-C2
**Steering:** `.kiro/steering/*`

## Introduction
The catalog exposes the trilingual service category tree (top-level trades + Solar
sub-categories) to customers and lets admins manage it.

## Requirement 1 — Browse categories
**User story:** As a customer, I browse service categories incl. Solar sub-categories. *(CAT-01)*
**Acceptance criteria (EARS):**
1. WHEN a client requests the catalog, THE SYSTEM SHALL return active categories as a tree (top-level → sub-categories). ✅
2. THE SYSTEM SHALL include trilingual names (en/si/ta) for every category. ✅
3. THE SYSTEM SHALL nest Solar sub-categories under the Solar parent. ✅

## Requirement 2 — Manage categories (admin)
**User story:** As an admin, I manage categories/sub-categories. *(CAT-02)*
**Acceptance criteria (EARS):**
1. WHEN an admin creates/updates/deactivates a category, THE SYSTEM SHALL persist it. ⬜ (admin endpoints — later sprint)
2. THE management endpoints SHALL be admin-only (403 otherwise). ⬜

## Implementation notes (as built)
- `GET /api/v1/categories` → `CategoriesService.tree()` builds the tree from the
  `categories` table (`apps/api/src/categories/`).
- Returns `{ id, key, name:{en,si,ta}, children[] }`.
- Admin CRUD (Req 2) is intentionally deferred to the Admin sprint (Sprint 5).

## Status
Req 1 ✅ built & verified (12 roots + 7 Solar children).  Req 2 ⬜ pending (admin sprint).
