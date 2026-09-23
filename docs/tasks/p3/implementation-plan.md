# Phase 3 Implementation Plan — Coding Workflow

Status: READY FOR PROMPT DISTILLATION  
Baseline: package `0.3.0` at `831d371d21c4527a7f70beddc6afb6e704e2add3`

## Governing contracts

Implement against:
- `BOOT.md`;
- `AGENTS.md`;
- `docs/project-overview.md`;
- `docs/architecture.md`;
- `docs/workflow.md`;
- `docs/stability-contract.md`;
- `docs/roadmap/mvp-roadmap.md`;
- `docs/planning/p3-coding-workflow/decision-record.md`;
- `docs/tasks/p3/prompt-assessment.md`.

Preserve all owner-accepted Phase-1/2 evidence truth. Do not turn historical Evidence Gaps into Green without actually exercising them.

## Architectural target

By the end of Phase 3, the runtime shape should remain:

```text
OpenTUI
   |
application coding workflow / agent loop
   |
+-- context assembly + skills
+-- durable sessions
+-- coding evidence / completion
+-- approval + ToolRegistry
   |
provider / filesystem / process / read-only Git adapters
```

The existing `AgentLoopApplicationService` remains the canonical model/tool loop. New concerns should be introduced behind typed helpers/services rather than duplicating the loop.

## P1 — context source model, routing, and budget foundation

Target: `0.3.1`.

### Source model

Introduce a provider-independent context representation with stable source metadata.

The implementation should distinguish at least:
- George-owned invariant instructions;
- current user task/input;
- user-global instructions;
- user personality;
- workspace-native instructions;
- repository guidance;
- routing documents;
- explicitly selected routed project documents;
- conversation/tool material;
- later activated skill content.

Each source should retain enough metadata for diagnostics:
- stable identity;
- source/trust class;
- precedence/priority;
- active vs routed/selected role;
- path/origin when safe;
- estimated size;
- admitted/omitted/deferred/rejected state and reason.

Executable authority remains outside this model.

### Config roots and optional files

Use platform-aware user config discovery.

On Linux prefer `$XDG_CONFIG_HOME/george`, otherwise `~/.config/george`; use platform-appropriate equivalents where practical.

Support optional:
- user-global `instructions.md`;
- user `personality.md`;
- workspace `.george/instructions.md`.

Missing optional files are normal.

Do not make environment variables containing file bodies part of the model-facing contract.

Allow tests to inject config roots/budgets without mutating the developer's real home directory.

### Repository guidance and routing

Continue root `BOOT.md` / `AGENTS.md` compatibility.

Treat `BOOT.md` as routing guidance, not a reason to eagerly read every document it mentions.

Create a bounded deterministic route catalog from safe workspace-relative Markdown/path references found in the routing source. Only accept candidates that resolve beneath the canonical workspace and fit supported text-document rules.

Support an explicit selected-routes input to the assembler so tests/application callers can request full routed document bodies just in time.

A routed document body is absent unless selected.

No browser/network access.

### Duplicate behavior

Use stable identity and deterministic ordering.

Exact duplicate content may be suppressed when safe, but diagnostics must still preserve enough origin information to explain what happened.

Do not silently let one conflicting source overwrite another.

### Budgeting

Introduce a token-oriented provider-facing estimate.

Do not pretend an estimate is exact. Use a deterministic documented heuristic unless the active provider supplies a known exact tokenizer later.

Make budget limits injectable/configurable. A named default may be used, but it is a George harness budget rather than a claim about the model's maximum context window.

Whole critical instruction sources must either be admitted or fail explicitly. Do not truncate critical text and call it complete.

Lower-priority optional/routed material may be omitted/deferred with explicit diagnostics.

Keep byte bounds as safety limits on file reads, but do not confuse byte limits with the model-facing token budget.

### Tests

Add focused context tests for:
- source discovery/order/precedence metadata;
- missing optional sources;
- workspace path/symlink containment;
- route catalog extraction and selected-only body loading;
- duplicate handling;
- personality lowest/stylistic placement;
- exact-budget boundary behavior;
- oversized critical source explicit failure;
- optional/routed source omit/defer;
- deterministic estimated-token accounting;
- diagnostics do not contain unexpected full omitted bodies.

Do not replace the live application loop in P1.

## P2 — integrate assembled context into the canonical loop

Target: `0.3.2`.

### Application integration

Replace `loadRepositoryInstructions` + raw `instructions()` concatenation in `AgentLoopApplicationService` with the P1 context assembler.

The canonical provider request should still use normalized provider fields. Do not introduce LM Studio wire details into the core.

