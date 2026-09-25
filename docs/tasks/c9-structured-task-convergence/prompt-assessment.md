# c9-structured-task-convergence Prompt Assessment

Status: READY FOR CORRECTION IMPLEMENTATION PLANNING

Correction: `c9-structured-task-convergence`  
Roadmap phase: 9  
Required unchanged package version: `0.9.10`

## Trigger

The first complete Phase 9 live qualification on 2026-09-25 is **Not Green** even though deterministic Phase 9 qualification and real Bubblewrap containment are Green.

Observed live evidence supplied by the owner:

| Workload | Result | Tool calls | Provider rounds | Provider input/output | Wall time | Human intervention |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| Frozen Phase 8 structured replay | Not Green | 25 | 20 | 63,253 / 1,801 | 344.745 s | 0 |
| `greenfield-express-v1` | Not Green | P1 failed before validation | — | — | — | 0 |
| `existing-express-feature-v1` | Not Green | 47 | 23 | recorded in live artifact | 449.249 s | 0 |

The greenfield temporary qualification harness also incorrectly continued P2/P3 after P1 had already failed. Those later attempts are retained evidence but are non-qualifying.

The preserved Phase 8 comparison for the small edit-plus-validation workload was also Not Green, but it used 10 tool calls, 7 provider rounds, 20,765 / 406 provider tokens, and 45.826 s. Phase 9 therefore made the same class of failed work substantially more expensive rather than demonstrating the intended convergence improvement.

Bubblewrap Workspace Autonomous containment is Green and is not implicated by this correction. Native TUI remains an Evidence Gap and is not a convergence repair target.

## Source-level findings that must be tested, not hand-waved

Current source establishes several concrete risks.

### 1. Inspection-to-implementation evidence discontinuity

`StructuredTaskApplicationService` deliberately invokes inspection and implementation as separate model runs with `omitHistory: true`.

Inspection TaskState currently records only an inspection item plus a source identity such as a tool/call ID. `projectStructuredTaskSlice()` therefore hands implementation text such as an inspection marker, not the bounded successful tool-result evidence the model just acquired.

This preserves context isolation but can force Qwen to reconstruct repository state by reading/searching again.

### 2. Correction diagnostic starvation

Structured validation attempts currently persist status/exit/signal/outcome, while the correction slice renders only bounded status information.

The actual bounded validation stderr/stdout/error diagnostic that explains the failure is not represented in TaskState/correction evidence. A correction turn can therefore know only that V1 failed and may have to restart investigation instead of repairing the concrete failure.

### 3. Structured subruns do not share one aggregate run budget by default

Each nested agent/workflow invocation may create a fresh run budget when the structured caller did not pass one. The structured task service currently does not establish one explicit task-wide budget and thread it through every inspection, implementation, validation, discovery, and correction subrun.

A task can therefore consume much more aggregate provider/tool/context budget than one ordinary run while every individual subrun remains under its own generous ceiling.

### 4. George-owned validation currently pays an unnecessary provider round

For a literal validation, the structured service calls the coding workflow with no provider tools and text equivalent to "George will execute Vn", after which the coding workflow executes the requested validation.

The model has no decision to make in that pre-validation round. This is exactly the class of deterministic orchestration Phase 9 intended to remove from the model.

### 5. No structured-stage convergence ceiling exists below the broad inherited loop limits

The agent loop's ordinary default tool-call/tool-round limits remain broad. Structured inspection/implementation/correction stages use capability-reduced tool surfaces but do not currently have a dedicated per-stage call/round ceiling or deterministic no-progress/repeated-read guard.

The live 20/23-round failures show that the broad inherited limits are not sufficient convergence protection for Qwen.

### 6. The live-work qualification path needs deterministic fail-stop semantics

The first greenfield live harness continued later stack tasks after P1 failed. Qualification must stop at the first failed/blocked/cancelled/budget-exhausted task, and hidden acceptance must run only after the full frozen stack completes.

This is a qualification-runner defect unless source inspection proves the production stack contract itself is incomplete.

## Correction objective

Make structured task execution converge on bounded coding work without weakening correctness, tool safety, context authority, validation truth, or Workspace Autonomous containment.

The correction should improve the information and deterministic orchestration around Qwen rather than increasing context profiles, retries, correction counts, or global run budgets.

## Locked non-goals

Do not:
- retune ordinary/medium/large context profiles;
- increase LM Studio context length or change runtime tuning;
- add Phase 10 concurrency or model-call batching beyond deterministic validation removal required by this defect;
- change Bubblewrap containment/policy unless a direct regression is discovered;
- redesign Transcript/Task TUI;
- add a helper model;
- broaden external/network/browser tools;
- raise retry/correction limits to chase a pass;
- erase the Phase 8 or first Phase 9 Not Green evidence.

## Recommended stack

### P1 — convergence diagnostic and executable regression boundary

Evidence-first. Reconstruct the structured stage/provider/tool timeline, verify the source-level findings above, and install deterministic regression instrumentation/fixtures without changing production convergence behavior.

### P2 — stage evidence continuity and task-wide budget

Carry bounded successful inspection evidence into the immediately dependent implementation slice, carry bounded validation failure diagnostics into correction state/slices, and establish one shared task-wide run budget across all structured subruns.

### P3 — direct validation and convergence guards

Remove deterministic validation-only provider turns. Add structured-stage capability-reducing provider/tool ceilings and a safe exact repeated replay-safe-read/no-progress guard scoped to structured execution. Preserve ordinary chat/tool-loop behavior.

### P4 — reusable fail-stop live-work runner

Replace ad-hoc qualification orchestration with a reusable repository-owned runner for the frozen Phase 9 instruments. It must validate task stacks, stop after the first non-completed task, keep hidden acceptance outside the model workspace, and record comparable raw metrics.

### P5 — gated live requalification

Run the frozen P4 replay first. The larger live-work stacks may run only if P4 is functionally Green and demonstrates material convergence improvement. Greenfield must stop immediately on the first failed task. Existing-app runs only after greenfield qualifies.

### P6 — correction closeout

Evidence-only. Reconcile deterministic and live evidence; do not owner-close Phase 9 or open Phase 10.

## Acceptance direction

The first live gate is the exact frozen Phase 8 structured replay.

It must:
- produce the exact required edit;
- pass George-owned V1;
- finish with TaskState completed/verified;
- require zero human coding intervention;
- avoid correction/budget exhaustion;
- use no more than 10 model-requested tool calls;
- use no more than 10 logical provider rounds.

The call ceiling is anchored to the preserved Phase 8 failed run's 10 calls; the round ceiling permits bounded structured-stage overhead while requiring at least a 50% reduction from the failed Phase 9 20-round result.

Provider input should also be materially below the failed Phase 9 63,253-token result. Do not impose a new production context threshold from this one fixture.

Only after that gate is Green should the correction spend live attempts on greenfield and then existing-app.

## Prompt count

Six prompts including final correction closeout.

All prompts:
- use `Browser required: no.`;
- require package version to remain exactly `0.9.10`;
- preserve permanent regression coverage for every confirmed defect;
- do not alter owner/roadmap phase state.
