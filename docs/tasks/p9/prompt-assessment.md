# Phase 9 Prompt Assessment — Structured Task Execution + Workspace Autonomy

Status: READY FOR PHASE PROMPTING

Phase: 9 — Structured Task Execution + Workspace Autonomy  
Execution folder: `p9`  
Baseline package: `0.9.0`  
Planning baseline: `49cc154d96fd59872077acbfaf6e548f1109d16e`

Read with `BOOT.md`, `AGENTS.md`, current product/architecture/workflow/stability/roadmap contracts, the Phase 9 decision/format/qualification records, and the final Phase 8 owner/correction evidence.

## Assessment

Phase 9 is ready for implementation prompting.

The current repository has no Task Prompt v1 parser, TaskState, structured-task application service, Task TUI page, Workspace Autonomous policy, or sandbox process executor. The Phase 9 implementation can therefore be layered cleanly over the existing Phase 2-8 agent, context, tool, workflow, session, recovery, and TUI substrate.

The most important Phase 8 carry-forward is architectural:

> canonical TaskState is durable George state; it is not automatically provider context.

The structured execution layer must make Qwen's job smaller and more deterministic rather than wrapping the same large unstructured request in more metadata.

## Current source truth

### Agent/application boundary

`AgentLoopApplicationService` owns the canonical provider/tool loop, context selection, approvals, budgets, retries, compaction, hooks, recovery evidence, and frozen-turn continuation safety.

`CodingWorkflowApplicationService` wraps that loop with:
- Git baseline/final observation;
- requested validation processes;
- structured workflow completion;
- session persistence;
- timing/evidence.

Phase 9 should add a **new structured-task orchestration layer above these services**, not move task semantics into OpenTUI or the LM Studio provider.

### Session persistence

`Session` currently contains:
- id;
- canonical workspace;
- transcript;
- durable application events;
- interruption classification.

`LocalSessionStore` is schema-versioned and strict. It rejects unknown shapes and preserves bounded/redacted durable evidence.

Phase 9 durable TaskState should extend this canonical session boundary with an explicit schema migration/backward-compatible reader. Existing v1 sessions must remain openable or fail through a deliberate documented migration rule; silently discarding old sessions is not acceptable.

### Context and task slicing

Phase 8 leaves:
- adaptive/fixed context selection;
- provisional ordinary/medium/large values;
- no empirically healthy all-family agentic envelope;
- P7 continuation-pressure protection;
- `agentic-context` v3/schema 3 benchmark.

Phase 9 must not invent a new token threshold.

Structured task slicing should instead reduce the **semantic working set**:
- current work unit;
- applicable requirements/invariants;
- active validation/stop conditions;
- relevant routed/inspected repository evidence;
- bounded active correction evidence.

Completed unrelated work units and stale validation history remain durable TaskState but should not be repeated to the provider.

### Existing coding workflow validation

Current coding workflow accepts explicit `ValidationRequest` values and runs them through the same process/approval/budget boundary.

Task Prompt v1 adds:
- literal `Run:` validation;
- `Run: DISCOVER` plus bounded `Scope:`.

Literal commands must remain shell-free. Phase 9 should parse a small command-line syntax into executable/argv and reject shell operators/expansion rather than invoking a shell.

DISCOVER may let the model propose a validation executable/argv, but George must validate and execute that proposal through the normal process policy and record actual result evidence. Model text cannot mark validation Green.

### Inspection

Task Prompt v1 `READ FIRST` has explicit paths and maps naturally to existing context routing/workspace resolution.

`INSPECT` is natural-language scope. George cannot deterministically prove semantic understanding from narration.

The safe Phase 9 contract is:
- perform an explicit structured inspection stage when INSPECT exists;
- expose read-only inspection tools;
- require actual read/list/search/Git evidence before implementation can advance;
- retain the inspection evidence in TaskState;
- do not pretend that model narration proves inspection.

### Requirement truth

Requirement bodies are natural language. George should not claim that it semantically proved implementation merely because the model says so.

Use distinct states:
- pending;
- addressed by completed work;
- validated when covered validation evidence passes;
- failed/blocked where authoritative evidence requires it.

