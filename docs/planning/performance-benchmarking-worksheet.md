# Performance + Benchmarking Worksheet

Status: APPROVED PLANNING WORKSHEET — Phase 7 owner-closed; Phase 8 agentic-context correction active; Phase 9 structured task execution planned next

Date: 2026-09-23

## Purpose

Record the benchmark control instrument, current performance observations, and the approved sequence for optimizing George's primary-model path before introducing a secondary helper model.

Phase 7 is owner-closed. This worksheet governs the Phase 8-13 context/execution/performance/utility/research campaign. Phase 9 is a structured-execution foundation inserted before agent-loop throughput; historical Phase 7-8 evidence remains unchanged.

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

For bounded performance experiments in Phases 7-8 and 10-11:

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

Phase 8 reached package `0.8.8` with deterministic adaptive/fixed context behavior qualified, but its operating conclusion is under correction `c8-agentic-context`.

Historical runtime control:
- main-model GPU Offload 26 when independently confirmed;
- accepted sustained runtime: approximately 1.82 s average provider round over 123 provider rounds;
- duplicate-tool-call stress failures remain separate behavioral Not Green evidence.

Historical synthetic context-ladder baseline:
- requested 2,048 -> actual provider input 1,466;
- requested 4,096 -> actual provider input 2,746;
- requested 8,192 -> actual provider input 5,306;
- requested 16,384 -> actual provider input 10,428;
- warm observations could complete in a few seconds, while first-shape behavior remained materially slower and occasional timeouts occurred.

The synthetic ladder is now classified as **long-context prefill/retrieval characterization**. It is not sufficient authority for production coding-agent profile boundaries because it uses no normal tool surface and places most large material in ordinary user input rather than realistic project/instruction context.

Implemented `0.8.8` profile policy remains current source truth pending correction:
- ordinary: preferred 4,096-6,144; soft 7,168; provider-input ceiling 8,192;
- medium: preferred 8,192-12,288; soft 14,336; provider-input ceiling 16,384;
- large: preferred 12,000-18,000; soft 20,000; provider-input ceiling 24,576;
- physical target remains 32,768.

Post-`0.8.8` live evidence:
- real ordinary selection completed a live read flow but also showed unrequested model write behavior and non-exact final formatting;
- calibrated medium at approximately 11,429 estimated tokens and large at approximately 14,932 estimated tokens selected the expected profiles but timed out at 120 seconds before useful completion;
- a captured medium-selected real George request at approximately 12,945 estimated tokens contained about 48,609 instruction bytes, 120 input bytes, nine tool schemas, about 3,108 serialized tool bytes, and about 52,220 total serialized request bytes;
- that real request produced first useful output at about 88 seconds and completed at about 89 seconds;
- direct raw/instruction/tools isolation controls became invalid after LM Studio stopped producing usable completions and then stopped listening, so the exact cause remains unresolved.

Correction measurement authority:
- `docs/planning/c8-agentic-context/decision-record.md`;
- `docs/planning/c8-agentic-context/qualification-plan.md`.

New optimization objective:

> maximize coding-task correctness, tool-use reliability, and reasonable latency inside the smallest high-signal working set the pinned model can use competently.

Agentic-context benchmark campaign:
- exploratory provider-facing bands around 2k/4k/6k/8k/10k/12k;
- normal George instructions;
- realistic project guidance;
- normal tool schemas;
- real repository inspection/search;
- multi-round investigation;
- edit-plus-validation workflow;
- stop ascending at a repeatable capability/latency cliff;
- confirm the healthy envelope and next materially worse region with bounded repeats.

Required acceptance metrics:
- deterministic task correctness;
- instruction/fact retention;
- expected tool correctness and call counts;
- duplicate/unrequested tool behavior;
- response-start/first-useful-output latency;
- full workflow latency;
- provider calls/retries/timeouts;
- provider-reported tokens where available;
- selected profile and promotion/omission/defer/compaction evidence.

Do not choose replacement ordinary/medium/large numbers before this benchmark establishes evidence.

