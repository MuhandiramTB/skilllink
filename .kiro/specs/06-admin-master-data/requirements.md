# Requirements — Admin Master-Data Console (EPIC ADMIN-MASTER)

**Spec:** `06-admin-master-data` · **Status:** Ready to build (Sprint 1.5)
**Traces to PRD:** MASTER-01..06 · **SRS:** FR-C2 (extends), new FR-MD*
**Steering:** `.kiro/steering/*` · **Depends on:** `01-authentication-otp` (role gating)
**Decision:** [ADR-0002](../../docs/04-architecture/decisions/0002-single-app-role-based-ui.md)

> Lets the business owner/admin maintain platform master data (categories,
> sub-services, district activation, trilingual names) through the UI — no SQL.

## Introduction
An admin-only section (`/admin`) of the PWA, backed by admin-guarded API endpoints,
where the owner manages the catalog and district coverage.

## Requirement 1 — Admin access control
**User story:** As an owner/admin, I access admin tools gated by my role. *(MASTER-01)*
**Acceptance criteria (EARS):**
1. WHEN a user with `role=admin` opens `/admin`, THE SYSTEM SHALL grant access.
2. IF a non-admin opens `/admin`, THEN THE SYSTEM SHALL redirect to the customer home (UI) AND the API SHALL return `403 FORBIDDEN` for admin endpoints.
3. THE admin API endpoints SHALL all require a valid admin access token.

## Requirement 2 — Manage categories
**User story:** As an owner, I add/edit/deactivate categories. *(MASTER-02, MASTER-06)*
**Acceptance criteria (EARS):**
1. WHEN an admin creates a category with `{ key, name_en, name_si, name_ta }`, THE SYSTEM SHALL insert it (unique `key`) and return it.
2. WHEN an admin edits a category's names or active flag, THE SYSTEM SHALL persist the change.
3. IF a duplicate `key` is submitted, THEN THE SYSTEM SHALL return `409` with code `CATEGORY_KEY_EXISTS`.
4. WHEN an admin deactivates a category, THE SYSTEM SHALL set `is_active=false`; deactivated categories SHALL NOT appear in the public `/categories` tree.
5. THE SYSTEM SHALL require all three language names (no partial i18n).

## Requirement 3 — Manage sub-services
**User story:** As an owner, I add/edit sub-services under a category. *(MASTER-03)*
**Acceptance criteria (EARS):**
1. WHEN an admin creates a category with a `parent_id`, THE SYSTEM SHALL nest it under that parent.
2. IF the `parent_id` does not exist, THEN THE SYSTEM SHALL return `400 VALIDATION_ERROR`.
3. THE SYSTEM SHALL prevent nesting deeper than 2 levels (parent → child only).

## Requirement 4 — Reorder categories
**User story:** As an owner, I reorder categories. *(MASTER-04, P1)*
**Acceptance criteria (EARS):**
1. WHEN an admin sets `sort_order` values, THE SYSTEM SHALL persist them and the public tree SHALL reflect the order.

## Requirement 5 — Manage districts (coverage)
**User story:** As an owner, I activate/deactivate a district. *(MASTER-05)*
**Acceptance criteria (EARS):**
1. WHEN an admin activates a district, THE SYSTEM SHALL set `is_active=true` and `launched_at=now()`.
2. WHEN an admin deactivates a district, THE SYSTEM SHALL set `is_active=false`.
3. THE SYSTEM SHALL list all districts with their active state for the admin.

## Non-functional acceptance
- Envelope `{ data, error }`; all admin mutations audited to `audit_log`.
- All admin endpoints role-guarded (`admin`).
- Trilingual validation enforced (Req 2.5).

## Out of scope (later admin sprint)
Disputes, analytics dashboards, fraud detection, provider verification queue
(that is in `02-provider-onboarding`).
