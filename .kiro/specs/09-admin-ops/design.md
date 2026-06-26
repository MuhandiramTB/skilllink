# Design — Admin Operations (Disputes & Analytics)

**Spec:** `09-admin-ops` · **Module:** API `admin-ops` · Web `/admin/disputes`, `/admin/analytics`

## 1. API
| Method | Path | Role | Purpose |
|--------|------|------|---------|
| POST | `/bookings/:id/dispute` | participant | `{ reason }` → open dispute |
| GET | `/admin/disputes?status=open` | admin | dispute queue |
| PATCH | `/admin/disputes/:id` | admin | `{ resolution }` → resolved (audited) |
| GET | `/admin/analytics` | admin | KPI snapshot |

## 2. Data
`disputes` (booking_id, opened_by, status, resolution, resolved_by). Analytics derived via
aggregate SQL over bookings/payments/providers/users/districts (no new tables).

## 3. Analytics query (illustrative)
```sql
bookings by status (count grouped), completed count,
gross = SUM(amount_cents) FILTER paid, commission = SUM(commission_cents) FILTER paid,
providers approved/pending counts, customers count, active districts count
```

## 4. Security
- dispute open: participant-only (booking customer or provider).
- dispute queue/resolve + analytics: AdminGuard.
- resolve audited via AuditService.

## 5. Errors
| Condition | HTTP | code |
|-----------|------|------|
| Not participant | 403 | FORBIDDEN |
| Open dispute exists | 409 | DISPUTE_EXISTS |
| Not admin | 403 | FORBIDDEN |

## 6. Testing
- Unit: participant check; existing-open guard; analytics aggregation shape.
- Integration: open→queue→resolve; non-admin blocked; analytics returns expected keys.
