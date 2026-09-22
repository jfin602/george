# George Architecture

Status: INITIAL ARCHITECTURE CONTRACT

## Shape

```text
OpenTUI / future Tauri / future network client
                 |
          application service
                 |
             agent core
      +----------+-----------+
      |          |           |
   context     tools      sessions
      |          |           |
 provider     executors    storage
      |
 LM Studio Responses API
      |
 Qwen3-Coder
```

## Agent core

Owns the turn loop: assemble input, request/stream a provider response, collect assistant output, validate tool calls, route them through policy/approval, dispatch permitted tools, append structured tool results, and continue until completion, cancellation, hard loop-limit exhaustion, or error.

The model proposes actions. George decides whether those actions are known, valid, permitted, and executable.

The core does not know terminal rendering, OpenTUI widgets, Tauri windows, HTTP routes, or LM Studio-specific wire details.

### Phase 2 loop contract

The first autonomous loop follows this lifecycle:

1. assemble normalized conversation/instructions and George's available tool schemas;
2. stream one provider response;
3. collect ordered tool calls;
4. reject unknown tools, malformed JSON, or schema-invalid arguments before execution;
5. evaluate each call against George policy;
6. request approval when required;
7. execute approved calls sequentially in model order;
8. append normalized tool request/result/error events;
9. send the tool results back through the provider boundary;
10. continue until the provider produces a final response or George reaches a terminal condition.

Phase 2 uses a simple configurable hard ceiling on tool rounds/calls to prevent infinite loops. Rich budgets, retries, compaction, and long-run recovery remain later-phase concerns.

Tool execution is sequential in Phase 2. Parallel tool execution is deferred until ordering semantics and real need justify it.

## TUI adapter

The initial user interface uses `@opentui/core` directly from TypeScript, without React.

It should provide a Codex-style terminal experience:
- owned screen regions and in-place redraw;
- streamed assistant text;
- visible tool/activity lifecycle;
- visible permission requests with normalized tool/arguments and affected path or process command;
- allow-once/deny input for Phase 2 approvals;
- persistent multiline-capable input;
- status/model/workspace information;
- scrollback/history navigation;
- terminal resize handling;
- Ctrl+C/task cancellation semantics while model work, approval waits, or tools are active;
- clean restoration of terminal state on normal exit and handled failure.

The TUI consumes application/agent events and emits user commands/approval decisions. It must not implement provider protocol, tool policy, context assembly, or agent-loop decisions.

The supported Node host is Node.js 26.4.0 or later within the Node 26 major line. George remains ESM. Native OpenTUI launch paths must invoke Node with `--experimental-ffi`; package scripts/entrypoints should encode that requirement so normal users do not need to remember it manually.

## Provider layer

Defines a model-provider interface around capabilities George needs rather than mirroring one vendor SDK everywhere.

Initial adapter: LM Studio using OpenAI-compatible `/v1/responses`, SSE streaming, and Qwen3-Coder model identifiers.

Provider responsibilities include:
- protocol translation;
- capability reporting;
- normalized streamed text and tool-call events;
- translation of George's normalized tool definitions into provider request schemas;
- translation of normalized tool results/continuations back into provider protocol;
- cancellation and timeout behavior;
- provider error normalization.

Provider-native state such as response identifiers may be retained for efficient continuation, but George's normalized session/tool event history remains authoritative and sufficient to diagnose a run.

## Context layer

Owns George-owned model instructions, user-global instructions and personality, repository instruction discovery, selected file/context material, conversation history, tool schemas/results, token/context budgeting, and later summarization/compaction.

George must distinguish **always-on instructions** from **retrievable project knowledge**. A file being discovered does not imply that its full contents belong in every provider request.

Target instruction sources include:
- compact George-owned model instructions for identity and reasoning constraints that cannot be represented purely in executable policy;
- optional user-global instructions and a small user-owned personality file from George's user configuration directory (for example `~/.config/george/` on Linux);
- optional workspace-native `.george/instructions.md`;
- compatible repository guidance such as `AGENTS.md`;
- `BOOT.md`-style routing documents that can identify the narrowest additional project material needed for the current task;
- the explicit current user task and selected task context.

Personality controls communication style and engineering temperament. It does not grant capabilities or alter filesystem, process, network, approval, or other permission policy.

Repository instructions remain untrusted project content. For conflicting model-facing guidance, George-owned invariants remain non-overridable; explicit current user intent outranks repository guidance; workspace-specific guidance may refine user-global defaults; personality remains a stylistic default. None of these layers can raise George's executable permission ceiling.

