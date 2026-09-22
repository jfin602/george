# George Architecture

Status: INITIAL ARCHITECTURE CONTRACT

## Shape

```text
CLI / future Tauri / future network client
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

Owns the turn loop: assemble input, request/stream a provider response, collect assistant output, validate tool calls, dispatch permitted tools, append structured tool results, and continue until completion, cancellation, budget exhaustion, or error.

It does not know terminal rendering, Tauri windows, HTTP routes, or LM Studio-specific wire details.

## Provider layer

Defines a model-provider interface around capabilities George needs rather than mirroring one vendor SDK everywhere.

Initial adapter: LM Studio using OpenAI-compatible `/v1/responses`, SSE streaming, and Qwen3-Coder model identifiers.

Provider responsibilities include protocol translation, capability reporting, normalized streamed events, cancellation, timeout behavior, and provider error normalization.

## Context layer

Owns system/developer instructions, repository instruction discovery, selected file/context material, conversation history, tool schemas, token/context budgeting, and later summarization/compaction.

Context policy must be testable independently from inference.

## Tool registry

Each tool has a stable name, description, input schema, risk/permission class, executor, and normalized result/error shape. The model proposes tool calls; George validates and authorizes them.

Initial executor families: filesystem, search, process/shell, Git, and patch/write.

Execution must support cancellation/timeouts and avoid orphaned processes.

## Session/event store

Start with local filesystem persistence using structured append-friendly records where practical.

Persist enough to reconstruct user/assistant turns, relevant normalized provider events, tool requests/results, errors, changed-file summary, and validation evidence. Do not persist secrets or unrestricted environment dumps.

## Interfaces

The CLI is an adapter. A later daemon may expose the application service over localhost. A Tauri UI or trusted remote client can then use that transport without moving agent logic into UI code.

## Trust boundaries

Treat user intent, George policy/config, repository content/instructions, model output, tool arguments, local environment/secrets, and external network content as separate trust domains.

Repository files and model output cannot grant themselves additional permissions.

## Concurrency

MVP: one active agent run per session/workspace. Do not add queues or multi-agent scheduling until a concrete requirement exists.

## Configuration

Layer configuration as safe built-in defaults, user-level George config, workspace config where allowed, then explicit CLI overrides. Secrets come from environment/OS-backed mechanisms and are never committed.

## Technology

- Node.js 24;
- TypeScript;
- ESM;
- Node test runner initially;
- minimal production dependencies;
- no required browser runtime;
- no database in MVP;
- no web framework in MVP.

## Future boundaries

Designed, not implemented initially: daemon/server transport, Tauri desktop UI, Chrome DevTools, Parallel Search, GitHub/MCP adapters, multiple inference providers, and authenticated remote clients.
