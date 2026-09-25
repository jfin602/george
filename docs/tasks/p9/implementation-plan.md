# Phase 9 Implementation Plan — Structured Task Execution + Workspace Autonomy

Status: CURRENT IMPLEMENTATION PLAN

Phase: 9  
Execution folder: `p9`  
Baseline package: `0.9.0`

Authority:
- `BOOT.md`;
- `AGENTS.md`;
- current product/architecture/workflow/stability/roadmap contracts;
- `docs/planning/p9-structured-task-execution/decision-record.md`;
- `docs/planning/p9-structured-task-execution/task-format-v1.md`;
- `docs/planning/p9-structured-task-execution/qualification-plan.md`;
- `docs/phase-8-owner-closeout.md`;
- `docs/tasks/c8-agentic-context/closeout.md`;
- `docs/tasks/p9/prompt-assessment.md`.

## Target architecture

```text
Task Prompt v1 text
       |
       v
src/tasks parser / validator
       |
       v
canonical TaskDefinition
       |
       v
application-owned TaskState
requirements / work units / validation / correction / stops
       |
       +---------------------> durable Session / LocalSessionStore
       |
       +---------------------> Task projection -> OpenTUI Task page
       |
       v
StructuredTaskApplicationService
       |
       +-- READ FIRST routing
       +-- INSPECT preflight
       +-- current work-unit selection
       +-- bounded task slice
       +-- stage-appropriate tool surface
       +-- validation / correction / resume
       |
       v
existing CodingWorkflow / AgentLoop
       |
       +-- context / provider / tools / approvals / recovery
       |
       v
Qwen / LM Studio
```

Workspace autonomy remains a separate application/core policy dimension:

```text
tool call
  |
  v
effective execution policy
  |
  +-- standard ----------------> existing approval behavior
  |
  +-- workspace autonomous
        |
        +-- workspace-native read/write -> qualified auto policy
        +-- outside reject -----------> deny
        +-- outside ask -------------> exact resource allow-once path
        +-- process -----------------> separate sandbox executor
                                      |
                                      +-- bwrap available/qualified -> contained run
                                      +-- unavailable/failure -> fail closed or host approval fallback
```

## P1 — Task Prompt v1 parser and domain model — 0.9.1

Create a dedicated `src/tasks/` provider/presentation-independent module.

### Domain

Represent:
- task format version;
- optional stack/version metadata;
- task title/kind/goal;
- READ FIRST entries;
- INSPECT entries;
- requirements;
- invariants;
- work units with covers/dependencies/completion text;
- validation entries;
- stop conditions;
- deliverables;
- non-goals;
- permission expectations;
- evidence expectations.

Use stable IDs and source ordering.

### Parser

Implement exact top-level section detection from the approved format.

Required:
- marker must be exactly version 1;
- exactly one required section;
- unknown sections reject;
- duplicate sections reject;
- duplicate IDs reject;
- invalid references reject;
- work-unit dependency cycles reject;
- invalid KIND reject;
- DISCOVER validation requires Scope;
- literal validation command rejects shell operators/expansion and parses to executable/argv without shell;
- malformed PERMISSIONS values reject;
- bounded prompt/section/entry sizes.

A prompt without the marker remains ordinary chat and is not parsed as structured.

P1 does not change TUI, agent execution, approval policy, persistence schema, or tool behavior.

## P2 — TaskState + durable persistence — 0.9.2

Add canonical application/core task state.

### State model

Track at minimum:
- task identity/definition fingerprint;
- overall task status;
- requirement status;
- work-unit status and active work unit;
- inspection evidence;
- validation attempts/history/current state;
- correction cycle count/history;
- blockers / Planning needed / cancellation;
- effective permission expectation snapshot;
- bounded recent task evidence projection.

Requirement state must distinguish addressed from validated.

Model text cannot directly set requirement/validation Green.

### State transitions

Use explicit deterministic functions/services.

Dependencies gate work readiness.

A work unit can become addressed only after its structured execution turn reaches a valid terminal state and required inspection evidence exists.

Validation evidence controls validated state.

A passing rerun never deletes prior failed attempts.

Default bounded correction count should be explicit/configurable; use 2 cycles unless the existing run-budget design provides a more appropriate lower-level bound.

### Persistence

Extend `Session` and `LocalSessionStore` to persist TaskState outside the target repository.

Bump the durable session schema deliberately.

Existing schema-v1 sessions must remain openable through an explicit migration/default-task-state path.

Unknown future schema still fails closed.

Task bodies/evidence are bounded/redacted under the existing durable-session discipline.

P2 does not execute structured tasks yet.

## P3 — Structured orchestration and bounded task slices — 0.9.3

Add `StructuredTaskApplicationService` in the application layer.

### Submission path

