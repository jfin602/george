# P1 structured convergence diagnostic evidence

Status: **DIAGNOSTIC GREEN; PHASE 9 LIVE EXECUTION NOT GREEN; PRODUCTION STACK EXECUTION PLANNING NEEDED**

Date: 2026-09-25  
Correction: `c9-structured-task-convergence` / P1  
Package: `0.9.10` (unchanged)  
Source candidate inspected: `236dd66f71d1425ff24d412301d7cb1eca2b250e`  
Live qualification candidate: `9b031333d3091df37aaab9b2c03175df76101bac`, package `0.9.10`

The P1 implementation result is intentionally uncommitted for the phase runner. It adds one deterministic diagnostic test and this evidence record; it does not change production convergence behavior.

## Evidence inputs

The latest preserved live record is `artifacts/phase9-live-qualification-20260925T133841Z/live-results.json`, SHA-256 `9b3f84f74d4ef138b4019f50eaf2aa471f7fc63f3f8c79d420a6bf59f20cb2ae`. Its related `summary.md`, `environment.md`, and `harness-console.txt` remain unchanged.

The source trace below is against the exact candidate above. The executable guard is `test/unit/application/structured-task.test.ts`, test `structured convergence diagnostic boundary remains executable without repairing it`.

## Live trigger

| Workload | Result | Tool calls | Provider attempts / rounds / retries | Provider input / output | Wall time | Terminal truth |
| --- | --- | ---: | ---: | ---: | ---: | --- |
| Frozen Phase 8 structured replay | Not Green | 25 | `20 / 20 / 0` | `63,253 / 1,801` | 344.745 s | Required edit unchanged; V1 failed; TaskState `budget_exhausted` with correction 1 active. |
| Greenfield P1 | Not Green | 5 | `2 / 2 / 0` | `2,583 / 326` | 42.363 s | Failed before V1; W1 remained active. |
| Greenfield P2, non-qualifying | Not Green | 22 | `6 / 6 / 0` | `8,232 / 1,218` | 157.066 s | Incorrectly attempted after P1 failed. |
| Greenfield P3, non-qualifying | Not Green | 22 | `6 / 6 / 0` | `7,107 / 832` | 96.594 s | Incorrectly attempted after P1 failed; `budget_exhausted`. |
| Existing-app P1 | Not Green | 47 | `23 / 23 / 0` | `49,446 / 1,937` | 449.249 s | Failed during W2 before V1/V2; hidden acceptance failed. |

All runs used the ordinary adaptive profile and recorded zero human coding interventions. Greenfield and existing-app recorded zero approval and sandbox events. The replay recorded seven approvals, but no retry or provider failure. Bubblewrap containment remains independently Green and is outside this correction.

## Producer/consumer trace

### Nested stage calls

One structured task currently follows these actual boundaries:

1. `StructuredTaskApplicationService.run` parses one prompt and creates or resumes one `TaskState` (`src/application/structured-task.ts:136-154`). Ordinary unmarked input immediately delegates to the inherited coding workflow unchanged.
2. Inspection calls `agent.run` directly with read/list/search/Git tools and `omitHistory: true` (`structured-task.ts:164-179`). It is not a `CodingWorkflowApplicationService` run.
3. Implementation calls `super.run`, which is `CodingWorkflowApplicationService.run`, with coding tools, no validations, and `omitHistory: true` (`structured-task.ts:180`). The coding workflow then calls `agent.run` (`coding-workflow.ts:147-170`).
4. A DISCOVER validation, when present, calls `super.run` with no tools and `omitHistory: true` so the model proposes executable/argv (`structured-task.ts:193-198`). This request contains a real model decision.
5. A correction calls `super.run` with coding tools, no validations, and `omitHistory: true` (`structured-task.ts:199-212`).
6. Every literal validation attempt calls `super.run` with no provider tools, `omitHistory: true`, and the literal validation request (`structured-task.ts:214`). The nested workflow first calls the provider, then invokes `agent.runProcess` using its local workflow budget (`coding-workflow.ts:165-190`).

`omitHistory` removes completed transcript history at the agent boundary (`one-turn.ts:613`). It does not remove George's bounded unresolved safety projection, which may add failed validation status/call identity, but that projection does not contain process stdout/stderr.

### Inspection producer and implementation consumer

At successful inspection completion George has the full normalized `tool.completed.result` in the local event list. The inspection provider continuation also receives that same normalized tool result, including bounded file text or other tool-specific result fields. The diagnostic fixture proves the sentinel file content is present in the inspection continuation.

The handoff then reduces all successful inspection activity to one value: `observedInspection` selects the first successful local-read completion and returns only `<tool-name>:<call-id>` (`structured-task.ts:98-101`). For every authored INSPECT item, TaskState stores only `{ item, source }` (`structured-task.ts:170-178`; `tasks/state.ts:18,159-166`). Additional successful inspection results are not represented in TaskState.

