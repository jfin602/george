# c9-turn-context-convergence Implementation Plan

Status: READY FOR PROMPT EXECUTION

Correction: `c9-turn-context-convergence`  
Roadmap phase: 9  
Required unchanged package version: `0.9.10`  
Controlled broad baseline: `d7804684801fa8418050c34d9ef097ca1adf80b6`

## Authority

Read:
- `BOOT.md`;
- `AGENTS.md`;
- `docs/workflow.md`;
- `docs/architecture.md`;
- `docs/stability-contract.md`;
- current Phase 9 decision/qualification authority;
- `docs/planning/c9-turn-context-convergence/{decision-record,qualification-plan}.md`;
- `docs/tasks/c9-qualification-preflight-scope/{P2-live-evidence,closeout}.md`;
- official B2 `attempt.json` / `trace.json`;
- exact current source/tests at each prompt.

## P1 — canonical/provider result projection

### Reproduce first

Add deterministic evidence showing that a canonical mutation result containing a realistic large Git snapshot can materially inflate provider continuation if forwarded unchanged.

Do not depend on Qwen.

Keep the reproduction focused on the real tool-result path.

### Introduce one generic projection seam

Preferred architecture:
- canonical execution result remains the authoritative result emitted through normal application/session/tool events;
- the tool registry/definition or another single provider-independent application seam can derive a bounded provider result from the canonical result;
- tools without a specialized projection preserve their existing bounded result unless an internal-only metadata case requires otherwise;
- the agent loop accumulates provider-projected results for continuation and size accounting, not canonical internal results.

Avoid hard-coding scattered `if (toolName === ...)` branches in provider adapters.

The provider adapter remains a wire serializer, not projection authority.

### Mutation projection

For successful `write_file` / `apply_patch`, provider-visible output retains:
- name if currently useful;
- path;
- bytes;
- resulting SHA-256.

Exclude canonical `git` snapshot.

For `create_directory`, retain bounded path/created outcome.

For known failures, preserve bounded error code/message.

Canonical events and workflow consumers must still see full canonical mutation results including Git evidence.

### Tests

Prove:
- canonical result unchanged;
- provider projection deterministic;
- provider continuation excludes Git snapshot;
- mutation receipt remains usable;
- provider payload size remains bounded even with a large canonical snapshot;
- direct mutation evidence/workflow change attribution still works;
- recovery, dirty-state and text-framing/SHA tests stay Green;
- no permission/effect authority changes.

### Evidence

Create `docs/tasks/c9-turn-context-convergence/P1-provider-projection-evidence.md` with the reproduced before/after bounded sizes and deterministic test results.

No live model work.

## P2 — provider-grounded continuation and adaptive envelope promotion

### Separate initial selection from effective envelope

Keep `ContextProfileSelection` / initial context selection truthful.

Introduce a turn-local effective continuation envelope initialized to the selected profile.

Do not mutate the initial assembled context or source dispositions when the envelope promotes.

### Continuation accounting

Track the strongest observed provider usage available from each completed provider response.

Before the next continuation, use a conservative estimate based on:
- provider-reported chain input/output when available;
- current deterministic chain estimate as a lower bound/fallback as appropriate;
- newly projected provider tool results;
- explicit bounded serialization/protocol margin.

Do not double-count arbitrarily; make the formula explicit, testable, and conservative.

### Promotion

Adaptive mode:
- if current envelope is sufficient, continue;
- otherwise promote only as far as required through ordinary -> medium -> large;
- record each promotion.

Fixed mode:
- never promote;
- preserve explicit failure when the fixed envelope is exceeded.

If >large:
- fail closed before another unsafe continuation when locally knowable;
- provider-reported usage >large is terminal.

If a completed response reports usage above the current adaptive envelope but within a larger envelope:
- record promotion;
- do not retroactively fail the otherwise completed response solely because the smaller initial envelope was exceeded.

### Diagnostics

Prefer an explicit bounded application event such as `context.envelope.promoted` rather than pretending the original source-selection result changed.

Evidence should include:
- from/to profile IDs;
- reason: local continuation estimate or provider usage;
- bounded estimated/observed token value;
- new provider-input ceiling.

Update live-work trace extraction so later P4 evidence retains promotion facts without raw context bodies.

### Tests

Prove:
- ordinary -> medium;
- medium -> large;
- no demotion;
- no source reassembly;
- no provider/tool call caused by promotion;
- no semantic compaction caused by promotion;
- fixed ordinary fails instead;
- adaptive >large fails;
- provider usage can trigger promotion;
- reported usage >large fails;
- fallback without usage is deterministic;
- initial provider request remains identical across promotion;
- existing Phase 8 profile-selector/source integrity floors remain Green.

### Evidence

Create `P2-continuation-convergence-evidence.md`.

No live model work.

## P3 — ordinary TUI wiring + live-smoke instrumentation

### Production TUI composition

Replace the production startup dependency on `createCodingWorkflowApplicationService(...).agent`.

Construct the base `AgentLoopApplicationService` directly from the same resolved config/provider/approval/store/diagnostics inputs and wrap it with `StructuredTaskApplicationService`.

Preserve:
- resume/recovery;
- LocalSessionStore behavior;
- approvals;
- execution policy;
- context config;
- run budgets;
- diagnostics;
- structured task support.

Keep explicit `createCodingWorkflowApplicationService` behavior unchanged for intentional callers.

### Testable composition seam

Refactor only enough startup composition to prove production wiring without launching a native renderer or network provider in unit tests.

A small TUI composition factory is acceptable if it remains presentation wiring and does not absorb agent-loop business logic.

