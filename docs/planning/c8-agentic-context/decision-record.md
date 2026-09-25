# Phase 8 Correction Decision Record — Agentic Context

Status: APPROVED CORRECTION DIRECTION

Correction: `c8-agentic-context`  
Phase: 8 — Context Throughput Optimization  
Implementation baseline: package `0.8.8`, candidate `07241c94ed3cbc0dafc969f0a59676b39e232fb0`

Read with:
- `BOOT.md`;
- `AGENTS.md`;
- `docs/planning/p8-context-throughput-optimization/decision-record.md`;
- `docs/planning/p8-context-throughput-optimization/initial-baseline.md`;
- `docs/planning/performance-benchmarking-worksheet.md`;
- `docs/phase-8-closeout.md`;
- `docs/planning/c8-agentic-context/qualification-plan.md`.

## Why this correction exists

Phase 8 successfully implemented deterministic adaptive/fixed context profiles, monotonic profile probing, bounded diagnostics, promotion-before-compaction, and frozen-turn continuation-pressure protection.

Those mechanisms are useful and remain the implementation baseline.

However, live qualification after `0.8.8` exposed a mismatch between the synthetic long-context benchmark and George's real coding-agent request shape.

The existing context ladder primarily measures long-text retrieval/prefill:
- `fixture: none`;
- no tool schemas;
- most large text is in user input;
- tiny repository guidance;
- no meaningful coding-agent planning.

Real George requests include:
- George-owned instructions;
- project instructions;
- normal coding tool schemas;
- repository/tool planning;
- multi-round provider/tool continuation;
- workflow state.

A live diagnostic captured a representative medium-selected George request at approximately 12,945 estimated context tokens with:
- 48,609 instruction bytes;
- 120 input bytes;
- 9 tool schemas;
- 3,108 serialized tool-schema bytes;
- 52,220 total serialized request bytes.

That real request produced its first useful output after approximately 88 seconds and completed at approximately 89 seconds.

By contrast, the synthetic context ladder has produced warm observations at roughly:
- 5,306 provider input tokens in a few seconds;
- 10,428 provider input tokens in a few seconds on warm runs, while also retaining large first-shape variability and occasional timeout behavior.

The direct A/B/C request-shape isolation diagnostic became invalid when LM Studio stopped producing usable completions and then stopped accepting connections. The exact cause of the long real-agent delay therefore remains unresolved.

The operational conclusion does not depend on prematurely assigning a cause: the current synthetic capacity ladder is not sufficient authority for choosing George's real coding-agent working-set envelopes.

## Correction objective

George must optimize for **effective agentic working set**, not maximum context occupancy.

The target is:

> maximize coding-task correctness, tool-use reliability, and reasonable latency inside the smallest high-signal working set that the pinned local model can use competently.

Nominal context capacity remains a safety/resource fact. It is not proof of useful agentic capacity.

## Locked decisions

### Preserve the 32k physical model context

The pinned LM Studio runtime remains configured for a 32,768 physical context target unless a separate measured runtime experiment later changes it.

The physical window is headroom and emergency capacity for:
- generation;
- tool-result growth;
- recovery state;
- exceptional large tasks.

George should not treat the physical window as a normal prompt-size goal.

### Preserve the qualified Phase 8 mechanisms

The correction must retain, unless evidence proves a defect:
- explicit adaptive versus fixed mode;
- provider-independent context assembly;
- Phase 3 trust/precedence/source identity;
- whole-source omit/defer/fail behavior;
- deterministic profile probing;
- provider/tool/session-neutral discarded probes;
- selection before first provider request;
- one frozen profile per user turn;
- bounded context diagnostics;
- Phase 5 large-profile compaction/recovery authority;
- P7 continuation-pressure fail-closed behavior;
- canonical George session/context authority over provider-native state.

The correction is not a rewrite of the context subsystem.

### Current ordinary/medium/large values are provisional operating values

The `0.8.8` profile values remain historical/current implementation truth:
- ordinary: preferred 4,096-6,144; soft 7,168; ceiling 8,192;
- medium: preferred 8,192-12,288; soft 14,336; ceiling 16,384;
- large: preferred 12,000-18,000; soft 20,000; ceiling 24,576.