Keep current user input and prior transcript behavior semantically intact, but assemble them through the context contract so precedence/source diagnostics are explicit.

Allow the run submission or service API to carry explicitly selected routed document paths.

### Context diagnostics

Add normalized application/session evidence for context preparation.

Record only metadata needed for diagnostics, such as:
- source identities/classes;
- admitted/omitted/deferred state;
- estimated provider-facing tokens;
- selected routed paths;
- activated-skill identities later;
- budget result.

Do not emit/persist every source body as a diagnostics event.

Provider-reported input/output usage remains separate actual usage evidence when available.

If multiple provider rounds occur, maintain truthful request-size diagnostics as continuation/tool-result material changes. The implementation may emit one base assembly event plus bounded per-provider-request estimates or another deterministic equivalent.

### Permission isolation

Add explicit regression coverage that:
- repository instructions cannot change ToolRegistry permissions;
- personality cannot bypass approvals;
- selected routed docs cannot expand filesystem/process/network authority.

### Compatibility

Preserve all existing Phase-2:
- tool order;
- schema validation;
- approval behavior;
- cancellation;
- loop limits;
- provider continuation;
- TUI adapter boundary.

The old raw `instructionBytes` API may be removed/replaced if it no longer represents the product contract, but do not leave two competing context systems.

### Tests

Update application/integration fixtures to prove:
- provider request begins with George-owned invariants;
- user/workspace/global/personality order is deterministic;
- routed bodies are absent by default;
- explicitly selected routed body appears only for that run;
- context estimate/diagnostics are emitted;
- tool continuation still works unchanged;
- all Phase-2 deterministic loop tests remain Green.

## P3 — portable skill registry and turn-scoped activation

Target: `0.3.3`.

### Discovery sources

Add a provider-independent skill registry with deterministic discovery from:
- built-in George skill root;
- user-global George skill root;
- workspace `.george/skills/`.

Allow roots to be injected for tests.

No plugin package discovery yet.

### Portable format

Support `skills/<name>/SKILL.md`-style directories.

Read only the bounded metadata/frontmatter area during catalog discovery.

Support at least:
- stable name;
- description.

Support optional simple help/argument-hint metadata where present.

Unknown noncritical metadata is ignored safely.

Prefer a small dependency-free frontmatter parser for the required subset. Do not add a general YAML dependency unless a concrete compatibility requirement proves it necessary.

Malformed required metadata, missing body, invalid names, duplicate stable identities, path escape, and oversized metadata/body must fail or be skipped with explicit diagnostics according to the registry contract.

### Identity/collisions

Use qualified source identities such as:
- `builtin:<name>`;
- `user:<name>`;
- `workspace:<name>`.

Discovery order is deterministic.

Unqualified `<name>` resolves only when exactly one discovered skill owns that name. Cross-source ambiguity fails visibly; do not silently allow workspace/user content to replace another skill.

This remains compatible with later `plugin:<name>` identities.

### Lazy body activation

Catalog discovery must not load every full `SKILL.md`.

Load the body only when explicitly activated.

Integrate activated skill content with the P1/P2 context trust/precedence/budget machinery.

Activation is scoped to one submitted user turn and remains available across that turn's provider/tool rounds.

The next unrelated turn has no activated skill unless explicitly requested again.

Do not persist skill bodies as durable session metadata.

### Application API

Expose a presentation-independent way to:
- list compact skill metadata;
- resolve a qualified/unqualified name;
- submit one or more explicit activated skill identities for a turn.

Do not implement generalized semantic auto-selection.

Do not implement a generic plugin command framework.

### Tests

Cover:
- all three discovery sources;
- stable order;
- unique unqualified resolution;
- collisions;
- malformed metadata/body;
- oversized body;
- metadata-only catalog reads;
- full-body read only on activation;
- turn-scoped activation across multi-round tool use;
- no activation leakage into the next turn;
- skill budget exhaustion;
- skill text cannot raise permissions;
- at least one external portable `SKILL.md` fixture not authored in a George-specific format.

## P4 — durable filesystem sessions and safe resume

Target: `0.3.4`.

### Store boundary

Add a session-store interface independent from OpenTUI.

Implement the first store using local filesystem state outside the repository.

On Linux prefer `$XDG_STATE_HOME/george`, falling back to `~/.local/state/george`; use a platform-appropriate user-state equivalent elsewhere.

Tests inject a temporary state root.

### Durable layout

Use a schema-versioned layout with:
- session metadata including session ID, schema version, canonical workspace identity, creation/update state;
- append-friendly normalized durable event records;
- explicit completion/interruption state.

Repository-local session files are not the default.