`projectStructuredTaskSlice` renders only `inspection: <authored item> (<tool-name>:<call-id>)` (`structured-task.ts:33-40`). Because implementation is a fresh `omitHistory` run, its provider request receives that marker but none of the successful tool-result payload. The diagnostic fixture proves the sentinel exists in inspection continuation data and is absent from the next implementation request.

Conclusion: context isolation works as designed, but the relevant inspected repository evidence required by the Phase 9 authority is discontinuous at the stage boundary.

### Validation producer and correction consumer

`validationFromEvents` produces a `WorkflowValidation` containing command metadata, status, outcome, exit/signal, bounded stdout, bounded stderr, truncation flags, and a normalized error when applicable (`coding-workflow.ts:110-132`; `core/events.ts:56-72`). `CodingWorkflowCompletion.validations` retains it, and `workflow.completed` records that completion in canonical session events (`coding-workflow.ts:205-212`). The diagnostic fixture proves a runtime-only stderr sentinel is present there.

The structured service persists only `turnId`, `callId`, `status`, `exitCode`, `signal`, and optional `outcome` into `TaskValidationAttempt` (`structured-task.ts:215-217`; `tasks/state.ts:19-26,178-196`). Durable parsing enforces exactly that shape (`core/session-store.ts:501-512`). Stdout, stderr, truncation flags, and normalized error are absent.

The correction task slice renders only `validation Vn: <status> (<exit>)` (`structured-task.ts:37-40`). The agent safety projection may separately render `validation <status>: <callId>` (`one-turn.ts:622-625` and `safetyState`), but neither projection contains the failure diagnostic. The fixture proves the stderr sentinel is present in workflow completion and absent from both correction provider input and TaskState.

Conclusion: the exact failure evidence exists and is durable in session workflow evidence, but the TaskState/correction projection consumer is diagnostically starved.

### Budget ownership

There is no aggregate structured-task budget.

- Inspection supplies no budget, so `AgentLoopApplicationService.run` creates one (`structured-task.ts:167`; `one-turn.ts:604-610`).
- Every `super.run` enters `CodingWorkflowApplicationService.run`, which unconditionally creates a fresh budget and overwrites any submission budget when it calls `agent.run` (`coding-workflow.ts:147-165`).
- Provider work and `runProcess` inside one validation subrun share that subrun's budget (`coding-workflow.ts:165,180`), but the next implementation, correction, discovery, or validation subrun creates another.

The fixture observes five distinct `reliability.run.started.runId` values for inspection, implementation, first literal validation, correction, and second literal validation. Therefore one structured task silently aggregates multiple independent run budgets. A caller-supplied `submission.budget` also cannot currently become task-wide through `CodingWorkflowApplicationService.run` because line 150 ignores it.

### Provider-only orchestration

Each literal validation attempt makes one provider request whose only instruction is effectively `Run no provider-owned validation. George will execute Vn.`, advertises zero tools, and then George deterministically runs the already-parsed executable/argv. The fixture proves two failed attempts produce two such requests. These requests exist only to launch George-owned work.

No other current provider request is wholly deterministic orchestration:

- inspection chooses repository evidence/tools;
- implementation chooses code work;
- correction interprets and repairs a failure;
- DISCOVER chooses executable/argv within a bounded scope.

### Effective convergence limits

The shared agent defaults are 32 model-requested tool calls and 32 tool rounds (`one-turn.ts:148-149,879-880`). Inspection, implementation, correction, and DISCOVER/literal-validation provider subruns all inherit that same configured agent because submissions can reduce tool names but cannot reduce call/round counts (`one-turn.ts:152-167`). No structured-stage call/round option exists.

There is no structured repeated-read, duplicate-request, workspace-mutation epoch, or other no-progress guard. The only loop stops are the ordinary 32/32 ceilings and the independent Phase 5 run-budget dimensions. Tool-less DISCOVER and literal-validation requests ordinarily complete in one provider round, but still inherit the ordinary service limits rather than a stage contract.

## Greenfield sequencing and stack boundary

The preserved result proves this sequence: greenfield P1 returned `failed` before validation; dependency installation then occurred; P2 and P3 both executed; app tests and hidden acceptance were subsequently attempted. The temporary harness source was not retained in the repository or bounded artifact, so its exact loop body is an **Evidence Gap**. The observed ordered result is nevertheless sufficient to prove it had no effective fail-stop check between task results. That is the immediate reason P2/P3 ran after P1 failed.

This is not only a qualification-runner defect. Production has no executable task-stack sequencing boundary:

- `validateTaskStack` checks non-empty input, shared stack identity, increasing unique ordinals, and unique/final closeout (`tasks/state.ts:127-135`).
- Its only callers are unit tests.
- `StructuredTaskApplicationService.run` accepts and executes one prompt/one TaskState; it has no stack submission, task-to-task durable state, fail-stop iteration, or hidden-acceptance boundary.

