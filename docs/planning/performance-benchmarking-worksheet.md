# Performance + Benchmarking Worksheet

Status: APPROVED PLANNING WORKSHEET — benchmark tooling implemented; Phase 7-12 optimization sequence approved

Date: 2026-09-23

## Purpose

Record the benchmark control instrument, current performance observations, and the approved sequence for optimizing George's primary-model path before introducing a secondary helper model.

Phase 6 is owner-closed. This worksheet now governs the active Phase 7-12 performance campaign.

## Implemented benchmark tooling

George now exposes the formal benchmark harness through:

```bash
npm run benchmark -- --suite quick
npm run benchmark -- --suite full
```

Supported options include:

```text
--model ID
--base-url LOOPBACK_URL
--repetitions 1..20
--label NAME
--compare results.json
--artifacts PATH
```

Current benchmark contract:
- schema version: 1;
- suite version: `v2`;
- default suite: `quick`;
- default repetitions: 1;
- generated artifacts: `artifacts/benchmarks/<run-id>/results.json` and `report.md`;
- comparison runs additionally write `comparison.md`;
- benchmark artifacts are Git-ignored.

The harness runs through George's real application/provider/tool boundaries rather than benchmarking raw LM Studio HTTP alone.

Current v2 cases cover:
- short reasoning;
- controlled long-context retrieval at approximately 2k/4k/8k/16k bands;
- code understanding;
- structured tool use;
- independent multi-tool inspection;
- bounded coding/edit workflow;
- extended agent loop;
- noisy-evidence/compaction preservation.

Metrics include environment/Git fingerprint, model/provider/context identity, process-order first/warm labels, estimated and reported token usage where available, George-observed response-start and first-output timing, wall time, provider attempts and logical response rounds, retries, tool calls, validations, memory observations, and deterministic pass/fail evidence.

The timing fields are event-observed approximations. `responseStartLatencyMs` is not claimed to be token-level TTFT, and `first-run-in-benchmark-process` does not prove LM Studio model residency was cold.

## Current performance observation

Phase 5 live-model context measurements showed an unusual first-run pattern:

| Approx. target context | Approx. provider input | Response start | TTFT | Elapsed |
| --- | ---: | ---: | ---: | ---: |
| 2k | 1,560 | 151 ms | 33,832 ms | 33,995 ms |
| 4k | 3,112 | 56 ms | 14,310 ms | 14,515 ms |
| 6k | 4,661 | 26 ms | 12,476 ms | 12,758 ms |
| 8k | 6,211 | 55 ms | 14,076 ms | 14,209 ms |
| 10k | 7,761 | 33 ms | 13,920 ms | — |

Do not treat the cause as known. Candidate explanations such as cold runtime/model state or cache/warm-up effects remain hypotheses to measure.

The pinned default primary model remains:

`qwen3-coder-30b-a3b-instruct@q4_k_m`

through LM Studio, with `GEORGE_MODEL` available for deliberate model testing.

## Optimization contract

For Phases 7-10:

1. begin from the last accepted benchmark baseline;
2. implement/configure **one** bounded speed change;
3. run the required benchmark suite;
4. compare speed/resource/call/token evidence and correctness;
5. keep, revise, or revert the change;
6. record the new accepted baseline;
7. only then start the next optimization.

Do not stack multiple unmeasured performance changes together.

A faster run is not an improvement if deterministic correctness fails, retries/errors materially worsen, or George's permission/context/recovery/evidence contracts are weakened.

## Approved phase sequence

### Phase 7 — Inference Runtime Optimization

Benchmark controlled LM Studio/runtime variables first:
- GPU offload;
- Flash Attention;
- GPU KV cache;
- eval batch size;
- model residency/persistence;
- cold/warm execution behavior.

Then test startup warm-up as a separate change.

Keep provider-specific tuning behind the provider/runtime boundary.

### Phase 8 — Context Throughput Optimization

First benchmark adaptive context/runtime profiles:
- ordinary/small work;
- medium repository work;
- genuinely large-context work.

Then separately benchmark:
- stable prompt/context identities;
- stable prefixes;
- incremental/changed-context submission;
- provider-native continuation/cache reuse where supported.

Preserve Phase 3 smallest-sufficient-working-set, precedence, provenance, hard budgets, and Phase 5 recovery semantics.

### Phase 9 — Agent Loop Throughput

First add dependency-safe parallel execution for independent operations, beginning with read-only work.

Concurrent mutations/ambiguous side effects remain out of scope unless a later explicit safety contract changes that.

