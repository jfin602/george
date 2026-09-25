# c9-inspection-execution Prompt Assessment

Status: READY FOR CORRECTION IMPLEMENTATION

Correction: `c9-inspection-execution`  
Roadmap phase: 9  
Required unchanged package version: `0.9.10`

## Trigger

The current Phase 9 live gate is still Not Green, but the failure is now sharply localized.

Already-qualified inherited boundaries:
- production structured task-stack execution: qualified deterministically;
- safe existing-file mutation contract: qualified;
- `read_file.sha256` -> `expectedSha256` mutation precondition path: qualified deterministically;
- structured stage evidence handoff/task-wide budget/direct validation/convergence guards: implemented and deterministically Green;
- Bubblewrap containment: inherited Green.

Latest live Gate A failure:
- pinned Qwen/LM Studio runtime was healthy;
- frozen structured replay started;
- structured INSPECT returned without any accepted read-only tool evidence;
- `StructuredTaskApplicationService` threw `Structured INSPECT preflight produced no read-only evidence.`;
- implementation was never reached;
- target remained unchanged;
- Gate B/C correctly did not run.

The same attempt also exposed a remaining qualification-layer defect:
- `runLiveWorkInstrument()` buffers events but awaits the production service before constructing a result;
- when the structured service throws, no `LiveWorkResult` exists;
- artifact writing therefore never receives the already-observed bounded events;
- official call/round/token/context/budget evidence is lost again.

## Root cause 1 — INSPECT is semantically mandatory but operationally optional

The current structured INSPECT prompt says:

> Use a local read/list/search/Git tool before responding.

However the provider request gives the model tools with ordinary automatic tool choice. Qwen may therefore return text without requesting any tool.

George then correctly rejects the stage because INSPECT requires observed tool evidence, but the harness did not make the required behavior deterministic.

This violates the Phase 9 design principle:

> Move reasoning that can be made deterministic out of the model and into the harness.

Whether INSPECT must contain at least one observed read-only tool call is deterministic task semantics and should not rely only on prose compliance.

## Root cause 2 — thrown production service loses official attempt envelope

Current live qualification creates its result only after the production service returns.

A service-level exception therefore bypasses:
- trace construction;
- attempt serialization;
- TaskState/StackState safe projection capture;
- provider/tool/context/budget metric persistence.

This is narrower than the prior postprocessor defect. Typed extraction itself is Green; the missing boundary is exception-to-result conversion at the qualification observer layer.

## Correction objective

1. Add a provider-neutral way for an application stage to require at least one tool call on its **first provider round**.
2. Apply it only to structured INSPECT.
3. Keep continuation rounds normal/automatic so one required inspection does not force an infinite sequence of tool calls.
4. Make live qualification convert thrown production-service failures into a bounded failed result with all events/state observed up to the throw.
5. Re-run the exact frozen Gate A once with durable telemetry.

## Provider boundary

The current provider request contract has:
- instructions;
- input;
- tools;
- continuation.

Add a narrow provider-neutral tool-choice contract, preferably:

`toolChoice?: 'auto' | 'required' | 'none'`

or an equivalently typed representation.

Requirements:
- provider-independent core type;
- LM Studio adapter maps it to OpenAI-compatible `tool_choice`;
- adapters must not silently ignore an explicitly required mode;
- `required` is invalid when no tools are exposed;
- ordinary calls remain unchanged when no tool-choice override is supplied.

Structured INSPECT should request `required` on only the initial provider request for that stage.

Continuation after the first observed tool result returns to ordinary automatic tool choice.

Do not force a specific read-only tool; Qwen may choose among the already-restricted INSPECTION_TOOLS.

## Qualification exception boundary

`runLiveWorkInstrument()` is an observer/qualification layer, not production task authority.

It may catch a production service exception and convert it into a bounded failed qualification result while preserving:
- already observed ApplicationEvents;
- safe session TaskState/StackState projections;
- normalized error code/message;
- hidden acceptance = not_run;
- derived trace/metrics from the events that did occur.

Catching the exception for qualification must not relabel production failure as success.

## Locked non-goals

Do not:
- modify Task Prompt v1 grammar;
- change production stack semantics;
- weaken INSPECT evidence requirements;
- bypass INSPECT by having George guess files;
- force a particular inspection tool name;
- retune context profiles;
- change mutation hash contract;
- alter stage call/round ceilings;
- change retry/correction counts;
- modify Bubblewrap/TUI;
- add Phase 10 concurrency/batching;
- add helper models;
- rewrite historical failures.

## Recommended stack

### P1 — required first-round inspection tool choice

Add provider-neutral tool-choice support, LM Studio mapping/tests, and structured INSPECT first-round enforcement.

### P2 — exception-safe live attempt retention

Convert thrown structured-service failures into bounded qualification results/artifacts with observed events/state retained.

### P3 — gated live qualification

Run the exact frozen Gate A once. Only if Green under existing functional/call/round criteria, run greenfield, then existing-app.

### P4 — correction closeout

Evidence-only. Determine whether mandatory INSPECT execution, exception-safe telemetry, and Qwen work-unit convergence are qualified.

## Gate A criteria

Unchanged:
- exact required edit;
- George-owned V1 passes;
- completed/verified TaskState;
- zero human coding intervention;
- no task/stage/correction exhaustion;
- <=10 model-requested tool calls;
- <=10 logical provider rounds.

Additionally record:
- initial INSPECT request tool-choice mode;
- first tool call selected by Qwen;
- observed `read_file.sha256` if `read_file` is selected;
- any mutation precondition and terminal result;
- complete failure envelope if the production service still fails.

## Prompt count

Four prompts including one final closeout.

All prompts:
- use `Browser required: no.`;
- require package version `0.9.10` unchanged;
- preserve all qualified Phase 9/c9 boundaries;
- do not owner-close Phase 9 or open Phase 10.