That conflicts with the locked Phase 9 decision record: multiple prompts may form a durable stack, and George must validate stack identity/order/dependency/version/closeout rules before execution (`docs/planning/p9-structured-task-execution/decision-record.md`, Durable task stacks). Current `validateTaskStack` also does not establish an execution owner or cross-task durable resume state.

Therefore:

- continuing P2/P3 after P1 is a confirmed temporary harness bug;
- relying on a new qualification-only loop as the sole repair would hide a confirmed production contract gap;
- P4 as currently bounded to a repository-owned qualification runner is **Planning needed** before implementation. The plan must decide the production stack submission/execution/persistence boundary and have qualification use it, without moving task authority into benchmark code.

## Root-cause hypotheses

### Confirmed

1. Successful inspection evidence is discarded between isolated stages except for an item/source marker.
2. Failed validation diagnostics exist in workflow completion but are not persisted/rendered into correction TaskState slices.
3. Nested structured stages create fresh run budgets rather than sharing one aggregate task budget.
4. Literal validation pays one unnecessary provider request per attempt.
5. Structured stages inherit ordinary 32/32 loop ceilings and have no structured no-progress guard.
6. The temporary live harness lacked fail-stop sequencing.
7. Production lacks the durable executable stack boundary required by the Phase 9 decision record.

### Rejected or not supported

- **Context profile exhaustion as root cause:** rejected by current evidence. Live requests used ordinary adaptive profiles with recorded headroom; Phase 8 did not establish context size as causal.
- **Provider retry instability:** rejected for these runs; every live workload recorded zero retries.
- **Bubblewrap or autonomous permission failure:** rejected for this correction trigger. Bubblewrap is independently Green, and greenfield/existing runs recorded zero approval/sandbox events.
- **Task Prompt v1 grammar/persistence failure:** rejected by deterministic parser, TaskState, and durable round-trip evidence; live tasks parsed and entered work state.
- **Correction-cycle limit too small:** rejected for the replay trigger. It ended on a run-budget terminal state with correction 1 active, not correction-limit exhaustion.
- **Increasing profiles, budgets, retries, or correction limits:** rejected as a correction. Those changes would mask the confirmed discontinuities and missing guards.
- **Qualification harness alone explains convergence:** rejected. It explains invalid P2/P3 sequencing, not the replay/existing-task repetition or the missing production stack executor.

## Correction boundaries

### P2 — evidence continuity and aggregate task budget

Keep the approved boundary: project bounded, tool-specific successful inspection evidence into only the immediately dependent implementation stage; add bounded/redacted validation diagnostics to durable attempts and only the relevant correction slice; create or accept exactly one task-wide budget and thread the same object through every nested stage. Do not alter ordinary chat, Task Prompt grammar, profiles, retry/correction limits, permissions, or raw-body durability rules.

P2 must account for `CodingWorkflowApplicationService.run` currently discarding a supplied budget; changing only structured call sites is insufficient.

### P3 — direct validation and stage convergence

Keep the approved boundary: execute resolved literal validation directly through the canonical process/policy/event/recovery path; retain a model request only for DISCOVER; add capability-reducing per-stage call/round ceilings plus an exact replay-safe repeated-read/no-progress guard scoped to structured execution. Ordinary unstructured behavior remains unchanged.

### P4 — production stack plan first, then qualification runner

**Planning needed.** Before building the reusable live runner, resolve the missing production boundary required by the decision record: stack submission, pre-execution validation, ordered fail-stop task execution, durable active-stack/task identity, and resume semantics. The qualification runner should prepare fixtures/hidden acceptance and invoke that production boundary; it must not become a second task authority. Hidden acceptance remains outside model-visible workspaces and runs only after a completed stack.

This is a material expansion of the current P4 implementation boundary, so P4 must not proceed under the existing plan as though the defect were harness-only.

## Truth table

| Claim | Truth |
| --- | --- |
| P1 source diagnosis and executable defect-shape guard | **Green** — focused test passes and production behavior is unchanged. |
| Phase 9 structured replay | **Not Green** — wrong/absent edit, failed validation, budget exhaustion. |
| Greenfield live stack | **Not Green** — P1 failed; P2/P3 were invalid post-failure attempts; acceptance failed. |
| Existing-app live task | **Not Green** — failed before validation; hidden acceptance failed. |
| Production executable durable task stack | **Not Green / contract gap** — no executor exists beyond the uncalled definition validator. |
| Temporary harness source-level cause | **Evidence Gap** — source was not retained; artifact order proves missing effective fail-stop behavior. |
| Controlled latency | **Evidence Gap** — GPU Offload 26 remains UI-unconfirmed. |
| Native OpenTUI | **Evidence Gap** — retained Phase 9 state; not part of this correction. |
| Workspace Autonomous/Bubblewrap containment | **Green, inherited** — unchanged and not implicated. |

Overall P1 is diagnostic Green. Phase 9 convergence remains Not Green. P2/P3 remain bounded corrections within the approved architecture; P4 requires planning because production stack execution is absent, not merely because the temporary qualification harness was faulty.
