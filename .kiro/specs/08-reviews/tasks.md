# Tasks — Ratings & Reviews

**Spec:** `08-reviews` · **Status: ✅ BUILT (Sprint 4, 2026-06-19)**.
API `apps/api/src/reviews/`. Verified: post-completion-only, once (409 on dup), rating recalc
0→5 **reflected live in /match score**. Web review form on completed booking. Moderation deferred.

- [ ] **1. Prisma** — `reviews` model. _Req: 1,2_
- [ ] **2. Create review** — `POST /bookings/:id/review`; completed-only; once; recalc aggregate. _Req: 1_
- [ ] **3. Recalc** — update provider `rating_avg`/`rating_count` atomically. _Req: 1.4_
- [ ] **4. Provider response** — `POST /reviews/:id/response`; owner-only. _Req: 2_
- [ ] **5. Public reviews** — `GET /providers/:id/reviews`. _Req: 3_
- [ ] **6. Tests** — recalc, completed-gate, double-review 409, response authZ. _Req: all_
- [ ] **7. Web** — review form on completed booking; show on provider. _Req: 1_
- [ ] **8. Close** — API spec + traceability + delivery-log.