Preserve Phase 3 smallest-sufficient-working-set, precedence, provenance, whole-source budgeting, Phase 5 recovery/compaction authority, Phase 8 probe neutrality/per-turn freezing, and P7 continuation-pressure fail-closed behavior.

The 32,768 physical context target remains safety/headroom capacity rather than a prompt-fill target.

### Phase 9 — Structured Task Execution + Workspace Autonomy

Phase 9 changes the execution architecture before further throughput tuning.

It introduces George Task Prompt v1, deterministic task/stack parsing, requirements/work-unit/validation/stop/correction state, bounded Qwen task slices, Transcript/Task TUI separation, sandbox-backed Workspace Autonomous execution with outside `reject | ask`, and frozen `greenfield-express-v1` / `existing-express-feature-v1` live-work instruments.

Phase 9 is qualified primarily for correctness, autonomy, containment, and developer usefulness rather than raw speed. Record provider/tool/context/time dimensions so it becomes the baseline for Phase 10 throughput work.

### Phase 10 — Agent Loop Throughput

Add dependency-safe parallel execution for independent operations, beginning with read-only work, on top of the Phase 9 task/dependency model. Benchmark it independently.

Then separately reduce redundant primary-model rounds where no intermediate model decision is necessary. Benchmark again.

Track logical provider rounds separately from retry attempts and rerun the frozen Phase 9 live-work instruments.

### Phase 11 — Final Acceleration + Performance Qualification

Evaluate speculative decoding only if practical and retain it only when net end-to-end benefit justifies complexity.

Then run the complete benchmark suite and frozen live-work instruments and produce a consolidated primary-model report covering original baseline, Phase 9 structured-execution baseline, every accepted/rejected optimization, cumulative latency deltas, correctness, provider/tool calls, tokens, retries, resource footprint, live-work outcomes, and human interventions.

Phase 11 freezes the optimized single-primary-model baseline.

### Phase 12 — Local Utility Model

Only after Phase 11, evaluate a secondary local helper for context/log compaction, diff summarization, ranking, relevance extraction, bounded classification/routing, and structured extraction.

Measure net system benefit including helper scheduling/inference/memory overhead and frozen live-work results.

The utility model has no independent permission/tool authority and cannot override George/user/project instructions, structured task authority, or canonical evidence.

### Phase 13 — Local Web Research

Build on Phase 6 network/browser boundaries plus the Phase 12 utility role:

`search discovery -> bounded fetch -> deterministic extraction -> utility compaction/reranking -> source-attributed evidence -> primary model`

Prefer local/self-hosted discovery such as SearXNG while keeping providers replaceable. Parallel remains optional escalation.

Compare local/premium paths for quality, provenance, latency, context, failure rate, API cost, and frozen live-work effects.

### Phase 14 / Phase 15

The daemon/desktop phases move later:
- Phase 14 — Local Daemon;
- Phase 15 — Native Desktop.

## Benchmark selection guidance

Use the quick suite as the default per-optimization gate because it covers representative inference, context, tool, multi-tool, and agent-loop behavior at lower cost.

Use the full suite:
- for the untouched starting baseline;
- when an optimization affects behavior not sufficiently represented by quick;
- at the Phase 11 consolidated closeout;
- before making cross-model/helper-model conclusions in Phase 12.

Use `--compare <prior results.json>` when possible so the recorded deltas are tied to a concrete previous run.

## Open design questions

These should be resolved during the relevant phase rather than prematurely:

- whether startup warm-up should be revisited later given the repeatedly observed post-reload penalty;
- which provider-native caching/continuation mechanism is safe and useful;
- the dependency representation used by Phase 10 concurrency;
- the minimum model-call reduction worth retaining;
- whether speculative decoding is practical for the pinned Qwen path;
- which smaller local model best fits the Phase 12 utility role;
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
- require speculative decoding;
- lock one Phase 9 Linux sandbox backend before implementation planning/qualification compares viable mechanisms.

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


### Rejected experiment 2 — Eval batch size

Decision: **reject `eval_batch_size=1024`; retain `2048`**.

