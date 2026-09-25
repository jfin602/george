# c8-agentic-context Prompt Assessment

Status: READY FOR CORRECTION PROMPTING

Correction: `c8-agentic-context`  
Parent phase: 8 — Context Throughput Optimization  
Execution folder: `c8-agentic-context`  
Required unchanged package version: `0.8.8`  
Planning baseline: `e5d79d01871bfe68d4e00af2186c1c4d5778be5d`

Read with `BOOT.md`, `AGENTS.md`, current product/architecture/workflow/stability/roadmap contracts, `docs/planning/c8-agentic-context/{decision-record,qualification-plan}.md`, the historical Phase-8 records/evidence, and `docs/planning/performance-benchmarking-worksheet.md`.

## Assessment

The correction is ready for an implementation stack.

The defect class is not that Phase 8's deterministic context machinery is internally broken. The defect is that production operating envelopes were derived from a synthetic long-context benchmark that does not sufficiently represent real coding-agent requests.

The correction must therefore repair the measurement authority first, measure the pinned model's effective agentic envelope, and only then change production context policy.

## Current source truth

### Adaptive context core

The current `0.8.8` implementation already provides:
- explicit adaptive/fixed mode;
- ordinary/medium/large profile registry;
- deterministic profile probes through the real context assembler;
- monotonic promotion;
- non-canonical discarded probes;
- final canonical assembly before provider execution;
- per-turn profile freezing;
- bounded promotion diagnostics.

These are preserved unless the correction proves a concrete defect.

### Context assembly

`src/context/index.ts` remains the sole authority for:
- trust and precedence;
- whole-source loading;
- source identity/order;
- duplicate suppression;
- required versus optional behavior;
- omit/defer/fail dispositions;
- provider-independent rendered guidance/conversation/tool channels.

Workspace `.george/instructions.md` and root `AGENTS.md` are ordinary project-guidance sources. `BOOT.md` is routed rather than injected as active guidance.

The correction must not introduce a second assembler or silently truncate a critical source.

### Selection policy

`src/context/profile-selector.ts` currently promotes:
- required-source failures;
- soft pressure;
- selected project instructions;
- routed documents;
- activated skills.

For selected optional project/skill/routed material it may probe larger profiles to see whether a larger envelope makes the material active.

That behavior was reasonable under the original capacity-oriented Phase-8 model, but it can now cause George to choose a technically valid larger request shape that has not been shown to preserve useful coding-agent performance.

The correction must revisit this policy only after live agentic measurement.

### Application loop

`src/application/one-turn.ts`:
- selects a profile before provider execution;
- assembles canonically once after selection;
- promotes ordinary/medium before provider-backed semantic compaction;
- preserves large-profile Phase-5 compaction behavior;
- builds a single base provider request;
- freezes selection through continuation rounds;
- estimates accumulated continuation result growth;
- stops before an unsafe continuation would exceed the frozen profile's provider-input ceiling.

P7's continuation-pressure guard is a permanent regression boundary.

### Existing profile representation

The profile type currently contains:
- physical context;
- preferred working-set min/max;
- soft pressure;
- provider-input ceiling;
- reserved headroom;
- always-on target.

The correction architecture now distinguishes physical capacity, hard safety ceiling, and effective agentic working set. If empirical policy cannot be represented safely with the existing fields, the implementation may add the smallest explicit agentic operating limit rather than misusing a hard provider ceiling. That decision belongs after P2 evidence.

### Benchmark harness

The benchmark harness is currently schema v2 / suite v2 and supports:
- quick;
- full;
- synthetic context.

The synthetic context suite:
- uses `fixture: none`;
- exposes zero tools;
- places most long material in the user input;
- is useful for prefill/retrieval characterization;
- is not sufficient authority for production coding-agent profile boundaries.

The existing benchmark record already captures useful provider/tool/timing evidence, including first output, provider usage, calls, retries, and context estimate. It does not yet expose all context-selection diagnostics required by the correction.

### Live evidence motivating the correction

Preserve these observations as evidence, not assumptions about root cause:
- real ordinary selection completed a live read flow but the model proposed an unrequested write and did not obey exact-only final formatting;
- calibrated medium at approximately 11,429 estimated tokens and large at approximately 14,932 selected correctly but timed out at 120 seconds;
- one captured medium-selected request at approximately 12,945 estimated tokens contained roughly 48.6 KB of instructions plus nine tool schemas and required about 88 seconds to first useful output;
- synthetic warm 10.4k-provider-input retrieval has completed in only a few seconds;
- later A/B/C isolation controls became invalid when LM Studio stopped producing usable completions and then stopped listening.

The precise inference cliff remains unresolved. The correction does not need to invent a root cause before measuring usable agentic capacity.

## Task decomposition

### P1 — agentic benchmark instrument

Add a first-class agentic-context benchmark suite without changing production context policy.

The suite must use real George application/provider/tool boundaries and realistic coding-agent fixtures at configurable approximate working-set bands.

At minimum include:
- repository inspection;
- sequential multi-round investigation;
- bounded edit plus validation.

