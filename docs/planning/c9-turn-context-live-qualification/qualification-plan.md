# Correction 9 Qualification Plan — Turn Context Live Qualification

Status: **APPROVED QUALIFICATION DIRECTION**

Date: 2026-09-26

Package remains `0.9.10`.

Starting repository HEAD:
`d8c27d13e6c1c86d53aa4d0f2f42acc7d18d5939`.

Exact production candidate:
`25d51a93d229e9b8cc76f56eb4b7b9afae1a5723`.

Inherited controlled broad baseline:
`d7804684801fa8418050c34d9ef097ca1adf80b6`.

Authority:
- `docs/planning/c9-turn-context-live-qualification/decision-record.md`;
- `docs/tasks/c9-turn-context-convergence/closeout.md`;
- `docs/tasks/c9-turn-context-convergence/P4-live-evidence.md`;
- current Phase 9 qualification/stability authority.

## Gate 0 — candidate identity

Before test or live qualification, prove that commits after `25d51a...` through the current correction contain no production-sensitive changes.

Require no differences in:
- `src/**`;
- `test/**`;
- `scripts/**`;
- `package.json`;
- dependency identity / shrinkwrap state;
- runtime/config files relevant to qualification;
- v1/v2 live-work instruments;
- hidden acceptance.

Planning/prompt/evidence/closeout documentation changes are allowed.

If candidate identity is not exact, stop with Planning needed / Evidence Gap. Do not inherit the prior deterministic or controlled-delta result across a changed candidate.

## Gate 1 — fresh sanity preflight

Against the unchanged candidate require Green:
- turn-context provider-projection tests;
- provider-grounded continuation/promotion tests;
- ordinary TUI composition/greeting deterministic guard;
- qualification/live-work helpers and three-file fixture immutability;
- Phase 9 integration and v1/v2 immutability;
- `npm run typecheck`;
- `npm run test:runner`;
- `git diff --check`;
- package exactly `0.9.10`;
- no root `package-lock.json`.

Run current `npm test` once under supported Node 26 as characterization.

Compare exact current failing/skipped identities and bounded signatures to the retained controlled set from `c9-turn-context-convergence`.

Any new/materially worsened affected failure blocks live work.

The inherited controlled broad regression delta remains Green if:
- candidate identity is exact;
- current characterization contains no new/worsened regression.

Do not rerun the old two-tree baseline/candidate experiment unless candidate identity changed or prior evidence becomes unusable.

## Gate 2 — loaded runtime provenance

Before any official provider request:

1. print `MANUAL CHECK: LM Studio GPU Offload must show 26`;
2. query LM Studio's model API;
3. require the exact pinned model;
4. require a non-empty loaded instance;
5. capture REST-visible controls.

Expected Phase 9 control:
- model: `qwen3-coder-30b-a3b-instruct@q4_k_m`;
- context length: 32,768;
- eval batch: 2,048;
- physical batch: 512;
- parallel: 1;
- Flash Attention: enabled;
- GPU KV-cache offload: enabled;
- experts: 8.

Do not load, unload, or retune the model as part of qualification unless the user explicitly performs that environment action outside the runner.

If the loaded instance is absent or REST-visible control provenance is insufficient/materially different, record bounded runtime evidence and stop before live attempts.

UI-only GPU Offload 26:
- record as Green only if independently observed;
- otherwise record Evidence Gap;
- do **not** block functional qualification when the REST-visible runtime is healthy;
- do not claim controlled latency comparison without it.

## Gate 3 — ordinary greeting smoke

Exactly one official attempt.

Use the existing production ordinary path and `runOrdinaryTurnQualification()`.

Input:
`hi`

Acceptance uses the existing `acceptGreetingSmoke()`.

Require:
- one logical provider round;
- zero model-requested tools;
- final assistant response present;
- no coding-workflow guidance;
- no exhaustion;
- zero human intervention.

Persist bounded sanitized attempt/trace evidence.

If Not Green, stop. No retry.

## Gate 4 — synthetic three-file inspection smoke

