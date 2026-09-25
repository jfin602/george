# c9-inspection-stage-completion Implementation Plan

Status: READY FOR PROMPT EXECUTION

Correction: `c9-inspection-stage-completion`  
Roadmap phase: 9  
Required unchanged package version: `0.9.10`

## Authority

Read:
- `BOOT.md`;
- `AGENTS.md`;
- current architecture/workflow/stability contracts;
- current Phase 9 decision and qualification authority;
- `docs/tasks/c9-inspection-execution/closeout.md`;
- exact current `AgentLoopApplicationService`, `StructuredTaskApplicationService`, coding-workflow completion logic, and affected tests.

## P1 — deterministic INSPECT completion

### Agent-loop submission seam

Add the narrowest application-owned option that allows a caller to complete a bounded turn after the first **successful tool round**.

Preferred semantics:

`completeAfterSuccessfulToolRound?: boolean`

or an equivalent typed capability-reducing mode.

When absent/false:
- preserve current loop semantics exactly.

When enabled:
1. run the provider round normally;
2. execute admitted tool calls in model order under existing validation/policy/approval/budget/stage limits;
3. after the whole round completes, inspect the normalized tool results;
4. if at least one result succeeded, finish the turn without constructing/sending a provider continuation;
5. if zero results succeeded, preserve normal continuation behavior unless another existing terminal rule fires.

Do not terminate mid-round after the first success.

### Completion truth

Early successful stage completion must:
- retain all provider/tool events from the round;
- preserve provisional assistant-text rules: tool-round text does not become canonical final assistant text;
- invoke normal turn-completed hooks/events;
- produce a normal completed application/coding-workflow outcome;
- not fabricate assistant text;
- not fabricate tool evidence;
- keep run/stage budget accounting accurate.

### Interaction with stage limits

Existing limits remain authoritative.

If the provider returns more calls than the admitted stage tool-call ceiling:
- current limit behavior remains unchanged;
- do not use early-completion mode to bypass a call that already violates the stage bound.

If calls execute but all fail/deny:
- the early-completion criterion is not satisfied;
- normal bounded continuation/failure behavior remains.

### Structured INSPECT

Enable the new completion mode only for the structured INSPECT call.

Keep:
- first-round `initialToolChoice: 'required'`;
- exactly the existing read-only INSPECTION_TOOLS;
- current inspection call/round/no-progress limits;
- `observedInspection()` as the authoritative evidence extractor.

After the first provider tool round with >=1 successful qualifying local read:
- agent loop completes the INSPECT turn;
- StructuredTaskApplicationService observes the tool evidence;
- records bounded inspection evidence;
- proceeds directly to implementation.

Do not require an assistant final-text round to close preflight.

### Permanent regression tests

At minimum prove:

1. generic early-completion option is absent by default and ordinary agent-loop behavior is unchanged;
2. one provider round with successful tools completes without a continuation request when enabled;
3. all calls in that provider round execute in model order before completion;
4. provisional assistant text from the tool round is not committed;
5. normal turn completion/hook/evidence fires;
6. a round with only failed/denied tools does not satisfy early completion;
7. stage tool-call ceiling still fails when the provider round itself exceeds the admitted limit;
8. structured INSPECT uses both required first-round tool choice and successful-round completion;
9. structured INSPECT with one/multiple successful read-only calls proceeds to implementation with their evidence;
10. implementation/correction/ordinary chat continue normal multi-round behavior;
11. dynamic read SHA -> mutation replay remains Green;
12. frozen deterministic Phase 8 replay reaches implementation/validation with one inspection provider round.

Do not change the frozen live task.

## P2 — gated live qualification

### Deterministic pre-gate

Require Green:
- P1 loop/inspection completion tests;
- provider tool-choice tests;
- exception-safe trace/artifact tests;
- mutation SHA/precondition tests;
- frozen deterministic Phase 8 replay;
- Phase 9 integration;
- inherited c9 convergence/stack regression floor;
- typecheck;
- runner;
- diff hygiene.

### Gate A

Run exactly one official frozen structured replay with pinned Qwen.

Record:
- initial INSPECT `toolChoice=required`;
- ordered first-round Qwen tool calls and results;
- confirmation that no inspection continuation provider request occurred after successful evidence;
- implementation provider request start;
- observed target read SHA;
- mutation request/precondition/result;
- George-owned V1;
- final TaskState;
- provider rounds/attempts/retries/tokens/context;
- task/stage/run budgets;
- corrections/no-progress;
- elapsed/workflow timing;
- zero human coding intervention;
- attempt/trace artifact paths.

Gate A Green requires all locked Phase 9 criteria:
- exact edit;
- V1 pass;
- completed/verified TaskState;
- zero intervention;
- no exhaustion;
- <=10 model tool calls;
- <=10 provider rounds.

If Gate A is Not Green:
- stop;
- do not run greenfield/existing-app;
- do not repair production code in P2;
- do not rerun until another approved implementation change.

### Gate B

Only after Gate A Green:
- run `greenfield-express-v1` through production stack authority;
- preserve explicit dependency/network authorization;
- require all tasks/validations, completed StackState, hidden acceptance, zero intervention, and no exhaustion.

### Gate C

Only after Gate B Green:
- run `existing-express-feature-v1`;
- require focused/broad validation, completed TaskState, baseline preservation, hidden acceptance, zero intervention, no exhaustion.

Create:
`docs/tasks/c9-inspection-stage-completion/P2-live-evidence.md`.

## P3 — closeout

Create:
`docs/tasks/c9-inspection-stage-completion/closeout.md`.

Report separately:
- Implementation Complete;
- INSPECT Stage Completion Qualified;
- Gate A Qwen Work-Unit Convergence Qualified;
- Gate B Greenfield Qualified / Not Run;
- Gate C Existing-App Qualified / Not Run;
- Overall correction Qualified.

INSPECT Stage Completion Qualified requires:
- deterministic early-completion regressions Green;
- live Gate A proves successful inspection evidence advances to implementation without an inspection continuation/exhaustion.

Overall correction qualification requires Gate A Green.

Do not waive Gate A.

## Validation floor

Every implementation prompt:
- focused affected tests;
- inherited structured/c9 regression floor;
- `npm run typecheck`;
- `npm run test:runner`;
- `git diff --check`;
- no root `package-lock.json`.

Package remains exactly `0.9.10`.
