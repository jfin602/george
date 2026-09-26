# Phase 10 Prompt Assessment

Status: READY FOR IMPLEMENTATION

Phase: 10 — Agent Loop Throughput  
Baseline target: `0.10.0`  
Task folder: `p10`

## Decomposition

Phase 10 is an optimization campaign, not a single rewrite.

Prompts are ordered so expensive provider/model waste is attacked before low-level tool optimization.

1. baseline transition, telemetry, B3/C3 fast gates;
2. useful-output liveness semantics;
3. stable prefix / late dynamic context;
4. George Operation Protocol v1;
5. deterministic model-round elimination;
6. multi-operation read batching;
7. dependency-safe read-only concurrency;
8. focused correction path + output-budget policy;
9. primary-only qualification plus milestone B2/C2;
10. bounded helper A/B experiment;
11. evidence-only closeout.

## Preserved authority

All prompts must preserve:
- Phase 9 TaskState/StackState and validation truth;
- Workspace Autonomous containment;
- permission ceilings;
- replay safety and ambiguous-effect handling;
- response-completion-before-side-effect;
- mission-card/evidence freshness;
- strict duplicate/no-progress;
- historical Phase 8/9 evidence;
- provider independence.

## Model routing

- P1: Sol High
- P2-P8: Sol High
- P9: Sol Medium
- P10: Sol High
- P11: Sol Medium

P10 is architecture-sensitive because it introduces a new non-authoritative model role experiment, even though it may not be retained.

## Versioning

The Phase 10 line is `0.10.x`.

The repository remains `0.9.10` until P1 performs the explicit Phase 10 transition and targets `0.10.1`.

Subsequent prompts target sequential patch versions through closeout.

## Qualification strategy

Routine iteration uses deterministic floors plus the new fast live gate.

Frozen B2/C2 are milestone-only and are not rerun after every prompt.

Every optimization must produce enough before/after evidence to support accept, revise, or revert.
