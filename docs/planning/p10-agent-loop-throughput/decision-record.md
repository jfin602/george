# Phase 10 Decision Record — Agent Loop Throughput

Status: APPROVED DIRECTION

Date: 2026-09-26

Phase: 10 — Agent Loop Throughput

Baseline package: `0.10.0`

Primary inherited authority:
- `BOOT.md`;
- `AGENTS.md`;
- `docs/workflow.md`;
- `docs/stability-contract.md`;
- `docs/phase-9-owner-closeout.md`;
- Phase 9 Task Prompt v1 / TaskState / StackState / permission / recovery / evidence contracts;
- frozen Phase 9 live-work instruments and historical evidence;
- `docs/planning/c9-gen-op/{decision-record,qualification-plan}.md` as an unexecuted design precursor only.

## Goal

Reduce the number, input cost, output cost, and serialization cost of primary-model rounds while preserving or improving task completion efficacy.

Phase 10 optimizes the agent loop, not the intelligence of the underlying model.

George should call the primary model only where inference adds value and should own deterministic orchestration itself.

Optimization priority:

1. fewer provider/model rounds;
2. less prompt/prefill work per provider round;
3. less unnecessary generated output per provider round;
4. better batching between provider rounds;
5. dependency-safe read-only tool concurrency;
6. lower-level tool/runtime micro-optimization.

Provider/model latency dominates current local workloads. Tool parallelism is useful primarily when it removes serialization boundaries or shortens a provider-to-provider cycle.

## Human mode and Operation mode

Phase 10 introduces an explicit provider-facing distinction.

### Human mode

Used when the developer/operator is expected to read the model response.

Natural-language output is allowed.

Examples:
- ordinary chat;
- explanations;
- final user-facing answers;
- explicitly requested planning prose.

### Operation mode

Used for internal structured-agent work where prose is not itself a deliverable.

Examples:
- structured inspection/action selection;
- implementation;
- correction;
- tool-result continuation;
- internal task handoff.

Operation-mode output must use a typed machine protocol:
- executable tool calls; and/or
- bounded George application-control output.

Routine narration, progress prose, explanations, and completion prose are not useful internal outputs and should not be generated.

Human language remains at the human boundary. Machine protocol is used inside the agent loop.

## George Operation Protocol v1

The initial operation protocol should build on existing function/tool calls rather than inventing a dense custom DSL.

Add a small versioned George-owned control surface.

The initial required control is:

`handoff` — return authority to George because no further model action is required for the current bounded stage.

A later `blocked` control may be added only if implementation evidence justifies it.

George controls are:
- provider-visible;
- application-owned;
- non-executable;
- not ToolRegistry capabilities;
- unable to grant permissions;
- unable to mutate files or run processes;
- unable to mark TaskState complete;
- unable to mark validation Green.

Malformed or mixed-invalid controls fail closed.

A handoff must not become mandatory overhead. When George can deterministically infer the next transition from a successful tool result and canonical TaskState, it should advance without another model round.

## Deterministic orchestration before inference

Phase 10 must audit structured provider calls and remove model invocations for transitions George already owns.

George should not call the model merely to decide:
- whether a validation passed;
- whether to rerun a failed validation after a completed correction;
- whether to advance to the next validation;
- whether to advance to the next work unit or stack task when deterministic completion state is already satisfied;
- whether evidence is fresh/stale;
- whether effective permission allows an action;
- whether a declared literal validation should run;
- whether a deterministic stop/budget/cancellation condition is terminal.

Model inference remains appropriate for:
- choosing what to inspect;
- understanding code;
- selecting/designing a mutation;
- producing a mutation;
- repairing an observed failure;
- resolving genuine semantic ambiguity.

## Stable provider prefix and late dynamic control context

Current structured alignment changes every provider round.

Phase 10 should preserve mission-card authority while changing provider placement.

Provider-facing layout should prefer:

```text
stable George instructions
stable operation protocol
stable tool definitions / stable task semantics
provider-native continuation and tool results
late dynamic round-control context
```

The dynamic tail may include:
- current work unit;
- current fresh evidence;
- stale evidence markers;
- failed validation evidence;
- mutation generation;
- next completion condition;
- stop conditions.

Stable instruction content should remain byte-stable across continuation rounds when semantics are unchanged.

Provider adapters translate wire format only. TaskState logic remains application/core authority.

Canonical George state never depends solely on provider-native cache state.

## Useful-output provider timing

Response acceptance is not useful output.

Provider attempt state must distinguish at least:
- request sent;
- response accepted/prefilling;
- useful output active;
- completed.

`response.started` / response creation establishes response identity/acceptance, not active generation.

The first-useful-output allowance continues through accepted prefill.

Text generation and function/control-call generation progress are useful output.

Once useful output begins, the shorter active-output inactivity policy may apply.

Caller cancellation remains authoritative.

The existing finite retry/rebase safety contract remains unless separately requalified.

## Output budgets by round type

Phase 10 may add provider-independent output/generation policy by round type.

Initial policy should be conservative and empirical.

Candidate ranges:
- simple operation/action selection: roughly 128–256 tokens;
- ordinary mutation/correction selection: roughly 256–512 tokens;
- short continuation: roughly 128–256 tokens;
- human-facing response: normal existing behavior;
- deep planning: explicitly larger when requested.

