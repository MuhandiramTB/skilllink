# User Journeys — SkillLink LK

**Owner:** Business Analyst · **Consumed by:** UX, Dev, QA

---

## J1 — Customer books a service (happy path)
```
Open PWA → pick language → phone OTP login → choose category (e.g., AC repair)
→ describe issue + upload photos → share GPS location → see ranked matches
→ compare ratings/price/distance → book provider → provider accepts
→ chat (masked) → track live status → job done + completion photos
→ pay (PayHere) → rate & review
```
**Emotional peaks:** trust at "see verified matches"; relief at "completion photos"; satisfaction at "review".
**Failure branches:** no providers in radius → widen radius / notify when available; OTP fail → resend/limit; payment fail → retry.

## J2 — Overseas customer (Priya)
```
English UI → login → book for family address (manual location pin) → provider accepts
→ remote chat → completion photos as proof → online payment → review
```
Key need: proof + remote payment.

## J3 — Provider onboarding (Sunil)
```
Register → submit NIC + selfie → upload certs → pick categories + service area/radius
→ submit for verification → (admin reviews) → approved → set availability → receive job
→ accept → complete → upload completion photos → get paid → view earnings
```
Gate: cannot receive jobs until **admin-approved**.

## J4 — Solar job (Fathima + customer)
```
Customer picks Solar → sub-category (e.g., Inverter Repair) → enters system details (kW, inverter brand)
→ matched to certified solar providers → Fathima reviews specs → quotes accurately → books → completes
```

## J5 — Admin verification & dispute (Ayesha)
```
Open verification queue → review NIC/selfie/certs → approve/reject (with reason)
→ monitor bookings → handle dispute (evidence from chat + photos) → resolve → analytics review
```

> Each journey maps to PRD epics: J1/J2 → BOOK/MATCH/PAY/REV; J3 → PROV; J4 → SOLAR; J5 → ADMIN.
