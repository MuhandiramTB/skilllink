# Test Plan — Authentication & OTP

**Feature spec:** `.kiro/specs/01-authentication-otp/` · **Owner:** QA
**Traces:** AUTH-01..04 / FR-A1..A4

> One row per acceptance criterion. QA marks Pass/Fail and links the automated test.

## Functional cases
| # | From criterion | Test | Type | Expected |
|---|----------------|------|------|----------|
| T1 | Req1.1 | Request OTP, valid +94 number | Integration | 202, OTP triggered |
| T2 | Req1.2 | Request OTP, invalid number | Integration | 400 VALIDATION_ERROR, no OTP |
| T3 | Req1.3 | 6 OTP requests in 15 min | Integration | 6th → 429 AUTH_RATE_LIMIT |
| T4 | Req1.4 | Request OTP for existing vs new number | Integration | identical response (no enumeration) |
| T5 | Req2.1 | Verify valid Firebase token (new user) | Integration | 200, user created role=customer, tokens returned |
| T6 | Req2.2 | Inspect token lifetimes | Unit | access=15m, refresh=30d |
| T7 | Req2.3 | Verify invalid token | Integration | 401 AUTH_OTP_INVALID |
| T8 | Req2.5 | Inspect DB after verify | Integration | only refresh hash stored |
| T9 | Req3.1 | PATCH language=si | Integration | persisted, returned in profile |
| T10 | Req3.2 | PATCH language=xx | Integration | 400 VALIDATION_ERROR |
| T11 | Req4.1 | Refresh with valid token | Integration | new pair, old revoked |
| T12 | Req4.2 | Refresh with expired token | Integration | 401 |
| T13 | Req4.3 | Reuse rotated (revoked) token | Integration | all sessions revoked |
| T14 | Req5.1 | Logout | Integration | 204, session revoked |
| T15 | Req5.2 | Logout allDevices | Integration | all sessions revoked |
| T16 | Req6.2 | Call protected endpoint w/o token | Integration | 401 |
| T17 | Req6.3 | Customer calls admin endpoint | Integration | 403 FORBIDDEN |

## Non-functional cases
| # | Check | Test |
|---|-------|------|
| N1 | Envelope shape on all responses | Contract |
| N2 | Error messages are i18n keys | Integration |
| N3 | si/ta/en render on login + language screens | E2E + axe |
| N4 | Verify p95 < 400ms (excl. Firebase) | k6 |

## E2E journey
T-E2E: request → verify → /me → refresh → logout (Playwright, Firebase emulator).

## Sign-off
QA lead signs when T1–T17 + N1–N4 + T-E2E pass and DoD is met.