Expose normal George coding tool schemas rather than the synthetic context suite's zero-tool shape. Network/browser tools must remain non-authoritative and tasks must not require external services.

Record context mode/profile/attempts/promotion/disposition evidence in benchmark records in addition to existing timing/tool/provider evidence.

Keep the old synthetic context suite unchanged as characterization.

### P2 — empirical agentic envelope measurement

Run the P1 suite against the pinned live LM Studio/Qwen control in ascending approximate bands:
2k -> 4k -> 6k -> 8k -> 10k -> 12k.

Use one exploratory execution per band and stop ascending once a material cliff appears.

Then perform bounded confirmation around:
- the largest healthy candidate band;
- the next materially worse band.

Create an evidence record with Green / Not Green / Evidence Gap truth.

Do not change production profiles in P2.

### P3 — evidence-backed context policy correction

Read P2 evidence.

If P2 establishes a credible healthy agentic envelope, implement the smallest production policy correction supported by it.

Preserve 32k physical capacity and distinguish effective agentic operating limits from hard safety capacity.

Prefer:
- required George/user/tool/recovery context;
- immediate task/repository evidence;
- deterministic routing/defer of lower-value material;
- larger envelopes only when both needed and empirically qualified.

Do not silently discard applicable critical project guidance. If selected/required material cannot fit the largest qualified agentic envelope, fail/degrade explicitly rather than sending an unqualified giant request.

If P2 evidence is insufficient, do not guess new numbers. Record a policy-decision Evidence Gap and preserve current runtime values.

### P4 — deterministic correction qualification

Install permanent regression coverage for:
- the new agentic benchmark;
- any revised profile/agentic limits;
- promotion/routing/defer behavior;
- explicit oversized-selected-context behavior;
- fixed-mode/manual override semantics;
- Phase-3 precedence;
- Phase-5 compaction/recovery;
- P7 continuation-pressure safety.

Create deterministic qualification evidence.

### P5 — real George agentic qualification

Run the accepted policy through controlled live LM Studio/Qwen workloads.

Use the agentic benchmark for inspection, multi-round, and edit/validation capability.

Also perform bounded real supported George/TUI evidence where a usable TTY exists.

Do not manufacture Green if runtime controls fail.

Create live qualification evidence.

### P6 — evidence-only correction closeout

Audit P1-P5 from the exact final candidate.

Create `docs/tasks/c8-agentic-context/closeout.md`.

Do not rewrite the historical `docs/phase-8-closeout.md`, owner-close Phase 8, or advance Phase 9.

## Ordering rationale

Measurement comes first because the correction explicitly forbids guessed replacement profile values.

Production context behavior changes only after empirical evidence.

Deterministic qualification follows the policy change so every corrected behavior has a permanent detector.

Live qualification then tests the exact accepted candidate, and closeout records truth without repairing it.

## Preserved behavior

Across the stack preserve:
- package version `0.8.8`;
- 32,768 physical context unless a separate approved runtime experiment changes it;
- provider independence;
- Phase-3 trust/precedence/source identity;
- whole-source integrity;
- fixed profile semantics;
- probe side-effect neutrality;
- per-turn profile freezing;
- Phase-5 canonical-history/recovery authority;
- P7 continuation-pressure stop;
- tool permissions/approval boundaries;
- canonical George session history;
- user Git/dirty-state preservation;
- TUI presentation-only authority.

## Deferred work

Not part of this correction:
- helper/utility model;
- model-generated semantic relevance routing;
- Phase-9 structured-task implementation;
- Phase-10 parallel tool execution/model-call batching;
- speculative decoding;
- daemon/desktop work;
- changing the primary model.

## Model selection

- P1-P5: **Terra High**
- P6: **Terra Medium**

Every prompt uses `Browser required: no.`

## Validation policy

All correction prompts keep package version `0.8.8`.

Every implementation prompt must run focused coverage plus affected broader regression coverage, `npm run typecheck`, `npm run test:runner`, `git diff --check`, and verify no `package-lock.json`.

Live benchmark prompts must prepend the runtime control check and explicit manual GPU Offload 26 reminder before benchmark execution.

## Four stability questions

### 1. User-visible / aggregate behavior at risk

Coding-task success, instruction retention, tool selection/counts, duplicate/unrequested tools, TTFT/first useful output, workflow latency, provider calls/retries/timeouts, context size, profile selection, omissions/deferments, compaction, and continuation safety.

### 2. Invariants

Required task/safety context remains intact; no silent partial instruction source; permissions do not change; canonical session/recovery authority remains George-owned; fixed override stays explicit; adaptive probes stay non-canonical; P7 never sends an unsafe continuation.

### 3. Integrated-only evidence

Useful local-model coding ability at a given request size, request-shape latency, real tool planning, multi-round reliability, provider timeouts, and native TUI behavior require live/integrated evidence.

### 4. Comparison baseline

Correction planning baseline `e5d79d01871bfe68d4e00af2186c1c4d5778be5d`, package `0.8.8`, pinned Qwen3-Coder/LM Studio runtime control, historical synthetic context ladder, and the post-`0.8.8` live evidence recorded in the correction decision.
