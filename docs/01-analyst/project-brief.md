# Project Brief — SkillLink LK

**BMAD Agent:** `analyst`
**Owner:** Business Analyst
**Status:** Approved
**Inputs:** [Vision](../00-vision/vision.md), original research document
**Output consumed by:** PM (PRD)

---

## 1. Executive summary
SkillLink LK is a mobile-first PWA marketplace connecting Sri Lankan customers with
verified, nearby skilled service providers. It launches as a web PWA (lowest cost,
fastest to market, single codebase), pilots in one city, then scales nationally and
later to native apps. Differentiation is **trust + national multilingual coverage +
real-time geo-matching**.

## 2. Problem & opportunity
- **Customer pain:** unreliable discovery, opaque pricing, no quality guarantee, hard to compare, poor emergency availability.
- **Provider pain:** weak customer acquisition, no digital presence/reputation, fake inquiries, no central booking.
- **Opportunity:** incumbents are Colombo-centric, narrow in categories, low brand awareness, small networks, weak UX, and barely serve rural areas → room for a nationwide, multilingual platform.

## 3. Competitive landscape
| Competitor | Strength | Gap we exploit |
|-----------|----------|----------------|
| Blu.lk | Brand presence | Colombo-centric, narrow categories |
| Fixie.lk | Booking flow | Limited coverage |
| SourceTradesman | Tradesman focus | Weak UX, small network |
| Waddo | Local | Awareness |
| FindMe Service Finder | Directory | Not transactional / no trust layer |

**Our wedge:** verification + multilingual + emergency + transparent pricing + nationwide intent from day one.

## 4. Target segments
- **Customers:** homeowners, apartment residents, offices, SMBs, vehicle owners, overseas Sri Lankans managing family property.
- **Providers:** individual technicians, freelancers, workshops, small service businesses, maintenance companies.

## 5. Service categories (MVP + roadmap)
**Pilot categories:** Electricians, Plumbers, AC technicians.
**Full launch:** + Welders, Carpenters, Mechanics, Auto AC, Painters, Masons, CCTV installers, Cleaning, **Solar technicians**.
**Solar sub-categories:** Solar Installation, Solar Maintenance, Solar Cleaning, Inverter Repair, Battery Replacement, Net Metering Support, EV Charger Installation.

## 6. Goals & success criteria
| Horizon | Goal |
|---------|------|
| Validation (Phase 0) | 100+ interested users, 30+ verified providers |
| Pilot (Phase 3) | 100 providers, 1,000 customers, 500 completed jobs |
| Scale (Phase 4) | Multi-district, corporate accounts, fixed-price + subscriptions |

## 7. Constraints & assumptions
- Mobile data is the primary access channel → low-bandwidth design is mandatory.
- Trilingual content (si/ta/en) from MVP.
- Payments via PayHere/Genie (local rails).
- Lean team; modular monolith over microservices for MVP.

## 8. Key risks (full register: docs/08-management/risk-register.md)
Provider supply shortage · trust & safety · fake bookings · pricing disputes · low retention.
**Mitigations:** strong verification, support team, provider training, warranties.

## 9. Recommended approach
Do **not** start with mobile apps. Sequence: market validation → mobile-first PWA →
single-city pilot → expand categories → native Android/iOS. Solve trust, provider
acquisition, and service quality before scaling.

## 10. Phase 0 validation plan (immediate next action)
Interview 50 customers + 50 providers, validate pricing, identify highest-demand
categories, ship a landing page, run manual WhatsApp bookings.
**Deliverables:** customer insights report, provider insights report, MVP requirements.