On text containing the Task Prompt v1 marker:
1. parse before provider/tool execution;
2. fail closed on invalid structure;
3. initialize/bind TaskState to the session/workspace;
4. resolve READ FIRST;
5. run INSPECT preflight when declared;
6. execute ready work units in dependency order;
7. run applicable validation;
8. stop on explicit terminal/block condition.

Ordinary chat without the marker continues through the existing path unchanged.

### READ FIRST

- REQUIRED missing/unreadable blocks before provider execution.
- OPTIONAL missing is evidence but not blocking.
- route sources through existing context routing; do not bypass Phase 3 precedence.

### INSPECT preflight

When INSPECT exists, run a bounded read-only inspection stage before mutating work.

Expose only local read/Git inspection tools.

Require observed inspection tool evidence before advancing.

Do not treat model narration as inspection evidence.

### Provider task slice

Generate a bounded derived slice from canonical TaskState.

Include only:
- current W objective/body/completion criteria;
- requirements covered by W;
- applicable invariants;
- active validation and stop conditions;
- relevant READ FIRST/inspection/recovery evidence;
- bounded current failure/correction evidence.

Exclude by default:
- completed unrelated work units;
- stale validations;
- unrelated requirements;
- full historical task ledger.

The slice is derived context, not canonical state.

Do not add a guessed token ceiling.

### Stage-appropriate tool exposure

Use deterministic stage policy, not a model classifier.

At minimum:
- inspection stage exposes read-only local inspection tools;
- implementation/correction does not expose unrelated external/browser/remote tools by default;
- validation is George-owned and not satisfied by model narration.

Preserve explicit user/task network/permission constraints.

### Validation

Literal validation command is already parsed to executable/argv and runs through existing process/approval/budget evidence.

Basic DISCOVER support may ask the model for an explicit executable/argv proposal tied to the validation Scope, but George validates and executes it through the same process boundary.

P3 establishes one-pass structured execution; bounded correction/reopen/stack hardening is P5.

## P4 — Phase 8 edit+validation replay and hardening — 0.9.4

Freeze an exact structured counterpart to the Phase 8 agentic edit fixture.

Use the same functional target and comparable normal local tool/runtime assumptions.

Run with pinned Qwen/LM Studio when available.

Record side-by-side historical versus structured:
- edit correctness;
- validation;
- tool names/calls;
- duplicate/redundant/unrequested calls;
- provider rounds/attempts/retries;
- context/profile/tokens;
- elapsed time;
- intervention;
- final task ledger.

If the structured run exposes a bounded defect in P1-P3 orchestration, fix the smallest cause, add a deterministic regression guard, and rerun once.

Do not tune LM Studio/context values or erase original Not Green evidence.

Create `docs/tasks/p9/P4-phase8-regression-evidence.md`.

## P5 — correction/revalidation, stacks, and resume — 0.9.5

Complete structured execution reliability.

### Correction

On required validation failure:
- preserve the failed attempt;
- create a correction state;
- send only the relevant failure + current work slice;
- allow repair through normal tools/policy;
- rerun affected validation;
- stop after the configured correction bound.

Correction exhaustion is truthful failure/blocked state.

### Stop outcomes

Recognize application-owned terminal outcomes:
- completed;
- failed;
- blocked;
- Planning needed;
- cancelled;
- budget exhausted.

Model text may propose `Planning needed`/blocked, but George records the transition and cannot let the model mark validations/requirements Green.

### Stacks

Use STACK/TASK numbering metadata to validate ordered task stacks where the runner/application loads more than one structured task.

Do not reinterpret historical Phase 1-8 prompt files.

### Resume

Reopen TaskState with canonical workspace/session identity.

Resume from incomplete safe work only after Phase 5 interruption reconciliation.

Never blindly replay an interrupted mutation/process/provider continuation.

Reconstruct active work/validation/correction state from durable evidence.

## P6 — Transcript / Task TUI — 0.9.6

Refactor OpenTUI presentation around two first-class views over the same application state.

### Persistent regions

Always visible:
- George header;
- current task/work unit/progress summary when structured task active;
- bounded model/context/access status;
- composer.

### Transcript

Primarily:
- user messages;
- committed assistant responses;
- bounded exceptional diagnostics/approval UI.

Routine work rows move out of Transcript for structured tasks.

### Task

Render:
- goal;
- current work unit;
- requirements/status;
- workflow/dependencies;
- validations and attempt history;
- blockers/corrections;
- recent work items;
- effective permission policy.

No raw file/write/patch/provider bodies.

### Navigation

Provide keyboard page switching and pointer/tab support where OpenTUI reliably supports it.

Preserve:
- drafts;
- selection/scroll independently per view where practical;
- approvals;
- cancellation;
- resize;
- thinking/activity;
- clean terminal restoration.

Task state remains application-owned.

Native qualification requires Node 26 + real TTY; otherwise record Evidence Gap.

## P7 — Workspace Autonomous filesystem/effective policy — 0.9.7

