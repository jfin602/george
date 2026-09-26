# Correction 9 Decision Record — Mutation Precondition Convergence

Status: APPROVED DIRECTION — CURRENT PHASE 9 CORRECTION AFTER `c9-greenfield-instrument-alignment`

Package boundary: `0.9.10` unchanged.

Historical evidence remains authoritative:
- `docs/tasks/c9-mutation-intent-authority/closeout.md` — prior frozen Gate A Green;
- `docs/tasks/c9-greenfield-instrument-alignment/P2-live-evidence.md` — first official `greenfield-express-v2` B2 attempt, Not Green;
- `docs/tasks/c9-greenfield-instrument-alignment/closeout.md` — v2 instrument semantics/runner qualified, B2 Not Green, C2 not run.

This correction changes production agent-loop/tool/recovery behavior. It does not rewrite historical live attempts, change Task Prompt format 1, or create a new live-work instrument version.

## Problem

`c9-greenfield-instrument-alignment` removed the historical v1 task-authoring defect and produced a semantically aligned `greenfield-express-v2` workload. The one official B2 attempt then reached implementation and exposed a different production convergence boundary.

The authorized dependency prerequisite created `package.json`. During P1 implementation Qwen proposed:

1. a `write_file` replacement of existing `package.json` without `expectedSha256`;
2. a `write_file` for `src/app.js`;
3. a `write_file` for `src/server.js`.

The first request correctly failed because an existing target requires the latest observed `read_file.sha256`. That safety rule is working and must not be weakened.

The second request revealed a separate defect class. `src/` did not exist. Current pre-dispatch mutation preparation resolves the target/parent before normal tool execution and requires the mutation parent to exist. The request therefore did not reach a normal terminal execution state that could be returned through provider continuation. The work unit failed, later calls did not complete, no mutation succeeded, validation did not run, StackState failed at P1, and C2 remained gated.

Even if that pre-dispatch error were converted into a normal tool result, the structured coding surface currently exposes no George-native operation that can create the required directory. `write_file` intentionally refuses nonexistent parents and `run_process` is not part of the structured implementation tool surface.

The correction must therefore solve **mutation prerequisite convergence**, not merely special-case one missing SHA.

## Decisions

### Preserve explicit existing-file preconditions

Existing-file mutation authority is unchanged.

- `read_file.sha256` remains the provider-visible current-content precondition for `write_file` and `apply_patch`.
- George must not invent, silently fetch, silently refresh, or auto-fill `expectedSha256` on behalf of a model-originated mutation.
- A missing or stale precondition remains a safe failed mutation with no file change.
- The model may recover by reading the target, observing the current SHA/framing evidence, and explicitly retrying.

The existing mutation-precondition rule is a safety boundary, not the defect.

### Recoverable local prerequisite failures stay inside the tool loop

A model-originated local tool call that has passed schema validation but encounters an ordinary local validation/precondition/path prerequisite failure with a known no-side-effect outcome must finish as bounded per-call `tool.failed` evidence whenever possible.

Examples include:
- missing `expectedSha256` for an existing file;
- stale current-content precondition;
- nonexistent safe mutation parent;
- an idempotent directory request colliding with a regular file.

Pre-dispatch helpers such as path resolution, approval preparation, Git target observation, and recovery-intent preparation must not turn those ordinary no-side-effect failures into an uncaught provider-turn failure.

This rule is deliberately narrow. It does not convert:
- cancellation;
- task/stage/run-budget exhaustion;
- invalid George configuration;
- explicit policy/approval denial;
- ambiguous local side effects;
- remote/browser/external `outcome_unknown`;
- recovery states that require planning

into ordinary retryable failures.

### Explicit native directory creation

George gains a native `create_directory` tool.

Required behavior:
- accepts one bounded relative workspace directory path;
- rejects empty/absolute/traversing paths;
- never follows a symlink escape;
- may safely create the requested missing directory chain inside the canonical workspace;
- succeeds idempotently when the requested directory already exists as a real directory;
- fails if a path component/target collides with a regular file or unsafe filesystem object;
- never deletes, replaces, renames, or moves existing entries;
- performs no network or process execution.