Evidence:
- first run: 12/12 passed, 58.82 s total, 3.25 s average provider round, with a large post-reload startup penalty;
- warm verification: 11/12 passed, 35.25 s total, 1.85 s average provider round;
- accepted 2048 warm reference: 12/12 passed, 33.03 s total, 1.83 s average provider round.

Reason:
- no material latency gain;
- slightly worse warm aggregate time;
- correctness regression in `structured-tool-use-001`.

Accepted Phase 7 runtime baseline therefore remains:
- context length: 32768;
- eval batch size: **2048**;
- physical batch size: 512;
- max concurrent predictions: 1;
- Flash Attention: on;
- GPU KV cache: on;
- experts: 8;
- speculative draft: off.


### Rejected experiment 3 — Physical batch size

Decision: **reject `physical_batch_size=1024`; retain `512`**.

Evidence:
- first run `p7-physical-batch-1024`: 12/12 passed, 44.06 s total, 2.44 s average provider round, with a post-reload startup penalty;
- warm verification `p7-physical-batch-1024-warm-verify`: 12/12 passed, 33.19 s total, 1.835 s average provider round;
- accepted 512 warm reference: 12/12 passed, 33.03 s total, 1.83 s average provider round.

Reason:
- steady-state performance is effectively identical;
- no correctness or reliability benefit was observed;
- Phase 7 requires a material measured gain before accepting a new runtime setting.

Accepted Phase 7 runtime baseline remains:
- context length: 32768;
- eval batch size: 2048;
- physical batch size: **512**;
- max concurrent predictions: 1;
- Flash Attention: on;
- GPU KV cache: on;
- experts: 8;
- speculative draft: off.


### Rejected experiment 4 — GPU KV-cache offload

Decision: **reject CPU-resident KV cache; retain GPU KV-cache offload**.

LM Studio's loaded configuration was independently captured immediately before the run and confirmed:
- context length: 32768;
- eval batch size: 2048;
- physical batch size: 512;
- parallel: 1;
- Flash Attention: on;
- GPU KV-cache offload: **off**;
- experts: 8;
- speculative draft: off.

Evidence:
- `p7-kv-cache-cpu`: 12/12 passed, 53.58 s total, 2.97 s average provider round;
- the first repetition included the normal post-reload penalty;
- warm cases remained consistently slower than the accepted GPU-KV baseline:
  - short reasoning ~0.30 s vs ~0.23-0.25 s;
  - 2k context ~0.90-0.98 s vs ~0.83-0.93 s;
  - structured tool ~3.34-3.54 s vs ~3.17-3.27 s;
  - independent multi-read ~6.90-6.91 s vs ~6.55-6.74 s.

Reason:
- no latency benefit;
- warm steady-state performance regressed consistently;
- no correctness/reliability advantage.

Accepted Phase 7 runtime baseline remains:
- context length: 32768;
- eval batch size: 2048;
- physical batch size: 512;
- max concurrent predictions: 1;
- Flash Attention: on;
- GPU KV cache: **on**;
- experts: 8;
- speculative draft: off.


### Rejected experiment 5 — Flash Attention

Decision: **reject Flash Attention OFF; retain ON**.

Evidence:
- `p7-flash-attention-off`: 12/12 passed, 58.57 s total, 3.24 s average provider round;
- first repetition included the normal post-reload startup penalty;
- warm short/context/tool cases remained materially slower than the accepted Flash-Attention-on baseline.

Reason:
- no measured latency gain;
- steady-state performance regressed;
- no correctness/reliability benefit.

Accepted Phase 7 runtime baseline remains:
- context length: 32768;
- eval batch size: 2048;
- physical batch size: 512;
- max concurrent predictions: 1;
- Flash Attention: **on**;
- GPU KV cache: on;
- experts: 8;
- speculative draft: off.


### Rejected experiment 6 — Active experts

Decision: **reject `num_experts=6`; retain `8`**.

LM Studio's loaded configuration was independently captured immediately before the run and confirmed:
- context length: 32768;
- eval batch size: 2048;
- physical batch size: 512;
- parallel: 1;
- Flash Attention: on;
- GPU KV-cache offload: on;
- experts: **6**;
- speculative draft: off.

