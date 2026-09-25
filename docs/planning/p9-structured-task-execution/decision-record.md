# Phase 9 Decision Record — Structured Task Execution + Workspace Autonomy

Status: APPROVED DIRECTION — PLANNED NEXT PHASE AFTER PHASE 8

Phase 9 is the next planned George implementation phase after Phase 8 closes. It intentionally precedes Agent Loop Throughput so later throughput work optimizes the execution model George actually intends to use.

## Problem

George's current task prompts are strong human-readable implementation contracts, but they ask the execution model to reconstruct too much orchestration from prose: requirements, ordering, validation, stop conditions, correction behavior, and completion truth.

Phase 9 moves deterministic orchestration into George while leaving code understanding, implementation choices, debugging, and bounded reasoning with the coding model.

The current TUI also interleaves detailed work history with conversation, consuming transcript space. Repeated per-call approvals likewise limit useful autonomy for long structured tasks.

## Decisions

### George Task Prompt v1

Phase 9 introduces a versioned constrained-natural-language task format. It remains comfortable for humans and planning models such as ChatGPT Sol or Astra to author, but is deterministic enough for George to parse without semantic guessing.

Canonical marker:

    GEORGE TASK FORMAT: 1

A prompt carrying that marker must validate against the supported grammar. Invalid structured prompts fail closed with precise bounded diagnostics; George must not silently reinterpret them as ordinary chat. A prompt without the marker remains an ordinary conversational request.

Detailed grammar authority: docs/planning/p9-structured-task-execution/task-format-v1.md.

### Structured task authority

George parses a valid task into application/core-owned state including, as applicable:
- task identity and kind;
- goal;
- requirements;
- invariants;
- ordered work units and dependencies;
- required validation;
- stop/block conditions;
- deliverables;
- non-goals;
- declared execution expectations;
- current work-unit and verification state.

Identifiers such as R1, I1, W1, V1, S1, and D1 are stable machine identities. Their bodies remain natural language.

The TUI, provider, and future clients consume projections of this task state. They do not become task authority.

### Responsibility split

George owns prompt parsing/validation, requirement and validation ledgers, work-unit/dependency state, stop conditions, correction-cycle bounds, completion truth, durable task state, and permission ceilings.

The coding model owns understanding relevant code, selecting implementation details inside the current bounded work unit, producing edits/tool proposals, interpreting failures, and debugging.

George must not replace model intelligence with rigid pseudo-code. Work units describe outcomes, dependencies, requirements, and validation.

### Task-scoped model slices

George should send the primary model the smallest sufficient task slice rather than repeatedly sending the entire rich planning memo solely to remind the model where it is.

A slice may include the current work-unit objective, applicable requirements/invariants, relevant inspected/routed context, bounded prior failure evidence, and the next required validation or stop condition.

Task slicing remains subject to Phase 3/8 context precedence, provenance, budgeting, and required-context rules.

### Validation and bounded self-correction

Validation entries are first-class gates. A required validation remains unverified until George observes the actual result; model text cannot mark it Green.

Failed validation may enter a bounded correction state. George supplies relevant failure evidence/task context to the model, permits repair through the normal tool/permission boundary, and reruns affected validation. Correction cycles remain bounded, observable, cancellable, and subject to existing recovery semantics.

### Durable task stacks

Multiple structured prompts may form a versioned task stack. George validates stack identity, task numbering/order, dependency references, and applicable version/closeout rules before execution.

Durable state must retain enough evidence to reconstruct the active stack/task/work unit, requirement state, completed/outstanding validation, correction state, and interruption/outcome-unknown evidence. Resume must not blindly replay ambiguous side effects.

### Transcript and Task TUI pages

Phase 9 supersedes the earlier presentation direction that permanently interleaved routine work-log rows into the conversation surface.

OpenTUI gains two first-class pages:
- Transcript — primarily user/George conversation and committed assistant responses;
- Task — goal, current work unit, requirements, workflow, validation, blockers, recent execution work, and effective permission envelope.

The composer remains available on both pages. A compact persistent header remains visible on both pages and shows current task/work unit, progress/state, bounded model/context status, and effective access policy when relevant.

Task state and work projection remain application-owned. OpenTUI only renders them.

### Workspace Autonomous mode

Phase 9 introduces a higher-autonomy execution profile scoped to one canonical workspace.

Inside that workspace, Workspace Autonomous mode may automatically permit qualified workspace-native reads, writes/patches, normal development validation, and sandboxed development processes without per-call approval.

The outside-filesystem policy has exactly two modes:
- reject — deny outside-workspace access without prompting;
- ask — emit a bounded allow-once approval request for the specific outside resource/action.

A task prompt may declare an expected execution envelope for reproducibility, but task/repository/model text can never raise the configured user permission ceiling.

### Process sandbox requirement

George's existing host-process path remains truthfully non-sandboxed. A workspace-bounded cwd is not containment.

Workspace Autonomous mode may auto-run development processes only through a separately qualified OS-enforced process-containment path that prevents ordinary host filesystem authority outside the granted boundary.

If the required sandbox is unavailable or cannot be established, George must fail closed or fall back to the normal approval-required non-sandboxed process policy. It must never silently treat cwd-only execution as sandboxed.

Phase 9 locks the security semantics, not one implementation technology. The concrete Linux containment mechanism is selected during implementation planning against the qualification host. Broader general-purpose host/container sandboxing remains future work.

### Network and external effects remain separate

Filesystem autonomy does not imply network autonomy. The effective run policy independently controls workspace filesystem authority, outside-workspace filesystem policy, network access, remote mutations, browser interactions, and credentials/environment exposure.

Existing Phase 6 effect classification and Phase 5 replay/recovery semantics remain authoritative.

### Live-work longitudinal qualification

Phase 9 establishes two frozen real-work task-stack instruments:
- greenfield-express-v1;
- existing-express-feature-v1.

The greenfield case starts from a controlled empty repository and builds a small Node/Express application through a fixed structured stack.

The existing-app case starts from one frozen fixture commit and applies the same fixed feature stack every run. Hidden acceptance tests remain outside the model-visible workspace.

Record raw dimensions rather than one opaque score: acceptance tests, required validation, human interventions, self-discovered/self-repaired defects, provider rounds/attempts/retries, tool calls and duplicate/redundant calls, context/profile/token evidence, elapsed time, task/requirement/validation truth, and permission/sandbox events.

After Phase 9, repeat these cases at later phase closeouts to provide longitudinal developer-usefulness evidence.

## Architecture boundaries

- Task parsing/orchestration belongs below presentation adapters.
- Provider adapters do not own task semantics.
- OpenTUI does not parse or mutate authoritative task state.
- Task prompts cannot grant executable authority.
- Workspace autonomy cannot weaken ToolRegistry validation, run budgets, cancellation, durable evidence, environment sanitization, credential isolation, or replay safety.
- Structured task state is not hidden chain-of-thought and must not contain model private reasoning.

## Non-goals

Phase 9 does not include dependency-safe parallel tool execution/model-call batching, speculative decoding, helper-model introduction, local web-research replacement, daemon/desktop implementation, unrestricted host administration, broad full-machine autonomy, or multi-agent scheduling.

## Success condition

Phase 9 may close when George Task Prompt v1 parses/fails closed deterministically; task/stack state, validation, stop/correction, and resume semantics are qualified; bounded task slices preserve authority; Transcript/Task TUI separation is qualified; Workspace Autonomous mode auto-runs only genuinely contained operations; outside reject/ask behave exactly as configured; prompts cannot elevate permission ceilings; both v1 live-work stacks are frozen and baselined; and inherited Phase 2-8 contracts remain intact.
