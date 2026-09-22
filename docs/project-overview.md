# George Project Overview

Status: INITIAL PRODUCT CONTRACT

## Product definition

George is a local-first coding agent harness that lets a locally running language model perform useful repository-aware software development work through a controlled set of developer tools.

The initial model is Qwen3-Coder served by LM Studio. George is not coupled to Qwen or LM Studio: inference is a provider boundary and future local or remote providers may be added without rewriting the agent loop.

George exists because a capable local model is most useful when paired with a strong harness: project instructions, context assembly, tool schemas, filesystem and Git access, command execution, patching, validation, recovery, and eventually optional web/browser/network tools.

## Locked product laws

### Local-first

The normal MVP path runs on the developer's machine. Repository contents, prompts, tool results, and model inference stay local unless the user explicitly invokes a network-backed tool/provider.

### Codex-style TUI first, UI-independent core

The MVP interface is an interactive terminal application that behaves like a modern coding-agent TUI rather than a print-and-scroll command.

It must support in-place redraws, streaming assistant output, live tool/progress state, persistent interactive input, scrollback, resize handling, cancellation, and clean terminal restoration.

The initial renderer is `@opentui/core` used directly from TypeScript without React. OpenTUI is a presentation dependency only: the core agent engine must remain usable without it, must not depend on terminal state, and must be reusable by a future daemon or Tauri desktop application.

### Provider independence

The agent loop talks to a typed model-provider interface. LM Studio's OpenAI-compatible Responses API is the first implementation. Provider-specific translation, model quirks, stateful-response identifiers, and capability discovery remain inside provider code.

George's normalized session/tool history remains authoritative. Provider-native continuation state may optimize transport but must not become the only copy of tool-loop history George needs to diagnose a run.

### Token-conscious context

Model context is a scarce resource, especially for local models. George must not treat every discovered instruction or project document as permanent prompt content.

Enforce in code what can be enforced in code. Permission ceilings, workspace boundaries, tool validation, destructive-action policy, and other harness invariants belong in executable policy rather than relying on repeated prompt text where practical.

Keep always-on model instructions compact. User personality, project instructions, current task context, conversation history, tool schemas/results, and retrievable project knowledge are distinct inputs with different lifetimes and budgets. Rich human-readable instruction files may be larger than the compact active instruction set sent to the model.

Project documentation should be routed or retrieved when relevant instead of being blindly concatenated into every model turn. George should measure prompt/context growth and make instruction/context budgeting explicit before long autonomous workflows depend on it.

### Real developer tools

George's mature tool surface includes file discovery/reading, bounded writes/patching, text search, shell/process execution, Git operations, and validation commands.

Phase 1 intentionally implements only the read-only foundation: file read/list, text search, and Git status/diff.

Phase 2 owns the first safe autonomous tool loop: tool-schema advertisement, call validation, policy/approval, read/write/process execution, structured tool results, and repeated model -> tool -> result -> model cycling.

Later optional tools may include Chrome DevTools, Parallel Search, GitHub, and MCP.

### Extensible without delegated authority

George supports portable skills, lifecycle hooks, commands, and plugin packages so new development workflows and integrations can be added without rewriting the agent core.

Skills contribute declarative instructions/workflows. Hooks react to George-owned lifecycle events. Plugins package extension contributions. Executable plugin tools must register through George's canonical typed tool boundary.

Extension discovery or installation does not delegate George's authority. Repository/workspace extension content remains untrusted relative to George policy, and no skill, hook, plugin manifest, compatibility adapter, or model instruction may raise filesystem, process, network, secret-access, or approval permissions by instruction alone.

Skill discovery must remain token-conscious: compact metadata may be indexed broadly, while full skill bodies are loaded only when activated or selected rather than being permanently injected into every model request.

### Explicit permissions

Tool execution is governed by George, not by arbitrary model text. George must distinguish read-only actions from writes, process execution, destructive actions, network actions, and actions outside the active workspace. Permission policy is configurable and visible.

Repository instructions and model output cannot grant themselves additional permissions.

