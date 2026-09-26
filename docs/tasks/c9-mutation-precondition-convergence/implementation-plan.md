# c9-mutation-precondition-convergence Implementation Plan

Status: READY FOR PROMPT EXECUTION

Correction: `c9-mutation-precondition-convergence`  
Roadmap phase: 9  
Required unchanged package version: `0.9.10`

## Authority

Read:
- `BOOT.md`;
- `AGENTS.md`;
- current architecture/workflow/stability contracts;
- Phase 9 decision, Task Prompt v1, and qualification authority;
- `docs/planning/c9-mutation-precondition-convergence/{decision-record,qualification-plan}.md`;
- `docs/tasks/c9-greenfield-instrument-alignment/{P2-live-evidence,closeout}.md`;
- exact current agent-loop, workspace resolver, mutation ToolRegistry/executor, recovery coordinator/events, structured-task tool surface, progress projection, live-work artifact code, and affected tests.

Inspect current implementation before editing; preserve newer repository decisions if they differ from file names suggested below.

## P1 — production mutation prerequisite convergence

### A. Native create_directory tool

Add `create_directory` to George's canonical built-in workspace tool registry.

Prefer the smallest coherent placement beside the existing workspace mutation tools unless current module boundaries justify a tiny dedicated directory-mutation module.

Provider schema:
- name: `create_directory`;
- required `path` string;
- bounded schema/input;
- description clearly states it creates a workspace directory chain and is the prerequisite for nested `write_file` when parents are missing.

Execution metadata:
- effect: `workspace_mutation`;
- keep conservative no-blind-replay semantics at the event/recovery layer;
- do not classify it as a local read or external/process effect.

Result should contain only bounded operational metadata needed for evidence, such as:
- canonical workspace-relative directory path;
- whether anything was created / created component count if useful.

No file bodies or environment state.

### B. Safe directory path creation

Extend the canonical workspace filesystem boundary rather than implementing path checks ad hoc in the application layer.

Required algorithmic properties:
- canonical workspace root verified;
- relative paths only;
- reject NUL, absolute paths, and parent traversal;
- walk path components inside the workspace;
- reject symlink components/target;
- reject regular-file/non-directory collisions;
- create only missing directory components;
- revalidate enough filesystem state after creation to preserve the existing workspace/symlink trust boundary;
- already-existing real directory is success;
- no deletion/replacement/move;
- no shell/process use.

Do not weaken `resolveWorkspaceMutationPath()` for file writes. File writes still require an existing safe parent.

### C. Per-call recoverable pre-dispatch failure seam

Audit `AgentLoopApplicationService.executeTool()` from ToolRegistry validation through:
- outside-filesystem resolution;
- policy checks;
- approval preparation;
- recovery-intent preparation;
- `tool.started`;
- registry dispatch.

The B2 defect is specifically the uncaught mutation recovery-intent target resolution before `tool.started`.

Refactor only enough to guarantee:

> a schema-valid model-originated local request that fails during no-side-effect local preparation with an ordinary validation/tool prerequisite error returns one bounded terminal `tool.failed` result for that call.

Requirements:
- preserve `tool.requested`;
- include George-owned execution metadata when known;
- do not emit `tool.started` if dispatch never began;
- return the ToolResult so the current provider continuation receives the failure;
- continue later same-response calls unless an existing legitimate hard-stop rule applies.

Do not blanket-catch every error.

Must still propagate/retain stronger semantics for:
- cancellation;
- run/stage/task budget exhaustion;
- configuration errors;
- ambiguous/outcome-unknown mutations;
- explicit permission/policy handling.

Keep approval denial as its existing denied evidence, not a generic prerequisite failure.

### D. Existing SHA convergence

Do not change the low-level missing/stale SHA rule.

Add an application-loop regression where:
1. existing file write lacks `expectedSha256`;
2. call fails without changing bytes;
3. provider continuation receives the failure;
4. model requests `read_file`;
5. full-file SHA becomes provider-visible;
6. model retries the write with that exact SHA;
7. mutation succeeds.

Prove George never injects the SHA.

### E. Missing-parent convergence

Add an exact B2-shaped regression where a model requests nested writes while the parent directory is missing.

At minimum prove:
1. `write_file("src/app.js")` produces terminal bounded failure rather than `turn.failed` from pre-dispatch target preparation;
2. provider continuation can request `create_directory("src")`;
3. directory creation succeeds;
4. retrying `write_file("src/app.js")` succeeds;
5. no partial file exists before directory creation.

