# Correction 9 Qualification Plan — Mutation Precondition Convergence

Status: APPROVED QUALIFICATION DIRECTION

Authority:
- `docs/planning/c9-mutation-precondition-convergence/decision-record.md`;
- current Phase 9 qualification authority in `docs/planning/p9-structured-task-execution/qualification-plan.md`;
- historical B2 failure in `docs/tasks/c9-greenfield-instrument-alignment/P2-live-evidence.md`.

Package remains `0.9.10`.

## Qualification principle

This correction is Green only if George preserves mutation safety **and** converts ordinary no-side-effect local prerequisite failures into a usable convergence path.

A safe rejection by itself is insufficient if the provider never receives a terminal result or if the tool surface cannot perform the safe prerequisite needed to continue.

Do not alter the official v2 instrument files or hidden acceptance to make the correction pass.

## Deterministic Gate 0 — exact failure-class replay

Before live work, deterministic tests must reproduce and then protect the observed B2 class.

### Existing-file precondition convergence

Exercise a scripted provider sequence where:
1. the model attempts `write_file` on an existing file without `expectedSha256`;
2. George returns bounded `tool.failed` evidence and leaves bytes unchanged;
3. continuation requests `read_file`;
4. the returned full-file SHA is used explicitly in a retry;
5. the retry succeeds.

Require:
- no hidden/automatic SHA insertion;
- no mutation before a valid precondition;
- expected tool events/continuation order;
- exact final bytes;
- normal approval policy.

Also retain stale-SHA and text-framing regressions.

### Missing-parent convergence

Exercise a model request for a safe relative nested target whose parent does not exist.

Require:
- the request does not escape as an uncaught turn-level exception from pre-dispatch preparation;
- it produces bounded terminal `tool.failed` evidence with a known no-side-effect result;
- no partial path/file is created by the failed `write_file`;
- provider continuation remains possible.

### Native create_directory

Exercise `create_directory` through the canonical ToolRegistry/application path.

Require:
- one-level and multi-level in-workspace creation;
- idempotent success when the directory already exists;
- regular-file collision rejection;
- absolute-path rejection;
- `..` traversal rejection;
- symlink component/target escape rejection;
- bounded input;
- no delete/replace/move behavior;
- no process/network execution.

Then prove:

`create_directory src -> write_file src/app.js`

succeeds with truthful mutation/progress evidence.

### Permission policy

Require:
- Standard workspace mode requests the ordinary mutation approval before directory creation;
- denial produces normal denied evidence and creates nothing;
- Workspace Autonomous may auto-run the in-workspace directory creation;
- task/repository/model text cannot elevate a Standard/rejecting user ceiling;
- outside-workspace semantics remain unchanged.

### Recovery

Create an interrupted-directory-creation fixture around the existing session/recovery machinery.

Require:
- bounded directory intent is retained before the ambiguous interruption window;
- canonical post-reopen directory existence/type can classify confirmed completion/incompletion where provable;
- unsafe/ambiguous state becomes planning/outcome-unknown as appropriate;
- no blind replay;
- write/patch recovery behavior remains unchanged.

### Same-response tool-call terminality

Script a provider response containing multiple ordered local calls including:
- a recoverable missing-precondition failure;
- a recoverable missing-parent failure;
- a later safe call.

Require all requests that are actually reached before any legitimate hard stop to receive authoritative terminal evidence. An ordinary helper exception must not strand a request merely because it happened before `tool.started`.

Separately prove cancellation, budget exhaustion, configuration failure, explicit denial, and ambiguous side effects retain their existing stronger stop behavior.

## Regression inheritance

Rerun the affected floors for:
- Phase 2 workspace/tool/path/permission behavior;
- Phase 4 interruption/session recovery;
- Phase 5 retry/recovery and no-blind-replay behavior;
- Phase 8 context/continuation-pressure behavior affected by tool continuation;
- Phase 9 structured task/stack sequencing and fail-stop;
- `read_file.sha256 -> expectedSha256`;
- text framing and exact edit fidelity;
- mutation-intent authority and approvals;
- Workspace Autonomous/Bubblewrap boundaries;
- live-work runner/trace behavior;
- v1/v2 fixture, task, metadata, digest, and acceptance immutability.