Validate session IDs and paths so state lookup cannot escape the configured state root.

### Persistence semantics

Persist lifecycle evidence before advancing into side-effectful work where needed so an interruption can be distinguished from a completed action.

The application loop may need an async record/emit helper so durable append completes before the corresponding event is exposed/advanced.

Preserve the existing in-memory `Session` API where useful, but do not make in-memory arrays the durable authority.

### Durable event sanitization

Do not serialize arbitrary in-memory provider/tool payloads wholesale.

Create an explicit durable-record schema that stores the evidence required to reconstruct completed transcript/history and diagnose lifecycle state while avoiding known sensitive/unbounded sources.

At minimum:
- never persist unrestricted environment state;
- do not persist raw read-file bodies merely because a tool result contained them;
- do not persist raw write-file content merely because tool arguments contained it;
- avoid raw process output/arguments where they are not necessary for durable diagnosis;
- persist bounded safe summaries/identities/status instead.

User/assistant transcript persistence is required for resume; do not claim semantic secret detection for ordinary conversation text.

### Reconstruction

Opening a session:
- validates schema;
- validates canonical workspace match;
- reconstructs completed transcript/history deterministically;
- rejects malformed/unsupported state visibly;
- tolerates or reports a trailing partial append record safely rather than trusting it.

### Interrupted state

If durable evidence shows a turn began but did not reach a terminal turn state, mark it interrupted.

If a write/process/approval/provider continuation was in flight, do not replay it.

Resume always starts later work as a fresh turn from durable completed history.

A provider response ID is not sufficient recovery authority.

### Tests

Cover:
- new persistent session;
- reopen/reconstruct;
- workspace mismatch rejection;
- invalid session ID/path;
- unsupported schema;
- malformed/trailing partial record;
- transcript continuity;
- context/skill identity evidence;
- interrupted write/process/approval/provider continuation;
- no replay;
- no raw read/write content or unrestricted environment dump in durable files;
- no repository-local state artifacts.

## P5 — coding evidence, validation, and structured completion

Target: `0.3.5`.

### Baseline/final change evidence

At turn start, capture a read-only Git working-tree baseline when available.

Do not fail non-Git workspaces solely for lacking Git.

At turn end, capture final observable Git state when available.

Track direct successful `write_file` / `apply_patch` paths from George-native tool results.

Produce structured change evidence that distinguishes:
- pre-existing dirty paths;
- direct George-native mutation paths;
- newly observed dirty paths relative to baseline;
- final dirty paths;
- attribution uncertainty for arbitrary child-process effects.

If an arbitrary process changes a file, report observation without claiming precise causality unless directly evidenced.

No mutating Git operations.

### Validation tool

Add a model-facing `run_validation` tool with process permission and the same executable/argv/cwd/timeout shape as `run_process`.

It must delegate to the exact existing process execution implementation or a shared primitive extracted from it.

It must preserve:
- `shell: false`;
- sanitized environment;
- bounded stdout/stderr;
- timeout/cancellation;
- descendant cleanup;
- non-sandbox semantics;
- normal per-call process approval.

Do not create a second privileged executor.

### Validation evidence

Because validation has a distinct tool identity, record each attempt structurally:
- requested command identity;
- approval/denial/cancellation where applicable;
- cwd;
- terminal outcome;
- exit code/signal;
- bounded output evidence appropriate for in-memory/runtime display;
- durable sanitized representation from P4.

A failed validation remains failed even if later prose says the task succeeded.

Multiple validation attempts are retained in order.

### Completion result

Add a structured application/core completion record/event.

At minimum include:
- turn/session identity;
- final assistant response text;
- context-size/source diagnostics reference or summary;
- change evidence;
- validation attempts;
- unresolved failures/warnings/evidence gaps;
- terminal completion state.

The TUI is not the source of truth for this record.

### Tests

Cover:
- clean baseline + direct write;
- pre-existing dirty file preserved and identified;
- direct mutation of an already-dirty file;
- new process-caused dirty path classified as observed/uncertain rather than direct;
- non-Git workspace;
- `run_validation` approval required every time;
- validation uses same process environment/timeout/cancellation semantics;
- validation failure retained;
- completion object matches actual evidence;
- persistent sanitized completion state;
- no Git mutation.

## P6 — Phase-3 TUI/CLI usability

Target: `0.3.6`.

### Session startup/resume

Stop unconditionally constructing a fresh session inside `GeorgeTui`.

The application/bootstrap path creates or opens the session and passes it to the TUI.

Add a minimal CLI option:
- `--resume <session-id>`.

Keep the current optional positional workspace behavior.

A resumed session must match the canonical workspace.

