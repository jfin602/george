# c9-mutation-intent-authority Implementation Plan

Status: READY FOR PROMPT EXECUTION

Correction: `c9-mutation-intent-authority`  
Roadmap phase: 9  
Required unchanged package version: `0.9.10`

## Authority

Read:
- `BOOT.md`;
- `AGENTS.md`;
- current architecture/workflow/stability contracts;
- current Phase 9 decision/qualification authority;
- `docs/tasks/c9-text-file-edit-fidelity/{P2-live-evidence,closeout}.md`;
- exact `ApprovalRequest`, AgentLoop approval construction/execution, mutation tool definitions/executor, benchmark approval helper, qualification live-work code, and affected tests.

## P1 — mutation intent authority and fair Gate A approval

### A. ApprovalRequest mutation intent

Extend the presentation-independent approval contract with one optional bounded mutation projection.

Preferred shape:

`mutation?: { intent: 'text_framing_change'; warning: string }`

Do not expose:
- write content;
- patch edits;
- generic argument JSON;
- raw file contents.

The warning should be a stable bounded George-owned string such as:

`Existing text framing will change if this mutation is allowed.`

### B. Application approval construction

After ToolRegistry validation, detect model-originated `write_file` / `apply_patch` calls where:

`allowTextFramingChange === true`

Treat that as exceptional mutation intent.

Inside workspace:
- Standard mode: preserve the normal mutation approval request, adding `mutation.intent=text_framing_change`.
- Workspace Autonomous: ordinary workspace mutations still return no approval request; framing-change intent MUST return an approval request.
- The target path / already-dirty evidence remains unchanged.

Outside workspace:
- preserve existing outside reject/ask authority;
- when an outside mutation approval exists and the same exceptional intent is present, include the bounded mutation projection as well;
- do not let the framing intent weaken outside-workspace policy.

### C. Denial semantics

If the approval port denies:
- dispatch must not occur;
- mutation executor must not run;
- file bytes/SHA remain unchanged;
- normal `approval.denied` and `tool.failed code=denied` evidence is emitted;
- provider continuation can recover normally.

Do not consume successful mutation/recovery intent evidence for a denied call.

### D. Low-level executor boundary

Keep the current mutation executor framing guard and `allowTextFramingChange` behavior unchanged for trusted direct callers.

Approval authority belongs in the application loop, not inside the filesystem executor.

### E. Approval presentation / regressions

Any approval/TUI projection that consumes `ApprovalRequest` must tolerate and safely present the optional mutation intent without requiring a TUI redesign.

Permanent tests should prove:
1. ordinary Standard write approval unchanged;
2. Standard framing-change request includes bounded mutation intent;
3. Workspace Autonomous ordinary write remains auto-run;
4. Workspace Autonomous framing-change request requires approval;
5. denial under autonomous leaves file unchanged;
6. allow-once under autonomous permits the exact requested framing change;
7. repository/task/model content cannot suppress the request;
8. no file/patch body appears in ApprovalRequest;
9. outside reject still rejects;
10. outside ask request carries intent without broadening outside authority;
11. ordinary non-framing permissions remain Green.

### F. Phase 9 qualification approval helper

Add a repository-owned helper in the qualification layer rather than modifying the historical benchmark semantics.

Preferred API may resemble:

`createFrozenEditQualificationApproval({ targetPath, validation })`

or another narrowly named equivalent.

It returns an `ApprovalPort` that:
- allows `write_file` only for the exact approved target and only when `request.mutation` is absent;
- allows `apply_patch` only for the exact approved target and only when `request.mutation` is absent;
- denies any `text_framing_change` intent;
- allows only the exact expected validation executable/argv;
- denies unrelated tools/targets/processes.

Do not modify the historical benchmark case definition or expected tool set.

If `createBenchmarkApproval` is touched at all, only harden it so exceptional mutation intent is denied; do not allow `apply_patch` there or change historical expected tools.

### G. Exact deterministic regression

Install a Gate-A-shaped regression using the fair qualification approval helper:

1. first bad 59-byte `write_file` is allowed by target policy but rejected by the framing guard;
2. original bytes/SHA remain unchanged;
3. model rereads;
4. exact same-target `apply_patch` is approval-allowed;
5. patch creates exact required 60-byte file;
6. V1 passes;
7. TaskState completes;
8. hidden/exact fixture acceptance matches.

Also prove:
- if the scripted model instead sets `allowTextFramingChange: true`, the approval helper denies it before dispatch and file stays unchanged;
- the model can recover afterward with the safe patch.

## P2 — final live Phase 9 qualification

### Deterministic pre-gate

Require Green:
- P1 approval authority tests;
- qualification approval-helper tests;
- framing/mutation tests;
- frozen deterministic replay;
- Phase 9 integration;
- mandatory INSPECT/completion tests;
- exception-safe trace tests;
- inherited c9 stack/convergence/state/budget/recovery floors;
- `npm run typecheck`;
- `npm run test:runner`;
- `git diff --check`.

### Gate A

Run exactly one new official frozen structured replay against the P1 candidate.

Use the repository-owned Phase 9 qualification approval helper.

Record:
- target framing/SHA;
- first bad mutation and fidelity rejection if repeated;
- every approval request/decision;
- mutation-intent projection;
- whether framing-change intent was denied;
- whether safe same-target `apply_patch` was allowed;
- final mutation bytes/SHA/framing;
- V1;
- TaskState;
- hidden acceptance;
- calls/rounds/tokens/context/budgets/timing/intervention.

Gate A Green requires all existing locked criteria.

If Gate A is Not Green:
- STOP;
- do not run B/C;
- do not repair implementation in P2;
- do not rerun until another approved implementation change.

### Gate B — greenfield

Only after Gate A Green.

Run exact `greenfield-express-v1` through production stack authority.

Use its existing deliberate dependency/network authorization contract.

Require:
- strict task order;
- declared validations Green;
- StackState completed;
- hidden acceptance Green;
- zero human coding intervention;
- no task/stage exhaustion.

If B Not Green, STOP.

### Gate C — existing app

Only after B Green.

Run exact `existing-express-feature-v1`.

Require:
- focused validation Green;
- broad validation Green;
- completed TaskState;
- baseline preservation;
- hidden acceptance Green;
- zero human coding intervention;
- no task/stage exhaustion.

Create:
`docs/tasks/c9-mutation-intent-authority/P2-live-evidence.md`.

## P3 — correction closeout

Create:
`docs/tasks/c9-mutation-intent-authority/closeout.md`.

Report separately:
- Implementation Complete;
- Mutation Intent Authority Qualified;
- Fair Gate A Approval Qualified;
- Gate A Qwen Work-Unit Convergence Qualified;
- Gate B Greenfield Qualified / Not Run;
- Gate C Existing-App Qualified / Not Run;
- Overall correction Qualified;
- Phase 9 Ready For Owner Closeout: yes/no.

Phase 9 Ready For Owner Closeout is Yes only if A/B/C are all Green and no new blocking regression is observed.

Do not owner-close Phase 9 or open Phase 10 in P3.

## Validation floor

Every implementation prompt:
- focused affected tests;
- inherited c9/Phase 9 floor;
- `npm run typecheck`;
- `npm run test:runner`;
- `git diff --check`;
- no root `package-lock.json`.

Package remains exactly `0.9.10`.
