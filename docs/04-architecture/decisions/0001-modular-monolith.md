# ADR-0001: Modular monolith for the MVP

**Status:** Accepted · **Date:** 2026-06-19 · **Deciders:** Architect, Eng Manager

## Context
Lean team, tight timeline (8–12 week MVP), need fast iteration and low operational cost.
Future scale will pressure matching and chat.

## Decision
Build a single deployable NestJS API organized into clear modules (bounded contexts),
backed by one PostgreSQL/PostGIS database, with a Next.js PWA frontend. Keep module
seams clean enough to extract services later.

## Consequences
**Positive:** simplest deploy/observe/debug; one migration history; fastest to ship; cheap.
**Negative:** shared DB couples modules; must enforce boundaries by discipline (no
cross-module table access except via module services).
**Mitigation:** module-owned tables, service interfaces between modules, integration tests at seams.

## Extraction triggers (revisit)
Matching latency or chat connection volume exceeds single-node comfort at scale gate G2→G3.
