# Phase 2 Implementation Plan

Status: CURRENT IMPLEMENTATION PLAN

Phase: 2 — Safe Tool Loop  
Execution folder: `p2`  
Baseline: main `30f6ff7e5dc10b701e2a153aed13b982f06c4368`, package `0.2.0`.

Read with `BOOT.md`, `docs/project-overview.md`, `docs/architecture.md`, `docs/workflow.md`, `docs/stability-contract.md`, `docs/roadmap/mvp-roadmap.md`, `docs/planning/p2-safe-tool-loop/decision-record.md`, and `docs/tasks/p2/prompt-assessment.md`.

## Target architecture

```text
OpenTUI adapter
      |
application agent service <---- approval port ----> presentation decision
      |
  George agent loop
  +-----+----------+----------+
  |     |          |          |
context tool registry policy   sessions/events
  |       |
provider  executors
  |       +-- read/search/git-read
LM Studio +-- write/patch
Responses  +-- process
```

P1 establishes the contracts. P2 proves the autonomous loop using only safe read-only tools. P3 and P4 add risky executors while keeping them unavailable to the live model path. P5 adds approvals and activates the complete Phase 2 tool surface. P6 qualifies the exact candidate. P7 performs evidence-only closeout.

## P1 — canonical tool registry + provider tool protocol

Target: `0.2.1`.

### Tool contracts

Create a George-owned canonical registry abstraction. Each registered tool exposes:
- stable name and description;
- JSON-compatible provider input schema;
- permission class (`read`, `write`, or `process` is sufficient for Phase 2);
- runtime argument parse/validation;
- executor;
- normalized success/failure result.

Migrate the existing Phase 1 read-only tools through this registry without weakening their bounds or workspace/Git guarantees. Compatibility exports may remain temporarily, but there must be one canonical dispatch path by the end of P1.

Provider-facing schemas and runtime validation must remain in parity. Unknown tools, invalid JSON, wrong types, missing required fields and unexpected fields fail before executor invocation.

### Provider evolution

Evolve George's provider request/result types so a caller can supply normalized tool definitions and continue from normalized tool outputs while preserving call IDs.

Extend the LM Studio Responses adapter to:
- serialize George custom tools into the OpenAI-compatible Responses tool shape;
- retain the response identifier required for stateful continuation;
- serialize normalized tool outputs back into the provider-specific continuation request;
- continue using streaming SSE and current cancellation/timeout/error normalization;
- keep all LM Studio/OpenAI field names inside the adapter.

Current text-only requests must remain valid so existing simple-response behavior does not regress.

### Tests

Add deterministic provider fixtures that assert exact custom-tool request shape, response/call identity, tool-output continuation shape, multiple tool definitions, malformed call behavior, and unchanged text streaming.

Add focused registry tests proving validation blocks execution and existing read-only executors preserve limits/workspace boundaries.

P1 does **not** implement the autonomous model/tool loop.

## P2 — autonomous read-only agent loop

Target: `0.2.2`.

Replace `OneTurnApplicationService` as the canonical runtime behavior with one reusable agent-loop application service. Do not leave two competing loop implementations. A narrow compatibility wrapper/export is acceptable only if it delegates to the canonical service.

### Loop behavior

For each user submission:
1. load George/repository instructions and current conversation state;
2. advertise only the active read-only registry tools;
3. stream one provider response;
4. collect tool calls from that completed provider response;
5. validate/dispatch calls sequentially in provider order;
6. record structured requested/started/completed/failed events;
7. return normalized outputs using the original call IDs;
8. continue provider execution;
9. finish only when a provider response completes without tool calls.

Unknown tools, malformed JSON and schema-invalid calls never execute. Represent them as bounded structured tool failures that can be returned to the model where the provider protocol allows recovery.

Add a configurable hard tool-loop ceiling with a safe default and deterministic exhaustion behavior. Every proposed call, including invalid/rejected calls, counts so malformed loops cannot bypass the guard.

Cancellation applies during provider streaming and tool execution. Provider errors remain normalized. Session/event history must make every intermediate call/result inspectable.

