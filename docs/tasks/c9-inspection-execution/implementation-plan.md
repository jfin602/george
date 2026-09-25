# c9-inspection-execution Implementation Plan

Status: READY FOR PROMPT EXECUTION

Correction: `c9-inspection-execution`  
Roadmap phase: 9  
Required unchanged package version: `0.9.10`

## Authority

Read:
- `BOOT.md`;
- `AGENTS.md`;
- current product/architecture/workflow/stability contracts;
- current Phase 9 structured-task decision/format/qualification authority;
- `docs/tasks/c9-structured-task-convergence/closeout.md`;
- `docs/tasks/c9-qwen-workunit-convergence/{P3-live-evidence,closeout}.md`;
- exact current source/tests before editing.

## P1 — required first-round inspection tool choice

### Core provider request contract

Extend `ProviderRequest` with a narrow optional tool-choice field.

Preferred values:
- `auto`;
- `required`;
- `none`.

Keep the type provider-neutral.

Validation:
- `required` requires a non-empty tool list;
- `none` must not be combined with semantics that assume a tool result;
- absent remains current provider-default behavior.

### LM Studio adapter

Map the provider-neutral field to the OpenAI-compatible request JSON `tool_choice`.

Permanent adapter tests must inspect the actual request body and prove:
- required -> `tool_choice: "required"`;
- auto -> `"auto"`;
- none -> `"none"`;
- absent leaves the field omitted;
- tool definitions remain unchanged;
- continuation payloads remain valid.

Do not add Qwen-specific branching to core/application code.

### Agent-loop first-round override

Add the smallest application submission seam needed to say:

> require one tool call on the initial provider round only.

The first request of the stage receives `toolChoice: required`.

After a tool result creates a continuation:
- subsequent provider requests use ordinary automatic/default tool choice;
- they must not inherit `required` accidentally.

The override can only affect tool-choice behavior among tools already selected by the application; it cannot expand tool capability.

### Structured INSPECT

For structured INSPECT only:
- keep the existing restricted INSPECTION_TOOLS;
- first provider round requires a tool call;
- existing stage limits still apply;
- observedInspection remains authoritative;
- if provider/backend cannot honor required tool choice, fail visibly rather than silently treating prose as inspection.

Do not use required tool choice for implementation/correction by default.

### Tests

At minimum:
- generic provider request typing/validation;
- LM Studio request-body mapping;
- structured INSPECT initial request is required;
- continuation request is not required;
- Qwen-equivalent scripted model cannot complete INSPECT with text-only first response under the application contract;
- chosen read-only tool executes through normal ToolRegistry/policy;
- no tools outside INSPECTION_TOOLS become available;
- ordinary unstructured chat requests are unchanged;
- implementation/correction stages remain automatic;
- current stage limits/no-progress guards remain Green.

## P2 — exception-safe live attempt retention

### Qualification result

Extend `LiveWorkResult` or an adjacent typed result so a thrown production service can still produce a qualification result containing:
- `terminalStatus` = failed/appropriate observed state;
- `hiddenAcceptance` = not_run;
- normalized safe terminal error;
- all ApplicationEvents observed before the throw;
- current safe TaskState projection when present;
- current safe StackState projection when present;
- derived LiveWorkTrace/metrics from available events.

This is qualification observation only; do not swallow production failures in normal product execution.

### Catch boundary

Inside `runLiveWorkInstrument()`:
- register/capture events before invoking the service;
- catch service-level errors;
- normalize the error;
- derive terminal state from session/task/stack truth where possible;
- construct and return a failed result rather than throwing away evidence.

If an optional external `onEvent` observer itself throws, preserve the production-event evidence and report observer failure separately if current design permits; do not confuse observer failure with production success.

### Artifact durability

Ensure the existing attempt/trace writer can serialize the failed result exactly as it serializes completed results.

A thrown service must still yield:
- `attempt.json`;
- `trace.json`;
- task/stack safe projections;
- bounded terminal error;
- provider/tool/context/budget metrics available before failure.

Optional pretty-report failure still cannot erase these files.

### Tests

Permanent coverage:
- structured service throws after context/provider events -> result returned, not lost;
- INSPECT-no-evidence exception fixture preserves the exact preceding provider/tool events;
- TaskState/StackState projections survive where present;
- hidden acceptance is not run;
- tool/round/token/context/budget metrics remain derived from observed events;
- artifact files exist after thrown-service attempt;
- terminal error is bounded/redacted;
- successful live-work behavior remains unchanged.

## P3 — gated live qualification

### Deterministic pre-gate

Require Green:
- P1 provider/tool-choice tests;
- structured INSPECT tests;
- P2 exception-safe live trace tests;
- mutation precondition/dynamic replay tests from prior correction;
- frozen deterministic Phase 8 replay;
- Phase 9 integration;
- c9 convergence/stack floor;
- typecheck;
- runner;
- diff hygiene.

### Gate A

One official attempt only.

Use pinned:
`qwen3-coder-30b-a3b-instruct@q4_k_m`

Record runtime controls exactly as prior gates.

Use unchanged frozen structured replay.

Required evidence includes:
- first INSPECT provider request `toolChoice=required`;
- first Qwen-selected tool/call;
- inspection terminal evidence;
- implementation evidence;
- observed file SHA if available;
- mutation request/result;
- validation;
- TaskState;
- calls/rounds/retries/tokens/context/budgets/timing.

Green criteria remain:
- exact edit;
- V1 pass;
- completed/verified TaskState;
- zero human intervention;
- no exhaustion;
- <=10 model tool calls;
- <=10 provider rounds.

If Not Green:
- stop;
- do not run greenfield/existing-app;
- do not repair production code in P3;
- do not rerun until pass.

### Gate B / C

Only after Gate A Green:
- greenfield through qualified production stack;
- existing-app only after greenfield Green.

Preserve existing hidden-acceptance and network/dependency authorization contracts.

Create:
`docs/tasks/c9-inspection-execution/P3-live-evidence.md`.

## P4 — closeout

Create:
`docs/tasks/c9-inspection-execution/closeout.md`.

Report separately:
- Implementation Complete;
- Mandatory INSPECT Execution Qualified;
- Exception-Safe Live Trace Qualified;
- Gate A Qwen Work-Unit Convergence Qualified;
- Overall correction Qualified.

Overall qualification requires Gate A Green.

Do not owner-close Phase 9 or open Phase 10.

## Validation floor

Every implementation prompt runs:
- focused affected tests;
- inherited structured-task/c9 tests;
- `npm run typecheck`;
- `npm run test:runner`;
- `git diff --check`;
- no root `package-lock.json`.

Package remains exactly `0.9.10`.
