# Phase 8 Prompt Assessment

Status: READY FOR IMPLEMENTATION PROMPTING

Phase: 8 — Context Throughput Optimization  
Execution folder: `p8`  
Baseline package: `0.8.0`  
Baseline main: `e24776c7cf3cefc9d86991e6c268e6bdb88afa65`

Read with `BOOT.md`, `AGENTS.md`, the current product/architecture/workflow/stability/roadmap contracts, `docs/planning/p8-context-throughput-optimization/decision-record.md`, `docs/planning/p8-context-throughput-optimization/initial-baseline.md`, and the performance worksheet.

## Assessment

Phase 8 is ready for an implementation stack. Runtime tuning and initial context measurement are already complete enough to establish a control. The next material gate is adaptive profile selection; later stable-prefix and provider-reuse experiments must remain sequential and benchmark-gated.

The qualified tooling baseline now exists in canonical source:
- `ORDINARY_CONTEXT_PROFILE`, `MEDIUM_CONTEXT_PROFILE`, and `LARGE_CONTEXT_PROFILE`;
- `DEFAULT_CONTEXT_PROFILE === LARGE_CONTEXT_PROFILE`;
- deterministic context composition profiler and CLI;
- context benchmark suite with programmable requested bands through the current 16,384 safety ceiling.

The normal runtime has **not** yet switched to adaptive selection.

## Current source truth

### Configuration

`src/core/config.ts` currently resolves one concrete `ContextProfile` into `GeorgeConfig.context.profile`.

There is no explicit adaptive/fixed mode. Because `resolveGeorgeConfig()` always materializes a concrete profile, adaptive-default intent cannot be inferred later from “profile omitted.” Phase 8 therefore needs explicit mode/selection configuration rather than overloading `DEFAULT_CONTEXT_PROFILE`.

The large profile must remain value-for-value compatible with the Phase-3 default.

### Context assembly

`assembleContext()` already owns:
- source identity/kind/trust/precedence/order;
- deterministic duplicate handling;
- active/routed/omitted/deferred/failed dispositions;
- whole-source token budgeting;
- hard required-source failure;
- optional soft-pressure budget;
- stable rendered guidance/conversation/tool channels.

This is the authority to reuse. Adaptive selection must not duplicate these rules in a second context compiler.

### Application loop

`AgentLoopApplicationService` currently stores one readonly profile for the service lifetime. Each turn:
1. loads skills/history/workspace sources;
2. assembles directly against that profile;
3. may invoke Phase-5 compaction on hard assembly failure or soft pressure;
4. emits `context.assembled`;
5. starts the provider loop.

That order conflicts with the approved Phase-8 adaptive law: ordinary/medium must promote before provider-backed semantic compaction.

Context-source lifecycle observations are currently emitted during the real assembly. Adaptive trial/probe assemblies must not leak duplicate canonical `context.source` evidence.

### Diagnostics

`ContextDiagnostics` currently records profile ID/value, token totals, soft pressure, headroom, categories, active source IDs, and disposition evidence.

It does not yet record:
- adaptive vs fixed mode;
- attempted profiles;
- promotion reason/category.

Those additions must remain bounded derived evidence.

### Compaction

Phase-5 compaction is provider-backed and may itself create a model call. It must remain a large-profile pressure mechanism. Profile selection cannot trigger semantic compaction simply to keep a turn inside ordinary or medium.

Existing checkpoint/recovery authority must remain unchanged.

### Provider continuation

The provider boundary already has `ProviderContinuation { responseId, toolResults }`. LM Studio translates it to `previous_response_id` plus function-call outputs. George still retains normalized canonical history.

The application currently passes the full base request object on continuation rounds, while the LM Studio adapter substitutes continuation tool-result input. Any attempt to omit repeated instructions/tools or otherwise rely more heavily on provider-native continuation is a later Phase-8 experiment and must be independently proven. Do not broaden continuation authority during adaptive-profile work.

### Benchmark

The context suite is deterministic and useful for Phase 8. It currently caps requested context bands at 16,384. The approved adaptive qualification requires a requested 24,576 band.

The accepted baseline artifact remains:
`/home/jfin/dev/george/artifacts/benchmarks/2026-09-24T20-03-38-980Z-90704`

Accepted runtime control remains main-model GPU Offload 26 plus the recorded Phase-7 settings.

### Existing Not Green evidence

Two TUI streaming assertions are already known to fail and were reproduced identically on clean pre-profiler HEAD. They are pre-existing Not Green evidence. Phase 8 must not hide them, “fix” them incidentally, or relabel broad validation Green.

## Task decomposition

### P1 — adaptive configuration and selector substrate

Add explicit adaptive/fixed context mode and a deterministic provider-free selector/probe boundary over the existing three profiles.

Keep normal application behavior fixed/large until P2 wires the approved adaptive default.

Prove monotonic ordinary -> medium -> large promotion decisions without provider calls, tools, session mutation, or canonical source events.

### P2 — per-turn adaptive application integration

Make normal George runtime adaptive while explicit profile override remains fixed.

Select/finalize once before first provider request. Hold the selected profile for the entire turn.

Reorder pressure handling so ordinary/medium promote before provider-backed semantic compaction. Preserve Phase-5 large-profile compaction semantics.

Add bounded selection diagnostics/evidence.

### P3 — adaptive-profile qualification and ladder extension

Raise benchmark requested-band support to 24,576 without changing product context ceilings.

Build deterministic qualification covering ordinary/medium/large selection, promotion, fixed override, required-source retention, explicitly selected routed/skill/project material, no probe side effects, no provider call during selection, and large-profile compaction preservation.

