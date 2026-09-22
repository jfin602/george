# Phase 1 Implementation Plan

Status: CURRENT IMPLEMENTATION PLAN

Phase: 1 — Local Agent Foundation + TUI  
Execution folder: `p1`  
Baseline: main `c47cf78d36326bf0a5bd1c13186c56003db9fe2a`, package `0.1.0`.

Read with `BOOT.md`, `docs/project-overview.md`, `docs/architecture.md`, `docs/workflow.md`, `docs/stability-contract.md`, `docs/planning/p1-local-agent-foundation/decision-record.md`, and `docs/tasks/p1/prompt-assessment.md`.

## Target architecture

```text
OpenTUI adapter
      |
application service
      |
 one-turn core
 +----+---------+---------+
 |              |         |
context      read-only   events/session
 |            tools
provider
 |
LM Studio /v1/responses
 |
Qwen3-Coder
```

P1-P4 construct the vertical slice in that order. P5 qualifies the exact integrated source. P6 only closes evidence.

## P1 — runtime + core contracts

Target: `0.1.1`.

### Repository/runtime

- enforce Node >=26.4.0 <27;
- update Node typings to the Node-26 line;
- add npm configuration that prevents `package-lock.json` creation and preserves the runner's no-lock invariant;
- keep TypeScript strict + ESM;
- preserve the exact phase-runner sources unchanged;
- prove `npm run test:runner` under Node 26 before handoff.

### Core types

Create small dependency-free core modules for:
- resolved George configuration;
- normalized provider/application events;
- basic in-memory session/transcript state;
- cancellation/error shapes.

Do not introduce OpenTUI or LM Studio wire parsing yet.

Configuration must make workspace/base URL/model explicit and testable. Default base URL is loopback `http://127.0.0.1:1234`; no default model quantization ID.

### Test-command truth

Establish named deterministic commands that can grow without lying about coverage. Preserve `test:runner`; add focused core/unit command(s) and make `check` reflect only what it actually runs.

P1 proof:
- Node/runtime/config validation;
- loopback URL validation primitives;
- event/session contracts;
- test commands;
- exact runner tests;
- typecheck;
- no package lock;
- `git diff --check`.

## P2 — LM Studio Responses provider

Target: `0.1.2`.

Implement George's provider interface and LM Studio adapter using platform `fetch`/streams unless a dependency is materially justified.

### Request contract

- POST to configured loopback `/v1/responses`;
- model is required from configuration/override;
- stream responses;
- accept George instructions/input without leaking LM Studio-specific types into callers;
- support AbortSignal and bounded timeout;
- do not require an API key for the local default.

### Streaming

Implement a real incremental SSE parser that survives arbitrary chunk boundaries, CRLF, blank events and multiline data.

Normalize the Responses events George needs: text deltas, response completion/usage, function/tool-call data needed for later P2 tooling, and errors/failures.

Malformed/incomplete streams fail with structured provider errors rather than silently completing.

### Live smoke

Add an opt-in live smoke command that:
- never runs as part of deterministic `npm test`;
- accepts model/base-url configuration explicitly;
- sends a tiny prompt;
- verifies streamed completion;
- reports model/endpoint/timing evidence without secrets.

P2 proof:
- deterministic local HTTP fixture/server tests;
- request shape;
- split SSE chunks;
- text stream;
- tool-call event normalization;
- abort/timeout;
- non-2xx/error event/malformed stream;
- loopback-only Phase-1 endpoint enforcement;
- typecheck + applicable suites.

## P3 — workspace context + read-only tools + one-turn application service

Target: `0.1.3`.

### Workspace/context

Resolve one workspace root. Canonicalize/realpath it.

Discover root `BOOT.md` first and root `AGENTS.md` second when present. Bound instruction bytes and preserve deterministic ordering. Repository instructions remain data beneath George's own policy boundary.

### Read-only tools

Implement a typed read-only tool registry/executor foundation for:
- file read;
- directory/list discovery;
- bounded text search;
- Git status;
- Git diff.

Filesystem paths must remain inside the canonical workspace after realpath resolution. Reject `..`, absolute escape and symlink escape.

Search must not expose arbitrary shell execution.

Git tools may spawn only fixed read-only Git commands with `shell: false`, bounded timeout/cancellation and bounded stdout/stderr.

No writes, patching, arbitrary processes or mutating Git commands.

### One-turn application service

