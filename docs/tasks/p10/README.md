# Phase 10 Task Stack — Agent Loop Throughput

Status: READY FOR EXECUTION

Phase: 10  
Baseline package: `0.10.0`  
Task folder: `p10`

Authority:
- `BOOT.md`;
- `AGENTS.md`;
- `docs/workflow.md`;
- `docs/stability-contract.md`;
- `docs/phase-9-owner-closeout.md`;
- `docs/planning/p10-agent-loop-throughput/decision-record.md`;
- `docs/planning/p10-agent-loop-throughput/qualification-plan.md`;
- `docs/planning/p10-agent-loop-throughput/optimization-metrics.md`;
- `docs/planning/p10-agent-loop-throughput/fast-live-work.md`;
- `docs/tasks/p10/prompt-assessment.md`;
- `docs/tasks/p10/implementation-plan.md`.

## Stack

- P1 / 0.10.1 — Phase 10 baseline telemetry and fast B3/C3 live instruments.
- P2 / 0.10.2 — useful-output watchdog semantics and provider-attempt timing.
- P3 / 0.10.3 — stable provider prefix and late dynamic round context.
- P4 / 0.10.4 — George Operation Protocol v1 and Human/Operation mode split.
- P5 / 0.10.5 — deterministic model-round elimination.
- P6 / 0.10.6 — multi-tool batching and deterministic result batching.
- P7 / 0.10.7 — dependency-safe read-only concurrency.
- P8 / 0.10.8 — focused validation-correction loop and direct revalidation.
- P9 / 0.10.9 — per-mode output budgets and residual round cleanup.
- P10 / 0.10.10 — primary-only consolidated qualification plus one B2/C2 milestone.
- P11 / 0.10.11 — bounded non-authoritative helper A/B experiment.
- P12 / 0.10.12 — evidence-only Phase 10 closeout.

P1-P9 use Sol High because they touch agent/provider/runtime/context/permission-sensitive loop behavior.  
P10-P12 use Sol Medium.

Every prompt uses `Browser required: no.`.

## Optimization discipline

Each P2-P9 optimization is independently dispositioned:

`accept | revise | revert`

A rejected optimization must be removed from production code while its evidence remains recorded.

Correctness outranks speed.

Routine live iteration uses:

`greeting -> three-file -> Gate A -> B3 -> C3`

B2/C2 remain frozen Phase 9 milestone gates and are not run after each optimization.

## Phase boundary

P12 does not owner-close Phase 10 or open Phase 11.

After formal closeout, owner progression remains explicit.
