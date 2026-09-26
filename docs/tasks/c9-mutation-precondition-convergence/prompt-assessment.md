# c9-mutation-precondition-convergence Prompt Assessment

Status: READY FOR PRODUCTION CORRECTION

Correction: `c9-mutation-precondition-convergence`  
Roadmap phase: 9  
Required unchanged package version: `0.9.10`

## Trigger

`c9-greenfield-instrument-alignment` successfully removed the v1 task-authoring drift without changing production structured execution.

Deterministically qualified:
- v1 evidence immutability;
- v2 Task Prompt v1 semantics;
- top-level INSPECT ownership of preflight;
- WORKFLOW-only implementation progression;
- EVIDENCE ownership of post-validation reporting;
- v1/v2 runner isolation;
- prior exact Gate A Green.

The first official `greenfield-express-v2` Gate B2 attempt then reached real implementation and exposed a production convergence defect rather than another instrument-authoring defect.

## Exact B2 sequence

The authorized prerequisite `npm install express@5.1.0` created `package.json`.

P1 INSPECT then completed correctly in one required-tool round with successful read-only evidence.

The implementation response proposed:

1. `write_file("package.json")` without `expectedSha256`;
2. `write_file("src/app.js")`;
3. `write_file("src/server.js")`.

Observed result:
- `package.json` reached tool execution and failed safely because an existing target requires a current-content SHA;
- `src/app.js` was requested but did not reach `tool.started`;
- `src/server.js` was not registered after the failure;
- zero mutations succeeded;
- V1 did not run;
- P1/StackState failed;
- P2/P3 stayed pending;
- C2 was not run.

## Root cause A — existing-file precondition is correct but must remain recoverable

The existing-file SHA rule is not the defect.

Current authority correctly requires:

`read_file.sha256 -> expectedSha256 -> write_file/apply_patch`

George must not:
- invent the SHA;
- silently read and inject it;
- weaken stale-SHA rejection;
- bypass the framing guard.

The model must be able to receive the bounded missing-precondition failure, read the current file, and retry explicitly.

The canonical model/tool loop already supports tool-result continuation. This correction protects that convergence path rather than replacing it with hidden harness behavior.

## Root cause B — pre-dispatch recovery-intent preparation can abort the turn

The stronger B2 failure occurs after ToolRegistry validation and before normal tool dispatch.

For a model-originated in-workspace `write_file`, `AgentLoopApplicationService.executeTool()` prepares mutation recovery intent by resolving the workspace target.

`resolveWorkspaceMutationPath()` requires the target parent to exist.

For:

`src/app.js`

with no `src/`, it raises the bounded validation error:

`Workspace mutation parent must exist.`

That recovery-intent preparation currently sits outside the normal per-call failure conversion at that point. The exception escapes the individual call boundary, so the request never reaches ordinary terminal tool evidence and Qwen cannot react to it through continuation.

This is the terminal B2 convergence defect.

## Root cause C — George cannot explicitly create the missing parent

Even after Root cause B is fixed, the model needs a safe way to satisfy the prerequisite.

Current structured coding tools are reads plus:
- `write_file`;
- `apply_patch`.

`write_file` intentionally does not create nonexistent parents.

`run_process` is intentionally absent from the structured implementation tool surface and must not be exposed merely so the model can call `mkdir`.

Therefore George needs a native `create_directory` workspace-mutation capability.

## Decision

Implement one bounded production correction covering the complete prerequisite chain.

### 1. Keep SHA authority explicit

No automatic SHA injection.

Missing/stale existing-file preconditions remain failed mutations with unchanged bytes and provider-visible bounded error evidence.

### 2. Keep ordinary no-side-effect local failures inside the tool loop

After schema validation, an ordinary local validation/precondition/path prerequisite failure that is known to have produced no side effect should become a per-call `tool.failed` result instead of escaping as a provider-turn failure.

The correction should normalize the **smallest safe pre-dispatch seam**, especially mutation recovery-intent/path preparation.

Do not downgrade:
- cancellation;
- budget exhaustion;
- configuration failure;
- policy/approval denial;
- ambiguous local side effects;
- remote/external `outcome_unknown`.

