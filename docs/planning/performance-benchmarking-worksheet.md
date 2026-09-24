# Performance + Benchmarking Worksheet

Status: WORKSHEET — exploratory direction, not an implementation contract

Date: 2026-09-23

## Purpose

Capture the current George performance findings and define the next planning sequence before changing runtime behavior.

The immediate priority is to build a repeatable benchmark harness so model, quant, LM Studio, context, and orchestration changes can be measured against a stable baseline instead of judged by feel.

This worksheet does not change the current Phase 6 scope or its approved decision record.

## Current observations

Phase 5 live-model context measurements showed an unusual cold-first-run pattern:

| Approx. target context | Approx. provider input | Response start | TTFT | Elapsed |
| --- | ---: | ---: | ---: | ---: |
| 2k | 1,560 | 151 ms | 33,832 ms | 33,995 ms |
| 4k | 3,112 | 56 ms | 14,310 ms | 14,515 ms |
| 6k | 4,661 | 26 ms | 12,476 ms | 12,758 ms |
| 8k | 6,211 | 55 ms | 14,076 ms | 14,209 ms |
| 10k | 7,761 | 33 ms | 13,920 ms | — |

The 2k result was much slower than later larger-context runs. Treat that as a benchmark question, not as a proven cause. Candidate explanations include cold model/runtime state, cache/warm-up behavior, or other first-request overhead.

The current default model remains:

`qwen3-coder-30b-a3b-instruct@q4_k_m`

through LM Studio.

## Performance directions to preserve

### 1. Formal benchmarking first

Before introducing a helper model or changing orchestration, build a standardized benchmark system.

The benchmark should make it possible to compare:

- model family and exact model ID;
- quantization;
- context profile / provider input size;
- LM Studio runtime settings;
- cold versus warm execution;
- generation speed;
- tool-use behavior;
- coding/reasoning quality;
- context retention;
- instruction following;
- structured-output/tool-call correctness;
- end-to-end agent latency;
- number of primary-model calls;
- total input/output tokens;
- failure/retry rate;
- memory / resource pressure where observable.

Results should be persisted in a machine-readable format plus a concise human-readable report so runs can be compared over time.

### 2. Standardized stress prompt / benchmark suite

Do not rely on one generic coding prompt. Use a fixed, versioned suite that stresses materially different model behaviors while remaining deterministic enough for comparison.

Candidate benchmark cases:

1. **Short reasoning**
   - small self-contained logic/debugging problem;
   - measures cold/warm latency and basic reasoning without large context.

2. **Long-context retrieval**
   - inject a controlled synthetic/project-like context with facts distributed across it;
   - require exact retrieval and cross-reference;
   - measures prefill/context cost and retention.

3. **Code understanding**
   - inspect a fixed fixture repository or source bundle;
   - explain architecture and identify a narrowly defined defect;
   - no mutations.

4. **Code edit**
   - make one bounded change in a fixture repo with an objective expected result;
   - validate with deterministic tests.

5. **Multi-tool workflow**
   - require several independent read-only inspections followed by one conclusion;
   - captures tool-call correctness and reveals opportunities for parallel execution.

6. **Long tool-output compaction**
   - provide noisy logs/search results/diffs and require preservation of the important evidence;
   - useful later for evaluating a helper/utility model.

7. **Structured tool calling**
   - force exact schemas, arguments, and continuation behavior;
   - score malformed calls, unnecessary calls, and recoverability.

8. **Instruction hierarchy**
   - combine George instructions, workspace guidance, irrelevant context, and task-specific constraints;
   - verify precedence and resistance to distraction.

9. **Extended coding loop**
   - inspect -> edit -> test -> diagnose -> repair -> final;
   - measures total wall time, model-call count, retries, and final correctness.

10. **Web-research compaction fixture**
    - initially use saved/static HTML or text fixtures rather than live network variance;
    - compare raw material versus locally compacted evidence;
    - later becomes useful for evaluating a local alternative to premium research APIs.

Each benchmark case should have a stable ID and version. If the fixture or expected behavior changes, increment the case version rather than silently altering historical comparisons.

### 3. Benchmark result categories

At minimum record:

- environment fingerprint;
- George commit;
- benchmark-suite version;
- model/provider configuration;
- cold/warm state;
- context/input size;
- response-start latency;
- time to first generated token where available;
- total wall time;
- input/output token counts;
- tokens per second where reported or derivable;
- tool-call count;
- model-call count;
- retries;
- pass/fail or objective correctness criteria;
- peak/representative memory measurements where practical;
- notes for anomalies.

Separate **speed** from **quality**. A faster result is not an improvement if it fails the task or needs more retries/tool rounds.

## Helper / utility model direction