Also cover one provider response containing multiple ordered requests so a recoverable prerequisite failure does not strand subsequent reached calls as unexplained `unavailable`.

### F. Permission integration

Update the existing approval path generically by execution effect; avoid special-case policy forks if the canonical `workspace_mutation` handling already applies.

Prove:
- Standard mode asks before `create_directory`;
- deny creates nothing and produces approval/tool denied evidence;
- allow-once creates only the requested in-workspace directory;
- Workspace Autonomous in-workspace directory creation does not prompt;
- outside reject/ask behavior is not broadened;
- repository/task/model text cannot grant authority.

If outside-directory creation is not part of the canonical external filesystem capability, keep it unavailable rather than broadening Phase 9.

### G. Recovery intent and reconciliation

Extend `RecoveryIntent` minimally with a `create_directory` case containing only the bounded relative path.

Before dispatch, emit enough intent for interruption classification without treating provider arguments as authority.

Extend `RecoveryCoordinator`:
- requested directory exists as canonical real directory -> `confirmed_complete`;
- requested directory provably absent -> `confirmed_incomplete`;
- unsafe/collision/ambiguous observation -> conservative outcome;
- no provider/tool replay during recovery.

Preserve existing write/patch/process/external/approval/provider-continuation behavior.

Update interruption/session round-trip tests if the typed event union requires it.

### H. Structured coding surface

Add `create_directory` to structured implementation/correction tool exposure.

Do not add it to INSPECT.

Do not expose `run_process` merely for directory creation.

The provider should therefore have the safe primitives needed for:
- inspect;
- create parent directories;
- create/write files;
- patch existing files.

### I. Progress/evidence

Update presentation-independent work projection so `create_directory`:
- is classified as editing/workspace mutation;
- renders bounded requested/completed/failed status;
- includes path and small result metadata only;
- contains no raw provider payload.

Update safe live trace/tool evidence only if generic handling does not already cover the new tool.

Do not make UI code execution authority.

### J. Permanent tests

Minimum regression set:

TOOL / PATH
1. provider schema includes `create_directory`;
2. one-level creation;
3. nested chain creation;
4. existing-directory idempotence;
5. regular-file collision;
6. absolute path rejection;
7. traversal rejection;
8. symlink escape/component rejection;
9. cancellation leaves no unsafe partial state;
10. `write_file` still refuses missing parents.

AGENT LOOP
11. missing existing-file SHA returns tool failure and continuation can read/retry;
12. missing parent returns per-call tool failure, not turn failure;
13. create-directory then nested write succeeds;
14. multiple same-response calls retain truthful terminal evidence;
15. cancellation/budget/configuration/denial remain stronger current semantics;
16. mutation epoch/no-progress behavior remains correct.

PERMISSION / RECOVERY
17. Standard approval allow/deny;
18. Workspace Autonomous auto-run;
19. no outside-policy broadening;
20. interrupted directory creation reconciliation complete/incomplete/ambiguous;
21. no blind replay.

STRUCTURED / REGRESSION
22. structured implementation/correction surface includes `create_directory`, INSPECT does not;
23. exact Gate A deterministic replay remains Green;
24. SHA/text-framing/mutation-intent regressions remain Green;
25. StackState/fail-stop/budget/Phase 5 recovery remain Green;
26. v1/v2 fixture/digest/acceptance immutability remains Green.

### K. P1 validation

Run the narrow affected suites first, then the inherited c9/Phase 9 floor.

Require:
- workspace/mutation tests;
- agent-loop tests;
- recovery tests;
- structured-task tests;
- progress/live-work tests as affected;
- Phase 9 integration;
- inherited Gate A deterministic replay;
- Workspace Autonomous/Bubblewrap affected coverage;
- `npm run typecheck`;
- `npm run test:runner`;
- broad `npm test` on supported Node 26 when available;
- `git diff --check`.

Verify:
- package exactly `0.9.10`;
- no root `package-lock.json`;
- no live Qwen Gate A/B2/C2 in P1.

## P2 — fresh official live qualification

P2 is qualification/evidence only.

Do not change:
- production code;
- Task Prompt grammar;
- v1/v2 fixture/task/metadata/digests;
- hidden acceptance;
- provider/runtime/context/stage/correction/run-budget settings.

### A. Deterministic pre-gate

