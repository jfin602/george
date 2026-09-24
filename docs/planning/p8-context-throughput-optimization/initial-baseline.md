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


## Baseline attempt 1 — Not accepted

Label: `p8-context-baseline`

Artifact:

`/home/jfin/dev/george/artifacts/benchmarks/2026-09-24T16-07-22-095Z-4939`

This run is retained as diagnostic evidence but is **not** accepted as the Phase 8 comparison baseline.

Pre-run LM Studio evidence:
- model key matched `qwen3-coder-30b-a3b-instruct@q4_k_m`;
- `loaded_instances` was empty.

Repository/runtime provenance:
- benchmark reported George commit `270e47fb9981ec3080544047ad0a5559bd188ea0` clean;
- npm reported package `0.7.0`, not the Phase 8 `0.8.0` baseline.

Benchmark result:
- 34 / 39 passed;
- elapsed: 768.41 s;
- provider/model time: 764.19 s (99.5%);
- provider rounds: 117;
- average provider round: 6.53 s;
- input tokens: 222,098;
- output tokens: 4,431.

Observed failures:
- `multi-round-coding-workflow-001` failed in all three repetitions because the fixture edit did not match expected content;
- `short-reasoning-001` repetition 3 failed with `Engine protocol predict request failed: fetch failed`;
- `long-context-4096-001` repetition 3 failed with the same provider fetch failure.

Warm long-context observations within this diagnostic run:
- ~2k case: 0.79-1.02 s;
- ~4k case: one Green warm sample at 0.97 s; the third repetition hit a provider fetch failure;
- ~8k case: 1.29-1.39 s;
- ~16k case: 2.12-2.26 s.

Decision:
- do not use this run as the Phase 8 baseline;
- synchronize the local checkout to the Phase 8 `0.8.0` baseline;
- explicitly load the model with the accepted Phase 7 runtime configuration;
- confirm a non-empty LM Studio `loaded_instances` snapshot before rerunning;
- rerun the unchanged full benchmark after provenance is correct.
