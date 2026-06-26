# Design — Admin Master-Data Console

**Spec:** `06-admin-master-data` · **Reads:** requirements.md, ADR-0002, Auth design
**Modules:** API `admin` module · Web `/admin` section

## 1. Overview
Admin-guarded REST endpoints for category/sub-service/district CRUD, plus an `/admin`
section in the PWA. Reuses the existing `categories` and `districts` tables (no schema
change). All writes are audited.

## 2. API (NestJS `admin` module) — all require role=admin
```
GET    /api/v1/admin/categories                 list (incl. inactive)
POST   /api/v1/admin/categories                 create { key, name_en, name_si, name_ta, parent_id?, sort_order? }
PATCH  /api/v1/admin/categories/:id             update { name_*?, is_active?, sort_order? }
DELETE /api/v1/admin/categories/:id             soft-deactivate (is_active=false)
GET    /api/v1/admin/districts                   list all with is_active
PATCH  /api/v1/admin/districts/:id               { is_active }  (sets launched_at on activate)
```
Public `GET /categories` already filters `is_active=true` (built Sprint 0) — deactivation hides items automatically.

## 3. Web (`apps/web/src/app/[locale]/admin/`)
```
/admin                      → dashboard (links)
/admin/categories           → table: add/edit/deactivate/reorder, trilingual name fields
/admin/districts            → list with activate/deactivate toggles
```
- Server-side role check in an `admin/layout.tsx` (reads session; redirects non-admins).
- Forms post to the admin API via the existing API client (with the admin's access token).

## 4. Components
| Component | Responsibility |
|-----------|----------------|
| `AdminGuard` (API) | NestJS RolesGuard requiring `admin` |
| `AdminCategoriesController/Service` | category CRUD + validation |
| `AdminDistrictsController/Service` | district activation |
| `AuditService` | write `audit_log` on every mutation |
| Web `admin/layout.tsx` | role gate + nav |
| Web `CategoryForm`, `CategoryTable`, `DistrictToggle` | UI |

## 5. Validation
- `key`: lowercase, dot/underscore allowed (e.g. `solar.ev_charger`), unique.
- All three names required (non-empty).
- `parent_id`: must exist and be top-level (depth ≤ 2).

## 6. Security
- Every endpoint behind `RolesGuard('admin')` (depends on Auth spec).
- Mutations → `audit_log` (actor, action, entity, before/after in `meta`).
- Web role gate is convenience; API is the real boundary.

## 7. Error mapping
| Condition | HTTP | code |
|-----------|------|------|
| Non-admin | 403 | FORBIDDEN |
| Duplicate key | 409 | CATEGORY_KEY_EXISTS |
| Bad parent / names | 400 | VALIDATION_ERROR |
| Not found | 404 | NOT_FOUND |

## 8. Testing
- Unit: validation, depth limit, key uniqueness.
- Integration: each endpoint incl. 403 for non-admin, 409 dup, deactivation hides from public tree.
- E2E: admin logs in → adds a category → it appears in customer grid; activates a district.

## 9. Open questions
- Seed a first admin user? → yes, add a dev seed (`role=admin`) so the console is reachable.
