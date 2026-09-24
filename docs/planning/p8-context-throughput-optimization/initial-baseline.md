# Phase 8 Initial Baseline

Status: ACTIVE BASELINE — CONTEXT THROUGHPUT OPTIMIZATION

Opened: 2026-09-24  
Phase: 8 — Context Throughput Optimization  
Package baseline: `0.8.0`

## Starting runtime control

Phase 8 inherits the owner-accepted Phase 7 runtime configuration:

- model: `qwen3-coder-30b-a3b-instruct@q4_k_m`;
- context length: 32768;
- eval batch size: 2048;
- physical batch size: 512;
- max concurrent predictions / `parallel`: 1;
- Flash Attention: on;
- GPU KV-cache offload: on;
- experts: 8;
- speculative draft: off;
- main-model GPU offload: prior stable working position.

Accepted Phase 7 warm control:

- 12 / 12 quick-suite executions passed;
- 33.03 s total;
- 18 provider rounds;
- approximately 1.83 s average provider round;
- 0 retries.

Artifact:

`/home/jfin/dev/george/artifacts/benchmarks/2026-09-24T05-09-51-460Z-135836`

The Phase 7 final restored-runtime verification remains separately recorded Not Green and is not rewritten here.

## Phase 8 goal

Reduce provider-facing context/prefill cost while preserving George's established correctness and context contracts.

Primary optimization targets:

1. adaptive operating profiles for ordinary/small, medium-repository, and genuinely large-context work;
2. explicit context headroom and pressure behavior;
3. stable context source identity/order and smallest-sufficient working sets;
4. stable prompt prefixes where useful;
5. incremental/changed-context submission where safe;
6. provider-native continuation/cache reuse where supported, without making provider cache state authoritative.

## Preserved contracts

Phase 8 must preserve:

- Phase 3 instruction precedence and provenance;
- smallest-sufficient-working-set behavior;
- hard-budget/fail-or-defer behavior under critical context pressure;
- Phase 5 recovery and durable evidence semantics;
- provider independence;
- canonical normalized session/context state as George's authority.

## Measurement contract

Continue the benchmark-gated loop:

`last accepted baseline -> one bounded context optimization -> benchmark -> accept/revise/revert -> record`

Measure at minimum:

- input/context tokens;
- response-start/first-output timing;
- provider/model active time;
- provider rounds;
- total workflow latency;
- deterministic correctness;
- retrieval/instruction behavior where affected.

Do not stack multiple unmeasured context changes.

## First action

Before implementing a context optimization, characterize the current provider-facing context cost across representative ordinary, medium, and large-context workloads using the existing benchmark harness.

That characterization becomes the Phase 8 comparison baseline for subsequent context changes.
