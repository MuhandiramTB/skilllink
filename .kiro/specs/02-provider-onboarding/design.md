# Design — Provider Onboarding & Verification

**Spec:** `02-provider-onboarding` · **Reads:** requirements.md, Architecture, DB design, Auth design
**Module:** API `providers` · Web `/provider/*` + admin verify queue

## 1. Overview
A logged-in user becomes a provider (status=pending), submits identity (NIC + selfie) and
optional certificates, sets categories + service area/radius, and toggles availability.
Admins review the verification queue and approve/reject. **Only approved + available
providers are matchable** (enforced by the Sprint-0 matching query, which already filters
`status='approved' AND is_available=true`).

## 2. Media uploads — abstraction (mock first)
Like the Firebase verifier, we abstract file storage so it's testable without Cloudinary:
```
MediaUploader (abstract)
  ├── presignUpload(kind) -> { uploadUrl, fileUrl }      // client uploads directly
  └── (MockUploader: returns a local/fake URL; CloudinaryUploader: real signed upload later)
```
Selected by env `MEDIA_UPLOADER=mock|cloudinary`. The API stores only the resulting
`fileUrl` in `verifications.media_url` — never raw bytes (steering: no raw multipart).

## 3. State machine (provider.status)
```
(user) --become provider--> pending --admin approve--> approved
                              │                         │
                              └--admin reject--> rejected (with reason)
                                              approved --admin suspend--> suspended
```
Matchable only when `approved` AND `is_available=true`.

## 4. API (NestJS `providers` module)
| Method | Path | Role | Purpose |
|--------|------|------|---------|
| POST | `/providers` | auth (customer→provider) | Become a provider (creates providers row, status=pending; flips users.role=provider) |
| GET  | `/providers/me` | provider | My provider profile + verification status |
| POST | `/providers/me/verifications` | provider | Add verification `{ type, mediaUrl }` (nic/selfie/certificate) |
| PUT  | `/providers/me/service-area` | provider | `{ lat, lng, radiusMeters }` |
| PUT  | `/providers/me/categories` | provider | `{ categoryIds[] }` |
| PATCH| `/providers/me/availability` | provider | `{ isAvailable }` |
| GET  | `/providers/:id` | public | Public profile (business name, rating, **verified flag**) |
| GET  | `/admin/verifications?status=pending` | admin | Verification queue |
| PATCH| `/admin/providers/:id/verification` | admin | `{ decision: approve\|reject, reason? }` |

## 5. Components
| Component | Responsibility |
|-----------|----------------|
| `ProvidersController/Service` | become-provider, profile, verifications, area, categories, availability |
| `MediaUploader` (+ Mock) | presigned upload abstraction |
| `AdminVerificationController/Service` | queue + approve/reject (reuses AdminGuard + AuditService) |
| Web `provider/onboarding` | wizard: identity → certs → categories → area → submit |
| Web `provider/dashboard` | availability toggle, verification status |
| Web `admin/verifications` | queue + approve/reject |

## 6. Validation
- become-provider: only a `customer` may become a provider; idempotent if already provider.
- service-area: valid lat/lng, radiusMeters 500..50000.
- categories: all ids must exist & be active.
- verification type ∈ {nic, selfie, certificate, police_clearance}.

## 7. Security
- All `/providers/me/*` require the provider to be the owner (from JWT).
- Verification media is PII → access-controlled; only the provider + admins can read it.
- Approve/reject is admin-only (AdminGuard) and audited.
- A provider cannot self-approve; status only changes via admin endpoint.

## 8. Approval logic (Req 4)
On approve: set `providers.status='approved'`; mark the pending verifications `approved`.
On reject: set `status='rejected'`, store reason on the verification rows; provider notified
(notification = out of scope here; we record reason + audit).

## 9. Error mapping
| Condition | HTTP | code |
|-----------|------|------|
| Not a provider / not owner | 403 | FORBIDDEN |
| Already a provider | 200 | (idempotent) |
| Bad area/category | 400 | VALIDATION_ERROR |
| Provider/verification not found | 404 | NOT_FOUND |

## 10. Testing
- Unit: status transitions, only-customer-can-become, matchable-gate logic.
- Integration: become→submit→set area/categories→admin approve→provider now matchable;
  reject path; 403 for non-owner; non-admin cannot approve.
- E2E: provider onboards (mock uploads) → admin approves → appears in `/match`.

## 11. Open questions
- Notifications on approval/rejection → later (FCM/SMS sprint).
- Multiple service areas per provider → schema supports it; UI does one for v1.