### Integration evidence

Add a real deterministic fixture-repository integration suite with a scripted provider able to return different responses per round. Establish a truthful `test:integration` command and include it in the broad deterministic aggregate command if appropriate.

Prove at minimum one read-file round to final answer, multiple rounds, multiple calls in order, invalid-call recovery, tool failure recovery, cancellation and loop-limit exhaustion.

Update the existing OpenTUI wiring only as needed to consume the canonical service/event stream; do not add approval UI yet.

Add an opt-in live LM Studio/Qwen read-only tool-cycle smoke command, excluded from ordinary deterministic tests, for later P6 evidence.

## P3 — workspace write/patch + Git safeguards

Target: `0.2.3`.

Implement George-native mutation without exposing it to the active model loop yet.

### Safe write path

Add a workspace mutation resolver that safely handles a not-yet-existing final file while requiring its existing parent chain to canonicalize beneath the workspace. Reject absolute paths, parent traversal, NUL, symlink-parent escape, directory targets and other ambiguous cases.

`write_file` semantics:
- create a new bounded text file under an existing safe parent;
- overwriting an existing file requires an exact current-content precondition such as SHA-256;
- stale/missing overwrite preconditions fail before mutation;
- use a sibling temporary file + rename or equivalent atomic replacement where practical;
- preserve relevant existing file mode when replacing;
- cancellation/failure must not leave a partial target or stray temp artifact.

`apply_patch` semantics:
- text-file only and workspace bounded;
- require an exact current-content precondition;
- use deterministic ordered exact-text edits (or an equivalently fail-closed representation) rather than invoking an external patch shell command;
- every expected old fragment must match unambiguously according to the chosen contract;
- validate all edits in memory before touching the target;
- write exactly once atomically after full validation;
- no partial application.

Bound content/edit counts and resulting file size.

### Git safeguard

Add read-only machine-readable Git working-tree snapshot support for mutating runs/targets. Non-Git workspaces remain supported.

Never reset, clean, checkout, stash or mutate Git. Expose enough metadata to mark whether a target was already dirty before George's mutation.

Register write/patch definitions with approval-required risk, but P3 must not advertise them through the live agent service until the P5 approval gate exists.

Tests cover new/existing writes, hash mismatch, patch ambiguity/mismatch, atomic failure, traversal/symlink-parent escape, bounded input, dirty-state detection and preservation.

## P4 — bounded arbitrary process executor

Target: `0.2.4`.

Implement `run_process` as an approval-required executor but keep it unavailable to the live agent loop until P5.

### Input and execution

Use explicit fields for executable, argv, optional relative workspace cwd and optional requested timeout. Bound strings/argument count/timeout. Do not accept model-provided arbitrary environment variables.

Use Node process APIs with `shell: false`. If a model later needs shell syntax it must explicitly request an approved shell executable and argv.

Stdin is closed/noninteractive by default. Capture bounded stdout/stderr, truncation flags, exit code and terminating signal.

### Environment

Build child environment from a small trusted allowlist of platform necessities (for example PATH plus justified home/temp/locale variables) and trusted George-side additions only. Do not spread unrestricted `process.env`.

Tests inject a sentinel secret-like environment variable and prove it is absent from the child while required ordinary path execution still works.

### Timeout, cancellation and descendants

Timeout/cancellation must stop the direct process and perform best-effort descendant-process cleanup on the supported platform. No process is intentionally unrefed/backgrounded.

Add deterministic fixtures that create a descendant and prove it does not silently survive the cleanup path where the test platform supports that assertion. Preserve truthful platform-specific evidence instead of pretending stronger cross-platform containment.

Explicitly preserve the architectural truth that approved arbitrary processes are **not** workspace/OS sandboxed.

## P5 — approval gate + full TUI integration

Target: `0.2.5`.

Introduce a presentation-independent approval interface and activate the complete Phase 2 registry through the canonical agent loop.

### Policy

Default policy:
- read-only workspace calls: allow automatically;
- `write_file` / `apply_patch`: ask;
- `run_process`: ask;
- destructive filesystem/outside-workspace/network-native actions: unavailable/denied.