Run/record the Phase-8 adaptive live ladder when the accepted local LM Studio runtime is available. Missing runtime evidence is Evidence Gap, not manufactured Green.

This prompt establishes the adaptive-profile baseline before later throughput experiments.

### P4 — stable-prefix/context identity experiment

Audit current rendered ordering and provider request construction. Implement at most one bounded semantically neutral stable-prefix/context-identity optimization.

Do not change logical precedence, roles, selected sources, tool permissions, or adaptive thresholds.

Benchmark against the accepted P3 adaptive baseline. Keep only a correctness-preserving measured improvement; otherwise revert the candidate and record rejection/no-op evidence.

### P5 — incremental/provider-native reuse experiment

Investigate one bounded reduction of repeated provider-facing context on continuation rounds, behind the provider boundary.

George's canonical normalized context/session state remains authoritative. Provider continuation/cache state must be optional optimization with explicit fallback.

Do not assume LM Studio retains omitted fields unless adapter tests and live evidence support it. Do not extend reuse across user turns unless the approved contracts can be preserved and the experiment is separately justified.

Keep/revert based on correctness plus measured evidence.

### P6 — integrated Phase-8 qualification

Qualify the exact accepted P1-P5 candidate:
- adaptive/fixed profile semantics;
- source precedence/provenance;
- Phase-5 compaction/recovery;
- provider continuation fallback;
- context ladder/token/latency evidence;
- quick/full regression floor;
- known pre-existing Not Green evidence kept explicit.

Create `docs/tasks/p8/P6-qualification-evidence.md`.

Permit at most two substantial evidence-driven correction cycles; every correction adds a permanent regression guard.

### P7 — adaptive continuation-pressure hardening

Start from the accepted P6 candidate and explicitly qualify the edge case where ordinary or medium is selected from a small initial working set but substantial file/search/tool-result context accumulates over later continuation rounds.

Prove that a frozen profile never causes silent loss of correctness-critical current/routed/project/skill/recovery context. Test current behavior before changing it. If a defect exists, prefer the smallest architecture-preserving reserve/budget/fail-closed correction and add a permanent regression guard.

Do not introduce helper-model summarization, semantic relevance routing, mid-turn profile resizing, or unrelated throughput work.

Create `docs/tasks/p8/P7-continuation-pressure-evidence.md`.

### P8 — evidence-only Phase-8 closeout

Audit both P6 integrated qualification and P7 continuation-pressure evidence and create/update `docs/phase-8-closeout.md` from the exact final post-P7 candidate.

The stability verdict must explicitly cover substantial within-turn tool/file-result growth under a frozen ordinary/medium profile and confirm that unsafe pressure cannot silently discard correctness-critical context.

Do not repair implementation, owner-close the phase, or advance Phase 9.

## Ordering rationale

P1 isolates policy/configuration before runtime behavior changes.

P2 changes the live context path only after deterministic selector behavior exists.

P3 qualifies adaptive profiles before any stable-prefix/cache experiment, matching the decision record.

P4 changes semantic-neutral ordering/identity only.

P5 touches provider-specific reuse only after provider-independent adaptive behavior is qualified.

P6 consolidates accepted experiments. P7 adds the narrow continuation-pressure hardening gate identified after integrated qualification. P8 records final truth without repairing it.

## Preserved behavior

Across all prompts:
- Phase-3 trust/precedence/source-order semantics;
- whole-source omission/defer/fail behavior;
- routing remains distinct from always-on context;
- required sources are never silently truncated;
- canonical normalized session/event history remains authoritative;
- Phase-5 compaction checkpoints and recovery truth remain derived/non-authoritative;
- permissions/tool policy are unchanged;
- TUI remains presentation-only;
- provider adapters remain replaceable;
- user work/Git dirty state remains preserved;
- the large concrete profile remains backward compatible.

## Deferred work

Not Phase 8:
- helper utility model compaction;
- Phase-9 parallel tool execution or model-call batching;
- speculative decoding;
- daemon/desktop work;
- making provider cache state canonical;
- unrelated TUI streaming correction.

## Model selection

- P1-P7: **Terra High**
- P8: **Terra Medium**

All prompts use:
`Browser required: no.`

## Validation policy

Implementation prompts use focused tests plus affected broad regression coverage, `npm run typecheck`, `npm test`, `npm run test:runner`, `git diff --check`, and explicit no-`package-lock.json`.

Performance prompts additionally use the formal benchmark harness and preserve Green / Not Green / Evidence Gap truth.

The live Phase-8 context benchmark command must independently verify REST-visible LM Studio settings and explicitly record the manual GPU Offload 26 UI check. Cold/first-shape and warm-state results remain separate.

## Four stability questions

### 1. User-visible / aggregate behavior at risk

Provider-input tokens, first-output latency, provider active time, provider request count, compaction call count, selected profile, promotion count/reason, omitted/deferred source count, continuation payload size, workflow latency, and deterministic answer/tool behavior.

### 2. Invariants

Required current intent/invariants/tool schemas survive; logical precedence/order stays stable; selected task context is not lost solely due to an undersized probe; ordinary/medium promotion precedes semantic compaction; fixed override stays fixed; provider-native state never becomes canonical authority.

### 3. Integrated-only evidence

Live LM Studio prefill/caching/continuation behavior, first-shape penalties, provider-reported token usage, and latency benefits cannot be proven solely through deterministic tests.

### 4. Comparison baseline

Package `0.8.0`, main `e24776c7cf3cefc9d86991e6c268e6bdb88afa65`, accepted GPU Offload 26 runtime state, and accepted context-ladder artifact `2026-09-24T20-03-38-980Z-90704`.
