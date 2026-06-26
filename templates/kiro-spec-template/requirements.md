# Requirements — <FEATURE NAME> (EPIC <CODE>)

**Spec:** `<NN-feature>` · **Status:** Draft
**Traces to PRD:** <STORY IDs> · **SRS:** <FR IDs>
**Steering:** `.kiro/steering/{product,tech,structure}.md`

> Use EARS: `WHEN <trigger> THE SYSTEM SHALL <response>` (also `WHILE`, `IF…THEN`).
> Every criterion must be independently testable.

## Introduction
<1–2 sentences: what this feature does and for whom.>

## Glossary
- <term> — <definition>

## Requirement 1 — <title>
**User story:** As a <role>, I want <goal>, so that <benefit>. *(<STORY ID>)*

**Acceptance criteria (EARS):**
1. WHEN <trigger>, THE SYSTEM SHALL <response>.
2. IF <condition>, THEN THE SYSTEM SHALL <response>.
3. WHILE <state>, THE SYSTEM SHALL <response>.

## Requirement 2 — <title>
**User story:** As a <role>, I want <goal>, so that <benefit>. *(<STORY ID>)*
**Acceptance criteria (EARS):**
1. …

## Non-functional acceptance
- Responses use envelope `{ data, error }`.
- User-facing strings are i18n keys (si/ta/en).
- <perf/security targets relevant to this feature>.

## Out of scope
- <explicitly excluded items>
