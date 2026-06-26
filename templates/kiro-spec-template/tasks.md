# Tasks — <FEATURE NAME>

**Spec:** `<NN-feature>` · **Execute top-to-bottom.** Each task names the requirement(s)
it satisfies. Check off only when the task's tests pass.

- [ ] **1. <Scaffold / setup>**
  - <subtask>
  - _Req: <id>_

- [ ] **2. <Build unit>**
  - [ ] 2.1 <subtask>
  - [ ] 2.2 <write unit tests>
  - _Req: <id>_

- [ ] **3. <Endpoint / flow>**
  - [ ] 3.1 <implement>
  - [ ] 3.2 <integration tests, incl. negative cases>
  - _Req: <id>_

- [ ] **N. Cross-cutting compliance**
  - [ ] Envelope `{ data, error }`
  - [ ] i18n keys (si/ta/en)
  - [ ] Update API spec / OpenAPI
  - [ ] Update traceability matrix
  - _Req: NFR_

- [ ] **N+1. E2E happy path**
  - <journey>
  - _Req: all_

- [ ] **N+2. Definition of Done check**
  - Run docs/06-delivery/definition-of-done.md; hand to QA.
