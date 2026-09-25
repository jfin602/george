# c9-mutation-intent-authority Prompt Assessment

Status: READY FOR CORRECTION IMPLEMENTATION

Correction: `c9-mutation-intent-authority`  
Roadmap phase: 9  
Required unchanged package version: `0.9.10`

## Trigger

The latest Phase 9 live Gate A is Not Green for one narrow authority mismatch, not for a broad structured-execution failure.

Already-qualified inherited boundaries:
- production `StackState` task-stack validation/order/fail-stop/persistence/resume;
- structured evidence handoff, task-wide budget, direct George-owned validation, and convergence guards;
- full-file `read_file.sha256` -> existing-file mutation precondition;
- mandatory first-round structured INSPECT execution;
- application-owned completion after the first successful INSPECT tool round;
- exception-safe live attempt/trace retention;
- full-file text-framing evidence;
- mutation framing-preservation guard;
- Bubblewrap containment.

Latest official Gate A sequence:
1. Qwen requested a 59-byte `write_file` that removed the target's final newline.
2. George's fidelity guard rejected it recoverably and preserved the original 46-byte file/SHA.
3. Qwen reread the target.
4. Qwen requested an exact `apply_patch` from the original 46 bytes to the required 60-byte content using the still-valid SHA.
5. The frozen benchmark approval policy denied `apply_patch` because its historical helper authorizes only `write_file` on the expected target.
6. Qwen then requested the same wrong 59-byte `write_file` with `allowTextFramingChange: true`.
7. The application approval boundary did not represent that exceptional mutation intent separately, so the qualification approval port treated it as an ordinary same-target write and allowed it.
8. George correctly wrote exactly the acknowledged 59 bytes; V1 passed and TaskState completed, but exact/hidden acceptance failed.

Qwen therefore selected the correct safe recovery before the harness denied it.

## Root cause A — model intent is conflated with executable authority

`allowTextFramingChange` currently means both:
- model says it intends to change framing; and
- low-level executor is permitted to bypass the preservation guard.

That second meaning is valid only for an already-authorized trusted caller.

For model-originated execution through George's canonical loop, a tool argument cannot grant new authority.

The application approval boundary currently sees:
- tool name;
- execution metadata;
- target path / dirty state;
- process details where applicable.

It does not receive a bounded projection of exceptional mutation intent.

Workspace Autonomous also returns no approval request for ordinary workspace mutations before considering argument-level exceptional intent.

## Root cause B — Gate A uses an unfair historical approval helper

`createBenchmarkApproval()` intentionally reflects the historical agentic benchmark:
- `write_file` on the expected target;
- exact validation process;
- everything else denied.

That historical behavior should remain stable for benchmark comparability.

Phase 9 structured Gate A now exposes both qualified mutation primitives and explicitly guides Qwen to prefer `apply_patch` for localized edits. Reusing the historical helper therefore creates an artificial tool bias.

The fair structured Gate A needs a separate qualification approval envelope.

## Correction objective

### 1. Mutation intent authority

Keep `allowTextFramingChange` as the existing tool-schema field to avoid needless churn, but define it as:

> request/acknowledgement of exceptional text-framing-change intent, not executable permission.

For model-originated calls:
- detect this validated intent in the application layer before dispatch;
- represent it in a bounded `ApprovalRequest`;
- require `allow_once` even when Workspace Autonomous would normally auto-run the mutation;
- denial leaves the file unchanged and returns normal denied tool evidence.

Standard workspace mode already asks for mutation approval; the same request should include the exceptional intent.

The lower-level mutation executor remains exact and can honor the flag when invoked by an already-authorized trusted caller. Do not move approval logic into the executor.

### 2. Bounded approval representation

Extend `ApprovalRequest` with the smallest safe mutation-intent projection, conceptually:

`mutation?: { intent: 'text_framing_change'; warning: string }`

Requirements:
- no file body;
- no patch body;
- no generic raw argument dump;
- stable typed intent;
- concise safe warning.

### 3. Workspace Autonomous boundary

Ordinary qualified workspace mutations stay automatic.

A model-requested framing change is exceptional and must still require explicit approval.

Task prompt/repository/plugin/model content cannot waive that approval.

### 4. Fair Phase 9 Gate A approval

Do not change the historical benchmark case or its expected tools.

Add a Phase-9 qualification-specific approval helper, preferably in the qualification layer, that for the frozen exact-edit workload:
- allows `write_file` on exactly the expected target when no exceptional framing-change intent is requested;
- allows `apply_patch` on exactly the expected target when no exceptional framing-change intent is requested;
- denies unrelated mutation targets;
- denies text-framing-change intent;
- allows only the exact expected George-owned validation process;
- denies everything else.

This helper should be executable regression-covered and reusable by the official Gate A harness.

## Locked non-goals

Do not:
- change Task Prompt v1;
- change text-framing classifier semantics;
- change low-level mutation byte behavior;
- silently normalize newlines;
- remove `allowTextFramingChange`;
- change SHA preconditions;
- change INSPECT behavior;
- modify stack execution;
- retune context/runtime/stage limits;
- change Bubblewrap/TUI;
- rewrite historical benchmark definitions/evidence;
- open Phase 10.

## Recommended stack

### P1 — mutation intent authority + fair qualification approval

Implement the application approval seam, Workspace Autonomous exception, bounded ApprovalRequest projection, fair Phase 9 Gate A approval helper, and permanent regressions.

### P2 — final gated Phase 9 live qualification

Run exactly one new Gate A. If Green, immediately run Gate B greenfield; if B Green, run Gate C existing-app.

### P3 — correction closeout

Evidence-only. If A/B/C are Green, record that Phase 9 is ready for separate owner closeout. Do not owner-close Phase 9 inside this correction.

## Gate A criteria

Unchanged:
- exact required 60-byte edit;
- George-owned V1 Green;
- completed/verified TaskState;
- hidden acceptance Green;
- zero human coding intervention;
- no task/stage/correction exhaustion;
- <=10 model-requested tool calls;
- <=10 logical provider rounds.

Also record:
- exceptional mutation-intent approval requests/decisions;
- whether `apply_patch` was permitted on the exact target;
- whether a framing-change request was denied;
- final bytes/SHA/framing.

## Prompt count

Three prompts including one final closeout.

Model routing:
- P1: `Sol High` because it changes an executable permission/approval boundary.
- P2/P3: `Sol Medium`.

All prompts:
- `Browser required: no.`;
- package remains exactly `0.9.10`;
- Phase 9 remains open until separate owner closeout;
- Phase 10 remains unopened.
