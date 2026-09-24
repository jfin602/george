# Phase 7 Closeout

Status: FORMAL CLOSEOUT — RUNTIME BASELINE ACCEPTED; FINAL VERIFICATION NOT GREEN

Closed: 2026-09-24  
Phase: 7 — Inference Runtime Optimization  
Package baseline: `0.7.0`

## Scope

Phase 7 measured the pinned LM Studio/Qwen3-Coder runtime one bounded variable at a time under the benchmark-gated optimization contract:

`last accepted baseline -> one bounded runtime change -> benchmark -> accept/revise/revert -> record`

No higher-level context, agent-loop, permission, recovery, or provider-independent architecture change was part of this phase.

## Accepted runtime result

The only accepted runtime optimization was:

`parallel: 4 -> 1`

Accepted warm verification:

- label: `p7-parallel-1-warm-verify`;
- artifact: `/home/jfin/dev/george/artifacts/benchmarks/2026-09-24T05-09-51-460Z-135836`;
- quick suite: 12 / 12 passed;
- elapsed: 33.03 s;
- provider/model time: 32.88 s (99.9%);
- provider rounds: 18;
- average provider round: 1.83 s;
- retries: 0.

Accepted Phase 7 runtime state:

- context length: 32768;
- eval batch size: 2048;
- physical batch size: 512;
- max concurrent predictions / `parallel`: **1**;
- Flash Attention: on;
- GPU KV-cache offload: on;
- experts: 8;
- speculative draft: off;
- main-model GPU offload: retained at the prior working position rather than maximum.

This is the measured best-known Phase 7 steady-state runtime configuration on the qualification machine.

## Rejected and aborted experiments

The evidence trail intentionally retains the following non-accepted experiments:

1. `eval_batch_size: 2048 -> 1024` — rejected; no material latency gain and a quick-suite correctness regression.
2. `physical_batch_size: 512 -> 1024` — rejected; steady-state tie with no compensating benefit.
3. GPU KV cache offload ON -> OFF — rejected; warm steady-state performance regressed.
4. Flash Attention ON -> OFF — rejected; warm performance regressed materially.
5. `num_experts: 8 -> 6` — rejected; faster in some warm cases but duplicated tool work and failed deterministic correctness.
6. `num_experts=7` — deliberately not tested after the six-expert quality regression.
7. main-model GPU offload to maximum — aborted before benchmark because model loading became materially slower, the workstation lagged, and LM Studio debug errors appeared.

The detailed evidence and artifact paths remain in:

- `docs/planning/p7-inference-runtime-optimization/initial-baseline.md`;
- `docs/planning/performance-benchmarking-worksheet.md`.

## Cold/reload behavior

Repeated experiments showed a substantial first-request/post-reload latency penalty.

Phase 7 did not claim a proven root cause and did not introduce startup warm-up behavior without a measured net benefit.

Cold/reload cost remains useful evidence for later runtime/startup work, but it is not conflated with the accepted 1.83 s steady-state provider-round result.

## Final verification evidence

The restored accepted configuration was independently confirmed through LM Studio's `/api/v1/models` endpoint before the final verification run.

Final verification:

- label: `p7-final-runtime-verify`;
- artifact: `/home/jfin/dev/george/artifacts/benchmarks/2026-09-24T05-42-12-722Z-151109`;
- 11 / 12 passed;
- elapsed: 49.49 s;
- provider/model time: 49.30 s;
- average provider round: 2.60 s;
- one `structured-tool-use-001` repetition issued 2 reads where exactly 1 was expected.

The first repetition also carried the recurring post-reload penalty.

This final run is **Not Green** and is not rewritten as Green. The duplicate-tool behavior has appeared in more than one runtime experiment, so the evidence does not establish that the accepted runtime configuration caused it. The earlier accepted warm verification remains the Green evidence for the `parallel=1` runtime decision.

## Evidence classification

- Accepted `parallel=1` warm performance/correctness evidence: **Green**.
- Rejected runtime experiments: **recorded and reverted/aborted as documented**.
- Final restored-runtime verification: **Not Green** due one duplicated tool call.
- Maximum-GPU-offload experiment: **aborted before benchmark** due load-time stability/usability failure.
- No Phase 7 result weakens George's existing permission, context, recovery, or evidence contracts.

## Closeout conclusion

Phase 7 established a measured steady-state runtime improvement and exhausted the bounded runtime knobs judged worth further qualification on this machine.

The accepted control carried forward is the `parallel=1` configuration above, with approximately **1.83 s average provider round** on the accepted warm quick-suite evidence.

The next optimization phase should target provider-facing context/prefill cost rather than continue low-yield runtime micro-tuning.