`create_directory` is a `workspace_mutation`.

Standard workspace mode uses the ordinary mutation approval boundary. Workspace Autonomous may auto-run it only inside the canonical workspace under the existing user-configured ceiling. Repository/task/model/plugin text cannot elevate that ceiling.

`write_file` remains an exact file mutation primitive and does **not** silently create missing parents. Making directory creation explicit preserves observability, permission truth, and recovery evidence.

### Directory recovery and replay semantics

Directory creation is idempotent at the filesystem-result level, but interruption evidence must still remain truthful.

Before/around dispatch George retains enough bounded intent to reconcile an interrupted `create_directory` from the canonical workspace:
- requested relative directory path;
- whether the final canonical target exists as the requested real directory after reopen.

Recovery may classify an interrupted directory creation as confirmed complete/incomplete when canonical filesystem evidence proves that state. It must not blindly replay when state is ambiguous or unsafe.

The existing rules for ambiguous write/patch/external effects remain unchanged.

### Same-response call convergence

Provider-emitted tool calls remain ordered.

An ordinary recoverable failure in one local request must not, by itself, strand later safe requests in an unexplained nonterminal state because harness preparation threw outside the per-call boundary.

The loop may still stop immediately for legitimate hard-stop conditions such as cancellation or exhausted task/stage/run budget. When it stops, the event stream must truthfully distinguish calls that were never reached from calls that received terminal results.

### Instrument history and versioning

The live-work instruments are not changed by this correction.

- `greenfield-express-v1` and `existing-express-feature-v1` remain frozen historical evidence.
- `greenfield-express-v2` and `existing-express-feature-v2` remain the current aligned instruments with their existing versions/digests/acceptance references.
- The first v2 B2 Not Green attempt remains immutable longitudinal evidence.
- Do not create v3 unless the task/instrument structure itself changes.

### Live gate reset

The prior exact Gate A Green remains historical evidence, but this correction changes production agent-loop/tool/recovery behavior.

Therefore final Phase 9 qualification after implementation is:

1. fresh Gate A — exact frozen edit-plus-validation replay;
2. fresh B2 — unchanged `greenfield-express-v2`, only after Gate A Green;
3. C2 — unchanged `existing-express-feature-v2`, only after B2 Green.

A later pass does not erase any earlier Not Green attempt.

## Expected convergence shape

A representative corrected path may look like:

```text
write_file package.json
-> tool.failed: current-content SHA precondition required

write_file src/app.js
-> tool.failed: parent directory does not exist

provider continuation

read_file package.json
-> current sha256 + framing evidence

create_directory src
-> succeeded

write_file package.json + expectedSha256
write_file src/app.js
write_file src/server.js
-> succeeded

George-owned validation
```

The exact provider strategy is not prescribed. Qwen may choose an equivalent safe sequence. George owns the capability and evidence rules, not a scripted plan.

## Implementation boundary

Expected production areas include:
- workspace-native directory tool registration/execution;
- canonical workspace path validation for directory creation;
- agent-loop per-call error normalization around pre-dispatch preparation;
- recovery intent/reconciliation for directory creation;
- safe progress/evidence projection;
- structured coding-tool exposure;
- focused unit/integration regression coverage.

Keep provider adapters, OpenTUI rendering authority, Task Prompt grammar, context profile values, stage limits, hidden acceptance, and v2 task fixtures unchanged unless implementation evidence proves a separate defect.

## Non-goals

- weakening or removing SHA preconditions;
- automatic SHA injection;
- implicit parent-directory creation inside `write_file`;
- exposing arbitrary `run_process` merely to run `mkdir`;
- changing Task Prompt format 1;
- title-based task semantics;
- increasing stage/run budgets to force a pass;
- changing v2 instrument semantics or hidden acceptance;
- broad filesystem delete/move/copy APIs;
- Phase 10 throughput work.

## Model-routing intent for the later correction stack

When the correction implementation stack is authored:
- production mutation/tool/recovery implementation: GPT-6 Sol High;
- gated live qualification: GPT-6 Sol Medium;
- evidence-only correction closeout: GPT-6 Sol Medium.

Executable labels remain subject to the runner's currently validated model mapping.