### 3. Add native create_directory

Add one explicit George-owned tool.

Required semantics:
- relative workspace directory path only;
- bounded input;
- safely create one or more missing directory components inside the canonical workspace;
- reject absolute paths, traversal, symlinks/escapes, regular-file collisions, and unsafe filesystem objects;
- idempotent success for an already-existing real directory;
- no delete/replace/move;
- no process/network execution.

Use native Node filesystem APIs and the canonical workspace trust boundary. Do not shell out.

### 4. Preserve permission authority

`create_directory` is `workspace_mutation`.

Standard mode:
- normal per-call mutation approval.

Workspace Autonomous:
- may auto-run a qualified in-workspace directory creation.

Outside-workspace behavior is unchanged. The task/model/repository cannot elevate the user's configured ceiling.

### 5. Preserve recovery truth

Directory creation is idempotent as a resulting filesystem state, but George still must not blindly replay an interrupted mutation.

Extend bounded recovery intent/reconciliation so canonical directory existence/type can prove completion or incompletion when possible.

Do not weaken write/patch or external recovery semantics.

### 6. Preserve ordered same-response evidence

A recoverable local failure in one call must not strand later reached calls in an unexplained nonterminal state because harness preparation threw.

Hard-stop conditions may still terminate the round according to current policy.

## Existing boundaries that must remain unchanged

- Task Prompt format 1;
- v1 and v2 fixture/task/acceptance bytes and digests;
- provider/runtime/context configuration;
- structured stage and run-budget limits;
- duplicate/no-progress guards;
- full-file SHA authority;
- text-framing fidelity;
- mutation-intent approval authority;
- Bubblewrap containment;
- hidden acceptance;
- strict task-stack fail-stop;
- no title-based stage inference.

## Evidence retention improvement

The prior B2 evidence document references safe bounded attempt/trace artifacts under ignored `artifacts/`, so a repository-only reviewer cannot independently re-open those raw envelopes.

For fresh official attempts in this correction:
- use the repository-defined safe `writeLiveWorkArtifacts()` envelope/trace format;
- persist the safe bounded `attempt.json` and `trace.json` under a tracked evidence directory inside `docs/tasks/c9-mutation-precondition-convergence/`;
- retain only bounded/sanitized evidence there;
- do not commit raw provider streams, file bodies, dependency workspaces, secrets, or unrestricted outputs;
- record hashes and exact paths in P2 evidence.

This is auditability work, not permission expansion.

## Final live gate reset

Because P1 changes production agent-loop/tool/recovery behavior, the previous Gate A Green cannot simply be inherited.

After deterministic qualification:

1. run one fresh Gate A;
2. only if A Green, run one fresh B2 using unchanged `greenfield-express-v2`;
3. only if B2 Green, run C2 using unchanged `existing-express-feature-v2`.

A new passing run never erases the earlier Not Green evidence.

## Recommended stack

### P1 — mutation prerequisite convergence + native directory capability

Model: `Sol High`.

Implement:
- recoverable pre-dispatch local failure handling;
- native `create_directory`;
- approval/policy integration;
- recovery intent/reconciliation;
- structured coding-tool exposure;
- safe progress/evidence projection;
- permanent deterministic regression coverage.

Do not run live Qwen gates.

### P2 — final gated live Phase 9 qualification

Model: `Sol Medium`.

Run deterministic pre-gate, then:
- Gate A;
- B2 only after A Green;
- C2 only after B2 Green.

No repairs, retuning, fixture edits, or reruns inside P2.

Persist safe bounded live envelopes in the task folder and create `P2-live-evidence.md`.

### P3 — correction closeout

Model: `Sol Medium`.

Audit implementation, deterministic evidence, all fresh live gates, historical evidence preservation, and Phase 9 owner-closeout readiness.

Do not owner-close Phase 9 or open Phase 10.

## Prompt count

Three prompts including final closeout.

All prompts:
- Browser required: no;
- package stays exactly `0.9.10`;
- root `package-lock.json` remains absent;
- phase runner owns commits.
