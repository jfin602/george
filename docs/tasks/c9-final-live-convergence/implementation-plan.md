# c9-final-live-convergence Implementation Plan

Status: READY FOR PROMPT EXECUTION

Correction: `c9-final-live-convergence`  
Roadmap phase: 9  
Required unchanged package version: `0.9.10`

## Authority

Read:
- `BOOT.md`;
- `AGENTS.md`;
- workflow/stability/Phase 9 authority;
- `docs/planning/c9-final-live-convergence/{decision-record,qualification-plan}.md`;
- `docs/tasks/c9-final-qualification/{report.md,failure-ledger.json}`;
- current live artifacts for Gate A/B2/C2;
- current source/tests at the actual repository HEAD.

## Current source seams

### Structured orchestration

`src/application/structured-task.ts` currently owns:
- Task Prompt parsing/routing;
- top-level INSPECT;
- bounded inspection projection;
- stage slice rendering;
- stage limits;
- task/work/validation transitions.

Current limitations:
- `renderSlice()` is consumed only at stage entry;
- inner provider continuation rounds are owned by the canonical agent loop;
- `stageEvidence` is string-based;
- any direct mutation clears all stage evidence.

### Canonical agent loop

`src/application/one-turn.ts` currently owns:
- context assembly;
- provider request/continuation lifecycle;
- tool execution;
- duplicate-read/mutation-epoch tracking;
- provider result projection;
- continuation budget/promotion;
- provider retry policy.

This is the correct seam for per-round structured alignment.

### Provider

`src/provider/lm-studio.ts` owns LM Studio wire translation and timeout normalization.

Do not put George replay-safety policy in this adapter.

### Existing retry policy

`src/application/retry.ts` already owns bounded provider retry counts/backoff.

Extend replay-safe provider-attempt classification in the application loop rather than creating a second retry system.

## P1 — deterministic mission card, evidence freshness, convergence policy

### A. Round-alignment contract

Add the smallest typed provider-independent seam that lets an application-owned structured stage supply a recomputed bounded alignment projection before each provider request.

Possible shapes include an optional submission callback/projector invoked inside the canonical provider loop. The implementation may choose a better shape after tracing current types.

Requirements:
- ordinary turns are unchanged when no projector is supplied;
- initial and continuation provider requests can receive current alignment guidance;
- alignment is recomputed after each completed tool round;
- continuation token accounting includes the actual provider-visible alignment payload;
- provider adapters remain unaware of structured TaskState.

### B. Mission-card projection

Implement a deterministic bounded projector from:
- current structured task/work state;
- applicable requirements/invariants/stops;
- current effective permission expectations;
- initial INSPECT evidence;
- valid recent local read/tool evidence;
- relevant failure evidence;
- pending George-owned validation/completion condition.

Use stable ordering and explicit bounds.

Do not make mission-card prose canonical state.

### C. Evidence freshness

Introduce the smallest ephemeral typed evidence cache needed for:
- path/resource identity;
- source/tool identity;
- safe bounded projected fact;
- mutation/freshness generation;
- valid/stale determination.

Rules:
- successful read/list/search/Git evidence enters derived cache;
- mutations invalidate affected resources only;
- a mutation of `src/app.js` must not automatically invalidate `package.json` or `test/notes.test.js`;
- evidence whose freshness cannot be safely established is omitted/reinspected;
- restart/reopen without ephemeral cache keeps existing safe behavior: re-inspect.

Avoid persisting a second task/evidence authority.

### D. No-repeat alignment

Mission card should explicitly tell the model not to repeat still-valid observations and to stop when current work-unit completion is materially satisfied so George can run validation.

Do not hard-code fixture-specific file names or exact tool sequences.

Do not ban legitimate rereads after invalidation.

### E. Convergence budgets

Refactor structured limits/policy so:
- hard stage ceiling is a true runaway guard;
- duplicate/no-progress remains strict;
- historical efficiency targets are measured separately.

Choose justified hard limits from observed Gate A/C2 needs and existing generic 32-call ceiling.

Do not make hard limits unlimited.

### F. Qualification/sweep classification

Update qualification helpers/tests only as needed so final Gate A has separate:
- functional state;
- efficiency-target result.

Historical attempts remain unchanged.

### G. P1 regression floor

