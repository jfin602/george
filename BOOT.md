# George Boot Document

This is the session router for repository-aware work in `jfin602/george`.

Before substantial repository-aware planning, implementation, review, architecture work, roadmap work, or documentation changes:

1. Read this file.
2. Read `AGENTS.md`.
3. Read the narrowest relevant current docs.
4. Inspect current source and tests before making implementation claims.

## Current state

Phase 1 — Local Agent Foundation + TUI — is owner-closed.

Accepted Phase 1 implementation candidate: `dc2dcfcb6563b884cddecc143b1d136ea9c752db` at package `0.1.5`.  
Formal Phase 1 P6 closeout marker: `39e6a3f178779e2f3a632a6b487fa548bc7d890c` at package `0.1.6`.  
Phase 1 owner closeout: `docs/phase-1-owner-closeout.md`.  
Phase 2 baseline transition: `da599d1c39baf57bbf58bf3a885c8717595759c1` at package `0.2.0`.

Phase 2 — Safe Tool Loop — is owner-closed.

Accepted Phase 2 implementation candidate: `79834552775a2ae4c01d7796f5005ba16450e260` at package `0.2.5`.  
P6 qualification marker: `57ccc6a1b77d99258d4e08e2ca122faa110bbc42` at package `0.2.6`.  
Formal P7 closeout marker: `0e8a766a77170a07bc290ff346b2d7d5c9a273c6` at package `0.2.7`.  
Formal Phase 2 closeout: `docs/phase-2-closeout.md`.  
Phase 2 owner closeout: `docs/phase-2-owner-closeout.md`.  
Phase 3 baseline transition: `ce0d6b4a81000ed60f58772a67cd2a783998fbd6` at package `0.3.0`.

Phase 3 — Context + Skills — is owner-closed.

Accepted Phase 3 implementation candidate: `2d8b5a9f4ce0cab87b9694843b14f8885b1f4b55` at package `0.3.5`.  
Formal Phase 3 P6 closeout marker: `1c5b03d787d07e9a43190f8caf1da838732b0920` at package `0.3.6`.  
Formal Phase 3 closeout: `docs/phase-3-closeout.md`.  
Phase 3 owner closeout: `docs/phase-3-owner-closeout.md`.  
Phase 4 baseline transition: package `0.4.0`.

Phase 4 — Coding Workflow + Sessions — is owner-closed.

Accepted Phase 4 implementation/qualification candidate: `ceac33dd09c85e141a4ff8a892a7e0dca8198ea2` at package `0.4.6`.  
Formal Phase 4 P7 closeout marker: `8374f3b3453c3ebc66942f2cf8796b34736c588d` at package `0.4.7`.  
Formal Phase 4 closeout: `docs/phase-4-closeout.md`.  
Phase 4 owner closeout: `docs/phase-4-owner-closeout.md`.  
Phase 5 baseline transition: package `0.5.0`.

Phase 5 — Reliability + Long Runs — is owner-closed.

Accepted Phase 5 implementation/qualification candidate: `0ea556034c70861297997a046e622162876a8d00` at package `0.5.7`.  
Formal Phase 5 P8 closeout marker: `dee176d91a1a37d143fea8ce3a75833d1e42b5e6` at package `0.5.8`.  
Formal Phase 5 closeout: `docs/phase-5-closeout.md`.  
Phase 5 owner closeout: `docs/phase-5-owner-closeout.md`.  
Phase 6 baseline transition: package `0.6.0`.

The owner explicitly accepts the recorded Phase 1-4 native-terminal/live-model Evidence Gaps plus the Phase 5 native-terminal Evidence Gap and live LM Studio/Qwen Not Green result for roadmap progression. These remain their recorded evidence states, not Green evidence.

**Phase 6 — Plugins + External Adapters — is the current planning gate.**

Phase 6 planning authority starts with the current product, architecture, workflow, stability, roadmap, and Phase 5 closeout contracts. Establish a Phase 6 decision record through the normal `/docs-review -> /docs-apply` workflow before implementation prompts are written.

## Core premise

George is a local-first coding agent harness. The pinned default local brain is LM Studio model ID `qwen3-coder-30b-a3b-instruct@q4_k_m`, with Qwen3-Coder served through LM Studio's OpenAI-compatible Responses API. `GEORGE_MODEL` remains an explicit override for deliberate model testing.

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
- Default LM Studio model ID: `qwen3-coder-30b-a3b-instruct@q4_k_m`; `GEORGE_MODEL` may explicitly override it.
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
- Phase 5 closeout/history when needed: `docs/phase-5-closeout.md`, `docs/phase-5-owner-closeout.md`, `docs/planning/p5-reliability-long-runs/decision-record.md`;
- Phase 4 closeout/history when needed: `docs/phase-4-closeout.md`, `docs/phase-4-owner-closeout.md`, `docs/planning/p4-coding-workflow-sessions/decision-record.md`;
- Phase 3 closeout/history when needed: `docs/phase-3-closeout.md`, `docs/phase-3-owner-closeout.md`, `docs/planning/p3-context-skills/decision-record.md`;
- superseded combined Phase 3 record/history when needed: `docs/planning/p3-coding-workflow/decision-record.md`;
- Phase 2 closeout/history when needed: `docs/phase-2-closeout.md`, `docs/phase-2-owner-closeout.md`, `docs/planning/p2-safe-tool-loop/decision-record.md`;
- Phase 1 closeout/history when needed: `docs/phase-1-owner-closeout.md`, `docs/planning/p1-local-agent-foundation/decision-record.md`.

## Workflow

Documentation:

`/docs-review -> explicit approval -> /docs-apply`

Implementation planning:

`/prompt-ass -> /prompt-plan -> /prompt-write <folder>`

Execution-brief philosophy:

> Plan richly; prompt sparsely; validate rigorously.

Correction stacks must repair the defect and install permanent executable regression coverage for the defect class.
