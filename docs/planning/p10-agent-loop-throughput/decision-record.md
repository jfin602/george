# Phase 10 Decision Record — Agent Loop Throughput

Status: APPROVED DIRECTION

Date: 2026-09-26

Phase: 10 — Agent Loop Throughput  
Baseline: Phase 9 owner-closed at package `0.9.10`  
Phase 10 baseline target: `0.10.0`

## Premise

Phase 9 established George-owned task, validation, permission, recovery, evidence, and convergence authority. Phase 10 optimizes the loop around that authority.

The primary rule is:

> Human language at the human boundary; machine protocol inside the agent loop.

George should call the primary model only when inference adds value. Deterministic orchestration stays in George.

## Optimization priority

Phase 10 prioritizes:

1. fewer primary-model rounds;
2. less prompt/prefill work per round;
3. less generated output per internal round;
4. better batching between provider rounds;
5. dependency-safe read-only concurrency;
6. lower-level tool micro-optimization.

This replaces the earlier tool-parallelism-first ordering.

## Human mode and Operation mode

Introduce an explicit provider-independent execution mode.

### Human mode

Used when model text is intended for the operator.

Natural-language output remains allowed.

### Operation mode

Used for structured inspection, implementation, correction, and internal continuation.

The model should produce typed operations, not narration:
- executable tool calls;
- a small George-owned control signal when explicit handoff/blocking is required.

Routine "I will inspect", progress prose, summaries, and "done" prose are not useful operation output.

## George Operation Protocol v1

Phase 10 owns a versioned internal protocol, initially built from:
- existing tool/function calls;
- bounded structured round context;
- a minimal George control schema.

Do not begin with an opaque compressed DSL. First eliminate unnecessary prose and stabilize provider context. A compact encoding may be benchmarked later only if efficacy is preserved.

George control is application control, not a ToolRegistry capability. Initial surface should remain minimal, such as:
- `handoff`: return control to George;
- optionally `blocked`: cannot make legitimate progress with supplied state/capabilities.

Control cannot grant permission, mutate, execute processes, validate, or complete TaskState.

## No mandatory handoff round

George must not ask the model whether work is done when George already knows the deterministic next transition.

Example:
- model performs required mutation;
- George-owned completion condition is satisfied;
- George runs declared validation directly.

A handoff control exists only where explicit yielding is useful.

## Stable prefix / dynamic tail

Provider-visible data should be arranged for locality:

```text
stable George invariants
stable operation protocol
stable tool definitions / stable task semantics
provider-native continuation + tool results
late dynamic task/evidence/control frame
```

Changing mission-card/task evidence remains deterministic and George-owned, but should not rewrite the stable request prefix when avoidable.

Provider adapters translate wire shape; they do not own TaskState.

## Useful-output liveness

Carry forward the unexecuted `c9-gen-op` finding.

Provider liveness must distinguish:
- request/response acceptance;
- prefill/awaiting first useful output;
- useful output active;
- completed.

Response acceptance alone must not activate a short post-output inactivity timer.

The existing absolute provider timeout and Phase 9 replay/rebase safety remain unless separately justified by evidence.

## Deterministic round elimination

Audit every provider invocation.

George should directly own transitions it can already determine from canonical state:
- validation pass/fail;
- validation sequencing;
- begin correction;
- rerun validation after repair;
- work-unit/stack progression where deterministic completion conditions permit;
- evidence freshness/staleness;
- permission and stop-condition decisions.

The model remains responsible for inference-heavy work:
- what to inspect;
- code understanding;
- mutation design;
- mutation generation;
- repairing observed failures;
- resolving genuine ambiguity.

## Multi-operation batching

One provider response may propose multiple independent operations.

George should batch independent replay-safe observations into one execution group and return one normalized result continuation.

The objective is fewer provider turns, not merely faster filesystem calls.

## Read-only concurrency

First concurrency class is intentionally narrow:
- independent replay-safe local observations such as `read_file`, `list_directory`, `search_text`, `git_status`, and `git_diff` when dependency analysis proves independence.

