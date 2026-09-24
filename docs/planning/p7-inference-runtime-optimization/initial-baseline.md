# Phase 7 Initial Benchmark Baseline

Status: ACCEPTED OWNER BASELINE

Accepted: 2026-09-23  
Phase: 7 — Inference Runtime Optimization  
Baseline package: `0.7.0`  
Benchmark suite: `full v2`  
Model: `qwen3-coder-30b-a3b-instruct@q4_k_m`  
Provider: `http://127.0.0.1:1234`

## Accepted run

Command:

```bash
npm run benchmark -- --suite full --repetitions 1 --label p7-baseline-sanity
```

Artifact directory:

```text
/home/jfin/dev/george/artifacts/benchmarks/2026-09-24T04-56-55-892Z-130236
```

The benchmark reported George commit `3d5d91a14fb22a30f04b0526fde9d8393dc4d8b5` with a dirty working tree. The owner explicitly accepts this run as the Phase 7 control baseline. That dirty-state limitation remains part of the evidence and must not be rewritten as a clean-tree run.

## Baseline results

- Passed: **12 / 13**
- Elapsed: **488,614 ms / 488.61 s**
- Median case: **9,558 ms / 9.56 s**
- Provider attempts/calls: **39**
- Logical provider rounds: **39**
- Average provider round: **12,430 ms / 12.43 s**
- Tool calls: **35**
- Retries: **0**
- Input tokens: **74,252**
- Output tokens: **1,493**

Measured case timing:

- Provider/model: **484,757 ms / 484.76 s (99.3%)**
- Tools: **2,503 ms / 2.50 s (0.5%)**
- Approval/wait: **1 ms (0.0%)**
- Other: **839 ms / 0.84 s (0.2%)**

## Known failed case

`multi-round-coding-workflow-001` failed after approximately **346.05 s** because the fixture edit did not match expected content.

This failure is part of the accepted baseline. Later comparisons must keep correctness separate from speed and must not hide the failure inside aggregates.

## Interpretation carried into Phase 7

The accepted run shows that George-observed provider/model activity dominates measured wall-clock time on this benchmark. Phase 7 therefore prioritizes reducing **provider-round latency** before changing context architecture or model-call count.

Tool execution is not the Phase 7 target: measured tool time was only 0.5% of the accepted run.

The benchmark evidence does not claim the provider-active interval is pure GPU compute time. It is George-observed provider/model request activity.

## First optimization gate

Before changing any runtime setting, capture the currently loaded LM Studio model configuration.

Then apply exactly one bounded runtime change, run the benchmark against this accepted baseline, and explicitly keep/revise/revert the change.

No Phase 7 optimization is accepted merely because it is faster if correctness, reliability, or required evidence regresses.


## Accepted runtime experiment 1 — Max Concurrent Predictions 4 → 1

Status: ACCEPTED

Baseline LM Studio load state before the experiment:

- context length: `32768`
- eval batch size: `2048`
- physical batch size: `512`
- max concurrent predictions / `parallel`: `4`
- Flash Attention: enabled
- GPU KV-cache offload: enabled
- experts: `8`
- speculative draft: disabled

Experiment change:

`parallel: 4 -> 1`

No other runtime/model/context/George setting was intentionally changed.

### First comparison run

Label: `p7-parallel-1`

Artifact:

`/home/jfin/dev/george/artifacts/benchmarks/2026-09-24T05-07-57-693Z-133847`

Results:
- 12 / 12 quick-suite executions passed;
- elapsed: 53.47 s;
- provider/model time: 53.24 s (99.9%);
- provider rounds: 18;
- average provider round: 2.96 s;
- the first requests after model reload showed a large cold/reload penalty, while subsequent warm repetitions were substantially faster.

The reload penalty is retained as separate startup-state evidence and is not treated as steady-state throughput.

### Warm verification run

Label: `p7-parallel-1-warm-verify`

Artifact:

`/home/jfin/dev/george/artifacts/benchmarks/2026-09-24T05-09-51-460Z-135836`

Results:
- 12 / 12 passed;
- elapsed: 33.03 s;
- provider/model time: 32.88 s (99.9%);
- provider rounds: 18;
- average provider round: 1.83 s;
- retries: 0;
- total tool time: ~0.01 s.

Representative steady-state results:
- short reasoning: ~0.23–0.25 s;
- 2k context: ~0.83–0.93 s;
- structured tool workflow: ~3.17–3.27 s;
- independent three-read workflow: ~6.55–6.74 s.

### Decision

`parallel=1` is accepted as the new Phase 7 runtime baseline.