Phase 2's minimum approval experience is per-call allow-once or deny for workspace writes/patches and arbitrary process execution. Read-only workspace tools may run without prompting. Outside-workspace native filesystem access and destructive filesystem actions remain denied/deferred.

### Process execution is not an OS sandbox

George may constrain a process tool's working directory, arguments, runtime, output, and inherited environment, but an approved arbitrary child process still runs with the operating-system privileges of George's host user unless a future sandbox explicitly changes that.

The product must not claim that `cwd` containment alone prevents an approved process from accessing files, processes, or networks available to that user.

### Recoverable agent loop

A failed tool call, malformed model response, timeout, cancellation, permission denial, or provider error must not corrupt the session or leave child processes silently running. Structured session/event history must make failures diagnosable.

Recoverable tool failures should be representable to the model as structured results so it can adjust rather than forcing the entire turn to fail.

### Small dependency surface

Prefer Node standard library and focused dependencies. OpenTUI is an approved Phase 1 presentation dependency. Do not introduce React, a database, browser runtime, queue, container runtime, or distributed system before a current requirement needs it.

### Networking-ready, not networking-first

Core APIs should permit a later daemon/server transport so another local UI or trusted device can drive George. Phase 2 does not expose George to the LAN or Internet and does not add network-capable tools.

### Native desktop later

If a GUI becomes justified, Tauri is the preferred direction: a lightweight native shell over George's reusable core/daemon interfaces. Electron is not the default.

## Phase 1 success condition

Phase 1 proved a reliable Codex-style local terminal foundation where George can open a repository, load its instructions, stream one bounded model turn through local Qwen/LM Studio, visibly present agent/read-only-tool activity, and expose independently testable read-only tool infrastructure without embedding agent logic in the TUI.

Phase 1 intentionally stopped before autonomous tool execution.

## Phase 2 success condition

Phase 2 succeeds when George can safely complete deterministic multi-step tool loops against fixture repositories:

- advertise typed tool schemas to the provider;
- receive and validate model-proposed tool calls;
- enforce workspace and permission policy before execution;
- run read-only tools automatically;
- request visible allow-once/deny approval for writes/patches and arbitrary processes;
- execute bounded workspace writes/patches and bounded process commands;
- return structured tool results to the model and continue until a final answer;
- stop safely on cancellation, timeout, permission denial, unrecoverable failure, or hard loop-limit exhaustion;
- preserve pre-existing Git working-tree changes;
- avoid unrestricted environment-secret inheritance and orphaned child processes;
- prove the behavior with deterministic fixture/provider tests plus clearly separated live evidence where available.

Phase 2 does not yet own context compaction, durable resume, comprehensive changed-file summaries, validation-command orchestration, browser/network tools, a daemon, desktop UI, or multi-agent scheduling.

## Phase 3 success condition

Phase 3 succeeds when George can complete a bounded coding task in a disposable repository through one provider-independent workflow that:

- assembles compact model context from George-owned instructions, current user intent, user-global/personality input, workspace instructions, routed project guidance, conversation state, and activated skills under explicit precedence and context budgets;
- exposes observable provider-facing context size and does not silently present truncated critical instructions as complete;
- discovers portable skills cheaply, loads a selected skill body just in time, and prevents declarative extension content from expanding executable authority;
- tracks a pre-run repository baseline and reports observed changed files without claiming unsupported attribution for arbitrary process side effects;
- runs requested validation through George's existing process/tool/approval boundary and records the resulting evidence;
- persists normalized session history outside the repository and can resume from completed durable history without automatically replaying interrupted writes, processes, approvals, or provider continuations;
- emits a structured completion result covering observed changes, validation, unresolved failures/warnings, and the final assistant response;
- proves the workflow with deterministic fixture coverage, including pre-existing dirty work and at least one portable external-skill fixture.

Phase 3 does not add LLM-based compaction, automatic semantic skill routing, executable hooks, plugin packaging, browser/network adapters, daemon mode, or multi-agent scheduling.
