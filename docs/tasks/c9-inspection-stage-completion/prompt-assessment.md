# c9-inspection-stage-completion Prompt Assessment

Status: READY FOR CORRECTION IMPLEMENTATION

Correction: `c9-inspection-stage-completion`  
Roadmap phase: 9  
Required unchanged package version: `0.9.10`

## Trigger

The latest Phase 9 correction chain has qualified the harness-side prerequisites needed for a fair local-model edit test:

- production `StackState` / ordered fail-stop task-stack execution — qualified deterministically;
- structured evidence handoff, task-wide budget, direct George-owned validation, and convergence limits — deterministic Green;
- full-file `read_file.sha256` -> safe existing-file mutation precondition — qualified;
- provider-neutral first-round required tool choice for structured INSPECT — qualified;
- exception-safe live attempt/trace retention — qualified;
- Bubblewrap containment — inherited Green.

The remaining live Gate A failure is now narrow and directly observed.

Latest official Gate A:
- initial INSPECT provider request used required tool choice;
- Qwen first selected `read_file {"path":"src/label.js"}`;
- Qwen requested three read-only tools in the first provider round;
- the stage then entered an automatic continuation and requested three additional reads;
- four local-read executions completed successfully;
- INSPECT hit its unchanged four-execution stage ceiling before implementation started;
- TaskState ended `budget_exhausted`;
- implementation, mutation, and George-owned V1 were never reached;
- provider rounds / attempts / retries: `2 / 2 / 0`;
- provider tokens: `3,946 / 134`;
- zero human coding intervention.

The stage ceiling worked correctly as a failure guard. The defect is that George still waits for the model to voluntarily finish INSPECT even after sufficient qualifying inspection evidence exists.

## Root cause

Structured INSPECT has two deterministic requirements:
1. at least one actual qualifying read-only tool execution must occur;
2. once qualifying evidence exists, preflight may advance to implementation.

Requirement 1 is now executable through first-round required tool choice.

Requirement 2 is still model-driven. The canonical agent loop executes a tool round, constructs continuation results, and asks the model again even when the calling application already has enough evidence to complete that bounded stage.

This violates the Phase 9 rule that deterministic orchestration belongs in George.

## Correction objective

Add one application-owned, capability-reducing agent-loop completion mode:

> after one provider tool round completes, if at least one tool execution in that round succeeded, terminate the bounded stage successfully instead of sending a continuation.

Enable that mode only for structured INSPECT.

The first inspection round remains model-selected:
- Qwen chooses among the restricted INSPECTION_TOOLS;
- George executes the full admitted tool-call round in model order;
- existing tool-call/stage limits still apply;
- if no tool succeeds, INSPECT does not complete;
- if a qualifying tool succeeds, the turn completes without an extra provider continuation;
- StructuredTaskApplicationService then extracts the successful inspection events and advances to implementation.

## Why tool-round completion rather than first-call completion

The latest live first INSPECT round contained several relevant calls. George should preserve the model's ordered calls within the already accepted provider round rather than terminating mid-round after the first success.

Completion therefore happens after the round's admitted calls finish, not after the first individual tool.

This preserves deterministic model-call semantics while eliminating the unnecessary second provider decision.

## Canonical loop implications

A successful early-completed inspection turn:
- emits normal provider/tool lifecycle evidence;
- does not commit provisional assistant text from a tool-calling provider round;
- emits normal turn completion;
- returns a completed CodingWorkflowCompletion even if no final assistant text exists;
- does not create/send a provider continuation;
- leaves ordinary agent-loop behavior unchanged when the mode is absent.

The generic seam may be reusable later, but Phase 9 enables it only where the completion criterion is deterministic and already owned by the application.

## Locked boundaries

Do not:
- change Task Prompt v1;
- change required first-round INSPECT tool choice;
- weaken actual inspection evidence requirements;
- change the inspection tool surface;
- lower or raise current stage limits as the fix;
- modify mutation SHA/preconditions;
- modify stack execution;
- retune context/runtime;
- alter correction/retry limits;
- change Bubblewrap/TUI;
- add Phase 10 concurrency/batching;
- add helper models;
- rewrite historical failures.

The four-execution INSPECT ceiling remains a fallback failure guard for rounds that cannot produce sufficient successful evidence.

## Recommended stack

### P1 — deterministic inspection-stage completion

Add the generic first-successful-tool-round completion seam and apply it only to structured INSPECT. Install permanent regression coverage proving no continuation provider request occurs after a successful inspection round.

### P2 — gated live requalification

Run the exact frozen Gate A once. If Green under the existing functional/call/round criteria, run greenfield through the qualified production stack, then existing-app only after greenfield Green.

### P3 — correction closeout

Evidence-only. Determine whether INSPECT stage completion and Qwen work-unit convergence are qualified.

## Gate A criteria

Unchanged:
- observed qualifying INSPECT evidence;
- exact required edit;
- George-owned V1 passes;
- completed/verified TaskState;
- zero human coding intervention;
- no task/stage/correction exhaustion;
- <=10 model-requested tool calls;
- <=10 logical provider rounds.

Also record:
- first INSPECT round calls/results;
- whether George terminated INSPECT without a continuation;
- implementation-stage start;
- read SHA/mutation-precondition provenance;
- complete attempt/trace evidence.

## Prompt count

Three prompts including one final closeout.

All prompts:
- use `Browser required: no.`;
- keep package `0.9.10` unchanged;
- preserve all previously qualified Phase 9/c9 boundaries;
- do not owner-close Phase 9 or open Phase 10.