The helper model is deliberately **after the primary-model optimization campaign**, not immediately after the benchmark harness.

First, use the benchmark system to optimize George's existing primary-model path one change at a time. Each speed change must be followed by a benchmark run against the same versioned suite before the next optimization is attempted. This leaves George with a measured, highly optimized primary-model baseline before a second model introduces new scheduling, memory, routing, and quality variables.

Only after that campaign is complete should the next major direction become a secondary local helper model.

Candidate responsibilities:

- context compaction;
- long-log compaction;
- diff summarization;
- file/search-result ranking;
- relevance extraction;
- page/content compaction;
- lightweight classification/routing;
- trivial structured extraction;
- other low-cost context preparation that does not require the primary coding model.

The helper model must remain subordinate to George's primary model and core policy:

- no permission authority;
- no ability to expand executable capability;
- no implicit network access;
- no instruction-precedence authority;
- outputs are derived context/evidence, not trusted project instructions;
- model/provider must remain replaceable.

### Local research / Parallel independence

The helper-model direction also supports the existing Post-MVP Local Web Research + Utility Model roadmap.

A local or self-hosted research path should eventually be able to:

`search discovery -> bounded page fetch -> deterministic extraction -> local utility-model compaction -> compact source-attributed evidence -> primary model`

This can reduce dependence on Parallel Search or another paid research API for ordinary technical research.

Parallel should remain an optional escalation provider rather than a required web brain.

The benchmark system should eventually compare local research against premium research on:

- answer/evidence quality;
- source/provenance preservation;
- latency;
- context usage;
- external API cost;
- failure rate;
- hostile/prompt-injection content handling.

Do not build this local replacement until the benchmark harness exists **and the primary-model speed campaign is complete**. Otherwise helper-model gains can become mixed together with unresolved primary-model inefficiencies and there is no clean baseline for deciding whether the extra model is actually worthwhile.

## Primary-model optimization campaign

The speed directions below should be executed as a controlled sequence.

For every optimization:

1. start from the last accepted benchmark baseline;
2. implement or configure **one** bounded speed change;
3. run the same required benchmark suite;
4. compare latency, quality, tool/model-call counts, tokens, retries, and resource use against the previous accepted baseline;
5. keep, revise, or revert the change based on evidence;
6. record the new accepted baseline before moving to the next optimization.

Avoid stacking multiple unmeasured performance changes together. The goal is to know which changes actually help George and by how much.

### Adaptive context sizing

Investigate choosing the smallest appropriate context/runtime profile rather than treating maximum physical context as the normal operating target.

Candidate operating bands to benchmark:

- small/ordinary coding turns;
- medium repository tasks;
- large-context tasks only when genuinely required.

Any change must preserve the Phase 3 smallest-sufficient-working-set policy and provider independence.

### Runtime / LM Studio tuning

Benchmark rather than assume the best settings.

Candidate variables include:

- GPU offload level;
- Flash Attention;
- GPU KV cache;
- eval batch size;
- loaded-model persistence;
- cold-start versus warm-state behavior;
- speculative decoding later, if a compatible draft model is worthwhile.

Do not freeze LM Studio-specific tuning into George core architecture.

### Startup warm-up

The Phase 5 first-run anomaly makes an optional startup warm-up worth measuring.

A tiny bounded provider request after connection/model readiness could remove user-visible cold-start cost if benchmarks prove it helps.

Do not adopt warm-up behavior until cold/warm benchmark evidence demonstrates a meaningful benefit and acceptable resource cost.

### Stable / incremental context assembly

Preserve stable context identities/order and avoid unnecessary reprocessing when inputs have not changed.

Potential future work:

- stable prompt prefixes;
- incremental context continuation where provider capabilities permit;
- reuse/caching behind provider adapters;
- only route changed or newly relevant context;
- helper-model compaction for old/noisy context.

This must not weaken instruction precedence, provenance, budget accounting, or session recoverability.

### Parallelize independent tools

George currently has many workflows where independent read-only operations could potentially run concurrently.

Examples:

- BOOT + AGENTS + Git status + top-level structure;
- independent file reads;
- independent searches;
- independent diagnostics/tests when they do not contend or mutate shared state.

Future implementation must make dependency ordering explicit. Never parallelize operations merely because they are individually read-only if ordering, resource contention, provider semantics, or evidence ordering matters.

Measure end-to-end gain with the benchmark suite.

### Reduce primary-model call count

Prefer orchestration patterns that batch deterministic work between model turns when safe.

Target shape:

`reason -> batch tools -> reason -> batch changes/validation -> final`

instead of unnecessary:

`reason -> tool -> reason -> tool -> reason -> tool -> ...`

