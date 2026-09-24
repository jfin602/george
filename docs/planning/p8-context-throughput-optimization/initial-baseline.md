# Phase 8 Initial Baseline

Status: ACTIVE BASELINE — CONTEXT LADDER ACCEPTED; ADAPTIVE PROFILE QUALIFICATION NEXT

Opened: 2026-09-24  
Phase: 8 — Context Throughput Optimization  
Package baseline: `0.8.0`

Decision authority: `docs/planning/p8-context-throughput-optimization/decision-record.md`

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

Current accepted runtime refinement after Phase 8 recovery/tuning:
- main-model GPU Offload UI value: **26**;
- sustained stress: approximately 1.82 s average provider round across 123 provider rounds;
- duplicate-tool-call stress failures remain separate behavioral Not Green evidence.

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

## Current gate

Initial runtime recovery and provider-facing context-ladder characterization are complete.

The next Phase 8 implementation/qualification gate is the adaptive ordinary/medium/large profile contract defined in `decision-record.md`:

- explicit adaptive versus fixed mode;
- per-user-turn selection before the first provider request;
- monotonic ordinary -> medium -> large promotion;
- promotion of required/deliberately selected context rather than silent loss under an undersized profile;
- ordinary/medium promotion before provider-backed semantic history compaction;
- preserved Phase 5 large-profile pressure/recovery semantics;
- bounded observable selection/promotion diagnostics;
- context-ladder qualification extended to a requested ~24,576 band.

Stable-prefix, incremental-context, and provider-native cache/reuse experiments follow only after this gate is accepted.


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



## GPU offload provenance correction

Owner clarification:
- the severe runtime slowdown/lag state occurred with the main-model GPU Offload UI value at **0**;
- the later fast warm-state observation was not evidence that offload 20 caused recovery;
- the owner has now explicitly set GPU Offload to **24** for the next controlled runtime check.

Interpretation:
- GPU-offload position is now the leading explanation for the earlier large latency regression;
- the next benchmark should be treated as the first actual GPU Offload 24 experiment;
- no Phase 8 context optimization should begin until that run confirms a stable runtime envelope.


## Runtime recovery accepted — main GPU Offload 24

Status: ACCEPTED AS PHASE 8 STARTING RUNTIME CONTROL

Owner-confirmed experiment state:
- main-model GPU Offload UI value: **24**;
- the benchmark label still said `p8-runtime-warm-confirm-offload-20`, but the owner clarified immediately before the run that the actual UI value had been changed to 24;
- REST-visible runtime settings remained at the accepted Phase 7 values.

Artifact:

`/home/jfin/dev/george/artifacts/benchmarks/2026-09-24T19-26-33-619Z-74834`

Result:
- 12 / 12 passed;
- elapsed: 47.68 s;
- provider/model time: 47.44 s (99.9%);
- provider rounds: 18;
- aggregate average provider round: 2.63 s;
- retries: 0.

The first repetition still carried a large post-load/warm-up penalty.

Warm repetitions 2-3:
- short reasoning: ~0.18 s;
- ~2k context: ~0.84-0.89 s;
- structured tool workflow: ~3.09-3.26 s;
- independent multi-tool workflow: ~6.44-6.61 s.

Warm provider-round calculation:
- repetition 2: ~10.76 s provider active time over 6 rounds = ~1.79 s/round;
- repetition 3: ~10.71 s provider active time over 6 rounds = ~1.78 s/round;
- combined warm average: approximately **1.79 s/provider round**.

Comparison:
- accepted Phase 7 warm control: approximately 1.83 s/provider round.

Decision:
- accept GPU Offload 24 as the stable Phase 8 starting runtime control;
- do not claim a material speed improvement over the 1.83 s Phase 7 control because the difference is small and within plausible run variance;
- the important result is restoration of the Phase 7 steady-state performance envelope with 12/12 correctness;
- the earlier severe slowdown is now attributed to the owner-confirmed GPU Offload 0 state rather than the accepted Phase 7 runtime settings;
- Phase 8 context/prefill characterization may now proceed from this recovered runtime control.