Approval is allow-once or deny for the exact normalized call. No remembered grants.

Unknown/schema-invalid calls never generate approval requests because they never reach policy execution.

Denial should become a structured tool result and allow the model to continue when safe. Cancellation while waiting for approval cancels the run.

### TUI

OpenTUI renders approval state from application events and resolves the application approval port. It does not implement policy.

Display:
- tool name/risk;
- normalized target path or executable + argv + cwd;
- pre-existing dirty target marker for writes when known;
- a clear process warning that arbitrary commands are not sandboxed;
- allow-once/deny controls.

Preserve existing streamed transcript, draft input, multiline submit behavior, scrollback, resize, active Ctrl+C cancellation, idle exit and terminal cleanup.

Approve executes exactly one call. A repeated risky call requires another approval.

### Qualification tests

Use scripted approval fixtures for application integration and OpenTUI's test renderer for visible approval/decision behavior. Cover allow, deny, repeat-call reapproval, cancellation while pending, write dirty warning, process warning, tool lifecycle and draft preservation.

By the end of P5 the normal George TUI path must use the full approved Phase 2 agent loop.

## P6 — integrated Phase 2 qualification + hardening

Target: `0.2.6`.

Qualify the exact integrated candidate without broadening scope.

### Deterministic matrix

Run and record:
- exact phase-runner tests;
- core/config/session tests;
- provider/tool-protocol tests;
- registry/read-only tests;
- write/patch/Git-safeguard tests;
- process/environment/cleanup tests;
- autonomous agent-loop fixture integration;
- permission/approval integration;
- OpenTUI test-renderer coverage;
- architecture-boundary tests;
- TypeScript typecheck;
- broad deterministic aggregate command;
- `git diff --check`;
- explicit no-`package-lock.json` check.

Ensure the required negative cases from `docs/stability-contract.md` are represented by executable tests.

### Native/process evidence

Record exact Node/platform versions. Exercise real child timeout/cancellation/descendant cleanup behavior. If the environment provides a genuine usable TTY, exercise real approval allow/deny/cancel plus terminal restoration/resize where practical; otherwise record that portion as Evidence Gap.

### Live model evidence

If the supported LM Studio endpoint is reachable and an explicit model ID is configured, run the opt-in live tool-cycle smoke against the exact candidate. Record endpoint/model/runtime and bounded success/failure/timing/usage evidence without dumping repository context or secrets.

If unavailable, record Evidence Gap. Do not download a substitute model or alter architecture merely to manufacture evidence.

### Hardening bound

Allow at most two substantial correction cycles for defects discovered by qualification. Rerun focused affected evidence first, then the broad deterministic matrix.

Write `docs/tasks/p2/P6-qualification-evidence.md` for the exact final source baseline with per-layer Green / Not Green / Evidence Gap truth.

## P7 — evidence-only Phase 2 closeout

Target: `0.2.7`.

Read exact P6 source/evidence and audit:
- provider tool schema/result continuation;
- canonical registry/validation;
- read-only autonomous loop and loop guard;
- write/patch containment and atomicity;
- process execution/env/cleanup and non-sandbox truth;
- permission/approval separation;
- Git dirty-state preservation;
- TUI integration and cancellation;
- deterministic fixture coverage;
- native terminal/live LM Studio evidence;
- exact runner/no-package-lock invariants;
- deferred Phase 3/4 boundaries.

Do not repair implementation, add features or advance the roadmap to Phase 3.

Write/update `docs/phase-2-closeout.md` and narrow Phase-2 task/router status only as needed to preserve evidence truth. Owner closeout/Phase-3 transition remains a separate decision.

## Phase boundaries

Phase 2 does not implement destructive delete/rm tools, remembered approvals, OS/container sandboxing, general mutating Git, comprehensive changed-file/final summaries, validation-command orchestration, context budgeting/compaction, durable resume, long-run retry/backoff, browser/web/network tools, GitHub/MCP/Parallel adapters, daemon/Tauri work, or multi-agent scheduling.