Task completion is application-owned from work-unit + validation + stop/correction state, not from a model sentence.

### TUI

The current TUI owns one transcript scroll region and interleaves work items into it.

Phase 9 should preserve the same event/work authority but present:
- Transcript page;
- Task page;
- persistent task/progress header;
- composer on both.

OpenTUI must consume TaskState projections only.

### Permission and outside-workspace policy

Current George tools are intentionally workspace-native:
- reads and mutations resolve through canonical workspace functions;
- writes/processes ask approval;
- outside paths reject before execution;
- existing `run_process` is explicitly non-sandboxed.

Phase 9 must preserve those paths.

Workspace Autonomous should introduce a George-owned effective execution policy:
- standard mode preserves current behavior;
- autonomous workspace-native reads/writes may auto-run;
- outside filesystem `reject | ask` is a separate capability path;
- an outside allow-once approval never changes the canonical workspace root or weakens workspace resolvers;
- external/network/browser/remote effects remain independent.

For outside filesystem `ask`, the implementation may intercept a path intent before the workspace executor, canonicalize the exact outside target through a separate resolver/capability, request approval, and dispatch through a bounded outside executor. Do not teach `resolveWorkspacePath` to accept outside paths.

### Process containment decision

The initial Linux Workspace Autonomous process backend should use **Bubblewrap (`bwrap`)** as an optional OS-enforced containment adapter.

Reasons:
- no in-process native addon is required;
- Linux user/mount/network namespaces provide an actual kernel boundary;
- it can remain an optional capability detected at runtime;
- failure/unavailability can safely fall back to the existing approval-required host-process path.

The sandbox path must be separate from the existing host `run_process` executor/effect.

Initial containment policy:
- bind the canonical workspace read/write at its canonical path;
- provide only required read-only runtime/toolchain roots;
- use isolated temporary HOME/TMP;
- sanitize environment as the host process path already does;
- deny network by default using a separate network namespace;
- only permit network when effective user policy explicitly authorizes it;
- preserve timeout/cancellation/descendant cleanup semantics;
- fail closed/fallback if `bwrap` or required namespace setup is unavailable.

Do not use `--ro-bind / /` as the security model because that would expose arbitrary host files for reading.

Tests must include outside sentinel read/write failure and symlink/traversal attempts.

### Phase 8 mandatory regression

The Phase 8 `agentic-context` edit-plus-validation workload is mandatory longitudinal evidence.

Phase 9 must replay an equivalent structured task before claiming usefulness.

The original result remains Not Green.

The structured replay records:
- functional edit/validation;
- expected/observed tools;
- duplicate/redundant/unrequested calls;
- provider rounds/attempts/retries;
- context/profile/tokens;
- wall time;
- intervention;
- final TaskState ledger.

P4 is the dedicated replay/hardening prompt so the phase gets an early answer before TUI/autonomy work.

## Task decomposition

### P1 — Task Prompt v1 parser and domain model — 0.9.1

Implement `src/tasks` parser/types for the approved grammar.

No provider/tool/TUI execution yet.

### P2 — TaskState, state machine, and durable session persistence — 0.9.2

Create application-owned task/requirement/work/validation/correction state and persistence/reopen support.

No model orchestration yet.

### P3 — Structured task orchestration and bounded task slices — 0.9.3

Add a structured-task application service over the existing agent/coding workflow.

Implement READ FIRST, INSPECT preflight, work-unit dependencies, bounded task slices, basic validation execution, stop/block outcomes, and stage-appropriate tool exposure.

### P4 — Mandatory Phase 8 regression replay and structured hardening — 0.9.4

Run the structured equivalent of the failed Phase 8 edit+validation fixture against live Qwen where runtime is available.

Fix only bounded Phase 9 orchestration defects directly exposed by the replay and install regression guards.

### P5 — Bounded correction, revalidation, stack/resume semantics — 0.9.5

Add bounded correction cycles, DISCOVER validation resolution, truthful failure history, stack sequencing, and reopen/resume behavior.

### P6 — Transcript/Task OpenTUI split — 0.9.6

Add Task page, persistent task header, page navigation, and composer preservation without moving task authority into OpenTUI.