Rationale:
- the warm verification was stable across all 12 executions;
- correctness remained Green for the quick suite;
- provider-round latency was materially lower than the accepted original control;
- George currently issues primary-model requests serially, so dedicating the loaded model to one prediction slot better matches the workload than a throughput-oriented four-slot configuration.

The first-request/reload penalty remains a later startup warm-up experiment and must not be conflated with steady-state throughput.

Future Phase 7 experiments should keep `parallel=1` unless explicitly testing or reverting this decision, and should change only one additional runtime variable at a time.


## Rejected runtime experiment 2 — Eval batch size 2048 → 1024

Status: REJECTED

Starting accepted state:
- `parallel=1`;
- `eval_batch_size=2048`;
- `physical_batch_size=512`;
- Flash Attention enabled;
- GPU KV-cache offload enabled.

Experiment change:

`eval_batch_size: 2048 -> 1024`

No other runtime/model/context/George setting was intentionally changed.

### First run

Label: `p7-eval-batch-1024`

Artifact:

`/home/jfin/dev/george/artifacts/benchmarks/2026-09-24T05-16-30-644Z-137378`

Result:
- 12 / 12 passed;
- elapsed: 58.82 s;
- provider/model time: 58.57 s (99.9%);
- average provider round: 3.25 s;
- the first post-reload requests again showed a large startup penalty.

### Warm verification

Label: `p7-eval-batch-1024-warm-verify`

Artifact:

`/home/jfin/dev/george/artifacts/benchmarks/2026-09-24T05-17-52-280Z-140045`

Result:
- 11 / 12 passed;
- elapsed: 35.25 s;
- provider/model time: 35.08 s (99.9%);
- provider rounds: 19;
- average provider round: 1.85 s;
- one `structured-tool-use-001` repetition failed because the model made 2 tool calls where the case requires exactly 1.

Accepted `eval_batch_size=2048` warm reference:
- 12 / 12 passed;
- elapsed: 33.03 s;
- average provider round: 1.83 s.

### Decision

Reject `eval_batch_size=1024`.

Reason:
- no convincing latency improvement over the accepted 2048 setting;
- total warm quick-suite time was slightly worse;
- average provider-round time was effectively unchanged/slightly worse;
- correctness regressed from 12/12 to 11/12.

Restore and retain `eval_batch_size=2048` as the accepted Phase 7 runtime baseline.

The first-request/reload penalty remains a separate startup warm-up question.


## Rejected runtime experiment 3 — Physical batch size 512 → 1024

Status: REJECTED / NO MATERIAL IMPROVEMENT

Starting accepted state:
- `parallel=1`;
- `eval_batch_size=2048`;
- `physical_batch_size=512`;
- Flash Attention enabled;
- GPU KV-cache offload enabled.

Experiment change:

`physical_batch_size: 512 -> 1024`

No other runtime/model/context/George setting was intentionally changed.

### First run

Label: `p7-physical-batch-1024`

Artifact:

`/home/jfin/dev/george/artifacts/benchmarks/2026-09-24T05-21-23-720Z-142213`

Result:
- 12 / 12 passed;
- elapsed: 44.06 s;
- provider/model time: 43.88 s (99.9%);
- average provider round: 2.44 s;
- the first post-reload long-context request showed a large startup penalty.

### Warm verification

Label: `p7-physical-batch-1024-warm-verify`

Artifact:

`/home/jfin/dev/george/artifacts/benchmarks/2026-09-24T05-22-56-511Z-142640`

Result:
- 12 / 12 passed;
- elapsed: 33.19 s;
- provider/model time: 33.03 s (99.9%);
- provider rounds: 18;
- average provider round: 1.835 s;
- retries: 0.

Accepted `physical_batch_size=512` warm reference:
- 12 / 12 passed;
- elapsed: 33.03 s;
- average provider round: 1.83 s.

### Decision

Reject `physical_batch_size=1024` as a no-material-improvement experiment and restore `physical_batch_size=512`.

Reason:
- steady-state total time is effectively identical to the accepted 512 baseline;
- average provider-round time is effectively identical;
- no correctness benefit or other compensating gain was observed;
- the Phase 7 contract requires a measurable improvement before adding runtime cost/complexity.

Accepted Phase 7 runtime baseline remains:
- context length: 32768;
- eval batch size: 2048;
- physical batch size: 512;
- parallel: 1;
- Flash Attention: on;
- GPU KV cache: on;
- experts: 8;
- speculative draft: off.


## Rejected runtime experiment 4 — GPU KV cache offload ON → OFF

Status: REJECTED