At minimum require:
- focused correction suites Green;
- Phase 9 integration Green;
- inherited c9 affected floor Green;
- `npm run typecheck` Green;
- `npm run test:runner` Green;
- `git diff --check` Green;
- package exactly `0.9.10`;
- no root `package-lock.json`.

Run `npm test` on the supported Node 26/FFI environment when available and classify unrelated retained TUI/native failures truthfully rather than relabeling them.

## Live Gate A — frozen edit replay

Because production agent-loop/tool/recovery behavior changed, run exactly one fresh official Gate A attempt.

Use the same frozen fixture, acceptance, pinned Qwen/LM Studio control, execution policy, context policy, stage limits, correction limits, and run budgets used by the current Phase 9 gate contract.

Green requires:
- exact required 60-byte edit;
- George-owned V1 Green;
- completed/verified TaskState;
- hidden acceptance Green;
- zero human coding intervention;
- no task/stage/correction/run-budget exhaustion;
- <=10 model-requested tool calls;
- <=10 logical provider rounds.

If Gate A is Not Green:
- stop;
- preserve the attempt;
- do not run B2/C2;
- do not retune/rerun merely to obtain a pass.

## Live Gate B2 — greenfield-express-v2

Only after fresh Gate A Green, run exactly one new official B2 attempt against the **unchanged** `greenfield-express-v2` version/digest and acceptance version 1.

The earlier B2 Not Green remains historical evidence and must not be overwritten.

Record:
- exact George candidate/version;
- unchanged v2 instrument/task digest and acceptance version;
- dependency prerequisite authorization/result;
- StackState progression;
- top-level INSPECT calls/completion;
- provider attempts/rounds/retries;
- every requested/started/terminal tool call;
- recoverable prerequisite failures and their continuations;
- directory-creation calls;
- mutations;
- George-owned validations;
- hidden acceptance;
- context/profile/tokens/headroom;
- task/stage/correction/run budgets;
- duplicate/no-progress events;
- timing;
- human intervention.

B2 Green requires:
- P1/P2/P3 complete in strict order;
- every declared validation Green;
- final StackState completed;
- hidden acceptance Green;
- zero human coding intervention;
- no task/stage/correction/run-budget exhaustion;
- no instrument-authoring fallback or title heuristic.

If B2 is Not Green, stop and leave C2 unspent.

## Live Gate C2 — existing-express-feature-v2

Only after B2 Green, run exactly one official C2 attempt against unchanged `existing-express-feature-v2`.

Green requires:
- focused validation Green;
- broad validation Green;
- completed/verified TaskState;
- baseline behavior preserved;
- hidden acceptance Green;
- zero human coding intervention;
- no task/stage/correction/run-budget exhaustion.

## Evidence retention

Each official live attempt must produce the repository-defined bounded attempt/trace artifacts before optional report rendering. The evidence document records exact artifact paths and hashes and preserves failures even when execution or optional presentation fails.

Closeout must distinguish:
- implementation complete;
- deterministic correction qualification;
- fresh Gate A;
- fresh B2;
- C2;
- retained historical Not Green/Evidence Gap states.

A later pass never erases the prior Gate A/B/B2 failures.

## Phase 9 owner-closeout condition

Phase 9 is eligible for separate owner closeout only when:
- deterministic mutation-precondition convergence is Green;
- fresh corrected Gate A is Green;
- fresh B2 is Green;
- C2 is Green;
- no new blocking production or qualification regression exists.

The correction closeout itself does not owner-close Phase 9 or open Phase 10.

## Post-closeout preflight scoping correction

The historical P2 correctly followed its authored prompt and stopped when aggregate `npm test` was Not Green. That result remains immutable. The prompt had accidentally strengthened this plan's intended broad characterization into an absolute Green prerequisite.

Subsequent authority is `docs/planning/c9-qualification-preflight-scope/{decision-record,qualification-plan}.md`. It preserves this correction's production implementation and deterministic qualification, then requires a controlled broad baseline-vs-candidate regression delta before spending fresh Gate A/B2/C2. Aggregate broad failures remain Not Green even when the candidate regression delta is Green.
