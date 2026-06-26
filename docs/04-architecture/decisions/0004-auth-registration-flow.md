# ADR-0004: Authentication & registration flow (single login, role-aware, OTP)

**Status:** Accepted · **Date:** 2026-06-19 · **Deciders:** Owner, Architect, UX
**Supersedes parts of:** ADR-0002 (login UX), confirms ADR-0003 (OTP-only)

## Context
A detailed UX spec was provided for the entry experience. It was reconciled against the
built system; three points conflicted and were decided by the owner.

## Decisions
1. **Single login screen, role-aware redirect.** One OTP sign-in for everyone. After verify,
   the app reads `users.role` and redirects: customer → customer area, provider → provider
   dashboard, admin → admin console. Users never pick a role to log in.
   ```
   if (role === 'customer') → /{locale}/bookings      (customer home)
   if (role === 'provider') → /{locale}/provider       (provider dashboard)
   if (role === 'admin')    → /{locale}/admin          (admin console)
   ```
2. **OTP only — no passwords, including admin.** Admin uses the same phone-OTP via a
   *hidden* URL (`/admin/login`) not linked from public pages. (Owner chose this over the
   spec's email+password+MFA, to keep one auth system — consistent with ADR-0003 and the
   spec's own "one users table / don't build three auth systems" recommendation.) MFA-over-OTP
   can be added later.
3. **No Google sign-in for v1.** Phone OTP is universal for the Sri Lankan audience. Revisit
   if demand appears.
4. **Brand color stays Teal** (#0F766E) — the existing trust palette, not the spec's blue.

## Registration flows (from the spec, adopted)
- **Customer (simple, < 30s):** full name, mobile (OTP), district, language. Optional: email,
  photo. Created on first OTP verify with sensible defaults; a short profile step captures
  name/district/language.
- **Provider (multi-step, < 10 min):**
  1. Basic info (name, mobile, email?, photo?)
  2. Service info (category, sub-categories, years of experience)
  3. Service area (location + radius 5/10/25 km)
  4. Verification (NIC front/back, selfie, certificates, business reg optional)
  5. Availability (working days, hours, emergency service)
  Provider stays `pending` until an admin approves; only then matchable.

## Data model
One `users` table with `role ∈ {customer, provider, admin}` (already built). Provider detail
in `providers` + related tables. New optional columns added for the spec's fields
(experience, availability, customer full_name/district) — see migration 004.

## Consequences
**Positive:** one auth system; fast customer onboarding; thorough provider vetting; matches
the built backend. **Negative:** admin has no password "feel" — mitigated by hidden URL +
future OTP-MFA. Provider wizard is longer — acceptable for trust.

## Mobile-first
All auth/registration screens are designed mobile-first (primary audience is on smartphones);
bottom navigation per role (customer: Home/Bookings/Messages/Profile;
provider: Jobs/Earnings/Messages/Profile).
