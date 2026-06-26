# BMAD Agent Personas & Workflow

BMAD (Breakthrough Method of Agile AI-Driven Development) runs the project as a
team of specialized AI agents, each with a clear role, inputs, and outputs. You
"become" an agent by adopting its persona, then produce its deliverable.

## The planning pipeline (run once up front, refine each phase)

```
analyst → pm → architect → po (validate) → sm (shard into stories) → dev + qa (build/verify)
```

| Agent | Persona | Reads | Produces |
|-------|---------|-------|----------|
| `analyst`   | Curious market researcher | Vision | Project Brief, market research |
| `pm`        | Decisive product manager | Project Brief | PRD (epics + stories + NFRs) |
| `architect` | Pragmatic systems designer | PRD | Architecture, DB design, API spec, ADRs |
| `po`        | Detail-obsessed product owner | PRD + Architecture | Validated, consistent docs; acceptance criteria |
| `ux-expert` | User-empathetic designer | PRD + personas | Design system, wireframes, prototype notes |
| `sm`        | Process-driven scrum master | PRD + Architecture | Sharded epics → ready-to-build stories, sprint plan |
| `dev`       | Disciplined fullstack engineer | A story + its Kiro spec | Working, tested code |
| `qa`        | Skeptical quality engineer | Story + acceptance criteria | Test plan, sign-off / defects |

## How to invoke an agent (with Claude Code / any AI)

> "Act as the **BMAD `architect`** agent. Read `docs/02-product/PRD.md` and
> `.kiro/steering/*`. Produce/refine `docs/04-architecture/system-architecture.md`
> following the structure already in that file. Stay within MVP scope."

## Handoff rule
An agent may only start when its inputs exist and are validated by the previous
agent. The `po` agent gates the transition from *planning* (docs/) to *building*
(.kiro/specs/). The `sm` agent is what bridges a PRD story into a Kiro spec.