Benchmark.

Then separately reduce redundant primary-model rounds by batching deterministic orchestration/tool work where no intermediate model decision is necessary.

Benchmark again.

Track logical provider rounds separately from retry attempts.

### Phase 10 — Final Acceleration + Performance Qualification

Evaluate speculative decoding only if a compatible draft-model/runtime path is practical.

Keep it only if the net end-to-end gain justifies memory/runtime complexity.

Then run the complete benchmark suite and produce the consolidated primary-model performance report:
- original untouched baseline;
- each accepted/rejected experiment;
- per-stage and cumulative latency deltas;
- correctness/quality state;
- provider/model-call counts;
- tool-call counts;
- token usage where available;
- retries;
- resource footprint.

Phase 10 freezes the optimized single-primary-model baseline.

### Phase 11 — Local Utility Model

Only after Phase 10, evaluate a secondary local helper/utility model for:
- context/log compaction;
- diff summarization;
- file/search-result ranking;
- relevance extraction;
- bounded classification/routing;
- structured extraction;
- other low-cost context preparation.

Measure net system benefit, including helper scheduling/inference/memory overhead.

The utility model has no independent permission or tool authority and cannot override George/user/project instructions or replace canonical evidence.

### Phase 12 — Local Web Research

Build on Phase 6 network/browser boundaries plus the Phase 11 utility role:

`search discovery -> bounded fetch -> deterministic extraction -> utility compaction/reranking -> source-attributed evidence -> primary model`

Prefer a local/self-hosted discovery path such as SearXNG while keeping providers replaceable.

Parallel Search remains an optional escalation provider rather than a required web brain.

Compare local and premium paths for quality, provenance, latency, context usage, failure rate, and API cost.

### Phase 13 / Phase 14

The former daemon/desktop phases move later:
- Phase 13 — Local Daemon;
- Phase 14 — Native Desktop.

The intent is to put service/desktop layers over an already measured and optimized agent core.

## Benchmark selection guidance

Use the quick suite as the default per-optimization gate because it covers representative inference, context, tool, multi-tool, and agent-loop behavior at lower cost.

Use the full suite:
- for the untouched starting baseline;
- when an optimization affects behavior not sufficiently represented by quick;
- at the Phase 10 consolidated closeout;
- before making cross-model/helper-model conclusions in Phase 11.

Use `--compare <prior results.json>` when possible so the recorded deltas are tied to a concrete previous run.

## Open design questions

These should be resolved during the relevant phase rather than prematurely:

- exact Phase 7 accepted LM Studio settings for the qualification hardware;
- whether startup warm-up produces a real net benefit;
- exact adaptive profile thresholds in Phase 8;
- which provider-native caching/continuation mechanism is safe and useful;
- the dependency representation used by Phase 9 concurrency;
- the minimum model-call reduction worth retaining;
- whether speculative decoding is practical for the pinned Qwen path;
- which smaller local model best fits the Phase 11 utility role;
- the eventual SearXNG/local-search deployment shape.

## Non-decisions

This worksheet still does **not**:
- select the helper model;
- lock SearXNG deployment/configuration;
- remove Parallel Search from Phase 6;
- change the active Phase 6 decision record;
- lock future context thresholds;
- lock LM Studio tuning values before measurement;
- authorize concurrent ambiguous mutations;
- require speculative decoding.

Those decisions must follow benchmark evidence and the normal George planning/qualification workflow.


## Phase 7 experiment log

### Accepted experiment 1 — Max Concurrent Predictions

Decision: **accept `parallel=1`**, replacing the previous `parallel=4` runtime baseline.

Evidence:
- `p7-parallel-1`: 12/12 passed, 53.47 s total, 2.96 s average provider round; the first post-reload requests showed a large startup penalty;
- `p7-parallel-1-warm-verify`: 12/12 passed, 33.03 s total, 1.83 s average provider round, 0 retries;
- provider/model activity remained ~99.9% of measured time, confirming primary inference remains the dominant optimization target.

Accepted current Phase 7 runtime state:
- context length: 32768;
- eval batch size: 2048;
- physical batch size: 512;
- max concurrent predictions: **1**;
- Flash Attention: on;
- GPU KV cache: on;
- experts: 8;
- speculative draft: off.

The cold/reload penalty is preserved as a separate startup/warm-up question. It is not folded into the steady-state `parallel=1` decision.

Subsequent Phase 7 experiments must start from this accepted state and change only one additional runtime variable at a time.
