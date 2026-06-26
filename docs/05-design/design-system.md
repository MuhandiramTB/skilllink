# Design System & UX Notes — SkillLink LK

**BMAD Agent:** `ux-expert` · **Owner:** UX/UI Designer
**Inputs:** PRD, personas, journeys · **Tools:** Figma, Miro

> This is the design intent that guides UI build. High-fidelity files live in Figma;
> this doc is the committed source of truth for tokens, patterns, and trilingual rules.

## Principles
1. **Mobile-first, thumb-friendly** — primary actions in the bottom third.
2. **Low-bandwidth** — skeleton loaders, lazy media, compressed images, offline-tolerant booking draft.
3. **Trilingual** — every screen tested in Sinhala, Tamil, English; allow longer Tamil/Sinhala strings (no fixed-width text).
4. **Trust cues** — verified badge, ratings, completion photos, masked-call indicator prominent.

## Design tokens (starter — refine in Figma)
| Token | Value | Use |
|-------|-------|-----|
| color.primary | #0F766E (teal) | trust, primary actions |
| color.accent | #F59E0B (amber) | highlights, ratings |
| color.success | #16A34A | completed/verified |
| color.danger | #DC2626 | errors/cancel |
| radius.base | 12px | cards/buttons |
| font | Inter (Latin) + Noto Sans Sinhala/Tamil | trilingual |

## Core screens (wireframe checklist)
- Language picker → OTP login
- Home: category grid (incl. Solar tile) + "near me"
- Issue capture: description + photo/video + location
- Match results: ranked cards (badge, rating, distance, price)
- Booking detail + live status + masked chat
- Payment → review
- Provider: onboarding wizard, verification status, availability toggle, job inbox, earnings
- Admin: verification queue, disputes, analytics

## Accessibility
WCAG 2.1 AA: contrast, focus states, labels, 44px tap targets, screen-reader labels via i18n keys.

## Handoff
Figma link + this doc → Dev. Components map to a Tailwind-based UI kit in `apps/web/components`.
