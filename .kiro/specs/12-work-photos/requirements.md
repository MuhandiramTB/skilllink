# Requirements — Provider Work-Photos Portfolio (EPIC WPH)

**Spec:** `12-work-photos` · **Status:** Ready to build (Sprint 6)
**Traces to PRD:** TRUST-01 · **SRS:** FR-PRV7
**Depends on:** `02-provider-onboarding`, `04-matching-engine`

## Introduction
Providers upload real photos of past jobs to a **work-photos portfolio**. These show on
the public provider profile and on the match card **before** the customer books — the
strongest trust/conversion signal in home services (customers book what they can see).
Photos are validated client-side (JPEG/PNG/WebP, ≤ 5 MB, resized) and stored as the
existing pipeline does. Distinct from `booking_media.completion_photo` (per-job evidence).

---

## Requirement 1 — Provider adds a work photo
**User story:** As a provider, I upload photos of jobs I've completed so customers can see the quality of my work. *(TRUST-01)*
**Acceptance criteria (EARS):**
1. WHEN a provider posts a photo (validated image URL/data-URL, optional caption + category) to their portfolio, THE SYSTEM SHALL store a `provider_photos` row and return it.
2. IF the requester is not a provider, THEN THE SYSTEM SHALL return `403` (`FORBIDDEN`).
3. IF the provider already has 12 photos, THEN THE SYSTEM SHALL return `400` (`PHOTO_LIMIT_REACHED`).
4. IF the `url` is empty, THEN THE SYSTEM SHALL return `400` (`VALIDATION_ERROR`).

## Requirement 2 — Provider removes a work photo
**User story:** As a provider, I delete a photo I no longer want shown.
**Acceptance criteria (EARS):**
1. WHEN a provider deletes a photo they own, THE SYSTEM SHALL remove the row and return `{ ok: true }`.
2. IF the photo does not belong to the requester, THEN THE SYSTEM SHALL return `403`/`404`.

## Requirement 3 — Customer sees work photos
**User story:** As a customer choosing a provider, I see their work photos so I can pick with confidence. *(TRUST-01)*
**Acceptance criteria (EARS):**
1. THE public profile (`GET /providers/:id`) SHALL include `photos[]` (newest first, url + caption).
2. THE matching result SHALL include `photoCount` and `coverPhoto` (newest photo URL or null) per provider so the match card can show a thumbnail.

## Non-functional
- Image validation (type + 5 MB cap) is enforced client-side via `lib/image.ts`; the API trusts the validated payload (consistent with avatar + verification doc uploads in v1).
- Portfolio cap: 12 photos per provider.
