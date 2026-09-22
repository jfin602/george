# George Project Overview

Status: INITIAL PRODUCT CONTRACT

## Product definition

George is a local-first coding agent harness that lets a locally running language model perform useful repository-aware software development work through a controlled set of developer tools.

The initial model is Qwen3-Coder served by LM Studio. George is not coupled to Qwen or LM Studio: inference is a provider boundary and future local or remote providers may be added without rewriting the agent loop.

George exists because a capable local model is most useful when paired with a strong harness: project instructions, context assembly, tool schemas, filesystem and Git access, command execution, patching, validation, recovery, and eventually optional web/browser/network tools.

## Locked product laws

### Local-first

The normal MVP path runs on the developer's machine. Repository contents, prompts, tool results, and model inference stay local unless the user explicitly invokes a network-backed tool/provider.

### CLI-first, UI-independent core

The MVP is a terminal application. The core agent engine must be usable without a graphical interface and must not depend on browser state. A future desktop application is an adapter over the same core.

### Provider independence

The agent loop talks to a typed model-provider interface. LM Studio's OpenAI-compatible Responses API is the first implementation. Provider-specific translation, model quirks, and capability discovery remain inside provider code.

### Real developer tools

Initial tools cover file discovery/reading, bounded writes/patching, text search, shell/process execution, Git status/diff/history, and tests/builds/typechecks through process execution.

Later optional tools may include Chrome DevTools, Parallel Search, GitHub, and MCP.

### Explicit permissions

Tool execution is governed by George, not by arbitrary model text. George must distinguish read-only actions from writes, destructive actions, network actions, and actions outside the active workspace. Permission policy is configurable and visible.

### Recoverable agent loop

A failed tool call, malformed model response, timeout, cancellation, or provider error must not corrupt the session or leave child processes silently running. Structured session/event history must make failures diagnosable.

### Small dependency surface

Prefer Node standard library and focused dependencies. Do not introduce a framework, database, browser runtime, queue, or distributed system before a current requirement needs it.

### Networking-ready, not networking-first

Core APIs should permit a later daemon/server transport so another local UI or trusted device can drive George. Phase 1 does not expose George to the LAN or Internet.

### Native desktop later

If a GUI becomes justified, Tauri is the preferred direction: a lightweight native shell over George's reusable core/daemon interfaces. Electron is not the default.

## Initial success condition

The first meaningful milestone is a reliable local loop where George can open a repository, load its instructions, send a bounded task to local Qwen through LM Studio, receive streamed text/tool calls, execute permitted tools, feed results back, continue until a clear stop condition, and report what changed and what validation actually ran.
