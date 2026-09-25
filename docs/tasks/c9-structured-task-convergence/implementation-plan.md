# c9-structured-task-convergence Implementation Plan

Status: READY FOR PROMPT EXECUTION

Correction: `c9-structured-task-convergence`  
Roadmap phase: 9  
Required unchanged package version: `0.9.10`

## Authority

Read:
- `BOOT.md`;
- `AGENTS.md`;
- `docs/project-overview.md`;
- `docs/architecture.md`;
- `docs/workflow.md`;
- `docs/stability-contract.md`;
- `docs/planning/p9-structured-task-execution/{decision-record,task-format-v1,qualification-plan}.md`;
- current `docs/phase-9-closeout.md`;
- current `docs/tasks/p9/{P4-phase8-regression-evidence,P9-qualification-evidence}.md`;
- the latest local `artifacts/phase9-live-qualification-*/live-results.json` when present;
- exact current source/tests before editing.

Historical live failures remain evidence and are not rewritten.

## Architectural correction

The intended structured execution path after this correction is:

```text
canonical TaskState
      |
      +--> one task-wide RunBudget
      |
      +--> inspection stage
      |      |
      |      +--> bounded successful local evidence
      |              |
      |              v
      +--> implementation stage
      |      current work + relevant inspection evidence
      |      structured-stage convergence limits
      |
      +--> George-owned direct validation
      |      no model round merely to launch validation
      |      |
      |      +--> pass -> verified
      |      |
      |      +--> fail -> bounded diagnostic evidence
      |                    |
      |                    v
      +--> correction stage
             current work + exact bounded failure evidence
             structured-stage convergence limits
```

Canonical durable state stays distinct from provider-facing derived slices.

Raw file/tool-result bodies must not be dumped into durable TaskState merely to preserve continuity.

## P1 — diagnostic boundary

Do not repair production behavior yet.

Inspect and document:
- exact current nested `agent.run` / `super.run` boundaries;
- which subruns create/reuse budgets;
- provider request/tool-call timeline for the frozen structured replay under deterministic scripted providers;
- what inspection result data is available at the end of preflight and what reaches implementation;
- what validation failure data exists in `CodingWorkflowCompletion` versus what is stored in TaskState;
- the extra provider request used only to trigger literal validation;
- current per-service/per-run tool-call/tool-round limits;
- how the live-work harness sequenced greenfield tasks and why it continued after P1 failed;
- whether production has any stack executor beyond `validateTaskStack`.

Create `docs/tasks/c9-structured-task-convergence/P1-diagnostic-evidence.md`.

Add only non-behavioral deterministic test/fixture instrumentation needed to preserve the diagnosis.

## P2 — evidence continuity and aggregate budget

### Task-wide budget

At the beginning of one structured task run:
- use caller-supplied budget when present;
- otherwise create exactly one task-wide budget;
- thread that same budget through inspection, implementation, DISCOVER proposal, direct validation, correction, and any other structured subrun.

Do not create a fresh effective budget per stage.

Preserve ordinary unstructured runs.

### Inspection handoff

Introduce a bounded, tool-specific, non-authoritative stage-evidence projection from successful inspection results.

Requirements:
- sufficient evidence for the next implementation stage to use what was actually inspected;
- bounded bytes/items;
- deterministic ordering;
- no secrets/unrestricted outputs/provider payloads;
- no automatic durable storage of raw file bodies;
- no claim that stale inspection evidence remains current after mutation;
- on interruption/reopen where ephemeral evidence is unavailable, re-inspect rather than fabricate continuity.

The exact representation should reuse existing normalized tool results where practical instead of adding a second filesystem truth model.

### Validation failure evidence

Extend durable validation-attempt evidence with a bounded safe diagnostic sufficient for correction:
- exit/outcome;
- bounded stderr/stdout or normalized error as applicable;
- truncation/redaction markers.

Correction slices receive only the relevant current validation failure evidence.

Earlier failed attempts remain durable after a pass.

## P3 — direct validation and deterministic convergence

### Direct validation

Add/reuse an application-owned validation execution seam that runs the approved literal validation through the canonical process/tool/approval/budget/event/recovery path **without a provider request solely to announce that validation will run**.

DISCOVER still requires the bounded model proposal because that is a model decision. Once executable/argv is resolved, execution is George-owned.

### Per-stage limits

Allow an `AgentLoopSubmission` or equivalent application-owned option to reduce, never raise, the configured max tool calls/rounds for one structured stage.

Initial structured defaults should be explicit and conservative:
- inspection: max 6 logical provider rounds, max 4 model-requested tool calls;
- implementation: max 10 logical provider rounds, max 8 model-requested tool calls;
- correction: max 8 logical provider rounds, max 6 model-requested tool calls;
- DISCOVER proposal: no tools and one bounded provider completion.