## GPU offload experiment — 28

Status: REJECTED — CORRECTNESS / AGENT-LOOP FAILURE

Owner-confirmed main-model GPU Offload UI value: **28**.

Artifact:

`/home/jfin/dev/george/artifacts/benchmarks/2026-09-24T19-33-46-019Z-75928`

Result:
- 15 / 16 passed;
- elapsed: 150.42 s;
- provider/model time: 150.12 s;
- provider rounds: 55;
- aggregate average provider round: 2.73 s;
- retries: 0.

Warm performance when behavior remained normal was faster than the accepted GPU Offload 24 control:
- repetition 2 provider active time: ~9.71 s over 6 rounds = ~1.62 s/round;
- repetition 4 provider active time: ~10.11 s over 6 rounds = ~1.69 s/round;
- representative successful warm cases:
  - short reasoning: ~0.17-0.18 s;
  - ~2k context: ~0.81-0.88 s;
  - structured tool: ~2.85-2.89 s;
  - independent multi-tool: ~5.86-6.22 s.

However, repetition 3 of `structured-tool-use-001` failed catastrophically:
- `Tool round limit of 32 exhausted`;
- ~100.26 s elapsed;
- the model entered an abnormal repeated-tool loop.

Decision:
- reject GPU Offload 28 despite its apparent latency improvement when stable;
- correctness and bounded-agent-loop reliability take precedence over speed;
- retain GPU Offload 24 as the accepted stable control;
- bracket the likely performance/stability boundary between 24 and 28;
- test GPU Offload 26 next as the midpoint before considering 25 or 27.


## GPU offload experiment — 26

Status: ACCEPTED AS NEW BEST STABLE RUNTIME CONTROL

Owner-confirmed main-model GPU Offload UI value: **26**.

Artifact:

`/home/jfin/dev/george/artifacts/benchmarks/2026-09-24T19-39-46-613Z-77435`

Result:
- 16 / 16 passed;
- elapsed: 58.34 s;
- provider/model time: 58.10 s;
- provider rounds: 24;
- aggregate average provider round: 2.42 s;
- retries: 0.

The first repetition again carried a post-load/warm-up penalty.

Warm repetitions 2-4:
- repetition 2 provider active time: ~10.70 s over 6 rounds = ~1.78 s/round;
- repetition 3 provider active time: ~10.67 s over 6 rounds = ~1.78 s/round;
- repetition 4 provider active time: ~10.31 s over 6 rounds = ~1.72 s/round;
- combined warm provider time: ~31.67 s over 18 rounds = approximately **1.76 s/provider round**.

Representative warm cases:
- short reasoning: ~0.18-0.21 s;
- ~2k context: ~0.80-0.89 s;
- structured tool workflow: ~3.11-3.28 s;
- independent multi-tool workflow: ~6.21-6.48 s.

Comparison:
- accepted GPU Offload 24 control: ~1.79 s/provider round warm;
- original accepted Phase 7 control: ~1.83 s/provider round warm.

Decision:
- accept GPU Offload 26 as the new best-known stable runtime control;
- keep all other accepted runtime settings unchanged;
- test GPU Offload 27 next as the final boundary point because 28 already failed the correctness/agent-loop gate;
- if 27 is Green and materially faster than 26, retain 27; otherwise keep 26 and stop GPU-offload tuning.


## GPU Offload 26 sustained stability stress

Status: RUNTIME QUALIFIED / BEHAVIORAL STRESS NOT GREEN

Owner-confirmed main-model GPU Offload UI value: **26**.

Artifact:

`/home/jfin/dev/george/artifacts/benchmarks/2026-09-24T19-46-59-607Z-78264`

Stress shape:
- quick suite;
- 20 repetitions;
- 80 benchmark executions;
- 123 provider rounds;
- repeated structured single-tool and independent three-tool workflows.

Result:
- 77 / 80 passed;
- elapsed: 224.59 s;
- provider/model time: 223.68 s (99.9%);
- average provider round: **1.82 s**;
- retries: 0;
- no provider fetch failures;
- no 32-round tool-loop exhaustion;
- no progressive latency degradation was observed.