Accept user input, assemble context, invoke the provider once, emit normalized activity/transcript events, and terminate on completed/cancelled/failed state.

Do not dispatch model tool calls. If a provider yields a tool call, retain/emit it as deferred/unsupported Phase-1 output rather than entering another model turn.

P3 proof:
- instruction ordering/limits;
- traversal and symlink escape denial;
- bounded file/list/search behavior;
- fixed Git command behavior and dirty-tree preservation;
- provider one-turn event flow;
- cancellation/failure;
- proof that no second provider request/tool loop occurs.

## P4 — OpenTUI adapter

Target: `0.1.4`.

Add current `@opentui/core` as the production presentation dependency without React and without creating a package lock.

### Launch contract

Normal repository launch scripts must invoke Node with `--experimental-ffi`. Do not rely on the user manually setting flags.

The TUI entry point validates configuration/workspace before beginning a model turn and presents actionable errors.

### Presentation

Create a restrained coding-agent layout:
- George identity/header;
- model/provider/workspace status;
- scrollable conversation/transcript;
- compact activity line/region capable of rendering read-only-tool lifecycle events;
- persistent input;
- streaming assistant output.

Keep render state derived from application events. No provider parsing, tool permission logic or context assembly in TUI widgets.

### Lifecycle/input

- input remains usable after completed turns;
- multiline-capable entry;
- Enter/submit semantics are explicit and covered;
- transcript scrollback works;
- resize preserves a coherent layout;
- Ctrl+C during an active turn requests cancellation;
- Ctrl+C while idle exits;
- normal/handled-error exit restores terminal state.

Use OpenTUI's supported test renderer for deterministic rendering/input/resize/lifecycle tests; do not require a real terminal for the ordinary suite.

P4 proof:
- OpenTUI dependency/launch flag;
- test-renderer snapshots/assertions at semantic level rather than brittle decorative pixels;
- streaming updates do not corrupt input;
- cancellation and idle exit;
- resize/scroll;
- terminal cleanup seam;
- architecture/source test that core/provider modules do not import OpenTUI.

## P5 — integrated local qualification + hardening

Target: `0.1.5`.

Qualify the exact candidate; do not expand roadmap scope.

### Deterministic evidence

Run:
- runner tests;
- core/unit tests;
- provider tests;
- tool/application integration tests;
- TUI test-renderer tests;
- typecheck;
- any full deterministic aggregate command established by P1-P4;
- `git diff --check`.

### Native/runtime evidence

Verify Node runtime and normal TUI launch command include FFI. If the execution environment exposes a genuine TTY, exercise startup, submit/cancel/exit, resize if practical, and terminal restoration. If not, record the missing real-TTY portion as Evidence Gap; do not fabricate a pass.

### Live model evidence

If LM Studio is reachable and an explicit model is configured, run the live smoke against the exact candidate and record base URL, model ID, completion, timing/usage when available. Do not log secrets or unrestricted prompt/context bodies.

If the local provider/model is unavailable, record Evidence Gap rather than changing provider architecture or downloading a substitute model.

### Hardening bound

At most two substantial correction cycles for evidence-discovered Phase-1 defects. Rerun affected focused evidence first, then the broad deterministic matrix.

If a finding requires changing locked architecture or Phase-1/P2 boundaries, stop with Not Green / Planning needed.

Write `docs/tasks/p1/P5-qualification-evidence.md` with exact SHA/package/runtime and Green / Not Green / Evidence Gap results.

## P6 — evidence-only Phase 1 closeout

Target: `0.1.6`.

Read exact P5 source/evidence and audit:
- Node/OpenTUI runtime;
- TUI/core separation;
- provider contract;
- workspace/instruction handling;
- read-only tool boundaries;
- one-turn boundary;
- deterministic tests;
- live model/native terminal evidence;
- package-lock/runner invariants.

Do not add product implementation or repair defects.

Write/update `docs/phase-1-closeout.md` and narrow task/router status. Preserve Evidence Gaps and Not Green findings truthfully.

## Phase boundaries

Phase 1 does not implement:
- autonomous model -> tool -> result -> model loops;
- arbitrary shell/process execution;
- file writes/patches;
- mutating Git;
- approvals/permission prompts for writes;
- web/browser tools;
- MCP;
- daemon/network server;
- Tauri desktop;
- remote providers;
- multi-agent behavior;
- persistent/resumable long-running sessions.
