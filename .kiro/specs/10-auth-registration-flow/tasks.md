# Tasks — Auth & Registration Flow

**Spec:** `10-auth-registration-flow` · Execute top-to-bottom.

- [ ] **1. Migration 004**: `customer_profiles.district_id`; `providers` add years_experience, working_days, working_hours, emergency_service. Prisma models updated.
- [ ] **2. API: customer profile** — `PATCH /me/profile` {fullName, districtId, language, email?}; `GET /districts/public`.
- [ ] **3. API: provider details** — `PATCH /providers/me/details` {yearsExperience, workingDays, workingHours, emergencyService}.
- [ ] **4. Web: customer registration** — `/register` simple form (name, district, language); on new-customer login with no profile, route here; then home.
- [ ] **5. Web: provider wizard** — `/provider/register` 5 steps (basic / service / area / verification / availability), resumable, persists per step, submit → pending.
- [ ] **6. Web: login refine** — Join-as-Customer / Join-as-Provider CTAs; hidden `/admin/login`.
- [ ] **7. Web: bottom navigation** — customer (Home/Bookings/Messages/Profile) + provider (Jobs/Earnings/Messages/Profile).
- [ ] **8. Verify + close** — role redirects; customer <30s; provider pending→approve→matchable; build green; update delivery-log + traceability.