Evidence:
- `p7-experts-6`: 11/12 passed, 49.92 s total, 2.62 s average provider round;
- warm latency improved on several cases;
- `independent-multi-tool-001` regressed from exactly 3 required tool calls to 6 observed tool calls.

Reason:
- correctness/tool-use behavior regressed;
- Phase 7 does not accept faster inference at the cost of deterministic coding-agent reliability.

Accepted Phase 7 runtime baseline remains:
- context length: 32768;
- eval batch size: 2048;
- physical batch size: 512;
- max concurrent predictions: 1;
- Flash Attention: on;
- GPU KV cache: on;
- experts: **8**;
- speculative draft: off.


### Aborted experiment 7 — Maximum main-model GPU offload

Decision: **reject before benchmark**.

Observed during load:
- materially slower model loading;
- noticeable machine lag;
- LM Studio debug-console errors;
- model had not completed loading.

No benchmark result was recorded because the configuration failed the runtime stability/usability gate before inference.

Accepted Phase 7 steady-state reference remains approximately **1.83 s average provider round**, with the previously retained runtime settings.


## Phase 7 closeout summary

Phase 7 is owner-closed as of 2026-09-24.

Formal closeout:
- `docs/phase-7-closeout.md`

Owner closeout:
- `docs/phase-7-owner-closeout.md`

Accepted runtime result:
- `parallel=1`;
- accepted warm quick-suite evidence: 12/12 passed;
- 33.03 s total;
- 18 provider rounds;
- approximately 1.83 s average provider round;
- 0 retries.

Accepted runtime state carried into Phase 8:
- context length: 32768;
- eval batch size: 2048;
- physical batch size: 512;
- max concurrent predictions: 1;
- Flash Attention: on;
- GPU KV cache: on;
- experts: 8;
- speculative draft: off;
- main model GPU offload retained at the prior stable working position.

The final restored-runtime verification remains **Not Green** because one structured-tool repetition duplicated a read. Owner closeout accepts that evidence state for progression but does not relabel it Green.

Phase 8 authority:
- `docs/planning/p8-context-throughput-optimization/decision-record.md`;
- `docs/planning/p8-context-throughput-optimization/initial-baseline.md`.

Phase 8 has completed its initial runtime recovery and context-ladder characterization. Its current benchmark-gated optimization loop is adaptive ordinary/medium/large profile selection and qualification.


## Phase 8 current measurement state

Accepted runtime control:
- main-model GPU Offload: 26;
- context length: 32,768;
- eval batch: 2,048;
- physical batch: 512;
- parallel: 1;
- Flash Attention: on;
- GPU KV cache: on;
- experts: 8;
- speculative draft: off.

GPU Offload 26 stress evidence:
- 80 quick-suite executions;
- 123 provider rounds;
- approximately 1.82 s average provider round;
- no provider fetch failures;
- no 32-round runaway loop;
- three duplicate-tool-call failures remain behavioral Not Green evidence.

Accepted Phase 8 context ladder:
- artifact: `/home/jfin/dev/george/artifacts/benchmarks/2026-09-24T20-03-38-980Z-90704`;
- 12/12 passed;
- requested bands: 2,048 / 4,096 / 8,192 / 16,384;
- cold/first-shape and warm-state costs are recorded separately.

Candidate context composition/profile tooling:
- ordinary / medium / large profile definitions have been locally qualified;
- profiler/config/benchmark-focused qualification passed;
- normal runtime behavior remained large/fixed and adaptive selection remained disabled during that tooling qualification;
- two broader TUI streaming failures were reproduced identically on the clean pre-change HEAD and classified as pre-existing;
- the tooling candidate must still be committed to the canonical repository before implementation prompts may assume those files exist.

Next acceptance gate:
- canonicalize the qualified profiler/profile tooling;
- implement the adaptive selection contract from the Phase 8 decision record;
- extend context-ladder requested-band support to ~24,576 for large-region qualification;
- run deterministic adaptive-profile qualification plus the live context ladder;
- accept/revise/revert before stable-prefix or provider-cache work begins.
