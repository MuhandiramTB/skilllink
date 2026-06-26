---
inclusion: always
---

# Product Steering — SkillLink LK

**What we are building:** A mobile-first PWA marketplace that connects Sri Lankan
customers with verified nearby skilled service providers (electricians, plumbers,
AC/auto technicians, carpenters, welders, masons, painters, CCTV installers,
cleaners, and solar technicians).

**Who it serves:**
- **Customers** — homeowners, apartment residents, offices, small businesses,
  vehicle owners, and overseas Sri Lankans managing family property.
- **Providers** — individual technicians, freelancers, workshops, small service businesses.
- **Admins** — operations team handling verification, disputes, and analytics.

**Core promise:** *"Find verified skilled professionals near your location within minutes."*

**Non-negotiable product principles (apply to every feature):**
1. **Trust first.** Every provider-facing flow assumes verification matters. Never
   surface an unverified provider as "verified."
2. **Mobile-first & low-bandwidth.** Sri Lankan users are on mobile data. Pages must
   work on 3G; images lazy-load; payloads stay small.
3. **Multilingual.** All user-facing copy must support Sinhala (si), Tamil (ta),
   and English (en). Never hard-code user-facing strings.
4. **Location is central.** Matching is geo-based; always respect provider service radius.
5. **Transparent money.** Pricing, commission, and payout must always be explainable to the user.

**Out of scope for MVP:** native Android/iOS apps, in-app video calls, subscription
billing, advertising platform. (These come in later phases.)
