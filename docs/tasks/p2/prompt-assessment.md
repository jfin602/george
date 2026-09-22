# Phase 2 Prompt Assessment

Status: CURRENT IMPLEMENTATION ASSESSMENT

Phase: 2 — Safe Tool Loop  
Execution folder: `p2`  
Assessment baseline: main `30f6ff7e5dc10b701e2a153aed13b982f06c4368`, package `0.2.0`.

## Assessment conclusion

Proceed as one Phase 2 with **six implementation prompts plus one evidence-only closeout**.

The safest order is to establish the canonical tool/provider contracts before any autonomous execution, prove the loop first with read-only tools, implement mutation and process executors while they remain unavailable to the live loop, then add approval/TUI integration, integrated qualification, and closeout.

All Phase 2 prompts are `Browser required: no.`. The ordinary phase runner can execute the complete stack; native-TTY and live-LM-Studio evidence are conditional runtime evidence rather than browser handoffs.

## Current-source findings

- `package.json` is `0.2.0`, Node >=26.4.0 <27, TypeScript + ESM, with `@opentui/core` as the only production dependency.
- `ModelProvider.stream()` currently accepts only George instructions plus a string input. It has no normalized tool-definition or tool-result continuation input.
- the LM Studio adapter can normalize `provider.tool.call` and captures a response ID from `response.created`, but it does not advertise custom tool schemas or submit tool outputs/continuations.
- `OneTurnApplicationService` intentionally performs one provider request, emits `tool.deferred`, and stops; Phase 2 must replace this as the canonical behavior rather than layering a second competing agent loop beside it.
- the current session records user/assistant text plus application events; tool/approval lifecycle evidence is not yet represented.
- `src/tools/read-only.ts` provides bounded file/list/search and fixed Git status/diff behavior, but its definitions are names/descriptions rather than the Phase 2 canonical schema/risk/executor registry.
- current workspace path resolution safely handles existing paths and rejects traversal/symlink escapes; new-file mutation needs a separate fail-closed parent-resolution path.
- current read-only Git subprocess handling has bounded output/time and cancellation but only kills the direct child; arbitrary process execution needs a stronger process-tree cleanup contract.
- the OpenTUI adapter already consumes application events, preserves draft input during streaming, supports resize/scrollback, and maps Ctrl+C to active cancellation then idle exit.
- deterministic provider, tool, application, TUI, architecture, and runner tests already exist and form the regression baseline.
- Phase 1 native-terminal and live LM Studio/Qwen evidence remain accepted Evidence Gaps; Phase 2 must not rewrite that history.

## Prompt decomposition

### P1 / 0.2.1 — canonical tool registry + provider tool protocol

Introduce the George-owned typed tool registry, runtime call validation, normalized tool-result/continuation contracts, migrate Phase 1 read-only tools through the registry, and evolve the LM Studio Responses adapter so it can advertise custom tools and continue from tool outputs. Do not execute an autonomous loop yet.

### P2 / 0.2.2 — autonomous read-only agent loop

Replace the one-request/deferred-call behavior with George's canonical bounded agent loop using only read-only tools. Prove multi-round continuation, ordered calls, structured tool lifecycle, invalid-call recovery, cancellation, and hard loop limits with deterministic fixture repositories/providers. Add an opt-in live read-only tool-cycle smoke path.

### P3 / 0.2.3 — workspace write/patch + Git safeguards

Implement bounded `write_file` and fail-closed `apply_patch` primitives, safe new-path resolution, content preconditions, atomic application, and Git dirty-state capture/preservation. Register them as approval-required capabilities but do not expose them to the active model loop until P5.

### P4 / 0.2.4 — bounded arbitrary process executor

Implement approval-required `run_process` with explicit executable/argv, workspace cwd, no implicit shell, closed stdin, bounded output, timeout/cancellation, sanitized environment, exit/signal evidence, and best-effort descendant cleanup. Keep it unavailable to the active model loop until P5.

### P5 / 0.2.5 — approval gate + full TUI integration

Add the presentation-independent approval port/policy, wire write/patch/process tools into the real agent loop, and extend OpenTUI with allow-once/deny interaction and complete tool lifecycle presentation. Preserve draft/resize/cancellation and make process trust limits and pre-existing dirty-file warnings visible.

### P6 / 0.2.6 — integrated Phase 2 qualification + hardening

Exercise the exact full candidate across deterministic provider/tool/process/approval/TUI/fixture-repository layers, native terminal where available, and a bounded live LM Studio/Qwen tool cycle when configured. Record evidence and permit at most two bounded evidence-driven corrections.

### P7 / 0.2.7 — evidence-only Phase 2 closeout

Audit P1-P6 against the locked contracts and durable qualification evidence, record Implementation Complete / Stability Qualified truth, and preserve every Not Green or Evidence Gap without implementing Phase 3.

## Key planning decisions

### Tool registry and validation

Use one canonical George-owned tool definition containing stable name, description, provider-facing JSON-compatible input schema, permission class, executor, and normalized result/error contract.