Add deterministic tests for:
- per-round mission-card refresh after tool results;
- ordinary/non-structured turns unaffected;
- path-aware evidence reuse/invalidation;
- reopen without derived freshness re-inspects;
- Gate-A-shaped completion guidance;
- C2-shaped INSPECT reuse reaching a legitimate mutation before hard limit;
- strict duplicate/no-progress behavior;
- hard runaway exhaustion;
- efficiency-target miss not overriding functional Green;
- context accounting includes alignment payload;
- TaskState/permission/recovery authority unchanged.

Run affected Phase 2/4/5/8/9 floors, typecheck, runner, broad suite, diff hygiene.

P1 does not run official live workloads.

## P2 — safe incomplete provider response recovery

### A. Replay-safe attempt state

Refine the application-loop provider attempt classification.

Track enough per-attempt state to distinguish:
- no response evidence;
- provisional response-start/text/tool proposals;
- provider completion;
- tool execution from the completed round;
- canonical assistant commit;
- ambiguous external/remote effect.

Do not infer executed side effects from streamed proposals.

### B. Safe retry

Permit bounded retry of an incomplete provider branch only before any branch proposal executes or canonical assistant response commits.

On safe retry:
- retain provider.error/attempt evidence;
- discard provisional text/proposals from execution/continuation;
- do not reuse incomplete response ID;
- start fresh with same canonical pre-round input/state;
- increment retry budget/events;
- apply existing bounded backoff/cancellation.

### C. Unsafe cases

No transparent retry after:
- a tool from that branch executes;
- remote/external ambiguous side effect;
- canonical assistant commit;
- cancellation;
- retry exhaustion;
- configuration/policy failure.

### D. Permanent tests

Script:
- timeout before response;
- response.started then timeout;
- response.started + text then timeout;
- response.started + tool proposals then timeout;
- retry then successful completed response;
- timeout after executed tool/ambiguous effect does not replay;
- cancellation;
- exhausted retries;
- incomplete response ID is never reused;
- provisional proposals never execute after branch failure;
- failure evidence remains bounded/auditable.

Preserve existing provider adapter tests and Phase 5 retry/recovery semantics.

P2 does not run official live qualification.

## P3 — final five-workload Phase 9 qualification

Evidence-only except tracked reports/artifacts.

Run common validity gates, deterministic correction floors, `npm test` once, then execute exactly once each in isolated environments:

1. greeting;
2. three-file;
3. Gate A;
4. B2;
5. C2.

Do not repair between workloads.

Use pinned local model/runtime and current qualified settings.

Print:
`MANUAL CHECK: LM Studio GPU Offload must show 26`

### Gate A

Functional Green:
- exact 60-byte result;
- V1 Green;
- completed/verified TaskState;
- hidden acceptance Green;
- zero intervention;
- no hard convergence/task/run exhaustion;
- permission/recovery/framing boundaries Green.

Report separately:
- model tool calls;
- logical provider rounds;
- historical <=10 efficiency target met/missed.

### B2

Require unchanged `greenfield-express-v2` full P1/P2/P3 completion, declared validations, completed StackState, hidden acceptance, zero intervention, and no terminal provider/hard-convergence failure.

### C2

Require unchanged `existing-express-feature-v2` completed/verified TaskState, focused/broad validation, baseline preservation, hidden acceptance, zero intervention, and no hard-convergence failure.

### Evidence

Create bounded schema-2 attempt/trace evidence for every reached workload and one final report/failure ledger.

Preserve historical artifacts.

## P4 — closeout

Create `docs/tasks/c9-final-live-convergence/closeout.md`.

Audit:
- Mission Card / Alignment Projection;
- Per-Round Continuation Alignment;
- Evidence Freshness / Reuse;
- No-Repeat Convergence;
- Hard Convergence Budget;
- Efficiency Metric Separation;
- Partial Provider Timeout Recovery;
- broad suite;
- greeting;
- three-file;
- Gate A Functional;
- Gate A Efficiency Target;
- B2;
- C2;
- Evidence Auditability;
- Historical Evidence Preserved;
- Remaining Blocking Failures/Gaps;
- Overall correction;
- Phase 9 Ready For Owner Closeout.

If ready, state:
`next action: /closeout phase 9`.

Do not owner-close Phase 9 or open Phase 10.

## Model routing

- P1 — Sol High;
- P2 — Sol High;
- P3 — Sol Medium;
- P4 — Sol Medium.
