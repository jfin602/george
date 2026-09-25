# c9-greenfield-instrument-alignment Implementation Plan

Status: READY FOR PROMPT EXECUTION

Correction: `c9-greenfield-instrument-alignment`  
Roadmap phase: 9  
Required unchanged package version: `0.9.10`

## Authority

Read:
- `BOOT.md`;
- `AGENTS.md`;
- current Phase 9 task-format/decision/qualification authority;
- current stability/workflow contracts;
- `docs/tasks/c9-mutation-intent-authority/{P2-live-evidence,closeout}.md`;
- exact v1 live-work fixtures, instrument metadata, acceptance tests, qualification runner functions, and Phase 9 integration tests.

## P1 — qualification instrument alignment only

### A. Preserve v1 immutably

Do not edit any existing:
- `greenfield-express-v1` task/README/instrument files;
- `existing-express-feature-v1` task/base/README/instrument files;
- v1 acceptance tests.

Integration tests must continue asserting their current recorded digests/versions.

### B. Add greenfield-express-v2

Create:

`test/fixtures/p9-live-work/greenfield-express-v2/`

with:
- `P1-scaffold.task.txt`;
- `P2-api.task.txt`;
- `P3-tests-docs-closeout.task.txt`;
- `README.md`;
- `instrument.json`.

Keep product behavior and dependency prerequisite unchanged.

#### P1 v2

Add top-level:

`INSPECT`
- clean repository structure;
- package/dependency state;
- Git baseline.

Remove `W1 — Inspect the clean repository`.

WORKFLOW should contain one actual work unit:
- create the minimal application skeleton.

It covers the implementation requirements and starts with Depends on: none.

Keep R3/network prerequisite truthful, but do not ask the model to perform dependency installation if the qualification harness already executes the deliberately authorized prerequisite before the stack.

#### P2 v2

Retain top-level INSPECT:
- current application source;
- package scripts.

Remove `W1 — Inspect current application behavior`.

WORKFLOW should contain one implementation unit:
- add routes and validation behavior.

Preserve API behavior and V1.

#### P3 v2

Top-level INSPECT should include:
- application routes/validation;
- existing tests;
- current documentation.

Remove:
- `W1 — Inspect implementation and tests`;
- `W3 — Validate and report`.

WORKFLOW should contain actual implementation:
- add focused tests and concise README usage documentation.

Requirements:
- node:test coverage;
- README contents.

Do not make a requirement depend on reporting George-owned validation results before validation executes.

Put completion/reporting expectations in EVIDENCE, e.g.:
- exact V1/V2 results;
- changed files;
- unmet prerequisites;
- final stack/task state.

Keep V1/V2 and deliverable behavior truthful.

### C. Add existing-express-feature-v2

Create:

`test/fixtures/p9-live-work/existing-express-feature-v2/`

Prefer a self-contained copy of the unchanged v1 `base/` bytes so the versioned instrument is independently reproducible. The recorded fixture-source digest must equal v1 if the bytes are unchanged.

Add aligned:
- `P1-tag-feature.task.txt`;
- `README.md`;
- `instrument.json`.

Task:
- retain top-level INSPECT;
- remove `W1 — Inspect frozen baseline`;
- W1 = implement validated tag behavior;
- W2 = add feature tests and docs;
- preserve behavior R1-R5;
- split current R6 so README update is a normal implementation requirement;
- move exact focused/broad validation and completion reporting into EVIDENCE.

Keep V1/V2 unchanged.

### D. Metadata/versioning

V2 metadata must identify:
- new instrument name/version = 2;
- Task Prompt format still = 1;
- new task-stack digest;
- unchanged acceptance version = 1 when behavior is unchanged;
- same dependency prerequisite;
- existing fixtureVersion remains 1 if base bytes are identical;
- existing fixtureSourceSha256 remains identical if base bytes are identical.

Do not manufacture v2 acceptance behavior merely to rename files. Reusing the v1 hidden acceptance implementation/path is acceptable and should be explicit in metadata/README.

### E. Qualification runner entry points

Keep v1 functions unchanged.

Add:
- `runGreenfieldExpressV2()`;
- `runExistingExpressFeatureV2()`.

Each must load only the correct v2 task filenames and delegate to `runLiveWorkInstrument()`.

Do not duplicate production task/stack orchestration logic.

### F. Permanent tests

At minimum prove:

VERSION IMMUTABILITY
1. v1 metadata/digests remain exactly unchanged;
2. v1 runner functions still load v1 content;
3. v2 has independent version/digest metadata;
4. v2 runners load v2 only and do not redirect v1 calls.

SEMANTIC ALIGNMENT
5. every v2 task parses as Task Prompt v1;
6. greenfield v2 stack validates;
7. greenfield P1/P2/P3 use top-level INSPECT where preflight is required;
8. no v2 WORKFLOW unit is inspection-only;
9. no v2 WORKFLOW title/prose claims special Inspect/Validate/Report stage semantics;
10. no pre-validation v2 work requirement requires exact validation results;
11. EVIDENCE owns post-validation reporting expectations.

BEHAVIORAL STABILITY
12. greenfield behavioral acceptance remains unchanged/version 1;
13. existing-app behavioral acceptance remains unchanged/version 1;
14. existing v2 base digest equals v1 when copied unchanged;
15. dependency prerequisites remain explicit;
16. hidden acceptance remains outside model-visible workspace.

RUNNER
17. `runGreenfieldExpressV2` supplies P1/P2/P3 in strict order to production stack service;
18. `runExistingExpressFeatureV2` supplies the aligned v2 task to production service.

REGRESSION FLOOR
19. Gate A deterministic/qualified boundaries remain Green without rerunning live Gate A;
20. Phase 9 integration and inherited c9 tests stay Green.

Do not add production heuristics to recognize titles.

## P2 — final B2/C2 live qualification

### Deterministic pre-gate

Require Green:
- P1 instrument version/digest/semantic tests;
- v1 immutability checks;
- v2 runner tests;
- Phase 9 integration;
- inherited c9 production regression floor;
- typecheck;
- runner;
- diff hygiene.

State explicitly:
- Gate A is inherited Green from `c9-mutation-intent-authority`;
- Gate A is not rerun;
- production execution code is unchanged by P1.

### Gate B2

Run exactly one official `greenfield-express-v2` attempt.

Use:
- pinned Qwen/LM Studio runtime;
- supported Node 26;
- unchanged user-authorized dependency prerequisite;
- production `StructuredTaskStackApplicationService`;
- v2 task stack;
- unchanged behavioral hidden acceptance v1.

Record:
- instrument version/digest;
- prerequisite result;
- per-task StackState progression;
- INSPECT calls/completion;
- mutations;
- validations;
- hidden acceptance;
- calls/rounds/tokens/context/budgets/timing;
- intervention count.

B2 Green requires:
- all three tasks completed in order;
- declared validations Green;
- StackState completed;
- hidden acceptance Green;
- zero human coding intervention;
- no task/stage exhaustion.

If B2 Not Green:
- STOP;
- do not run C2;
- do not repair implementation in P2;
- no rerun.

### Gate C2

Only after B2 Green.

Run exactly one official `existing-express-feature-v2` attempt.

Use:
- same frozen baseline bytes/fixture version 1;
- aligned v2 task;
- production `StructuredTaskApplicationService`;
- unchanged behavioral hidden acceptance v1;
- deliberate dependency/network authorization exactly as required.

C2 Green requires:
- focused validation Green;
- broad validation Green;
- completed/verified TaskState;
- baseline behavior preserved;
- hidden acceptance Green;
- zero human coding intervention;
- no task/stage exhaustion.

Create:

`docs/tasks/c9-greenfield-instrument-alignment/P2-live-evidence.md`

Include inherited Gate A Green plus B2/C2 truth.

## P3 — closeout

Create:

`docs/tasks/c9-greenfield-instrument-alignment/closeout.md`

Report:
- Implementation Complete;
- v1 Evidence Preserved;
- v2 Instrument Semantics Qualified;
- v2 Runner Qualified;
- Gate A Inherited Green;
- Gate B2 Greenfield Qualified / Not Green;
- Gate C2 Existing-App Qualified / Not Run / Not Green;
- Overall correction Qualified;
- Phase 9 Ready For Owner Closeout: yes/no.

Phase 9 Ready For Owner Closeout is Yes only if:
- inherited Gate A remains valid;
- B2 Green;
- C2 Green;
- no new blocking regression.

Do not owner-close Phase 9 or open Phase 10 in this correction.

## Validation floor

- focused instrument/qualification tests;
- Phase 9 integration;
- inherited c9 affected floor;
- `npm run typecheck`;
- `npm run test:runner`;
- `git diff --check`;
- no root `package-lock.json`.

Package remains exactly `0.9.10`.