These are stage convergence limits, not context-profile limits.

Exhaustion must produce a truthful structured failure/block state and evidence, never silent continuation.

### Exact repeat/no-progress guard

For structured stages only, detect exact repeated replay-safe local read/list/search/Git requests with the same normalized arguments when no successful George workspace mutation has occurred since the earlier equivalent request.

Do not re-execute an unbounded identical read loop.

Preferred behavior:
- return a bounded normalized duplicate/no-progress tool result that tells the model the same unchanged request already succeeded;
- retain the original successful evidence;
- allow the request again after a successful workspace mutation invalidates the stage epoch;
- after a small bounded sequence of duplicate/no-progress requests, terminate the stage truthfully rather than letting Qwen burn the full ordinary loop ceiling.

Do not apply this behavior globally to ordinary chat or unrelated external tools.

### Completion guidance

Keep model instructions concise but explicit: use supplied observed evidence, perform the current work, stop when the work-unit completion condition is satisfied, and leave declared validation to George.

Do not solve convergence by injecting the complete TaskState.

## P4 — repository-owned live-work runner

Build a reusable qualification runner, not a second task authority.

It must:
- load the frozen Phase 9 instruments;
- validate definitions with the canonical parser/`validateTaskStack`;
- create disposable workspaces;
- use real LM Studio/provider/application/tool/context boundaries;
- keep hidden acceptance outside model-visible workspaces;
- support explicit user-authorized dependency installation as harness setup;
- record exact model/runtime/context/tool/provider/task metrics;
- stop a stack immediately after the first task whose TaskState/completion is not completed/Green;
- never execute P2/P3 after greenfield P1 failure;
- never run hidden acceptance as a passing qualification after an incomplete stack;
- preserve every attempted result;
- support the frozen P4 replay as the first gate.

If source inspection proves the production Task Prompt stack contract itself is materially incomplete rather than the temporary harness being wrong, stop with `Planning needed` instead of hiding that architecture issue in benchmark tooling.

## P5 — live qualification

Use the pinned Qwen/LM Studio control and latest available runtime provenance.

### Gate A — frozen P4 replay

One official run after deterministic validation.

Required Green:
- exact edit;
- V1 pass;
- completed/verified TaskState;
- zero human coding intervention;
- no correction/budget exhaustion;
- <=10 model-requested tool calls;
- <=10 logical provider rounds.

Also record tokens, elapsed time, retries, stage-level budgets, duplicate/no-progress events, and evidence-handoff diagnostics.

If Gate A is not Green:
- stop live qualification;
- do not run greenfield/existing-app;
- record Not Green;
- do not chase a pass with repeated runs.

### Gate B — greenfield

Only after Gate A Green.

Run the exact frozen stack in order. Dependency installation remains harness/user-authorized setup.

If P1 fails/blocks/cancels/exhausts:
- stop immediately;
- P2/P3 must not run;
- hidden acceptance may be run only as an expected failed/non-qualifying observation if the qualification contract explicitly records it as such; never represent it as stack acceptance.

Green requires all tasks/validations plus hidden acceptance.

### Gate C — existing-app

Only after greenfield Green.

Run one official frozen task and hidden acceptance.

Green requires focused/broad validation, completed TaskState, and hidden acceptance.

Create `docs/tasks/c9-structured-task-convergence/P5-live-evidence.md`.

Do not edit Phase 9 owner/roadmap state in P5.

## P6 — closeout

Create `docs/tasks/c9-structured-task-convergence/closeout.md`.

Audit:
- diagnosed causes;
- implemented evidence handoff;
- shared task budget;
- direct validation;
- stage convergence controls;
- fail-stop live runner;
- deterministic regression;
- P4 live gate;
- greenfield/existing live results if gates allowed them;
- inherited Phase 9 Bubblewrap/TUI evidence;
- every remaining Not Green/Evidence Gap.

Closeout may qualify only the correction. It does not owner-close Phase 9 or advance Phase 10.

## Validation floor

Every implementation prompt runs:
- focused affected tests;
- `npm run typecheck`;
- `npm run test:runner`;
- appropriate inherited structured/recovery/agent-loop tests;
- `git diff --check`;
- root `package-lock.json` absence.

Full `npm test` should be run where the affected boundary warrants it, but recurring unrelated OpenTUI renderer failures must remain visible and classified, never silently ignored.

## Version/Git

Package version stays exactly `0.9.10` for all correction prompts.

Correction commits use the runner's correction subject convention.

No prompt owner-closes Phase 9 or opens Phase 10.
