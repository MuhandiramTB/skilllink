# ADR-0002: Single PWA with role-based sections (customer / provider / admin-owner)

**Status:** Accepted · **Date:** 2026-06-19 · **Deciders:** Owner, Architect, PM

## Context
Three audiences need interfaces: **customers** (find & book), **providers** (onboard,
get jobs, earn), and the **business owner / admin** (manage master data — categories,
sub-services, districts — plus verification, disputes, analytics). We must decide whether
to build one app or several.

## Decision
Build **one Next.js PWA** (`apps/web`) with **role-based sections**, not separate apps:

```
apps/web
├── /                 → Customer area  (public + customer role)
├── /provider/*       → Provider area  (role = provider)
└── /admin/*          → Admin/Owner area (role = admin)   ← master-data lives here
```

- Login resolves the user's `role` (`users.role`: customer | provider | admin).
- The web app shows only the section(s) allowed for that role; the API enforces role on
  every endpoint (guards) — the UI gate is convenience, the API gate is security.
- Shared design system, i18n (si/ta/en), and API client across all three areas.

## Master-data ownership (the owner's control panel)
The `/admin` area is where the **business owner** maintains platform master data WITHOUT code:
| Master data | Action | Table |
|-------------|--------|-------|
| Categories & sub-services | add / edit / activate / reorder | `categories` (self-ref) |
| Districts | activate a new district (v1 Kandy → expand) | `districts` |
| Providers | approve / reject verification | `providers`, `verifications` |
| Disputes | resolve | `disputes` |
| Analytics | view KPIs & revenue | (read-only across tables) |

## Build-order consequence
The **Admin master-data console is pulled forward to Sprint 1.5** (right after Auth) so the
owner can manage categories/services/districts via UI instead of SQL. Remaining admin
features (disputes, analytics, advanced fraud) stay in Sprint 5.

## Consequences
**Positive:** one codebase, shared components, cheapest for a lean team, matches the
modular-monolith architecture; owner self-serves master data early.
**Negative:** must enforce role separation carefully (UI + API); admin code ships in the
same bundle (mitigate with route-level code-splitting and server-side role checks).

## Alternatives considered
- *Separate admin app:* more isolation but duplicate tooling and more maintenance — revisit
  if the ops team grows large or needs independent deploys.