Behavioral failures:
- independent multi-tool repetition 6 issued 6 tool calls instead of exactly 3;
- structured-tool-use repetition 19 issued 2 tool calls instead of exactly 1;
- independent multi-tool repetition 19 issued 6 tool calls instead of exactly 3.

Interpretation:
- GPU Offload 26 sustained the desired runtime performance envelope over 123 provider rounds;
- the runtime did not exhibit the catastrophic runaway-loop behavior observed at GPU Offload 28;
- deterministic tool-call behavior remains Not Green because of three duplicate-tool-call events;
- similar duplicate-tool behavior has been observed at other runtime settings, so this stress run does not establish GPU Offload 26 as the cause.

Decision:
- retain GPU Offload 26 as the best-known stable runtime control;
- classify its sustained runtime stability as qualified;
- preserve the 77/80 behavioral result as Not Green rather than rewriting it as a pass;
- treat duplicate-tool-call robustness as a separate model/agent-loop concern rather than continuing GPU-offload micro-tuning;
- proceed with Phase 8 context/prefill work from GPU Offload 26.


## Accepted Phase 8 context ladder baseline

Status: ACCEPTED BASELINE — CONTEXT LADDER TOOLING ACTIVE

Benchmark:
`npm run benchmark -- --suite context --context-bands 2048,4096,8192,16384 --repetitions 3 --label p8-context-ladder-baseline`

Artifact:

`/home/jfin/dev/george/artifacts/benchmarks/2026-09-24T20-03-38-980Z-90704`

Benchmark provenance:
- package: `0.8.0`;
- George commit: `ad33f2da1af22cf259b465cf8f5a06bf82f07941` clean;
- model: `qwen3-coder-30b-a3b-instruct@q4_k_m`;
- runtime control: GPU Offload 26 plus the accepted Phase 7/8 settings;
- suite: `context v2`;
- 4 bands × 3 repetitions = 12 executions.

Result:
- 12 / 12 passed;
- retries: 0;
- tool calls: 0;
- total provider input tokens: 59,838;
- total output tokens: 135.

Reported context-ladder medians:

| Requested band | Actual provider input | First output | Provider/model | Elapsed | Result |
| ---: | ---: | ---: | ---: | ---: | --- |
| 2,048 | 1,466 | 355 ms | 1,140 ms | 1,142 ms | 3/3 PASS |
| 4,096 | 2,746 | 192 ms | 1,092 ms | 1,094 ms | 3/3 PASS |
| 8,192 | 5,306 | 262 ms | 1,499 ms | 1,502 ms | 3/3 PASS |
| 16,384 | 10,428 | 421 ms | 2,266 ms | 2,267 ms | 3/3 PASS |

### Cold/shape-warm-up observation

The first pass through the larger context shapes was dramatically slower than later repetitions:
- 4k rep 1: ~11.53 s provider/model;
- 8k rep 1: ~24.93 s;
- 16k rep 1: ~63.87 s.

Repetitions 2-3 were much faster and stable:
- 2k warm average: ~1.15 s provider/model;
- 4k warm average: ~1.06 s;
- 8k warm average: ~1.46 s;
- 16k warm average: ~2.24 s.

Approximate warm first-output averages:
- 2k: ~357 ms;
- 4k: ~180 ms;
- 8k: ~252 ms;
- 16k: ~418 ms.

Interpretation:
- Phase 8 must distinguish cold/first-shape cost from steady-state context/prefill cost;
- the steady-state cost curve is relatively shallow through ~8k and becomes more material by ~16k;
- the 4k result being slightly faster than 2k is within run variance/cache effects and should not be treated as a monotonic speed law;
- no context-policy change has been made yet.

Decision:
- accept this run as the first Phase 8 context/prefill comparison baseline;
- use this context suite for subsequent one-change-at-a-time Phase 8 experiments;
- next design work should define adaptive operating profiles/headroom from these measured bands before modifying context assembly.
