# c9-turn-context-live-qualification Implementation Plan

Status: READY FOR PROMPT EXECUTION

Correction: `c9-turn-context-live-qualification`  
Roadmap phase: 9  
Required unchanged package version: `0.9.10`

Exact production candidate:
`25d51a93d229e9b8cc76f56eb4b7b9afae1a5723`.

Inherited broad baseline:
`d7804684801fa8418050c34d9ef097ca1adf80b6`.

## Authority

Read:
- `BOOT.md`;
- `AGENTS.md`;
- workflow/stability/current Phase 9 qualification authority;
- `docs/planning/c9-turn-context-live-qualification/{decision-record,qualification-plan}.md`;
- `docs/tasks/c9-turn-context-convergence/{P4-live-evidence,closeout}.md`;
- turn-context P1/P2/P3 evidence as needed;
- current production/tests/qualification helpers;
- frozen three-file fixture;
- frozen Gate A and v2 live-work instruments.

## P1 — live qualification

P1 changes no production/test/fixture/instrument behavior.

### Candidate identity

Compare `25d51a...` to current HEAD.

Allow only correction planning/prompt/evidence/closeout documentation changes after the candidate.

Fail if any relevant change appears under:
- `src/**`;
- `test/**`;
- `scripts/**`;
- package/dependency/runtime config;
- qualification fixture/instrument/acceptance bytes.

Record exact changed paths proving identity.

### Fresh sanity floor

Run the currently established turn-context affected floor.

At minimum include:
- provider projection/contract;
- continuation accounting/promotion;
- context/profile/one-turn;
- mutation/recovery/Git preservation;
- TUI composition/greeting guard;
- qualification/live-work and frozen three-file hash guard;
- Phase 9 integration/v1-v2 immutability;
- typecheck;
- runner;
- diff check;
- package/root-lockfile hygiene.

Run one current Node-26 `npm test`.

Compare failing/skipped identities/signatures to the inherited controlled set.

If a new/worsened regression appears, stop before runtime/live work.

Do not rerun the archived two-tree baseline comparison while production candidate identity is exact.

### Runtime provenance

Print:
`MANUAL CHECK: LM Studio GPU Offload must show 26`.

Query `GET http://127.0.0.1:1234/api/v1/models`.

Require a non-empty loaded instance for the exact pinned model.

Capture:
- model;
- context length;
- eval batch;
- physical batch;
- parallel;
- Flash Attention;
- KV GPU offload;
- expert count.

Compare to the established Phase 9 control.

If missing or materially different, record runtime Evidence Gap/Not Green and stop before official provider work.

Record UI-only GPU Offload 26 separately:
- independently observed -> Green;
- otherwise Evidence Gap;
- do not block functional qualification solely because this UI-only field is unconfirmed.

Do not load/retune the model.

### Greeting

Exactly one official attempt through existing ordinary qualification machinery.

Input: `hi`.

Use `acceptGreetingSmoke()`.

Persist bounded `attempt.json` and `trace.json`.

If Not Green: stop.

### Three-file

Only after greeting Green.

Verify unchanged `THREE_FILE_INSPECTION_SMOKE` paths/hashes.

Prepare the unchanged frozen fixture.

Exactly one official ordinary-turn attempt using the existing frozen prompt and `acceptThreeFileSmoke()`.

Persist bounded attempt/trace.

If Not Green: stop before Gate A.

### Gate A

Only after both smokes Green.

Exactly one unchanged official frozen Gate A attempt.

Existing criteria unchanged.

Persist bounded attempt/trace.

If Not Green: stop.

### Gate B2

Only after Gate A Green.

Exactly one unchanged `greenfield-express-v2` attempt.

Do not create v3.

Persist normal bounded attempt/trace and capture continuation evidence sufficient to show whether:
- provider mutation results remain bounded;
- Git snapshot remains internal;
- selected profile/envelope promotions;
- provider input/output usage;
- frozen ordinary exhaustion recurs.

No forced promotion is required.

If Not Green: stop and leave C2 unspent.

### Gate C2

Only after B2 Green.

Exactly one unchanged `existing-express-feature-v2` attempt.

Persist bounded attempt/trace.

### P1 evidence

Create:
- `docs/tasks/c9-turn-context-live-qualification/P1-live-evidence.md`;
- `evidence/runtime.json`;
- reached smoke/gate attempt/trace pairs.

Record SHA-256 for every committed JSON.

Do not create broad baseline/candidate JSON when inherited controlled evidence remains applicable.

Do not commit raw provider streams, assistant prose logs, file bodies, unbounded Git snapshots/logs, workspaces, node_modules, dependency trees, secrets, or environment dumps.

### Final P1 validation

Re-run enough affected checks to prove evidence generation did not modify production state.

Verify:
- exact package `0.9.10`;
- no root lockfile;
- `git diff --check`;
- production candidate identity still preserved.

## P2 — closeout

P2 is evidence-only.

Read all P1 evidence/artifacts and historical turn-context evidence.

Audit:
- production candidate identity;
- inherited deterministic qualification;
- fresh sanity preflight;
- aggregate broad characterization;
- inherited broad regression delta applicability;
- loaded runtime provenance;
- UI-only GPU Offload 26 / controlled latency;
- greeting;
- three-file;
- A;
- B2;
- C2;
- artifact hashes/redaction;
- historical evidence immutability.

Create:
`docs/tasks/c9-turn-context-live-qualification/closeout.md`.

Phase 9 ready = Yes only if:
- candidate identity preserved;
- fresh preflight Green;
- no new broad regression;
- REST-visible runtime sufficient;
- greeting Green;
- three-file Green;
- A Green;
- B2 Green;
- C2 Green;
- no blocker.

GPU Offload 26 may remain Evidence Gap without blocking functional readiness.

If ready:
`next action: /closeout phase 9`.

Do not owner-close Phase 9 in P2.

## Model routing

- P1: `Sol Medium`;
- P2: `Sol Medium`.

No Terra.
