# Kiro Specs — feature build units

Each folder is one feature with three files Kiro/AI agents and developers execute:

| File | Purpose |
|------|---------|
| `requirements.md` | WHAT & WHY — EARS acceptance criteria, traced to PRD stories |
| `design.md` | HOW — components, flow, data, API contracts, security |
| `tasks.md` | STEP-BY-STEP — ordered, checkable implementation tasks |

## Status
| Spec | requirements | design | tasks |
|------|:-----------:|:------:|:-----:|
| 01-authentication-otp | ✅ full | ✅ full | ✅ full |
| 02-provider-onboarding | 🟡 seeded | ⬜ todo | ⬜ todo |
| 03-service-booking | 🟡 seeded | ⬜ todo | ⬜ todo |
| 04-matching-engine | 🟡 seeded | ⬜ todo | ⬜ todo |
| 05-solar-services | 🟡 seeded | ⬜ todo | ⬜ todo |

**To finish a seeded spec:** complete its `requirements.md` EARS criteria, then copy
`templates/kiro-spec-template/{design,tasks}.md` into the folder and fill them.

**Reference example:** `01-authentication-otp` is fully written — copy its style.
See [docs/DEVELOPER-GUIDE.md](../../docs/DEVELOPER-GUIDE.md) for the build loop.