Tests must prove:
- ordinary production path base instructions do not contain `CODING_WORKFLOW_GUIDANCE`;
- explicit CodingWorkflow path does;
- ordinary path still exposes configured coding tools;
- structured Task Prompt behavior still wraps the same base agent;
- resume/recovery/persistence semantics remain intact.

### Greeting deterministic guard

With a scripted provider returning direct text:
- ordinary `hi` reaches one provider request;
- request instructions lack coding-workflow guidance;
- no model-requested tool is fabricated by George;
- response commits normally.

This deterministic test does not claim Qwen will use zero tools; P4 live smoke supplies that evidence.

### Live-smoke support

Add the smallest reusable qualification support necessary for two ordinary-turn live smokes:
1. greeting;
2. synthetic three-file inspection.

Reuse existing live-work sanitization/trace conventions where practical rather than creating a second logging system.

The ordinary-turn artifact must retain bounded:
- attempt ID/runtime;
- terminal state/error;
- provider attempts/rounds/retries/usage;
- tool call names/terminal states;
- context assembly;
- envelope promotions;
- timing;
- human intervention count;
- final-response presence/byte count or digest as needed for acceptance, without committing unrestricted model prose.

### Frozen synthetic fixture

Create a small correction-specific non-George Git fixture containing exactly three bounded text files:
- implementation;
- focused test;
- short README/task description.

Target roughly 4-8 KiB each where practical so the shape resembles the manual context-growth case.

Freeze its hashes in qualification metadata/tests.

This fixture does **not** establish a product maximum of three files.

### Validation

Run the complete affected deterministic floor after P1-P3 production work:
- provider/tool/registry;
- context/profile/one-turn;
- mutation/recovery/workflow;
- TUI composition;
- Phase 9 integration;
- qualification/live-work;
- typecheck;
- runner;
- broad `npm test` characterization;
- diff/version/root-lockfile hygiene.

Create `P3-tui-and-smoke-instrumentation-evidence.md`.

Do not spend official live smokes or gates.

## P4 — official scoped qualification

P4 is qualification/evidence only. No production repair.

### Hard preflight

Require Green:
- all new P1-P3 regression tests;
- context/profile-selector/one-turn floors;
- provider adapter contract;
- mutation/recovery/Git preservation;
- TUI composition;
- qualification/live-work;
- Phase 9 structured integration;
- frozen Gate A deterministic replay;
- v1/v2 instrument/digest/acceptance immutability;
- typecheck;
- runner;
- diff/version/root-lockfile hygiene.

### Controlled broad regression delta

Use baseline:
`d7804684801fa8418050c34d9ef097ca1adf80b6`.

Run baseline/current broad suites under equivalent supported conditions and classify with the existing preflight helper.

Aggregate broad state remains separate from delta.

Any new/worsened affected failure or insufficient comparison evidence blocks all live work.

### Runtime provenance

Pinned:
`qwen3-coder-30b-a3b-instruct@q4_k_m`.

Use supported Node 26.

Capture REST-visible runtime controls and print:
`MANUAL CHECK: LM Studio GPU Offload must show 26`.

Do not retune runtime/profile/stage/correction/run-budget settings.

### Live smoke A — greeting

Exactly one attempt.

Input:
`hi`

Require:
- one logical provider round;
- zero model-requested tools;
- committed direct response;
- no coding-workflow guidance;
- no exhaustion;
- zero intervention.

If Not Green: stop. Do not run smoke B or official gates.

### Live smoke B — three-file inspection

Exactly one attempt using the frozen P3 fixture.

Ask Qwen to inspect the necessary files and explain the target implementation.

Require:
- grounded successful answer;
- no context exhaustion;
- required read evidence retained;
- truthful monotonic promotion evidence if promotion occurs;
- fixed source composition;
- zero intervention.

If Not Green: stop before Gate A.

### Gate A

Exactly one fresh attempt after both smokes Green.

Existing exact criteria unchanged.

If Not Green: stop.

### Gate B2

Exactly one fresh `greenfield-express-v2` attempt after Gate A Green.

Do not create v3.

Record provider-projection sizes and envelope promotions sufficient to show the historical 28,306 > 8,192 failure is resolved rather than hidden.

If Not Green: stop; C2 unspent.

### Gate C2

Exactly one unchanged `existing-express-feature-v2` attempt only after B2 Green.

### Evidence

Create bounded:
- `P4-live-evidence.md`;
- baseline/current/delta JSON;
- runtime JSON;
- greeting `attempt.json` / `trace.json`;
- three-file `attempt.json` / `trace.json`;
- reached Gate A/B2/C2 attempt/trace JSON.

Record SHA-256 of committed evidence JSON.

No raw provider streams, file bodies, unbounded Git snapshots/logs, workspace copies, node_modules, dependency trees, secrets, or environment dumps.

## P5 — closeout

Evidence-only.

Create `closeout.md`.

Audit:
- Provider Result Projection Qualified;
- Provider-Grounded Continuation Accounting Qualified;
- Adaptive Envelope Promotion Qualified;
- Fixed-Profile Safety Preserved;
- Ordinary TUI Base-Agent Wiring Qualified;
- hard preflight;
- aggregate broad state;
- broad regression delta;
- greeting smoke;
- three-file inspection smoke;
- fresh Gate A;
- B2;
- C2;
- evidence auditability;
- historical evidence preservation;
- overall correction;
- Phase 9 Ready For Owner Closeout.

Phase 9 ready = Yes only when the correction, both smokes, A, B2, C2, and regression delta are Green with no new blocker.

If ready, state next action: `/closeout phase 9`.

Do not owner-close Phase 9 inside this stack.

## Model routing

- P1: `Sol High`;
- P2: `Sol High`;
- P3: `Sol Medium`;
- P4: `Sol Medium`;
- P5: `Sol Medium`.

The current runner supports these labels. Do not substitute Terra.
