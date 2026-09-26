# Phase 10 Task Stack — Agent Loop Throughput

Status: READY FOR EXECUTION

Phase: 10  
Baseline package before P1: `0.9.10`  
Phase 10 line: `0.10.x`  
Task folder: `p10`

Authority:
- `BOOT.md`;
- `AGENTS.md`;
- `docs/workflow.md`;
- `docs/stability-contract.md`;
- `docs/phase-9-owner-closeout.md`;
- `docs/planning/p10-agent-loop-throughput/decision-record.md`;
- `qualification-plan.md`;
- `optimization-metrics.md`;
- `fast-live-work.md`;
- this folder's prompt assessment and implementation plan.

## Stack

- P1 / 0.10.1 — Phase 10 baseline, telemetry, and B3/C3 fast gates.
- P2 / 0.10.2 — useful-output provider liveness.
- P3 / 0.10.3 — stable prefix and late dynamic round context.
- P4 / 0.10.4 — George Operation Protocol v1.
- P5 / 0.10.5 — deterministic model-round elimination.
- P6 / 0.10.6 — multi-operation read batching.
- P7 / 0.10.7 — dependency-safe read-only concurrency.
- P8 / 0.10.8 — focused correction path and operation output budgets.
- P9 / 0.10.9 — primary-only optimization qualification plus B2/C2 milestone run.
- P10 / 0.10.10 — bounded non-authoritative helper A/B.
- P11 / 0.10.11 — Phase 10 closeout.

## Optimization order

```text
measure
-> fix useful-output liveness
-> stabilize prefix
-> machine operation protocol
-> remove deterministic model rounds
-> batch observations
-> parallelize safe reads
-> tighten correction/output generation
-> qualify primary-only path
-> helper A/B research
-> closeout
```

## Fast gate

Routine live development gate:

`greeting -> three-file -> Gate A -> B3 -> C3`

Frozen B2/C2 remain milestone instruments and are not inner-loop tests.

## Keep / revise / revert

Each optimization must be independently measurable and may be reverted if efficacy declines or benefit is immaterial.