Only after greeting Green.

Use the unchanged frozen fixture and `THREE_FILE_INSPECTION_SMOKE`.

Verify all fixture hashes before execution.

Run exactly one official ordinary-turn attempt.

Acceptance uses existing `acceptThreeFileSmoke()`.

Require:
- required read paths observed;
- final response present;
- no exhaustion;
- zero intervention;
- monotonic envelope promotions if any;
- unchanged source-composition contract.

Persist bounded sanitized attempt/trace evidence.

If Not Green, stop before Gate A.

## Gate 5 — fresh Gate A

Only after both smokes Green.

Run exactly one unchanged frozen edit-plus-validation attempt.

Require:
- exact 60-byte result;
- V1 Green;
- completed/verified TaskState;
- hidden acceptance Green;
- zero intervention;
- no task/stage/correction/run-budget exhaustion;
- <=10 model-requested tool calls;
- <=10 logical provider rounds.

Persist attempt/trace.

If Not Green, stop.

## Gate 6 — fresh Gate B2

Only after Gate A Green.

Run exactly one unchanged `greenfield-express-v2` attempt.

Keep:
- v2 task stack/digest;
- acceptance;
- exact dependency prerequisite;
- production structured stack service;
- runtime/context/stage/correction/run-budget controls.

Require:
- P1/P2/P3 completed;
- declared validation Green;
- completed StackState;
- hidden acceptance Green;
- zero intervention;
- no exhaustion.

Evidence must retain enough bounded context/continuation information to show:
- provider projections remain bounded;
- internal Git snapshot does not leak into provider continuation;
- selected profile;
- envelope promotion events if any;
- provider-reported token use;
- whether the historical frozen ordinary exhaustion recurred.

No forced promotion is required.

If Not Green, stop and leave C2 unspent.

## Gate 7 — Gate C2

Only after B2 Green.

Run exactly one unchanged `existing-express-feature-v2` attempt.

Require:
- baseline behavior preserved;
- focused validation Green;
- broad declared validation Green;
- completed/verified TaskState;
- hidden acceptance Green;
- zero intervention;
- no exhaustion.

## Evidence retention

Create:
- `docs/tasks/c9-turn-context-live-qualification/P1-live-evidence.md`;
- `evidence/runtime.json`;
- `evidence/greeting/{attempt,trace}.json` if reached;
- `evidence/three-file/{attempt,trace}.json` if reached;
- `evidence/gate-a/{attempt,trace}.json` if reached;
- `evidence/gate-b2/{attempt,trace}.json` if reached;
- `evidence/gate-c2/{attempt,trace}.json` if reached.

Record SHA-256 of every committed JSON.

No new broad baseline/candidate JSON is required when exact production candidate identity is preserved. Reference the inherited controlled-delta evidence and record the fresh current broad characterization in Markdown.

Never commit raw provider streams, full assistant prose, file bodies, unbounded Git snapshots/logs, workspace copies, dependency trees, secrets, or environment dumps.

## Closeout

Create `closeout.md`.

Report:
- Production Candidate Identity Preserved;
- Prior Deterministic Qualification Reused;
- Fresh Hard Sanity Preflight;
- Aggregate Broad Suite State;
- Broad Regression Delta Still Applicable;
- Loaded Runtime Provenance;
- GPU Offload 26 / Controlled Latency;
- Greeting Smoke;
- Three-File Inspection Smoke;
- Fresh Gate A;
- Gate B2 Greenfield;
- Gate C2 Existing-App;
- Evidence Auditability;
- Historical Evidence Preserved;
- Overall correction;
- Phase 9 Ready For Owner Closeout.

Phase 9 Ready = Yes only when all functional gates above are Green and no new blocker appears.

UI-only GPU Offload 26 may remain Evidence Gap without blocking functional readiness, but controlled performance/latency claims remain unavailable.

If Phase 9 Ready = Yes, state:
`next action: /closeout phase 9`.

Do not owner-close Phase 9 in this correction.
