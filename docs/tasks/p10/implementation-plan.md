# Phase 10 Implementation Plan — Agent Loop Throughput

Status: READY FOR PROMPT EXECUTION

Phase: 10  
Baseline: `0.10.0`

## Cross-phase invariants

All prompts preserve:
- Task Prompt v1;
- canonical TaskState/StackState;
- George-owned validation/completion;
- permission/containment ceilings;
- replay safety and ambiguous-effect handling;
- response-completion-before-side-effect semantics unless explicitly requalified;
- evidence freshness;
- duplicate/no-progress;
- session/evidence durability;
- frozen Phase 9 evidence;
- package-lock absence.

## Optimization ledger

P1 creates `docs/tasks/p10/optimization-ledger.md`.

Every P2-P9 prompt appends:
- optimization identity;
- baseline candidate/artifact;
- candidate change;
- focused correctness;
- benchmark/live comparison;
- intended metric;
- observed delta;
- disposition: accept / revise / revert;
- accepted baseline commit/artifact after disposition.

A reverted experiment still advances the phase version with code returned to the prior accepted production behavior plus tests/evidence documenting the rejection.

## P1 plan

### Telemetry
Extend benchmark/live-work schema compatibly for:
- cached input tokens when reported;
- Human/Operation round counts when introduced later;
- internal text amount;
- tool batch counts/width;
- concurrent read batches/timing;
- rounds avoided;
- George controls;
- correction cycles.

Fields unavailable before later prompts remain null/zero with clear semantics rather than fabricated measurements.

### B3/C3
Create `test/fixtures/p10-live-work/` plus independent hidden acceptance.

B3 should be pure Node and materially smaller than B2.

C3 should be a tiny existing pure-Node repo and materially smaller than C2.

Freeze instrument metadata/digests before first official run.

### Baseline
Capture:
- quick benchmark;
- full benchmark once if runtime is valid;
- fast live matrix once;
- exact runtime/Git/model provenance.

Do not run B2/C2.

## P2 plan — useful-output watchdog

Refine provider activity seam to classify:
- accepted;
- useful output progress.

`response.started` does not switch to active-output timeout.

Add provider-attempt timing events/metrics without exposing raw payloads.

Use fake-time deterministic tests and a focused live/benchmark comparison.

## P3 plan — stable prefix

Introduce a bounded late dynamic round-context provider field or equivalent typed seam.

Keep stable instructions byte-stable.

Ensure continuation/rebase/context-pressure accounting includes dynamic tail.

LM Studio adapter gets only wire serialization logic.

Measure cached input usage when actually reported.

## P4 plan — Operation Protocol v1

Add explicit provider/application Human versus Operation mode.

Operation mode:
- tool calls;
- George application-control output;
- no routine prose.

Add non-executable `handoff`.

Do not require handoff when George can deterministically advance from a completed tool result.

Do not execute provisional control/tool calls before response completion.

Run fast B3/C3 after this major behavior change.

## P5 plan — deterministic round elimination

Trace every structured provider call.

Remove only boundaries where George already owns all state/authority.

Instrument `modelRoundsAvoided`.

Add regressions for validation, work-unit, stack, cancellation, budget, approval, and recovery transitions.

## P6 plan — batching

Introduce a batch abstraction around the existing per-response `calls[]`.

Validate/effect-classify every member.

Execute sequentially.

Return provider results in original call order.

Measure batch width/compression.

Use `independent-multi-tool-001` and deterministic mixed-success tests.

## P7 plan — concurrency

Add dependency-safe scheduler for replay-safe local reads only.

Do not infer safety from tool name alone; use canonical effect/replay metadata plus dependency rules.

Execute safe members concurrently.

Normalize results in provider call order.

Use delayed deterministic fixtures to prove overlap.

No concurrent mutations/processes/approvals/external effects.

## P8 plan — correction

Build focused correction frame from current TaskState/freshness/failed validation.

Avoid broad reinspection by default.

After repair, George reruns failed validation directly.

Reinspect only stale/unknown evidence.

Exercise induced-failure B3 variant and deterministic correction tests.

## P9 plan — output budgets/cleanup

Add provider-independent per-mode output policy only where adapter support is explicit.

Protect function/control payload capacity.

Audit remaining internal text/model rounds.

Retain limits only with correctness + measured benefit.

Run quick benchmark + fast live matrix.

## P10 plan — primary-only milestone

Freeze final accepted primary-only candidate.

Run:
- affected deterministic floors;
- typecheck/runner/broad;
- quick/full benchmark;
- selected agentic-context workload(s);
- fast live matrix;
- B2 exactly once;
- C2 exactly once.

Preserve every result.

No repair between B2/C2.

Record cumulative deltas from P1 baseline.

## P11 plan — helper A/B

Use one narrow helper role, preferably evidence/result compression or relevance selection.

Run the same bounded fixture primary-only and helper-assisted.

Helper cannot own tools/permissions/TaskState/validation/completion.

Do not promote helper to production in Phase 10.

## P12 plan — closeout

Create `docs/phase-10-closeout.md`.

Report:
- optimization ledger;
- accepted primary-only baseline;
- cumulative deltas;
- fast live state;
- benchmark state;
- B2/C2 milestone state;
- helper A/B;
- remaining gaps;
- Phase 11 readiness.

Do not owner-close Phase 10.
