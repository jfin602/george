# Phase 10 Implementation Plan

Status: READY FOR PROMPT EXECUTION

## P1 — baseline, telemetry, and fast gates

- transition package into the `0.10.x` line;
- extend benchmark/live-work telemetry for Phase 10 metrics without breaking historical artifact readers;
- add immutable B3/C3 fixtures and hidden acceptance;
- add a fast-gate runner/qualification path;
- capture initial Phase 10 fast baseline;
- do not optimize agent behavior yet.

## P2 — useful-output liveness

Implement accepted/prefill/useful-output/completed liveness semantics.

Do not treat response acceptance alone as active generation.

Add provider-independent typed activity semantics and fake-time regression coverage.

## P3 — stable prefix / late dynamic context

Extend ProviderRequest with the smallest provider-independent dynamic-tail seam.

Keep stable instructions byte-stable when unchanged.

Move recomputed mission-card/control state late in the request while preserving token-pressure accounting and canonical rebase.

Qualify LM Studio request bodies and cache telemetry.

## P4 — George Operation Protocol v1

Add Human vs Operation execution mode.

Operation mode:
- no routine natural-language narration;
- normal tools remain canonical ToolRegistry capabilities;
- George control is non-executable/non-authoritative;
- no mandatory handoff round when George already knows the next transition.

Preserve response completion before tool/control acceptance.

## P5 — deterministic round elimination

Trace structured orchestration and remove provider calls for transitions George can already determine.

Add explicit observability for avoided model rounds.

Do not infer work-unit completion beyond deterministic authored/current evidence.

## P6 — multi-operation read batching

Improve operation-mode prompting/protocol so one provider round can propose a bounded set of independent observations.

Return one normalized result batch in original call order.

This prompt does not yet make execution concurrent.

## P7 — dependency-safe read-only concurrency

Execute qualified independent replay-safe observation calls concurrently.

Preserve deterministic result order, cancellation, failure isolation, budgets, duplicate-read accounting, and effect boundaries.

No mutation/process/approval/ambiguous concurrency.

## P8 — focused correction and output budgets

Build a minimal Correction Frame from failed validation and fresh evidence.

Avoid broad rediscovery.

Directly revalidate after repair.

Add provider-independent output-budget intent by operation type where supported, without truncating structured arguments.

## P9 — primary-only qualification and milestone gates

Run:
- affected deterministic/broad floors;
- benchmark comparisons;
- fast live gate;
- frozen B2 once;
- frozen C2 once.

Create Phase 10 primary-only optimization report and optimization ledger.

No repair-by-rerun.

## P10 — bounded helper A/B

Run one non-authoritative helper experiment after P9.

The helper gets exactly one evidence-preparation job.

Compare against the P9 primary-only baseline.

Retain only as research evidence; do not make helper production authority or baseline behavior.

## P11 — closeout

Evidence-only Phase 10 closeout.

Summarize accepted/revised/reverted changes, final fast-gate and benchmark deltas, B2/C2 milestone outcomes, helper A/B, and Phase 11 handoff.

## Regression emphasis

High priority:
- canonical assistant commit buffering;
- provider continuation/replay safety;
- TaskState/StackState authority;
- validation/correction;
- permission/effect classification;
- cancellation;
- duplicate/no-progress;
- deterministic event ordering;
- benchmark schema compatibility;
- fast-gate immutability.
