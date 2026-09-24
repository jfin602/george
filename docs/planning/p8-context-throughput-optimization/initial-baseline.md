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


## Runtime control check — Not Green

Label: `p8-runtime-control-check`

Artifact:

`/home/jfin/dev/george/artifacts/benchmarks/2026-09-24T19-10-38-490Z-70898`

Pre-run LM Studio configuration was independently confirmed as:
- context length: 32768;
- eval batch size: 2048;
- physical batch size: 512;
- parallel: 1;
- Flash Attention: on;
- GPU KV-cache offload: on;
- experts: 8.

Benchmark provenance:
- package: `0.8.0`;
- George commit: `91c9f79a59643f1253158feba9145e583383790f` clean.

Result:
- 11 / 12 passed;
- elapsed: 74.00 s;
- provider/model time: 73.67 s (99.9%);
- provider rounds: 16;
- average provider round: 4.59 s;
- one `structured-tool-use-001` repetition failed with `Engine protocol predict request failed: fetch failed`.

Comparison control:
- accepted Phase 7 warm quick-suite reference: 12 / 12, 33.03 s total, 18 provider rounds, approximately 1.83 s average provider round.

Decision:
- Phase 8 context optimization is paused until the Phase 7 runtime performance envelope is restored or the source of the regression is explained;
- do not treat the current 4.59 s/round quick run as the Phase 8 context baseline;
- visible LM Studio settings match the accepted control, so investigate runtime state not exposed by the current model-list snapshot (especially main model GPU-offload position), system/resource contention, and provider/runtime instability before changing context policy.


## Runtime recovery observation — GPU offload remained at 20

Status: PROMISING WARM-STATE RECOVERY / NO OFFLOAD CHANGE OCCURRED

Correction:
- the run labeled `p8-runtime-recovery-gpu-offload-24` did **not** actually use GPU Offload 24;
- the LM Studio main-model GPU Offload UI value remained at 20;
- therefore this run cannot support any claim that increasing GPU Offload restored performance.

Pre-run REST snapshot:
- the model key matched;
- `loaded_instances` was empty, so the benchmark caused/encountered model load rather than beginning from a verified already-loaded instance.

Artifact:

`/home/jfin/dev/george/artifacts/benchmarks/2026-09-24T19-21-59-626Z-73718`

Result:
- 12 / 12 passed;
- elapsed: 74.74 s;
- provider/model time: 74.46 s;
- provider rounds: 18;
- reported aggregate average provider round: 4.14 s;
- first repetition carried a very large cold/auto-load penalty.

Warm repetitions 2-3:
- short reasoning: ~0.20 s;
- ~2k context: ~0.86-0.88 s;
- structured tool workflow: ~3.39-3.43 s;
- independent multi-tool workflow: ~6.71-6.90 s.

Across warm repetitions 2-3, provider active time was approximately 22.57 s over 12 provider rounds, or approximately **1.88 s per provider round**.

Comparison:
- accepted Phase 7 warm control: approximately 1.83 s average provider round.

Interpretation:
- steady-state performance at GPU Offload 20 can still return to within a few percent of the accepted Phase 7 control;
- the earlier 4.59 s/round runtime-control result therefore does not by itself prove a persistent configuration regression;
- the discrepancy is more consistent with transient runtime/load/provider state or another uncontrolled factor than with GPU Offload 20 alone.

Decision:
- do not attribute the recovery to a GPU-offload change;
- keep GPU Offload at 20 for one clean, already-loaded warm confirmation;
- do not begin Phase 8 context optimization until that confirmation establishes whether the Phase 7 performance envelope is reproducible.

