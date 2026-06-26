# Design — <FEATURE NAME>

**Spec:** `<NN-feature>` · **Reads:** requirements.md, Architecture, DB design
**Module:** `<module>` (NestJS)

## 1. Overview
<How it works, end to end. Reference the relevant architecture decisions.>

## 2. Sequence / flow
```
<ASCII sequence or step list of the main flow>
```

## 3. Components
| Component | Responsibility |
|-----------|----------------|
| <Controller> | routes + DTO validation |
| <Service> | business logic |
| <...> | |

## 4. Data
<Tables/columns used or added; link to database-design.md. Note migrations needed.>

## 5. API contracts
- `<METHOD> <path>` `<request>` → `<status> { data: ... }`

## 6. Validation
<Zod/DTO rules per field.>

## 7. Security
<AuthZ roles, rate limits, PII handling, masking — as applicable.>

## 8. Error mapping
| Condition | HTTP | code |
|-----------|------|------|

## 9. Testing approach
<Unit / integration / E2E / non-functional notes.>

## 10. Open questions
- <decisions to confirm>
