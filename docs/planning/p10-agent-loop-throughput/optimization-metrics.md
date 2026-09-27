# Phase 10 Optimization Metrics

Status: APPROVED

## Primary metrics

- successful task completion;
- hidden acceptance;
- logical provider rounds;
- provider attempts;
- provider-active ms;
- total elapsed ms;
- provider input/output tokens;
- cached input tokens when available;
- tool calls;
- validations;
- corrections;
- retries/rebases.

## New Phase 10 metrics

- `executionMode`: human | operation;
- requested output-token ceiling and applied | inherited adapter disposition;
- completed tool/control payload counts;
- internal prose bytes / estimated tokens;
- George control count;
- successful meaningful action count;
- useful action density;
- model rounds avoided by deterministic orchestration;
- operation batch count;
- operation batch width;
- concurrent read count;
- parallel batch wall time;
- summed child tool runtime;
- duplicate/rejected read count;
- response acceptance latency;
- first useful output latency.

## Derived metrics

`Useful Action Density = successful meaningful actions / logical provider rounds`

`Cache Ratio = cached input tokens / input tokens` when both are provider-reported.

`Parallel Efficiency = summed child tool runtime / parallel batch wall time` for qualified concurrent batches.

Do not invent unavailable measurements.

## Acceptance precedence

1. safety / permission / evidence truth;
2. functional correctness;
3. task completion rate;
4. provider-round reduction;
5. provider/prefill/generation latency;
6. token reduction;
7. tool latency.

Performance never overrides a correctness regression.
