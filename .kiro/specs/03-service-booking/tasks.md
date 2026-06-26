# Tasks — Service Booking

**Spec:** `03-service-booking` · **Status: ✅ BUILT (Sprint 3, 2026-06-19)**.

**Implementation:** API `apps/api/src/bookings/` (BookingsService, ChatService,
booking-status state machine, chat-scrub). Web `category/[key]/page.tsx`. Prisma
`booking_media/conversations/messages` + `booking_status`/`media_kind` enums added.
Verified E2E: create→matches(verified only)→assign→accept→**masked chat (phone scrubbed)**→
in_progress→completed; illegal transition→400; cross-customer→403. 21 unit tests pass.
Realtime (Socket.IO) + payments/reviews on completion deferred to later sprints.

- [ ] **1. Prisma models** — `booking_media`, `conversations`, `messages` (bookings already present).
  - _Req: 1, 4_

- [ ] **2. Status state machine** — `BookingStatus` + `canTransition(from,to)`; guard helper.
  - _Req: 3, 5_

- [ ] **3. Create booking** — `POST /bookings` `{ categoryKey, description, lat, lng, media[]?, solarSpecs? }` → requested (PostGIS point via raw SQL).
  - _Req: 1.1, 1.2, 1.3_

- [ ] **4. Matches** — `GET /bookings/:id/matches` reuse MatchingService; empty → MATCH_NONE_IN_RADIUS.
  - _Req: 2.1, 2.2_

- [ ] **5. Assign + respond** — `POST /:id/assign` {providerId} → matched; `PATCH /:id/respond` {accept|reject} (reject → requested).
  - _Req: 2.3, 3.1, 3.2_

- [ ] **6. Status + cancel** — `PATCH /:id/status` (in_progress/completed, transition-guarded); `POST /:id/cancel`.
  - _Req: 5.1, 5.2_

- [ ] **7. Chat** — conversation per booking; `GET/POST /:id/messages`; scrub phone numbers; ownership-gated.
  - _Req: 4.1_

- [ ] **8. History + detail** — `GET /bookings?role=`; `GET /bookings/:id`.
  - _Req: cross_

- [ ] **9. Web** — `/category/[key]` (issue+location+matches+book), `/booking/[id]` (status+chat).
  - _Req: 1,2,3,4,5_

- [ ] **10. Tests + E2E + close** — unit (transitions, scrub, ownership), integration, E2E; update API spec + traceability + delivery-log.
  - _Req: all_