Introduce a typed effective execution policy.

### Modes

- standard: preserve current behavior;
- workspace autonomous: auto-permit qualified workspace-native operations.

Task PERMISSIONS are expectations and can only narrow configured user authority.

### Inside workspace

- local reads continue automatic;
- workspace write/patch may auto-run in autonomous mode;
- existing validation/recovery/Git precondition protections remain.

### Outside filesystem

Implement exactly:
- reject;
- ask.

Do not weaken `resolveWorkspacePath` or `resolveWorkspaceMutationPath`.

For an outside native filesystem intent:
- detect before normal workspace dispatch;
- canonicalize using a separate outside resolver/capability path;
- reject symlink/traversal ambiguity conservatively;
- on reject: deny without prompt;
- on ask: one resource/action-specific approval;
- allow once grants only the exact canonical file/root + operation;
- dispatch through a bounded outside executor;
- never convert the target into normal workspace authority.

Cover read/list/search and bounded write/patch semantics as justified by the existing native tools. Git tools remain workspace-scoped.

P7 must **not** auto-run host processes.

## P8 — Bubblewrap Workspace Autonomous process containment — 0.9.8

Use Sol Medium.

Implement a separate Linux sandbox process executor using `bwrap`.

### Capability detection

- Linux only initially.
- Detect usable `bwrap` without shell.
- Probe required namespace/mount support.
- expose availability as bounded capability/evidence.

### Boundary

Do not use the existing host process executor as the autonomous sandbox path.

The model may keep the same logical process tool name if registration is swapped by policy, but internal execution metadata/evidence must distinguish sandboxed workspace process from host process.

### Filesystem

Construct a minimal sandbox:
- canonical workspace RW at its canonical path;
- required system runtime directories RO;
- current Node installation/toolchain root RO when needed;
- isolated HOME/TMP;
- proc/dev only as required;
- no arbitrary user-home/sibling/tmp mounts;
- no `--ro-bind / /` security shortcut.

### Network

Autonomous sandbox network is denied by default with a separate network namespace.

Network may be available only when effective user policy explicitly authorizes it. A task declaration alone cannot grant network.

If network is `ask`, do not silently share host networking; require explicit policy/approval or fall back appropriately.

### Safety

Preserve:
- shell false semantics;
- bounded output;
- timeout/cancellation;
- descendant cleanup;
- sanitized environment;
- Git/user-work protection.

If sandbox setup is unavailable/fails:
- fail closed for autonomous process;
- or use the existing host-process path with its normal explicit approval;
- never relabel fallback as sandboxed.

### Qualification

Adversarial real-Linux tests when `bwrap` exists:
- workspace read/write succeeds;
- sibling/outside sentinel read fails;
- outside write fails;
- symlink/traversal escape fails;
- secrets are not inherited;
- Node/npm/test/typecheck/Git-read representative commands work;
- network deny is real;
- timeout/cancellation cleanup remains bounded.

If real `bwrap` cannot run, deterministic command-construction tests may pass but containment remains Evidence Gap.

## P9 — frozen live-work + integrated qualification — 0.9.9

Freeze versioned instruments:
- `greenfield-express-v1`;
- `existing-express-feature-v1`.

Provide reproducible fixture/task/hidden-acceptance runners that keep hidden tests outside model-visible workspace.

Record:
- exact George/model/runtime/context versions;
- task format/fixture/acceptance versions;
- functional hidden acceptance;
- required validation;
- human interventions;
- self-correction attempts;
- provider rounds/attempts/retries;
- tool calls/duplicates;
- context/profile/tokens;
- elapsed time;
- TaskState ledger;
- permission/sandbox events.

Run live when supported environment is available. Network/dependency install requirements must be explicit and separately authorized; unavailable prerequisites become Evidence Gap.

Also create integrated deterministic Phase 9 qualification covering parser/state/slicing/correction/persistence/TUI-policy/autonomy/sandbox interfaces and inherited Phase 2-8 regression floors.

Create `docs/tasks/p9/P9-qualification-evidence.md`.

## P10 — formal Phase 9 closeout — 0.9.10

Evidence-only.

Create `docs/phase-9-closeout.md`.

Audit:
- exact accepted candidate;
- Task Prompt/parser;
- canonical TaskState/persistence;
- bounded provider task slices;
- mandatory Phase 8 replay;
- correction/revalidation/resume;
- TUI;
- autonomous filesystem policy;
- process containment;
- live-work instruments;
- inherited contracts;
- all Not Green / Evidence Gap truth.

Do not repair implementation in closeout.

Do not owner-close Phase 9 or open Phase 10.

## Prompt grammar

Each P1-P10 prompt itself uses George Task Prompt v1 structure while retaining the repository phase-runner metadata required by `scripts/codex-phase-core.mjs`.

For Pn the assigned project version is `0.9.n`.

Exactly one P10 closeout prompt is final.