The provider-facing schema and runtime validator must not silently drift. Prefer a small dependency-free validation layer sufficient for George's declared schemas; if a focused dependency is materially justified, keep it isolated and preserve the no-package-lock contract.

Unknown tools, malformed JSON, and schema-invalid arguments never reach an executor. They count toward the loop guard and may be returned to the model as structured failed tool results.

### Provider continuation

Keep LM Studio/OpenAI wire details inside `src/provider`. George's normalized provider contract must support available tool definitions, call identity, response identity needed for continuation, and normalized tool outputs.

The LM Studio adapter may use Responses stateful continuation such as the prior response ID internally. George's own event/session history remains authoritative rather than depending solely on provider state.

### Agent-loop termination and ordering

Collect tool calls from one completed provider response, then execute them sequentially in model order. Continue with their structured results. Finish when a provider response completes with no tool calls.

Use a configurable positive hard ceiling on total tool calls/rounds with a conservative default. Exhaustion is a structured turn failure. Phase 4 still owns richer budgets/retries.

### Write and patch contract

`write_file` may create a file only beneath an existing canonical workspace directory. Overwriting an existing file requires an exact content precondition such as SHA-256 so stale model state cannot blindly replace bytes.

`apply_patch` should use a deterministic exact-text edit contract rather than a permissive shell patch command: require the current file precondition, apply all requested edits in memory, fail if any expected text is absent/ambiguous, and commit the result atomically only after every edit validates.

No delete/rm tool or implicit directory-tree creation is required in Phase 2.

### Git safeguards

Capture machine-readable dirty state before mutating execution when the workspace is a Git repository. Do not reset, clean, checkout, stash, or add general mutating Git commands.

Already-dirty targets remain writable only through an explicit approved mutation with matching content preconditions; the approval request must surface the pre-existing-dirty condition when known.

### Process contract

`run_process` accepts executable, argument vector, optional relative workspace cwd, and bounded requested timeout. Model input does not supply arbitrary environment variables.

Use `shell: false`; shell semantics require an explicitly proposed shell executable. Stdin is closed/noninteractive. Capture bounded stdout/stderr plus exit code/signal.

Inherit a small trusted environment sufficient for ordinary development execution, including path/locale/temp/home-style platform necessities as justified, while excluding arbitrary secrets such as token/key variables. Trusted George configuration may later add explicit variables; repository/model arguments cannot.

Cancellation/timeout must perform best-effort process-tree termination and tests must prove a spawned descendant does not silently survive on the supported test platform. No child may be intentionally unrefed/backgrounded.

A bounded cwd is not an OS sandbox; approved arbitrary processes still have host-user privileges.

### Approval boundary

Read-only workspace calls auto-allow. Write/patch/process calls require a presentation-independent allow-once/deny decision. No remembered grants in Phase 2.

Denial becomes a structured tool result when safe so the model can adapt. Cancellation while approval is pending cancels the run.

### TUI boundary

The TUI renders application events and returns approval decisions; it does not own policy or agent-loop business logic.

Approval presentation must show normalized action details. Process approvals explicitly state that the process is not sandboxed. Write/patch approvals show the target path and pre-existing dirty marker when available.

### Test-command truth

Introduce an explicit deterministic integration command for fixture-repository agent-loop coverage instead of relabeling the existing unit-only `npm test`. The broad deterministic `check` may be expanded to include the new integration layer, but `test:runner` remains explicitly separate unless its script is actually included.

Live LM Studio and real native-TTY checks remain opt-in/conditional evidence and never become ordinary deterministic tests.

## Model selection

- P1: **Terra High**
- P2: **Terra High**
- P3: **Terra High**
- P4: **Terra High**
- P5: **Terra High**
- P6: **Terra High**
- P7: **Terra Medium**

## Four stability questions

### 1. User-visible / aggregate quantities at risk

Tool ordering, number of provider turns, loop latency, process runtime/output, write sizes, patch atomicity, Git dirty-state preservation, approval latency, cancellation latency, TUI responsiveness/draft preservation, event/session growth, and local-model context/tool-schema size.

### 2. Invariants

Core remains presentation-independent; LM Studio wire details remain provider-local; repository/model text cannot widen permissions; native filesystem paths stay inside the workspace; read-only behavior remains read-only; writes fail closed on stale context; user Git changes are never silently discarded; processes use explicit argv and sanitized environment; arbitrary process approval is not mislabeled sandboxing; deterministic tests need no LM Studio; exact runner/no-package-lock contracts remain unchanged.

### 3. Integrated-only evidence

Real LM Studio/Qwen custom-tool behavior, actual tool-result continuation, native OpenTUI approval interaction/restoration, operating-system descendant cleanup behavior, and the complete model -> approval -> process/write -> model experience cannot be fully established by isolated unit tests.

### 4. Comparison baseline

The exact baseline is main `30f6ff7e5dc10b701e2a153aed13b982f06c4368`, package `0.2.0`, with Phase 1 owner-closed. Preserve its deterministic provider/read-only/TUI behavior except where Phase 2 explicitly replaces the one-turn/deferred-tool boundary.
