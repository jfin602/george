# Phase 10 Optimization Metrics

Status: APPROVED MEASUREMENT CONTRACT

## Purpose

Make agent-loop optimization decisions from comparable evidence rather than intuition.

Use the existing benchmark/live-work systems as the measurement substrate.

## Primary metrics

### Provider efficiency
- logical provider rounds;
- provider attempts;
- retry count;
- provider-active time;
- average provider-round time;
- response acceptance latency;
- first useful output latency;
- input tokens;
- cached input tokens when reported;
- output tokens;
- internal operation text bytes/estimated tokens.

### Loop efficiency
- model rounds avoided by deterministic orchestration;
- meaningful successful tool actions;
- tool calls;
- tool batches;
- average/max batch width;
- duplicate/rejected reads;
- George control calls;
- validation count;
- correction cycles.

### Concurrency
- concurrent read batches;
- summed member tool runtime;
- batch wall time;
- overlap/speedup ratio where deterministic measurement supports it.

### Efficacy
- terminal workload state;
- TaskState/StackState completion;
- hidden acceptance;
- validation success;
- human intervention;
- hard exhaustion.

## Derived metrics

### Useful Action Density

`successful meaningful actions / logical provider rounds`

Use only for comparison on the same workload/version.

### Provider Share

`provider-active time / total elapsed time`

This already exists conceptually in the benchmark harness and remains useful for identifying the dominant bottleneck.

### Batch Compression

`tool calls / provider tool-selection rounds`

Higher is only better when correctness and dependency semantics remain valid.

### Cache ratio

When and only when cached-input token usage is reported:

`cached input tokens / input tokens`

Do not synthesize a cache ratio from timing or LCP server logs.

## Comparability

Every measurement must retain:
- Git candidate;
- dirty/clean state;
- model ID;
- provider origin;
- Node/platform;
- benchmark/instrument version;
- context profile/mode;
- process-order label already used by benchmark harness.

Runtime UI-only controls remain Evidence Gaps unless independently observable.

## Acceptance

No single metric decides acceptance.

Correctness and efficacy are hard gates.

A retained optimization should improve the metric it explicitly targets and avoid material regressions in other primary metrics.

Do not hide individual failed repetitions inside medians.
