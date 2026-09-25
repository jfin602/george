# c9-qwen-workunit-convergence Implementation Plan

Status: READY FOR PROMPT EXECUTION

Correction: `c9-qwen-workunit-convergence`  
Roadmap phase: 9  
Required unchanged package version: `0.9.10`

## Authority

Read:
- `BOOT.md`;
- `AGENTS.md`;
- current product/architecture/workflow/stability contracts;
- current Phase 9 structured-task decision/format/qualification authority;
- `docs/tasks/c9-structured-task-convergence/{P5-live-evidence,closeout}.md`;
- `docs/phase-9-closeout.md`;
- exact current source/tests before editing.

Do not reopen already-qualified production StackState/stack execution work.

## P1 — safe mutation precondition visibility

### Read contract

Extend `read_file` with a current-content SHA-256 suitable for mutation preconditions.

The hash must:
- represent the full current file bytes, not only truncated returned text;
- be lowercase SHA-256 hex;
- be computed under the same canonical workspace/symlink boundary as the read;
- avoid unbounded in-memory buffering;
- remain valid only for the observed file version; normal mutation precondition checking still detects staleness.

Preserve existing `text`, `bytes`, and `truncated` semantics unless source contracts require a deliberate documented clarification.

### Provider/tool guidance

Make the mutation contract explicit in provider-visible tool metadata:
- `read_file` returns `sha256`;
- when overwriting an existing file with `write_file`, use the latest current-file SHA-256 as `expectedSha256`;
- `apply_patch` requires that same current hash.

Do not make `expectedSha256` optional at execution time for an existing file.

Do not auto-inject a stale hash behind the model's back.

### Structured evidence projection

Include safe `sha256` in the bounded structured inspection result supplied to implementation.

Do not persist raw file bodies to TaskState.

### Permanent tests

At minimum:
- direct `read_file` returns exact full-file SHA-256;
- truncated reads still hash the full current file correctly;
- symlink/workspace containment unchanged;
- hash from read allows a subsequent safe `write_file` overwrite;
- hash from read allows a subsequent `apply_patch`;
- stale hash still fails after an intervening mutation;
- structured inspection evidence includes path/text/hash;
- provider-facing mutation guidance clearly exposes the precondition relationship;
- a scripted/dynamic provider regression obtains the hash from George's actual read tool result rather than hard-coding it before issuing the edit.

The frozen deterministic Phase 8 replay should be updated only as needed so it no longer hides the precondition contract with a hard-coded hash.

## P2 — durable live qualification trace

Enhance repository-owned `src/qualification/live-work.ts` (or the narrowest existing qualification boundary) so official live attempts return/serialize a bounded stable trace.

### Required trace

Capture:
- exact terminal status;
- TaskState and StackState safe projections;
- provider attempts;
- logical provider rounds;
- retries;
- provider usage input/output;
- ordered model-requested tool names/call IDs plus bounded arguments sufficient for diagnosis;
- tool terminal status/effect;
- successful mutation path/hash evidence;
- validation outcomes;
- correction count;
- context profile ID/estimated tokens/provider-input budget using the actual `context.assembled.diagnostics` schema;
- run/stage budget pressure/exhaustion;
- wall/workflow timing where available;
- hidden acceptance result;
- human intervention field supplied by the harness.

### Failure resilience

- Trace extraction must be total over the current ApplicationEvent union: an unknown/optional field produces bounded missing evidence, not a crash.
- Never access context profile fields outside `event.diagnostics`.
- Preserve raw bounded ApplicationEvents in memory/result even if derived metric extraction fails.
- When writing artifacts, write an attempt envelope/task-state/workspace outcome before optional human-readable rendering so formatting failure cannot erase the official attempt.
- Never store secrets, raw environment dumps, unrestricted provider payloads, or hidden acceptance source.

### Tests

Use actual typed event fixtures including `context.assembled` to prove the original postprocessor crash cannot recur.

## P3 — gated live qualification

Use the pinned Qwen/LM Studio control and repository-owned live-work runner/trace.

### Deterministic pre-gate

Require P1/P2 focused tests, frozen deterministic replay, Phase 9 integration, affected c9 convergence tests, typecheck, runner, and diff hygiene Green.

### Gate A

Run exactly one official frozen Phase 8 structured replay.

Record the complete new trace.

Green requires:
- exact edit;
- George-owned V1 pass;
- completed/verified TaskState;
- zero human coding intervention;
- no correction/task/stage budget exhaustion;
- <=10 model-requested tool calls;
- <=10 logical provider rounds.

Specifically record whether:
- implementation received `read_file.sha256`;
- any `write_file` or `apply_patch` call used the observed hash;
- mutation succeeded/failed/was never attempted.

If Gate A is Not Green, stop. Do not run greenfield/existing-app and do not repair implementation in P3.

### Gate B — greenfield

Only after Gate A Green.

Run exact `greenfield-express-v1` through the already-qualified production stack executor.

Green requires all tasks/validations, completed StackState, hidden acceptance, zero human coding intervention, and no budget/convergence exhaustion.

### Gate C — existing-app

Only after Gate B Green.

Run exact frozen existing-app feature and hidden acceptance.

Record raw metrics for every reached gate.

Create `docs/tasks/c9-qwen-workunit-convergence/P3-live-evidence.md`.

## P4 — closeout

Create `docs/tasks/c9-qwen-workunit-convergence/closeout.md`.

Audit:
- mutation-precondition defect and fix;
- live trace/postprocessor defect and fix;
- deterministic regressions;
- Gate A mutation-precondition/tool trace;
- Gate A functional/call/round result;
- Gate B/C only if reached;
- inherited c9 production-stack qualification;
- inherited Bubblewrap/TUI evidence;
- every remaining Not Green/Evidence Gap.

Report separately:
- Implementation Complete;
- Mutation Contract Qualified;
- Live Trace Qualified;
- Qwen Work-Unit Convergence Qualified;
- Overall correction Qualified.

Overall qualification requires Gate A Green. Do not waive it.

## Validation floor

Every implementation prompt:
- focused affected tests;
- inherited structured-task/c9 tests;
- `npm run typecheck`;
- `npm run test:runner`;
- `git diff --check`;
- no root `package-lock.json`.

Package remains exactly `0.9.10`.
