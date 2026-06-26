# Tasks — Admin Master-Data Console

**Spec:** `06-admin-master-data` · **Status: ✅ BUILT (Sprint 1.5, 2026-06-19)**
Depends on Auth (role guard) ✅.

**Implementation:** API `apps/api/src/admin/` (AdminGuard, AdminCategoriesService,
AdminDistrictsService, AuditService, controller). Web `apps/web/src/app/[locale]/admin/`
(layout gate + categories + districts pages) + `lib/admin-api.ts`. Dev admin seed
`db/seeds/003_seed_admin.sql`. Verified end-to-end: admin-added category appears in the
customer grid (all languages); deactivation hides it; Gampaha activation works; 403/401/409
paths confirmed; audit_log written. **Note:** automated tests (unit/integration) for admin
endpoints deferred — verified manually this sprint; add to test suite next.

- [ ] **1. API: admin module scaffold + AdminGuard (role=admin)**
  - Reuse RolesGuard from Auth; create `admin` module.
  - _Req: 1.1, 1.3_

- [ ] **2. API: categories CRUD**
  - [ ] 2.1 `GET /admin/categories` (incl. inactive).
  - [ ] 2.2 `POST` create — validate key uniqueness + all 3 names; 409 on dup.
  - [ ] 2.3 `PATCH` update names/active/sort_order.
  - [ ] 2.4 `DELETE` → soft deactivate.
  - [ ] 2.5 Sub-service nesting: parent_id must exist, depth ≤ 2.
  - [ ] 2.6 Integration tests incl. 403 non-admin, 409 dup, deactivate hides from public tree.
  - _Req: 2.x, 3.x, 4.1_

- [ ] **3. API: districts**
  - [ ] 3.1 `GET /admin/districts` list with is_active.
  - [ ] 3.2 `PATCH /admin/districts/:id` activate (sets launched_at) / deactivate.
  - [ ] 3.3 Tests.
  - _Req: 5.x_

- [ ] **4. API: audit logging**
  - Write `audit_log` on every mutation (actor, action, entity, meta).
  - _Req: NFR_

- [ ] **5. Seed a dev admin user**
  - Add `db/seeds/003_seed_admin.sql` (a `role=admin` user) so the console is reachable.
  - _Req: 1.1_

- [ ] **6. Web: /admin role gate + layout**
  - `admin/layout.tsx`: server-side role check; redirect non-admins; nav.
  - _Req: 1.1, 1.2_

- [ ] **7. Web: categories management UI**
  - [ ] 7.1 Table (active+inactive), add/edit form with trilingual name fields.
  - [ ] 7.2 Deactivate + reorder controls.
  - [ ] 7.3 Sub-service add under a parent.
  - _Req: 2.x, 3.x, 4.x_

- [ ] **8. Web: districts management UI**
  - Toggle activate/deactivate per district.
  - _Req: 5.x_

- [ ] **9. Cross-cutting**
  - Envelope; i18n keys; update API spec + traceability matrix.
  - _Req: NFR_

- [ ] **10. E2E**
  - Admin login → add category → appears in customer grid; activate a district.
  - _Req: all_

- [ ] **11. Definition of Done + delivery-log entry**
