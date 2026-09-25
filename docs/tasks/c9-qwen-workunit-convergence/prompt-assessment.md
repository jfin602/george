# c9-qwen-workunit-convergence Prompt Assessment

Status: READY FOR CORRECTION IMPLEMENTATION

Correction: `c9-qwen-workunit-convergence`  
Roadmap phase: 9  
Required unchanged package version: `0.9.10`

## Trigger

`c9-structured-task-convergence` is implementation-complete and its production task-stack boundary is deterministically qualified, but its required live Gate A remains Not Green.

Latest Gate A evidence:
- exact frozen Phase 8 structured replay;
- pinned Qwen/LM Studio runtime healthy;
- target file remained unchanged;
- direct recovery-time test still failed;
- zero human coding intervention;
- official call/round/token/TaskState telemetry was lost because a post-run evidence processor crashed;
- Gate B greenfield and Gate C existing-app correctly did not run.

The prior correction must remain closed as recorded. This correction targets only the remaining within-work-unit edit/convergence boundary and reliable live evidence capture.

## Confirmed source-level defect

The current safe mutation contract requires a current-content SHA-256 precondition:

- `apply_patch` requires `expectedSha256`;
- `write_file` requires a valid current-content hash when overwriting an existing file.

However the current `read_file` result exposes:
- path;
- text;
- bytes;
- truncated;

and **does not expose the current file SHA-256**.

The c9 inspection-to-implementation evidence projection likewise passes file text but no hash.

Therefore a local model that correctly inspects an existing file does not receive the precondition needed to make a safe overwrite/patch through George's normal mutation tools.

The deterministic Phase 9/c9 structured replay did not reveal this because its scripted provider hard-coded the expected hash directly into the synthetic `write_file` call.

This means the latest live Gate A failure is not yet valid evidence that Qwen itself cannot converge on the edit: George withheld required mutation-enablement data.

## Secondary evidence defect

The Gate A live service returned, but a temporary postprocessor crashed while reading the `context.assembled` event using an incorrect field shape. The production event contract stores context data under `event.diagnostics`.

That crash destroyed the official attempt's detailed telemetry after execution.

The next official run must use repository-owned, schema-tested, bounded live trace extraction so an evidence formatting error cannot erase the task/tool/provider trace.

## Correction objective

Make safe existing-file mutation fully executable from George-provided read evidence, then rerun the frozen live gate with reliable telemetry.

This is not a request to loosen mutation preconditions. The safe hash requirement remains mandatory.

## Locked boundaries

Preserve:
- Task Prompt v1 grammar;
- canonical TaskState and StackState;
- production task-stack executor;
- c9 evidence handoff/task-wide budget/direct validation/stage limits/no-progress guards;
- Workspace Autonomous/Bubblewrap;
- Transcript/Task UI;
- context profile values;
- provider/runtime tuning;
- correction/retry limits;
- historical Phase 8, first Phase 9, and first c9 Gate A evidence.

Do not add Phase 10 concurrency/batching or a helper model.

## Recommended stack

### P1 — mutation-precondition visibility

Make full-file current SHA-256 a first-class bounded `read_file` result and provider-visible safe-mutation handoff.

Update mutation tool descriptions/schema metadata so local models are explicitly told to use the latest `read_file.sha256` when modifying an existing file.

Carry the hash through structured inspection evidence.

Install permanent tests proving a real read result can supply the precondition for a subsequent safe write/patch.

### P2 — resilient live trace capture

Move the live Gate metrics/postprocessing contract into repository-owned, schema-tested qualification code.

It must capture the official attempt's tool sequence, provider rounds/attempts/retries, usage, context profile, task/stack state, budgets, validation, corrections, and terminal state without assuming nonexistent event fields.

Evidence extraction failure must not erase the raw bounded attempt evidence.

### P3 — gated live requalification

Run exactly one new official Gate A attempt after P1/P2 deterministic Green.

If Gate A is Green under the existing functional/call/round criteria, run greenfield through the already-qualified production stack executor, then existing-app only if greenfield is Green.

Do not repair production code inside P3 or rerun a failed official workload until pass.

### P4 — correction closeout

Evidence-only. Determine whether edit enablement and live Qwen work-unit convergence are now qualified.

## Gate A criteria

Gate A remains Green only when all are true:
- exact required edit made;
- George-owned V1 passes;
- TaskState completed and requirements verified;
- zero human coding intervention;
- no correction/task/stage budget exhaustion;
- <=10 model-requested tool calls;
- <=10 logical provider rounds.

Also record tokens, timing, mutation calls/preconditions, stage evidence, and final task state.

## Prompt count

Four prompts including one final closeout.

All prompts:
- `Browser required: no.`;
- package remains exactly `0.9.10`;
- no Phase 9 owner closeout or Phase 10 transition;
- permanent regression coverage for every confirmed defect.