They are no longer accepted as final real-agent operating envelopes merely because they are internally consistent and deterministically qualified.

Do not guess replacement numbers in documentation or implementation before the agentic benchmark produces evidence.

### Real agentic workloads become the profile-boundary authority

The correction must add an agentic-context benchmark that uses George-shaped work:
- normal George instructions;
- realistic project guidance;
- normal tool schemas;
- real repository reads/searches;
- multi-round investigation;
- at least one edit-plus-validation workflow;
- deterministic expected outcomes.

Synthetic long-context retrieval remains useful for runtime/prefill characterization but cannot by itself qualify profile boundaries.

### Initial agentic sweep is bounded and ascending

The first measurement sweep should target approximately:
- 2k;
- 4k;
- 6k;
- 8k;
- 10k;
- 12k;

provider-facing working sets.

These are measurement bands, not new production profile definitions.

Stop ascending when a repeatable capability/latency cliff is established rather than running a large exhaustive matrix.

After the exploratory sweep, confirm the candidate healthy envelope and the next materially worse envelope with bounded repeat evidence.

### Agentic correctness outranks token reduction

A smaller/faster prompt is not accepted if it makes George a worse coding agent.

Measure at least:
- deterministic task success;
- required fact/instruction retention;
- expected tools;
- tool-call count/correctness;
- duplicate or unrequested tool behavior;
- provider response/first-useful-output latency;
- full workflow latency;
- provider calls;
- retries/timeouts;
- provider-reported input/output tokens when available;
- selected profile;
- promotion/omission/defer/compaction evidence.

### Promotion becomes fallback behavior, not the optimization target

Phase 8 originally promoted when deliberately selected project/skill/routed material became available only in a larger profile.

The correction must revisit this policy after measurement.

The desired order is conceptually:

```text
protect required agentic core
        |
route/narrow task-specific supporting context
        |
defer lower-value optional material
        |
compact older history where existing Phase-5 rules safely permit
        |
use a larger proven agentic envelope only when the task genuinely requires it
```

Do not silently truncate required sources.

Do not add model-generated relevance routing or helper-model summarization in this correction.

### Protect a high-signal agentic core

The correction should explicitly preserve budget priority for:
- George invariants;
- current user/task intent;
- required tool definitions;
- immediate task/repository evidence;
- authoritative unresolved/recovery state.

Project documentation, prior history, skills, and optional defaults remain governed by trust/precedence and should be routed/deferred/compacted according to existing laws rather than injected simply because capacity exists.

### Runtime health is a qualification prerequisite

A live run affected by:
- LM Studio no longer listening;
- provider stream ending without completion;
- unverified material runtime changes;
- provider timeout before usable evidence;

must remain Not Green or Evidence Gap for the relevant claim.

It must not be used to infer a context threshold without supporting evidence.

Main-model GPU Offload 26 remains part of the accepted runtime control when it can be independently verified.

### Phase 9 remains blocked

Phase 9 — Structured Task Execution + Workspace Autonomy — remains the approved next phase.

It must not begin implementation until the Phase 8 agentic-context correction is implemented, qualified, and owner-accepted/closed.

## Non-goals

This correction does not add:
- helper-model semantic compaction;
- semantic model-based relevance classification;
- Phase 10 parallel tool execution;
- model-call batching;
- speculative decoding;
- daemon or desktop behavior;
- provider cache state as canonical authority;
- broader permission/autonomy changes;
- a different primary model.

## Correction success condition

The correction may close when:
- a real agentic-context benchmark exists and is regression-protected;
- the pinned Qwen/LM Studio path has an empirically supported healthy agentic working-set envelope;
- production profile/routing policy is revised only where supported by that evidence;
- required context, Phase 3 precedence, Phase 5 recovery, and P7 continuation-pressure safety remain intact;
- real George coding scenarios qualify the final policy;
- synthetic context-ladder evidence is clearly classified as runtime/prefill characterization rather than profile-boundary authority;
- all live Not Green/Evidence Gap results remain explicit.

This correction supersedes the operating conclusion of the original Phase 8 profile-size campaign. It does not rewrite or invalidate the historical Phase 8 implementation/evidence records.