### P7 — Workspace Autonomous filesystem/effective policy — 0.9.7

Implement standard/autonomous policy, task-permission intersection, workspace auto writes, outside `reject | ask`, and narrow outside allow-once capabilities. Process auto-run is still disabled here.

### P8 — Bubblewrap workspace process containment — 0.9.8

Add the separate Linux `bwrap` sandbox process path, network independence, fallback/fail-closed behavior, and adversarial containment tests.

### P9 — Frozen live-work instruments + integrated Phase 9 qualification — 0.9.9

Freeze/run `greenfield-express-v1` and `existing-express-feature-v1`, perform integrated inherited-contract qualification, and record all Green / Not Green / Evidence Gap layers.

### P10 — evidence-only closeout — 0.9.10

Create formal Phase 9 closeout. Do not owner-close Phase 9 or open Phase 10.

## Ordering rationale

The parser/state substrate comes first.

Provider task slicing and structured orchestration are implemented before any UI/autonomy work.

The Phase 8 failed edit workflow is replayed immediately after the core structured path exists so usefulness problems are found early.

Correction/resume follows the first live structured evidence.

TUI presentation then consumes stable TaskState/events.

Autonomy policy precedes sandbox execution.

Full live-work qualification is last so it exercises the actual final Phase 9 architecture.

## Preserved behavior

Every prompt must preserve:
- provider independence;
- canonical normalized session/event authority;
- Phase 2 ToolRegistry/schema/approval boundaries;
- Phase 3 context precedence, source integrity, and skills;
- Phase 4 transcript/final-response/workflow truth;
- Phase 5 budgets, replay safety, compaction, interruption/recovery, hooks, diagnostics;
- Phase 6 external-effect/credential/plugin/adapter boundaries;
- Phase 7 runtime evidence truth;
- Phase 8 adaptive/fixed context behavior and P7 continuation-pressure guard;
- pre-existing Git/user work;
- no package-lock at George repository root.

## Deferred work

Not Phase 9:
- dependency-safe concurrent tool execution/model-call batching;
- speculative decoding;
- helper/utility model;
- local research replacement;
- daemon/desktop;
- unrestricted host administration;
- multi-agent scheduling;
- changing the pinned primary model;
- guessing a new context envelope.

## Model policy

- P1-P7: Terra High.
- P8 security-critical containment: Terra Ultra.
- P9 integrated/live qualification: Terra High.
- P10 closeout: Terra Medium.
- Browser required: no for every prompt.

## Validation policy

Each implementation prompt:
- focused tests at the changed boundary;
- affected inherited regression tests;
- `npm run typecheck`;
- `npm run test:runner`;
- `git diff --check`;
- verify no root `package-lock.json`;
- set package version to the assigned `0.9.N`.

P4/P9 live evidence must start with the pinned LM Studio REST control check and manual GPU Offload 26 reminder. Functional evidence may remain useful if UI-only offload is unconfirmed; controlled latency claims may not.

P6 native TUI evidence requires Node 26 + real TTY.

P8 actual sandbox Green requires real `bwrap` containment evidence; otherwise autonomous process execution must remain unavailable/fallback and be classified accordingly.

## Stability questions

1. User-visible aggregate risk: task parsing, task state, model slices, tool plans, validation/correction loops, resume truth, transcript/task UI, approval frequency, filesystem scope, process/network authority, context exposure, and real coding success.
2. Invariants: model/provider cannot mark task/validation Green by assertion; task text cannot elevate permissions; canonical TaskState/session evidence stays authoritative; workspace resolver stays workspace-only; host process stays non-sandboxed/approval-gated; no silent replay of ambiguous side effects.
3. Integrated-only evidence: live Qwen tool planning, Phase 8 regression improvement, actual `bwrap` containment, Node-26 native TUI, greenfield/existing-app task stacks.
4. Comparison baseline: Phase 9 baseline package `0.9.0`, planning HEAD `49cc154d96fd59872077acbfaf6e548f1109d16e`, Phase 8 owner-accepted agentic-context evidence, and frozen Phase 8 edit-plus-validation failure.
