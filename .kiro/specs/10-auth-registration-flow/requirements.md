# Requirements — Auth & Registration Flow

**Spec:** `10-auth-registration-flow` · **Status:** Ready to build
**Decision:** [ADR-0004](../../docs/04-architecture/decisions/0004-auth-registration-flow.md)
**Builds on:** `01-authentication-otp` (OTP + JWT already done)
**Traces to PRD:** AUTH-01/02, PROV-01..05

## Introduction
A single mobile-first OTP login that role-routes users, a sub-30-second customer
registration, and a multi-step provider registration that ends in `pending` for admin review.

## Requirement 1 — Single login, role-aware redirect
1. THE SYSTEM SHALL present one login screen (phone → OTP) for all roles.
2. WHEN a user verifies OTP, THE SYSTEM SHALL redirect by `users.role`: customer→customer home, provider→provider dashboard, admin→admin console.
3. THE login screen SHALL offer "Join as Customer" and "Join as Service Provider" entry points.
4. THE admin login SHALL be reachable only at a hidden `/admin/login` URL, not linked from public pages.

## Requirement 2 — Customer registration (simple, < 30s)
1. WHEN a new customer signs in, THE SYSTEM SHALL collect full name, district, and language (mobile already verified by OTP).
2. THE email and profile photo SHALL be optional.
3. THE SYSTEM SHALL persist these to the user/customer profile and then route to the customer home.
4. IF required fields are missing, THEN THE SYSTEM SHALL block completion with inline guidance.

## Requirement 3 — Provider registration (multi-step, < 10 min)
1. THE SYSTEM SHALL guide the provider through ordered steps: (1) basic info, (2) service info (category + sub-categories + years of experience), (3) service area (location + radius 5/10/25 km), (4) verification uploads (NIC front/back, selfie, certificates; business reg optional), (5) availability (days, hours, emergency flag).
2. THE provider SHALL be saved with status `pending` and SHALL NOT be matchable until an admin approves.
3. THE SYSTEM SHALL allow resuming a partially-completed registration.
4. WHEN all required steps are complete, THE SYSTEM SHALL submit for verification and show a "pending review" state.

## Requirement 4 — Role-based home & navigation
1. THE customer area SHALL show a bottom nav: Home · Bookings · Messages · Profile.
2. THE provider area SHALL show a bottom nav: Jobs · Earnings · Messages · Profile, plus an online/offline (availability) control.
3. Navigation SHALL be mobile-first.

## Non-functional
- Mobile-first; trilingual (si/ta/en); envelope `{data,error}`; OTP only (no passwords).
- Customer registration target < 30s; provider verification target < 10 min.

## Out of scope (later)
Google sign-in, WhatsApp OTP, admin MFA, in-app messaging backend (Messages tab links to existing per-booking chat for now).