Display enough session identity in the TUI status for a user to copy the ID and resume later.

Do not build a session browser/database UI.

### Skill presentation

Add presentation-only commands:
- `/skills` — render compact available skill name/description/source metadata without invoking the model;
- `/skill <name> <task>` — resolve and activate exactly that skill for the submitted user turn.

The TUI parser must call application/core registry APIs.

It must not read `SKILL.md` directly or decide collision/permission policy itself.

If the skill name is ambiguous/unknown or the task is missing, show a deterministic user-visible error and remain usable.

Do not implement generalized plugin commands.

### Context diagnostics

Render bounded context diagnostics from normalized application events/results:
- estimated token count labeled as estimated;
- active/omitted/deferred source counts or equivalent;
- selected/activated skill identity where relevant.

Do not dump all instruction bodies into the UI.

### Completion summary

Render a compact post-turn coding summary from structured completion evidence:
- observed/direct/pre-existing change counts or paths where bounded;
- validation outcomes;
- warnings/evidence gaps.

Keep the assistant narrative/transcript separate.

### Preserve existing TUI behavior

Regression-test:
- streamed transcript;
- multiline input;
- draft preservation;
- scrollback;
- resize;
- allow/deny approvals;
- Ctrl+C active cancellation and idle exit;
- terminal renderer cleanup.

No OpenTUI import may enter core/provider/application code.

## P7 — integrated Phase-3 qualification + bounded hardening

Target: `0.3.7`.

Qualify the exact P1-P6 candidate.

### Deterministic matrix

Run and record:
- exact phase-runner tests;
- core/config/context tests;
- context routing/budget tests;
- skill registry/activation tests;
- session persistence/resume tests;
- provider tests;
- ToolRegistry/read-only/mutation/process/validation tests;
- coding-workflow integration tests;
- TUI test-renderer tests;
- architecture-boundary tests;
- TypeScript typecheck;
- broad `npm run check`;
- `git diff --check`;
- explicit no-`package-lock.json` check.

### Required end-to-end fixture

Use a disposable Git repository with:
- at least one pre-existing dirty file;
- root routing/instruction material;
- an external portable `SKILL.md`;
- a deterministic scripted provider.

Drive one complete coding turn that:
1. assembles context under the documented precedence/budget contract;
2. explicitly activates the external skill;
3. reads/uses repository context as needed;
4. performs an approved write/patch;
5. runs at least one approved `run_validation`;
6. reaches a final assistant response;
7. emits structured change/validation/completion evidence;
8. persists the session.

Reopen the same persisted session and run a later unrelated turn.

Prove:
- completed transcript/history was reconstructed;
- pre-existing dirty work survived;
- changed-file classifications are truthful;
- the skill body is not active unless explicitly activated again;
- no interrupted side effect is replayed.

Add a separate interrupted-side-effect fixture covering incomplete write/process/approval/provider continuation evidence and safe non-replay resume.

### Live/native evidence

If a supported LM Studio/Qwen model is explicitly configured and reachable, run an opt-in bounded Phase-3 smoke that exercises context assembly plus at least a harmless read/validation cycle. Do not download a substitute model.

If a genuine TTY is available, exercise native startup/resume, `/skills`, one skill activation, approval interaction, cancellation, and terminal restoration where practical.

Unavailable live/native evidence is `Evidence Gap`.

### Hardening

Allow at most two substantial correction cycles.

Every correction adds a permanent executable regression detector at the lowest reliable layer and reruns focused then broad evidence.

Create `docs/tasks/p3/P7-qualification-evidence.md` for the exact final source/package/runtime.

## P8 — evidence-only Phase-3 closeout

Target: `0.3.8`.

Read the exact P7 source/evidence and audit:
- provider-independent context source/precedence/budget behavior;
- user-global/personality/workspace/repository routing behavior;
- estimated vs actual usage truth;
- skill discovery/collisions/lazy activation/turn scoping;
- durable state root/schema/workspace binding/sanitization;
- interrupted-turn non-replay resume;
- changed-file baseline/direct/observed attribution;
- validation process-boundary reuse;
- structured completion evidence;
- TUI skill/resume/context/completion surfaces;
- preservation of Phase-2 permissions/process/Git safeguards;
- deterministic integrated fixture;
- native/live evidence;
- exact phase-runner/no-package-lock invariants;
- deferred Phase-4/5 boundaries.

Do not repair implementation.

Write/update `docs/phase-3-closeout.md` and narrow task status only as needed.

Do not owner-close Phase 3 or advance `BOOT.md`/roadmap to Phase 4. Owner closeout is a separate decision.