Execution may be concurrent, but:
- original provider-call identity/order is preserved in normalized results;
- cancellation is shared and deterministic;
- failures remain isolated and attributable;
- mutations, approvals, processes with effects, ambiguous operations, and dependency-linked calls remain sequential.

## Focused correction path

Validation failure should produce a compact correction frame containing only:
- current work unit;
- failed validation;
- bounded failure stdout/stderr/error;
- current valid mutation/evidence;
- applicable invariant;
- repair completion condition.

The correction model must repair the observed failure without broad rediscovery.

George then reruns validation directly.

## Output budgets by mode

Add provider-independent output-budget intent where supported.

Internal operation rounds should have bounded generation allowances appropriate to their job; operator-facing and deep-planning responses may be larger.

Tool/control payload correctness outranks token ceilings. No output budget may truncate required structured arguments.

## Fast efficacy gates

Create new immutable Phase 10 fast live-work instruments.

### B3 — compact greenfield stack

Pure Node, no network/dependency installation.

Must still prove:
- ordered TaskStack execution;
- 2-3 tasks;
- mutation;
- declared validation;
- bounded correction;
- StackState completion;
- hidden acceptance.

Initial target: 2-5 minutes.

### C3 — compact existing-repository edit

Pure Node existing fixture.

Must prove:
- inspect existing code;
- preserve baseline behavior;
- focused mutation;
- focused + broad validation;
- TaskState completion;
- hidden acceptance.

Initial target: 1-3 minutes.

## B2/C2 become milestone gates

Frozen B2/C2 remain immutable historical/longitudinal instruments.

Do not run them after every optimization.

Run them:
- after the primary-only Phase 10 optimization campaign;
- at Phase 10 closeout when useful;
- later in Phase 11 consolidation.

Their Phase 9 Not Green state remains historical truth.

## Gate hierarchy

### Deterministic micro-floor
Run affected unit/integration tests continuously.

### Fast live efficacy gate
Routine live sequence:

`greeting -> three-file -> Gate A -> B3 -> C3`

Initial whole-sequence target: 5-10 minutes, then optimize downward.

### Milestone qualification
Use full benchmark, selected agentic-context cases, B2/C2, and broader inherited gates only at meaningful checkpoints.

## Performance authority

Extend the existing benchmark harness rather than creating a second benchmark system.

Add metrics where observable:
- cached input tokens;
- operation-mode vs human-mode rounds;
- internal prose bytes/tokens;
- George control calls;
- useful actions per logical provider round;
- operation batch count and width;
- parallel tool wall time vs summed runtime;
- duplicate/rejected reads;
- model rounds avoided by deterministic orchestration;
- correction cycles;
- successful-task provider rounds;
- task completion rate;
- response acceptance and first useful output timing.

Derived comparison metric:

`Useful Action Density = successful meaningful actions / logical provider rounds`

It is comparative evidence, not initially a hard product threshold.

## Keep / revise / revert discipline

Every optimization is independently classified:
- accept: measurable benefit with efficacy/safety preserved or improved;
- revise: promising but bounded defect remains;
- revert: no material benefit or correctness declines.

Do not retain clever infrastructure merely because it is theoretically attractive.

## Functional authority outranks performance

A faster failure is still failure.

Permissions, containment, TaskState/StackState truth, validation, recovery, evidence integrity, replay safety, and side-effect boundaries remain stronger gates than throughput.

## Helper A/B

Only after the primary-only optimization campaign, run one bounded non-authoritative helper experiment.

The helper may prepare/reduce evidence but cannot own TaskState, permissions, tools, validation, completion, or canonical evidence.

The helper result is comparative research for later utility-model work, not the Phase 10 baseline.

## Deferred

Phase 10 does not add:
- concurrent ambiguous mutations;
- multi-agent execution;
- daemon/background ownership;
- unrestricted helper autonomy;
- speculative decoding as baseline;
- opaque custom machine language without benchmark evidence.