Structured function-call arguments must not be accidentally truncated by prose-oriented limits.

Every retained limit must have correctness evidence.

## Multi-tool batching

The current provider can already propose multiple tool calls in one provider response.

Phase 10 should exploit that rather than forcing one model round per observation.

One provider round may propose multiple independent reads.

George should:
- validate all calls through canonical ToolRegistry/policy;
- identify dependency-safe operations;
- execute the safe batch;
- return one deterministic normalized result batch in original provider-call order;
- continue with one provider round.

Batching and concurrency are separate decisions.

A batch may still execute sequentially before concurrency is introduced.

## Read-only concurrency

The first concurrent execution class is narrow:

- local read-only;
- replay-safe;
- independently validatable;
- no declared dependency between calls;
- no shared mutation/process/approval/external-effect boundary.

Candidate tools:
- `read_file`;
- `list_directory`;
- `search_text`;
- `git_status`;
- `git_diff`.

Execution may be concurrent while provider-visible result ordering remains deterministic.

Mutations, processes, approvals, remote effects, ambiguous effects, or dependency-linked calls remain sequential unless a later contract explicitly qualifies them.

Failure/cancellation of one concurrent call cannot fabricate success for another.

## Focused correction loop

Validation correction should not reopen a broad exploration loop when current evidence is still valid.

Introduce a bounded correction frame derived from canonical state, containing only what is necessary:
- active work unit;
- failed validation identity;
- bounded stdout/stderr/error evidence;
- relevant fresh file/mutation evidence;
- applicable requirement/invariant;
- repair completion condition.

The model repairs the observed failure only.

George then reruns the failed validation directly.

No extra completion round is required when George already knows the next transition.

Broad rediscovery is allowed only when freshness/recovery evidence actually requires it.

## Fast live efficacy instruments

Phase 10 creates two new immutable live-work instruments for routine optimization.

They supplement rather than rewrite Phase 9 B2/C2.

### B3 — compact greenfield stack

Pure Node; no network or dependency installation.

It must prove:
- structured stack ordering;
- multiple tasks;
- workspace mutation;
- validation;
- bounded correction;
- StackState completion;
- hidden acceptance;
- zero human coding intervention.

Target runtime for the initial local Qwen path: approximately 2–5 minutes, then improve from measured baseline.

### C3 — compact existing-repository edit

Pure Node; no network or dependency installation.

It must prove:
- inspection of existing code;
- preservation of baseline behavior;
- focused mutation;
- focused validation;
- broad validation;
- TaskState completion;
- hidden acceptance;
- zero human coding intervention.

Target runtime: approximately 1–3 minutes.

B3/C3 instrument contents and hidden acceptance become immutable once officially exercised.

## Phase 9 B2/C2 become milestone gates

Do not delete or rewrite:
- `greenfield-express-v2` (B2);
- `existing-express-feature-v2` (C2).

They remain frozen longitudinal evidence.

Do not run them after every optimization.

Use them at milestone boundaries:
- inherited Phase 9 baseline is already recorded and is not rerun merely to start Phase 10;
- after the primary-only Phase 10 optimization campaign;
- Phase 10 closeout;
- Phase 11 consolidated qualification where applicable.

## Gate hierarchy

### Deterministic micro-floor

Run continuously for the affected seams.

### Fast live efficacy gate

Routine Phase 10 live gate:

`greeting -> three-file -> Gate A -> B3 -> C3`

Use isolated workspaces/sessions.

The initial target is roughly 5–10 minutes for the complete live gate, then improve from baseline.

### Milestone qualification

Run less frequently:
- full benchmark suite;
- selected `agentic-context` cases;
- B2;
- C2;
- other inherited frozen Phase 9 evidence only when relevant.

## Benchmark authority

Extend the existing `npm run benchmark` harness rather than creating a parallel performance subsystem.

Existing benchmark identities remain immutable.

Phase 10 may add new case versions/suites and schema fields with explicit versioning.

Every optimization follows:

`baseline -> one bounded change -> correctness/performance comparison -> accept | revise | revert -> new accepted baseline`

Do not stack multiple unmeasured optimizations into one acceptance decision.

## Primary optimization versus helper experiment

Production Phase 10 remains single-primary-model.

After the primary-only optimization campaign and milestone qualification, run one bounded non-authoritative helper A/B experiment.

The helper may perform one narrow evidence-preparation function.

It cannot own:
- TaskState;
- permissions;
- tool execution;
- validation;
- completion;
- canonical evidence.

The helper experiment is comparative research only and does not replace the primary-only Phase 10 baseline.

## Preserved Phase 9 authority

Phase 10 must preserve:
- Task Prompt v1 semantics;
- canonical TaskState/StackState;
- George-owned validation/completion truth;
- permission and containment ceilings;
- replay safety and ambiguous-effect handling;
- response-completion-before-side-effect semantics unless separately redesigned/requalified;
- mission-card/evidence freshness semantics;
- strict duplicate/no-progress;
- session/evidence durability;
- historical B2/C2 Not Green truth;
- functional correctness outranking performance.

## Non-goals

Phase 10 does not include:
- speculative decoding;
- production helper-model delegation;
- multi-agent scheduling;
- daemon/background ownership;
- concurrent ambiguous mutations;
- unrestricted concurrent process/external effects;
- a dense custom George DSL before the typed operation protocol is qualified.
