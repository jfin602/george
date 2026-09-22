# George Boot Document

This is the session router for repository-aware work in `jfin602/george`.

Before substantial repository-aware planning, implementation, review, architecture work, roadmap work, or documentation changes:

1. Read this file.
2. Read `AGENTS.md`.
3. Read the narrowest relevant current docs.
4. Inspect current source and tests before making implementation claims.

## Current state

Phase 1 — Local Agent Foundation + TUI — is owner-closed.

Accepted implementation candidate: `dc2dcfcb6563b884cddecc143b1d136ea9c752db` at package `0.1.5`.  
Formal P6 closeout marker: `39e6a3f178779e2f3a632a6b487fa548bc7d890c` at package `0.1.6`.  
Owner closeout: `docs/phase-1-owner-closeout.md`.  
Phase 2 baseline transition: `da599d1c39baf57bbf58bf3a885c8717595759c1` at package `0.2.0`.

The owner explicitly accepts the recorded native-terminal and live LM Studio/Qwen Evidence Gaps for roadmap progression. They remain Evidence Gaps, not Green evidence.

**Phase 2 — Safe Tool Loop — is the current implementation gate.**

The high-level product and architecture direction remains locked; new work must preserve the accepted Phase 1 boundaries unless Phase 2 explicitly changes them.

## Core premise

George is a local-first coding agent harness. The first supported brain is Qwen3-Coder running locally through LM Studio's OpenAI-compatible Responses API.

George owns repository/project instruction loading, context, tools, process lifecycle, filesystem/Git work, validation, permissions, streaming/recovery, and session persistence.

The model provider is replaceable. LM Studio/Qwen is the first provider, not an architectural dependency that may leak throughout the system.

## Locked stack direction

- Runtime: Node.js 26.4.0 or later within the Node 26 major line.
- Language: TypeScript.
- Module system: ESM.
- Initial interface: Codex-style interactive terminal UI, not a print-only CLI.
- TUI renderer: `@opentui/core`, used directly without React initially.
- OpenTUI Node launch paths must include `--experimental-ffi`; this is part of the runtime contract rather than an operator-memory requirement.
- TUI behavior: owns/redraws terminal regions in place, streams assistant output, shows live tool activity/status, keeps persistent interactive input, supports scrollback/resize/cancellation, and restores the terminal cleanly on exit.
- Core: reusable library modules independent from TUI rendering.
- Inference: provider interface; first adapter is LM Studio Responses API.
- Persistence: simple local filesystem state first; no database until justified.
- Desktop: deferred; Tauri is the preferred later native shell.
- Networking: architecture must permit a later daemon/server mode without rewriting the agent core.
- Browser UI: not required for the core or TUI.
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
