# Phase 2 Decision Record — Safe Tool Loop

Status: APPROVED DIRECTION

Baseline: package `0.2.0`  
Current roadmap gate: Phase 2 — Safe Tool Loop

## Problem

Phase 1 deliberately proved one bounded provider turn and independently executable read-only tools while deferring model-proposed tool calls.

The current implementation can normalize an LM Studio function-call event, but the provider/core request contract does not yet advertise tool schemas, submit tool results, or continue a model -> tool -> result -> model cycle.

Phase 2 must introduce George's first real autonomous tool loop without weakening the Phase 1 architecture, silently broadening trust, or pulling Phase 3/4 workflow/reliability scope forward.

## Decisions

### George owns the loop

George owns the canonical loop and terminal conditions.

The provider streams normalized model output and translates provider-specific tool protocol. The model proposes tool calls. George validates, authorizes, dispatches, records results, and decides whether another model turn occurs.

Provider-native continuation identifiers may be used by an adapter, but George's normalized session/tool events remain authoritative enough to diagnose a run.

### Canonical typed tool registry

Every executable tool is registered with:
- stable name;
- description;
- JSON-compatible input schema;
- permission/risk class;
- executor;
- normalized result/error contract.

Phase 1 read-only tools migrate through this registry rather than creating a second architecture.

Before any executor runs, George must:
1. resolve a known tool;
2. parse model arguments as JSON;
3. validate arguments against the tool schema;
4. apply permission policy;
5. execute only when allowed/approved.

Unknown, malformed, or schema-invalid calls never reach the executor.

### Sequential execution

Phase 2 executes model-proposed calls sequentially in model order.

Parallel dispatch is deferred. Deterministic ordering is preferred while writes, process execution, approvals, cancellation, and result continuation are first established.

### Structured tool lifecycle

The event model must represent enough lifecycle detail for the TUI and later persistence to diagnose a loop.

The exact type names may follow source conventions, but behavior must distinguish:
- tool requested;
- approval requested;
- approval allowed/denied;
- tool started;
- tool completed;
- tool failed;
- loop terminal state.

Recoverable tool errors and denials should be returned to the model as structured results when doing so is safe and meaningful, allowing the model to adjust rather than forcing every tool error into a fatal turn failure.

### Minimal hard loop guard

Phase 2 adds a simple configurable hard ceiling on tool rounds/calls.

This prevents infinite model/tool cycling. It is not the full budgeting subsystem planned for Phase 4.

Exhaustion is a structured terminal failure.

### Permission classes

Minimum Phase 2 defaults:
- read-only workspace tools: allow;
- workspace write/patch: ask;
- arbitrary process execution: ask;
- destructive filesystem operations: deny/defer;
- outside-workspace native filesystem access: deny;
- network-native tools: unavailable.

The Phase 2 approval scope is allow-once or deny per call.

Repository instructions, workspace files, and model output cannot grant additional permission or raise George's configured permission ceiling.

Remembered grants/policy profiles are deferred.

### TUI approval boundary

Approval policy does not live in OpenTUI.

The application/core emits an approval request and awaits a decision through a presentation-independent interface. OpenTUI renders the request and returns allow-once or deny.

The approval view should expose enough information for a meaningful choice, including the tool/risk class and normalized affected path or executable/arguments/cwd.

Ctrl+C must cancel an active approval wait through the same run cancellation semantics used elsewhere.

### Workspace-native mutation

Phase 2 requires bounded workspace-native write/patch capability, not a general unrestricted filesystem API.

Native mutation must:
- accept relative workspace paths;
- reject traversal and symlink escapes;
- safely resolve/revalidate parent directories for new paths;
- bound input size;
- prefer atomic replacement where practical;
- fail closed when patch/precondition context is stale or missing;
- avoid silent partial patch application;
- leave inspectable structured failure evidence.

General destructive delete/rm tooling is deferred.

### Process execution

The process tool uses explicit executable plus argument vectors through process APIs.

Defaults/requirements:
- `shell: false`;
- workspace-bounded `cwd`;
- closed/noninteractive stdin unless a later approved feature changes it;
- bounded stdout/stderr;
- explicit exit code/signal;
- timeout;
- cancellation;
- best-effort descendant-process cleanup;
- no intentionally detached/background child;
- sanitized inherited environment rather than unrestricted `process.env`.

If shell semantics are genuinely needed, the model may propose an explicit shell executable as the process. George does not silently build interpolated shell strings.

### Process execution is not sandboxing

A workspace-bounded `cwd` is not an OS security sandbox.

Once an arbitrary process is explicitly approved, it runs with the operating-system permissions of the George host user unless a future sandbox layer says otherwise. Such a process may access files, processes, or networks that user can access.

George must keep this trust distinction explicit in architecture, permissions, tests, and user presentation.

OS/container sandboxing is deferred.

### Environment/secrets

Arbitrary tool-triggered processes must not automatically receive unrestricted George environment state.

Phase 2 process execution starts from a sanitized inherited environment sufficient for ordinary development execution. Additional sensitive variables require explicit configuration/policy rather than becoming implicitly model-readable.

Tool/session events must not persist unrestricted environment dumps or secrets.

### Git dirty-state preservation

At mutating-run start, capture machine-readable Git working-tree state when the workspace is a Git repository.

Phase 2 must not reset, clean, stash, checkout, or otherwise discard pre-existing work.

General mutating Git tooling is not part of Phase 2.

When detectable, approval for a write targeting an already-dirty file should make that condition visible. Write/patch preconditions should prevent blind replacement based on stale model context.

Tests must prove original dirty work survives relevant success, denial, failure, timeout, and cancellation paths.

Comprehensive changed-file accounting and completion summaries remain Phase 3.

### Provider evolution

The provider abstraction must evolve around George's needs rather than exposing LM Studio protocol throughout the core.

Phase 2 provider capability includes:
- accepting George's normalized available tool definitions;
- emitting normalized tool calls;
- accepting normalized tool results/continuation input;
- preserving call identity required by the provider protocol;
- normalizing provider failures/cancellation/timeouts.

LM Studio-specific Responses wire shapes remain in the LM Studio adapter.

### Phase boundary

Phase 2 does not include:
- browser/web/network tools;
- Parallel Search, GitHub, or MCP;
- delete/rm-style destructive filesystem tools;
- remembered approval profiles;
- OS/container sandboxing;
- general mutating Git;
- context budgeting/compaction;
- validation-command orchestration;
- comprehensive changed-file/final summaries;
- durable session resume;
- retry/backoff policy for long jobs;
- daemon/Tauri work;
- multi-agent scheduling.

## Qualification direction

Deterministic fixture/provider coverage must prove at minimum:
- one read tool round continuing to a final answer;
- multiple ordered tool rounds;
- unknown tool rejection;
- malformed JSON rejection;
- schema-invalid argument rejection;
- approval allow-once;
- approval denial;
- workspace write success;
- traversal rejection;
- symlink escape rejection;
- patch/precondition failure;
- pre-existing dirty Git preservation;
- process stdout/stderr/exit-code capture;
- process timeout;
- process cancellation;
- descendant cleanup behavior;
- output bounds;
- sanitized environment behavior;
- recoverable tool failure returned to the model;
- hard loop-limit exhaustion;
- cancellation while waiting for approval;
- provider request tool-schema and tool-result continuation behavior.

When the supported local setup is available, Phase 2 should separately attempt one bounded live LM Studio/Qwen tool cycle. Native TUI approval/tool behavior should likewise be qualified in a genuine terminal when available.

Unavailable live/native evidence is recorded as Evidence Gap, never silently promoted to Green.