Require Green:
- P1 exact failure-class regressions;
- `create_directory` safety/policy/recovery tests;
- Phase 9 integration;
- inherited c9 affected floor;
- Gate A frozen deterministic replay;
- v1/v2 immutability;
- typecheck;
- runner;
- diff hygiene.

### B. Runtime provenance

Use the pinned live control:
`qwen3-coder-30b-a3b-instruct@q4_k_m`

Use supported Node 26.

Capture:
- exact George candidate/version;
- Node/npm;
- LM Studio endpoint/model ID;
- context length;
- eval/physical batch;
- parallel;
- Flash Attention;
- GPU KV-cache offload;
- experts;
- UI-only GPU Offload 26 remains a controlled-latency Evidence Gap if not independently observed.

No retuning.

### C. Gate A

Run exactly one fresh official frozen structured edit-plus-validation attempt.

Use the current repository-owned fair Gate A approval helper and unchanged fixture/acceptance.

Green requires:
- exact 60-byte result;
- George-owned V1 Green;
- completed/verified TaskState;
- hidden acceptance Green;
- zero human coding intervention;
- no task/stage/correction/run-budget exhaustion;
- <=10 model-requested tool calls;
- <=10 logical provider rounds.

If Not Green:
- stop;
- do not run B2/C2;
- do not repair/rerun.

### D. Gate B2

Only after A Green.

Run exactly one fresh official `greenfield-express-v2` attempt with unchanged:
- instrument version/digest;
- acceptance version 1;
- deliberate `npm install express@5.1.0` prerequisite;
- production structured task-stack service.

Record the complete prerequisite convergence path:
- missing SHA failures;
- reads/retries;
- missing-parent failures;
- `create_directory` calls;
- later file writes;
- every requested/started/terminal tool state;
- StackState;
- validations;
- hidden acceptance;
- budgets/context/tokens/timing/intervention.

Green criteria remain exactly the Phase 9 authority.

If Not Green:
- stop;
- leave C2 unspent;
- no repair/rerun.

### E. Gate C2

Only after B2 Green.

Run exactly one official `existing-express-feature-v2` attempt.

Use unchanged fixture version/source digest, task digest, acceptance version, dependency prerequisite, and production service.

Require:
- focused validation Green;
- broad validation Green;
- completed/verified TaskState;
- baseline preserved;
- hidden acceptance Green;
- zero intervention;
- no exhaustion.

### F. Committed safe evidence

Create:
- `docs/tasks/c9-mutation-precondition-convergence/P2-live-evidence.md`;
- tracked bounded safe evidence directories such as:
  - `docs/tasks/c9-mutation-precondition-convergence/evidence/gate-a/`;
  - `.../gate-b2/` if reached;
  - `.../gate-c2/` if reached.

Use `writeLiveWorkArtifacts()` or its exact safe schema for committed:
- `attempt.json`;
- `trace.json`.

A small sanitized runtime provenance JSON may also be committed.

Never commit:
- raw provider streams;
- arbitrary tool output;
- write/patch bodies;
- secrets/environment;
- dependency workspace copies;
- generated `node_modules`;
- ignored raw artifact trees merely for completeness.

Record SHA-256 for every committed evidence JSON in P2 evidence.

Historical live evidence remains untouched.

## P3 — correction closeout

Create:
`docs/tasks/c9-mutation-precondition-convergence/closeout.md`.

Audit separately:
- Implementation Complete;
- Recoverable Mutation Prerequisite Boundary Qualified;
- Native create_directory Qualified;
- Permission Boundary Qualified;
- Directory Recovery Qualified;
- Historical Evidence Preserved;
- Fresh Gate A;
- Fresh B2;
- Gate C2;
- Evidence Auditability;
- Overall Correction Qualified;
- Phase 9 Ready For Owner Closeout.

Phase 9 Ready For Owner Closeout = Yes only if:
- deterministic correction floor Green;
- fresh Gate A Green;
- B2 Green;
- C2 Green;
- no new blocking regression.

If Yes, state the next action is separate `/closeout phase 9`.

Do not owner-close Phase 9 or open Phase 10 inside this correction.

## Model routing

- P1: `Sol High` — production agent-loop/filesystem/permission/recovery boundary.
- P2: `Sol Medium` — controlled live qualification/evidence.
- P3: `Sol Medium` — evidence-only closeout.

These are the runner's currently supported executable Sol labels. Do not substitute Terra.