Starting accepted state:
- context length: 32768;
- eval batch size: 2048;
- physical batch size: 512;
- parallel: 1;
- Flash Attention: on;
- GPU KV-cache offload: on;
- experts: 8;
- speculative draft: off.

Experiment change:

`offload_kv_cache_to_gpu: true -> false`

LM Studio configuration was independently confirmed through `/api/v1/models` immediately before the benchmark.

Artifact:

`/home/jfin/dev/george/artifacts/benchmarks/2026-09-24T05-26-54-356Z-143418`

Result:
- 12 / 12 passed;
- elapsed: 53.58 s;
- provider/model time: 53.38 s (99.9%);
- provider rounds: 18;
- average provider round: 2.97 s;
- retries: 0.

The first repetition included the expected post-reload penalty. Warm repetitions still trailed the accepted GPU-KV baseline across the representative cases:
- short reasoning: ~0.30 s versus ~0.23-0.25 s;
- 2k context: ~0.90-0.98 s versus ~0.83-0.93 s;
- structured tool workflow: ~3.34-3.54 s versus ~3.17-3.27 s;
- independent three-read workflow: ~6.90-6.91 s versus ~6.55-6.74 s.

### Decision

Reject CPU-resident KV cache for this configuration and restore `offload_kv_cache_to_gpu=true`.

Reason:
- no latency benefit;
- steady-state warm cases are consistently slower;
- no correctness or reliability advantage was observed.

Accepted Phase 7 runtime baseline remains:
- context length: 32768;
- eval batch size: 2048;
- physical batch size: 512;
- parallel: 1;
- Flash Attention: on;
- GPU KV cache: **on**;
- experts: 8;
- speculative draft: off.


## Rejected runtime experiment 5 — Flash Attention ON → OFF

Status: REJECTED

Starting accepted state:
- context length: 32768;
- eval batch size: 2048;
- physical batch size: 512;
- parallel: 1;
- Flash Attention: on;
- GPU KV-cache offload: on;
- experts: 8;
- speculative draft: off.

Experiment change:

`flash_attention: true -> false`

LM Studio configuration was independently confirmed through `/api/v1/models` immediately before the benchmark.

Artifact:

`/home/jfin/dev/george/artifacts/benchmarks/2026-09-24T05-30-41-897Z-144436`

Result:
- 12 / 12 passed;
- elapsed: 58.57 s;
- provider/model time: 58.36 s (99.9%);
- provider rounds: 18;
- average provider round: 3.24 s;
- retries: 0.

The first repetition included the expected post-reload penalty. Warm repetitions were still materially slower than the accepted Flash-Attention-on baseline on the short/context/tool cases.

### Decision

Reject Flash Attention OFF and restore `flash_attention=true`.

Reason:
- no latency benefit;
- warm steady-state short/context/tool cases regressed materially;
- no correctness or reliability advantage was observed.

Accepted Phase 7 runtime baseline remains:
- context length: 32768;
- eval batch size: 2048;
- physical batch size: 512;
- parallel: 1;
- Flash Attention: **on**;
- GPU KV cache: on;
- experts: 8;
- speculative draft: off.


## Rejected runtime experiment 6 — Active experts 8 → 6

Status: REJECTED — CORRECTNESS REGRESSION

Starting accepted state:
- context length: 32768;
- eval batch size: 2048;
- physical batch size: 512;
- parallel: 1;
- Flash Attention: on;
- GPU KV-cache offload: on;
- experts: 8;
- speculative draft: off.

Experiment change:

`num_experts: 8 -> 6`

LM Studio configuration was independently confirmed through `/api/v1/models` immediately before the benchmark.

Artifact:

`/home/jfin/dev/george/artifacts/benchmarks/2026-09-24T05-34-07-275Z-146871`

Result:
- 11 / 12 passed;
- elapsed: 49.92 s;
- provider/model time: 49.72 s (99.9%);
- provider rounds: 19;
- average provider round: 2.62 s;
- retries: 0;
- `independent-multi-tool-001` failed because the model issued 6 tool calls where the deterministic case requires exactly 3.

Warm latency improved in several cases, but the benchmark contract treats correctness independently from speed.

### Decision

Reject `num_experts=6` and restore `num_experts=8`.

Reason:
- benchmark correctness regressed from the accepted 12/12 quick-suite state to 11/12;
- the model duplicated tool work under the reduced-expert configuration;
- Phase 7 does not accept a speed improvement that reduces coding/tool-use reliability.

Accepted Phase 7 runtime baseline remains:
- context length: 32768;
- eval batch size: 2048;
- physical batch size: 512;
- parallel: 1;
- Flash Attention: on;
- GPU KV cache: on;
- experts: **8**;
- speculative draft: off.
