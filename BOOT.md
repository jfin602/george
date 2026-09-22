# George Boot Document

This is the session router for repository-aware work in `jfin602/george`.

Before substantial repository-aware planning, implementation, review, architecture work, roadmap work, or documentation changes:

1. Read this file.
2. Read `AGENTS.md`.
3. Read the narrowest relevant current docs.
4. Inspect current source and tests before making implementation claims.

## Current state

George is at initial repository bootstrap. Phase 1 is the next implementation gate.

The high-level product and architecture direction is locked; implementation details should stay deliberately small until Phase 1 proves the local agent loop.

## Core premise

George is a local-first coding agent harness. The first supported brain is Qwen3-Coder running locally through LM Studio's OpenAI-compatible Responses API.

George owns:
- repository/project instruction loading;
- conversation and context management;
- tool definitions and execution;
- shell/process lifecycle;
- filesystem reads/writes and patching;
- Git inspection and search;
- test/build execution;
- permissions and trust boundaries;
- streaming, retries, cancellation, and recovery;
- session persistence.

The model provider is replaceable. LM Studio/Qwen is the first provider, not an architectural dependency that may leak throughout the system.

## Locked stack direction

- Runtime: Node.js 24.
- Language: TypeScript.
- Interface: CLI first.
- Core: reusable library modules independent from CLI rendering.
- Inference: provider interface; first adapter is LM Studio Responses API.
- Persistence: simple local filesystem state first; no database until justified.
- Desktop: deferred; Tauri is the preferred later native shell.
- Networking: architecture must permit a later daemon/server mode without rewriting the agent core.
- Browser UI: not required for the core or CLI.
- Electron: not the default desktop direction.

## Current authority

Read:
- product: `docs/project-overview.md`;
- architecture: `docs/architecture.md`;
- workflow: `docs/workflow.md`;
- stability/testing: `docs/stability-contract.md`;
- roadmap: `docs/roadmap/mvp-roadmap.md`;
- Phase 1 decisions: `docs/planning/p1-local-agent-foundation/decision-record.md`.

## Workflow

Documentation:

`/docs-review -> explicit approval -> /docs-apply`

Implementation planning:

`/prompt-ass -> /prompt-plan -> /prompt-write <folder>`

Execution-brief philosophy:

> Plan richly; prompt sparsely; validate rigorously.

Correction stacks must repair the defect and install permanent executable regression coverage for the defect class.
