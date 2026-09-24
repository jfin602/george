# Phase 8 Task Stack

Status: READY FOR EXECUTION

Phase: 8 — Context Throughput Optimization  
Execution folder: `p8`  
Baseline package: `0.8.0`  
Baseline main: `e24776c7cf3cefc9d86991e6c268e6bdb88afa65`

Current authority:
- `BOOT.md`;
- `AGENTS.md`;
- `docs/project-overview.md`;
- `docs/architecture.md`;
- `docs/workflow.md`;
- `docs/stability-contract.md`;
- `docs/roadmap/mvp-roadmap.md`;
- `docs/planning/p8-context-throughput-optimization/decision-record.md`;
- `docs/planning/p8-context-throughput-optimization/initial-baseline.md`;
- `docs/planning/performance-benchmarking-worksheet.md`;
- `docs/tasks/p8/prompt-assessment.md`;
- `docs/tasks/p8/implementation-plan.md`.

## Stack

- P1 / `0.8.1` — adaptive/fixed configuration and deterministic profile-selection substrate.
- P2 / `0.8.2` — per-turn adaptive runtime integration, promotion-before-compaction, bounded diagnostics.
- P3 / `0.8.3` — deterministic adaptive qualification plus requested 24,576 context-ladder support/live gate.
- P4 / `0.8.4` — one stable-prefix/context-identity experiment with keep/revert evidence.
- P5 / `0.8.5` — one intra-turn provider-native continuation/reuse experiment with fallback and keep/revert evidence.
- P6 / `0.8.6` — integrated Phase-8 qualification and bounded evidence-driven corrections.
- P7 / `0.8.7` — evidence-only Phase-8 closeout.

P1-P6 use Terra High. P7 uses Terra Medium.

Every prompt uses:

`Browser required: no.`

## Safety ordering

P1 creates policy without changing live default behavior.

P2 enables adaptive runtime only after deterministic selection exists.

P3 is the hard adaptive-profile qualification gate before later optimizations.

P4 changes only semantically neutral stable-prefix/context identity and keeps/reverts one candidate.

P5 touches provider-native reuse only after provider-independent adaptive behavior is qualified.

P6 consolidates the exact accepted candidate. P7 records evidence only.

## Benchmark control

Accepted context baseline:

`/home/jfin/dev/george/artifacts/benchmarks/2026-09-24T20-03-38-980Z-90704`

Accepted runtime control includes main-model GPU Offload 26 plus the recorded Phase-7/8 settings.

Every performance experiment must:
- change one bounded variable;
- independently verify runtime provenance;
- separate deterministic correctness from speed;
- separate cold/first-shape from warm-state cost;
- preserve rejected/no-benefit evidence.

## Phase boundary

Phase 8 ends with a qualified adaptive context policy plus explicit keep/revert outcomes for any stable-prefix and provider-reuse experiments attempted.

It does not add helper-model compaction, parallel tool execution, model-call batching, speculative decoding, daemon/desktop work, or canonical provider cache state.