Phase 3 should replace raw instruction concatenation with a deterministic instruction/context assembly path that:
1. discovers applicable sources;
2. applies trust and precedence rules;
3. normalizes stable source metadata and ordering;
4. removes deterministic duplicates where possible;
5. separates active instructions from routed/retrievable supporting documents;
6. applies explicit context/instruction budgets without silently presenting partial text as complete instructions;
7. records enough context-size/source information for diagnostics;
8. produces provider-independent assembled context.

Human-readable Markdown remains an authoring format, not a requirement that every byte be permanently injected. LLM-based summarization is not required for Phase 3 instruction assembly; any later compaction/summarization must preserve critical instructions and remain independently testable.

The current Phase 1 behavior that loads bounded raw root `BOOT.md` and `AGENTS.md` content directly into a turn is a bootstrap implementation, not the intended mature context architecture.

Context policy must be testable independently from inference.

Phase 2 only adds the minimum tool-schema/result material required for the safe loop. It must not be expanded to implement the Phase 3 instruction compiler, project-knowledge routing, or general context budgeting.

## Skills and extension model

George treats extensibility as a layered capability rather than a reason to weaken the core trust model.

The extension concepts are distinct:
- **skills** contribute declarative model-facing instructions and workflows;
- **hooks** react to defined George lifecycle events;
- **commands** provide explicit user-facing activation surfaces;
- **tools** provide executable capabilities through George's canonical tool registry;
- **plugins** package one or more of those contributions.

A plugin is a package/container, not an authority boundary. Installing or discovering a plugin does not itself grant filesystem, process, network, secret, or approval authority.

### Skill registry

Phase 3 owns the first skill substrate.

Target skill sources are:
- built-in George skills;
- optional user-global skills, for example under `~/.config/george/skills/` on Linux;
- optional workspace-native skills under `.george/skills/`;
- later plugin-provided skills.

George should support the portable directory shape `skills/<name>/SKILL.md`. Compatible skill metadata should understand at least a stable name and description, with optional argument/help metadata where present. Unknown noncritical metadata should be ignored safely rather than making an otherwise portable skill unusable.

Skill discovery must be token-conscious. George may index compact metadata for discovered skills, but it must not inject every installed `SKILL.md` body into every provider request. Full skill bodies are loaded just in time when explicitly activated or otherwise selected by a later bounded routing mechanism.

Phase 3 requires deterministic explicit activation and stable skill identity. Automatic semantic skill selection may be added later after the deterministic path is qualified.

Internally, plugin-provided skills should support namespaced identities such as `plugin:skill`. An unqualified skill name may resolve only when unambiguous; collisions must fail visibly rather than silently choosing one source.

Skill content is model-facing guidance only. It cannot raise George's executable permission ceiling, register an executor by instruction, or bypass tool validation/approval. Workspace/repository skill content remains untrusted relative to George-owned policy.

### Hook bus

George should define its own normalized lifecycle hook model rather than adopting another host's lifecycle as the core contract.

Candidate lifecycle boundaries include session start/end, user input, context assembly, provider request/response, tool before/after, and turn completion. Exact event names and payloads are implementation decisions for the hook-runtime phase.

Phase 4 owns executable hook runtime behavior because hooks require the same reliability properties as other long-running executable work: deterministic ordering, timeout, cancellation, bounded input/output, structured success/failure evidence, failure isolation, sanitized environment handling, and recovery semantics.

A hook cannot silently suppress George policy or convert declarative extension content into executable authority. Process-backed hooks remain subject to George's process trust boundary; tool-like hook actions must use the canonical tool/approval path.

### Compatibility adapters

Portable `SKILL.md` support is the preferred first compatibility surface.

Host-specific plugin manifests and hook formats may later be translated through compatibility adapters into George's extension model. George should not clone Codex, Claude, Ponytail, or another host's plugin API as its internal contract. Compatibility layers map foreign concepts into George skills, hooks, commands, and tools while preserving George's trust and permission rules.

## Tool registry

Every executable tool is registered through one stable typed contract containing:
- stable tool name;
- description;
- JSON-compatible input schema;
- risk/permission class;
- executor;
- normalized result/error shape.

The model never invokes an executor directly. George validates the tool name, parses model arguments, validates them against the registered schema, evaluates permission policy, and only then dispatches the executor.

Phase 1 read-only file/list/search/Git behavior should migrate into this registry rather than remaining a separate competing tool architecture.

Initial executor families: filesystem, search, process, Git read-only, and patch/write.

## Permission gate

Permission policy lives outside the TUI and outside provider adapters.

