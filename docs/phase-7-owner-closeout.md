# Phase 7 Owner Closeout

Status: OWNER-CLOSED WITH EXPLICIT FINAL-VERIFICATION NOT-GREEN ACCEPTANCE

Closed: 2026-09-24  
Phase: 7 — Inference Runtime Optimization  
Formal Phase 7 closeout marker: `a7d2e8491bf354a4317c80f06f1796cbee80ee58`  
Phase 8 baseline: `0.8.0`

This record captures the owner's explicit `/closeout phase 7` decision on 2026-09-24.

The owner accepts the completed Phase 7 runtime optimization work and its recorded evidence state for roadmap progression to Phase 8.

This owner decision does **not** rewrite the final 11/12 verification into Green.

## Accepted Phase 7 runtime state

The accepted measured runtime configuration is:

- context length: 32768;
- eval batch size: 2048;
- physical batch size: 512;
- max concurrent predictions / `parallel`: **1**;
- Flash Attention: on;
- GPU KV-cache offload: on;
- experts: 8;
- speculative draft: off;
- main-model GPU offload: prior working position, not the unstable maximum setting.

The accepted `parallel=1` warm verification remains:

- 12 / 12 quick-suite executions passed;
- 33.03 s total;
- 32.88 s provider/model time;
- 18 provider rounds;
- approximately 1.83 s average provider round;
- 0 retries.

Artifact:

`/home/jfin/dev/george/artifacts/benchmarks/2026-09-24T05-09-51-460Z-135836`

## Preserved non-Green evidence

The final restored-runtime verification remains explicitly **Not Green**:

- 11 / 12 passed;
- one `structured-tool-use-001` repetition duplicated the expected read;
- the run also included the recurring post-reload startup penalty.

Artifact:

`/home/jfin/dev/george/artifacts/benchmarks/2026-09-24T05-42-12-722Z-151109`

The owner accepts this known non-Green evidence for roadmap progression because:

- the accepted `parallel=1` decision already has separate 12/12 Green warm evidence;
- duplicate-tool behavior appeared under multiple configurations and was not established as a regression caused by the accepted runtime setting;
- all lower-performing, quality-regressing, or unstable experiments were rejected or aborted and their evidence retained.

Future documentation must preserve this distinction.

## Rejected/aborted decisions carried forward

Phase 7 explicitly retains:

- `eval_batch_size=2048`;
- `physical_batch_size=512`;
- Flash Attention ON;
- GPU KV-cache offload ON;
- `num_experts=8`;
- speculative draft OFF;
- no maximum main-model GPU-offload setting on this machine.

The owner also elected to stop further expert-count and low-yield runtime micro-tuning.

## Phase 8 gate

The next roadmap phase is:

**Phase 8 — Context Throughput Optimization**

Phase 8 begins from package baseline `0.8.0` and the accepted Phase 7 runtime control above.

Phase 8 should optimize provider-facing context/prefill cost while preserving:

- Phase 3 instruction precedence, provenance, and smallest-sufficient-working-set rules;
- Phase 5 recovery/evidence semantics;
- provider independence;
- canonical normalized session/context authority.

Phase 8 must continue the same one-change-at-a-time benchmark discipline and must not treat provider-native caching/reuse as the sole authoritative copy of George state.