The objective is not to arbitrarily minimize calls. The objective is to remove redundant inference while preserving correctness, observability, recovery, and permission boundaries.

Track model-call count as a first-class benchmark metric.

### Speculative decoding

Treat as a later runtime experiment, not a baseline requirement.

Only evaluate it once the benchmark harness can show whether draft-model memory cost and compatibility produce a real end-to-end improvement for George's workloads.

## Proposed planning order

### Stage 1 — Benchmark tooling

1. **Build the benchmark harness + standardized/versioned stress suite.**
2. **Capture the untouched current Qwen3-Coder Q4_K_M + LM Studio baseline.**
   - The baseline run is part of benchmark-tooling acceptance so every later change has a control.

### Stage 2 — Optimize the existing primary-model path

Apply one speed change at a time. Re-run the same required suite after every change and make the accepted result the next baseline.

3. **Runtime / LM Studio tuning**
   - benchmark GPU offload, Flash Attention, GPU KV cache, eval batch size, loaded-model persistence, and cold/warm behavior;
   - keep provider-specific tuning behind the provider/runtime boundary.
4. **Benchmark and record accepted runtime-tuning baseline.**

5. **Startup warm-up**
   - test whether a tiny bounded readiness/warm-up request removes the observed first-run penalty.
6. **Benchmark and keep/revert warm-up based on measured end-to-end value.**

7. **Adaptive context/runtime profiles**
   - use the smallest sufficient operating band for ordinary, medium, and genuinely large-context work.
8. **Benchmark context-profile changes for both speed and task quality.**

9. **Stable / incremental context assembly and provider caching experiments**
   - reduce unnecessary repeated prompt/context processing without weakening precedence, provenance, budgets, or recovery.
10. **Benchmark and record the accepted context-processing baseline.**

11. **Parallelize independent tools**
   - begin with dependency-safe read-only operations and preserve deterministic evidence semantics.
12. **Benchmark end-to-end workflow improvement and concurrency overhead.**

13. **Reduce primary-model call count / deterministic batching**
   - batch safe deterministic work between inference turns instead of reflexively returning to the model after every operation.
14. **Benchmark total wall time, model-call count, correctness, and recovery behavior.**

15. **Speculative decoding experiment**
   - only at this late point, and only if a compatible draft model/runtime configuration is practical.
16. **Benchmark and retain it only if net end-to-end gains justify memory/complexity cost.**

### Stage 3 — Consolidated optimized baseline

17. **Run the complete benchmark suite against the final accumulated primary-model configuration.**
18. **Record a consolidated performance report** showing the original baseline, each accepted/rejected optimization, cumulative improvement, quality deltas, and final resource footprint.

The desired outcome is a highly optimized **primary-model + George harness path** whose performance characteristics are understood before adding another model.

### Stage 4 — Helper / utility model

19. **Evaluate a secondary local helper model** against the already-optimized primary baseline for compaction, ranking, extraction, routing, logs, diffs, and similar low-cost work.
20. **Benchmark helper-model routing itself** so gains are net of its scheduling, memory, inference, and quality costs.
21. **Then pursue the local research/page-compaction path** as an alternative to routine Parallel dependence, keeping Parallel as an optional escalation provider.

This ordering is intentional: benchmark first, change one variable, benchmark again, and repeat until the existing primary path has been optimized. Only then add the helper model.

## Questions for the benchmark-design pass

- Should the benchmark runner live inside George or as a developer-only script/harness around George?
- Which metrics can LM Studio report directly and which must George measure?
- How should hardware/environment fingerprints be normalized?
- How many warm repetitions are enough to reduce noise without making routine runs expensive?
- Which cases should be mandatory for every model/config change versus an extended suite?
- Should quality scoring be fully deterministic for the baseline suite, with model-graded evaluation kept separate?
- How should fixture repositories be versioned and reset between runs?
- Should tool-use benchmarks include both sequential and future parallel-capable variants?
- How should model-call and tool-call counts be captured from canonical session evidence?
- What acceptance threshold should determine whether each speed optimization is kept versus reverted?
- Which benchmark subset should run after every optimization, and which cases belong only in the full-suite consolidation run?
- What minimum quality threshold must a smaller helper model meet before it is allowed to compact context for the primary model?

## Non-decisions

This worksheet does **not**:

- select the helper model;
- select a SearXNG deployment/configuration;
- remove Parallel Search from Phase 6;
- change the current Phase 6 implementation contract;
- lock new context-window defaults;
- lock LM Studio tuning values;
- authorize speculative decoding;
- authorize concurrent mutations;
- define a new roadmap phase number.

Those decisions should follow measured benchmark evidence and the normal George documentation/planning workflow.