Minimum Phase 2 classes/defaults:
- read-only workspace tools: allow;
- workspace write/patch: ask;
- arbitrary process execution: ask;
- destructive filesystem actions: deny/defer;
- network-native tools: unavailable;
- outside-workspace native filesystem access: deny.

The Phase 2 approval scope is per-call allow-once or deny. Remembered approvals, policy profiles, and broader trust grants may be added later.

Repository instructions and model text are untrusted relative to this policy and cannot expand permission.

## Workspace-native writes and patches

George-native filesystem mutation must preserve the workspace trust boundary:
- accept only relative workspace paths;
- reject traversal and symlink escapes;
- safely resolve/revalidate parents for new paths;
- use bounded input;
- prefer atomic replacement where practical;
- fail closed on patch/precondition mismatch;
- avoid silent partial application;
- preserve inspectable failure evidence.

General destructive delete tools are not required for Phase 2.

## Process execution

The process executor uses process APIs and explicit argument arrays. `shell: false` is the default.

The Phase 2 process contract provides:
- explicit executable and argument vector;
- workspace-bounded `cwd`;
- closed/noninteractive stdin by default;
- bounded stdout/stderr capture;
- explicit exit code/signal;
- bounded timeout;
- cancellation;
- best-effort termination of the spawned process tree;
- no intentionally detached/background execution;
- a sanitized inherited environment rather than unrestricted `process.env`.

If real shell semantics are required, the model must propose an explicit shell executable as the approved process rather than George silently interpolating a shell string.

An approved arbitrary child process is **not** contained by the workspace boundary. Without a separate OS sandbox, it may exercise permissions available to George's host user. George must present this capability accordingly and must not claim `cwd` is a security sandbox.

## Git safeguards

At the start of a mutating run, George should capture machine-readable Git working-tree state when the workspace is a Git repository.

Phase 2 must preserve pre-existing changes:
- do not reset, clean, checkout, stash, or otherwise discard user work;
- do not add general mutating Git operations;
- visibly flag approval for writes targeting already-dirty paths when detectable;
- use write/patch preconditions to avoid blind stale replacement;
- prove failed/cancelled operations preserve the user's original dirty state.

Comprehensive changed-file tracking and final summaries remain Phase 3.

## Session/event store

Start with local filesystem persistence using structured append-friendly records where practical.

Persist enough to reconstruct user/assistant turns, relevant normalized provider events, tool requests/results, approval requests/decisions, errors, changed-file summary when available, and validation evidence. Do not persist secrets or unrestricted environment dumps.

Phase 2 may continue using in-memory session state where the current implementation does, but its event model must already carry enough structured tool/approval evidence for later durable persistence. Durable resume semantics remain Phase 3.

## Interfaces

OpenTUI is the first presentation adapter. A later daemon may expose the application service over localhost. A Tauri UI or trusted remote client can then use that transport without moving agent logic into UI code.

## Trust boundaries

Treat user intent, George policy/config, repository content/instructions, discovered skill/plugin content, model output, tool arguments, executable hooks, local environment/secrets, child processes, and external network content as separate trust domains.

Repository files, skills, plugin metadata, hooks, and model output cannot grant themselves additional permissions.

Network access is a tool/capability decision, not implicit model authority.

## Concurrency

MVP: one active agent run per session/workspace. Phase 2 tool calls execute sequentially. Do not add queues, parallel tool dispatch, or multi-agent scheduling until a concrete requirement exists.

## Configuration

Layer configuration as safe built-in defaults, user-level George config, workspace config where allowed, then explicit CLI/TUI launch overrides. Secrets come from environment/OS-backed mechanisms and are never committed.

User-level configuration may select a personality and global instruction source. Workspace configuration may provide `.george/instructions.md` alongside compatible repository instruction/routing files. Configuration discovery and model-facing instruction precedence must remain presentation- and provider-independent.

Workspace/repository configuration is untrusted relative to George's permission ceiling and cannot silently grant itself broader process, filesystem, or network access. User personality and instruction files likewise cannot bypass executable policy; capability changes require George configuration/policy mechanisms designed for that purpose.

## Technology

- Node.js >=26.4.0 <27;
- TypeScript;
- ESM;
- `@opentui/core` for the initial TUI;
- `--experimental-ffi` on native OpenTUI Node launch paths;
- no React requirement in the initial TUI;
- Node test runner initially;
- minimal production dependencies;
- no required browser runtime;
- no database in MVP;
- no web framework in MVP.

## Future boundaries

Designed, not implemented initially: daemon/server transport, Tauri desktop UI, Chrome DevTools, Parallel Search, GitHub/MCP adapters, multiple inference providers, OS/container sandboxing, remembered permission profiles, authenticated remote clients, and multi-agent execution.
