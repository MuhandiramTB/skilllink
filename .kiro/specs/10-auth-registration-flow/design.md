# Design — Auth & Registration Flow

**Spec:** `10-auth-registration-flow` · Mobile-first. Builds on existing OTP + providers API.

## 1. What already exists (reuse)
- OTP verify + JWT + role on the token (`session.ts`, `/auth/otp/verify`).
- Role-aware redirect (`homeForRole`) and `/login` screen.
- Provider become/verifications/service-area/categories/availability endpoints.
- Admin verification queue.

## 2. New/extended
### Data (migration 004)
- `customer_profiles.district_id` (already have full_name, default_location).
- `providers.years_experience int`, `providers.working_days text`, `providers.working_hours text`, `providers.emergency_service boolean`.

### API
| Method | Path | Purpose |
|--------|------|---------|
| PATCH | `/me/profile` | customer: `{ fullName, districtId, language, email? }` |
| GET | `/districts/public` | list active districts for the dropdown |
| PATCH | `/providers/me/details` | `{ yearsExperience, workingDays, workingHours, emergencyService }` |

(Provider category/area/verification/availability endpoints already exist — the wizard calls them per step.)

### Web routes
```
/{locale}/login              one login, role redirect, Join CTAs  (exists; refine)
/{locale}/admin/login        hidden admin login (same OTP)        NEW
/{locale}/register           customer simple registration         NEW
/{locale}/provider/register  provider multi-step wizard           NEW
```
Customer & provider areas gain a **bottom navigation** component.

## 3. Flows
**Customer:** login (new number) → if no profile → `/register` (name, district, language) → customer home.
**Provider:** login → `/provider` → if not yet a provider, "Complete registration" → `/provider/register` wizard (5 steps, resumable) → submit → pending state.
**Admin:** `/admin/login` (hidden) → OTP → if role=admin → console, else bounce.

## 4. Components
- `BottomNav` (role-aware items) — customer & provider areas.
- `RegisterCustomer` page (one short form).
- `ProviderWizard` page (stepper; each step persists via existing endpoints).
- District dropdown fed by `/districts/public`.

## 5. Validation
Customer: name ≥ 2 chars, district required, language enum. Provider: per-step required fields;
radius ∈ {5000,10000,25000}; at least NIC + selfie before submit.

## 6. Security
OTP only. Admin URL hidden + API role-guarded (hiding the URL is convenience; the guard is the boundary).

## 7. Testing
- Customer: new login → register → lands on home; missing field blocked.
- Provider: wizard completes → status pending → not in /match → admin approves → matchable.
- Role redirect: each demo account lands on the right area.
