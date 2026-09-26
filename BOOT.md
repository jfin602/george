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

Phase 6 — Plugins + External Adapters — is owner-closed.

Accepted Phase 6 implementation/qualification candidate: `b25f48b9d8b3b46fac1031c72cc4b1143270fa37` at package `0.6.8`.  
Formal Phase 6 P9 closeout marker: `b0d87e12d437` at package `0.6.9`.  
Formal Phase 6 closeout: `docs/phase-6-closeout.md`.  
Phase 6 owner closeout: `docs/phase-6-owner-closeout.md`.  
Phase 7 baseline transition: package `0.7.0`.

The owner explicitly accepts the recorded Phase 6 live Parallel/GitHub/MCP/Chrome and native-terminal Evidence Gaps for roadmap progression. These remain Evidence Gaps, not Green evidence.

Phase 7 — Inference Runtime Optimization — is owner-closed.

Formal Phase 7 closeout marker: `a7d2e8491bf354a4317c80f06f1796cbee80ee58`.  
Phase 7 owner closeout: `docs/phase-7-owner-closeout.md`.  
Phase 8 planning baseline: `66d28597fc6b69f210bcbe4ebf4ae41a9df77375`.  
Phase 8 package transition: `cc7fd7a16d95e3057598c8fd8152979e8a25d79c` at package `0.8.0`.

The owner explicitly accepts the recorded Phase 7 final restored-runtime Not Green verification for roadmap progression. It remains Not Green and is not retroactively treated as Green. The accepted Phase 7 steady-state control is the separately Green `parallel=1` warm verification at approximately 1.83 s average provider round.

**Phase 8 — Context Throughput Optimization — is owner-closed.**

Accepted Phase 8 implementation package: `0.8.8`.  
Original Phase 8 implementation closeout candidate: `07241c94ed3cbc0dafc969f0a59676b39e232fb0`.  
Agentic-context correction closeout marker: `398b888f6b76b6a67b9a22a9137cf27fd20ab129`.  
Phase 8 owner closeout: `docs/phase-8-owner-closeout.md`.  
Phase 9 baseline transition: `d7c18231ac4edfa7e58618453f8eff20be1fe0db` at package `0.9.0`.

The owner explicitly accepts the recorded Phase 8 `c8-agentic-context` Not Green / Evidence Gap state for roadmap progression. That acceptance does not rewrite the failed edit-plus-validation workload, missing healthy agentic envelope, missing adjacent risk/cliff region, unconfirmed GPU Offload 26 control, or correction-time Node-26/native-TTY gaps into Green.

Phase 8 carries forward:
- deterministic adaptive/fixed context selection and diagnostics;
- Phase 3 precedence/provenance/source-integrity rules;
- Phase 5 compaction/recovery authority;
- P7 frozen-turn continuation-pressure safety;
- the `agentic-context` benchmark as the real coding-agent measurement instrument;
- the existing ordinary/medium/large profile values as provisional inherited operating policy rather than empirically optimal agentic envelopes.

**Phase 9 — Structured Task Execution + Workspace Autonomy — is the current roadmap gate.**

Phase 9 authority:
- decision record: `docs/planning/p9-structured-task-execution/decision-record.md`;
- task grammar: `docs/planning/p9-structured-task-execution/task-format-v1.md`;
- qualification plan: `docs/planning/p9-structured-task-execution/qualification-plan.md`.

Phase 9 begins from package baseline `0.9.0`.

Phase 9 moves deterministic requirements, work-unit/dependency state, validation truth, stop/correction semantics, durable task-stack state, Transcript/Task presentation, and Workspace Autonomous policy into George-owned application/core behavior while preserving Phase 2-8 trust, permission, context, recovery, and evidence contracts.

The failed Phase 8 agentic edit/validation workload must remain visible longitudinal evidence. Phase 9 must not claim that structured execution fixes it until the Phase 9 live-work instruments and qualification evidence actually demonstrate improvement.

### Current Phase 9 correction status — 2026-09-26

Package remains `0.9.10`; Phase 9 remains open and Phase 10 is not opened.

Post-closeout correction evidence remains authoritative for structured task convergence, safe mutation preconditions, INSPECT execution/completion, text-file fidelity, mutation intent authority, v2 instrument alignment, explicit directory creation, and qualification-preflight scope.

`c9-qualification-preflight-scope` is now closed as **Not Green overall** at commit `d7804684801fa8418050c34d9ef097ca1adf80b6`:
- qualification policy/preflight and controlled broad regression-delta handling are Green;
- fresh Gate A is Green;
- fresh `greenfield-express-v2` Gate B2 is Not Green;
- Gate C2 remains unspent.

The official B2 attempt reached corrected mutation execution, including successful `create_directory("src")` and two successful small file writes, then failed because continuation context was estimated at 28,306 tokens against the frozen ordinary 8,192-token provider-input ceiling. Source review also shows mutation tool results currently carry internal Git working-tree snapshots into provider continuation. A separate ordinary interactive transcript reproduced frozen ordinary overshoot around 8.2-8.6k actual provider input and showed globally injected coding-workflow guidance causing a simple greeting to expand into repository inspection.

The active correction is now `c9-turn-context-convergence`.

It must:
- separate canonical/internal tool evidence from bounded provider-visible tool-result projections;
- use provider-reported usage as continuation evidence when available;
- preserve frozen source composition while allowing adaptive safety-envelope promotion ordinary -> medium -> large;
- keep fixed profiles fixed and preserve >large fail-closed behavior;
- wire ordinary production TUI turns through the base agent instead of globally injecting `CODING_WORKFLOW_GUIDANCE`;
- leave the existing context profile constants, Task Prompt format 1, v1/v2 instruments, hidden acceptance, historical evidence, and package version unchanged.

Correction baseline: `d7804684801fa8418050c34d9ef097ca1adf80b6`.

Current correction evidence/planning:
- `docs/tasks/c9-structured-task-convergence/closeout.md`;
- `docs/tasks/c9-qwen-workunit-convergence/closeout.md`;
- `docs/tasks/c9-inspection-execution/closeout.md`;
- `docs/tasks/c9-inspection-stage-completion/closeout.md`;
- `docs/tasks/c9-text-file-edit-fidelity/closeout.md`;
- `docs/tasks/c9-mutation-intent-authority/closeout.md`;
- `docs/tasks/c9-greenfield-instrument-alignment/closeout.md`;
- `docs/tasks/c9-mutation-precondition-convergence/closeout.md`;
- `docs/tasks/c9-qualification-preflight-scope/closeout.md`;
- active correction planning: `docs/planning/c9-turn-context-convergence/decision-record.md` and `docs/planning/c9-turn-context-convergence/qualification-plan.md`.

Historical Phase 1-8 prompts/evidence are not renumbered or rewritten.

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
- Living Project Map / Software Graph, when relevant: `docs/planning/living-project-map/decision-record.md` (then its graph, interaction, and qualification companions as needed);
- current Phase 9 authority: `docs/planning/p9-structured-task-execution/decision-record.md`, `docs/planning/p9-structured-task-execution/task-format-v1.md`, and `docs/planning/p9-structured-task-execution/qualification-plan.md`; latest correction truth: `docs/tasks/c9-qualification-preflight-scope/closeout.md`; active correction planning: `docs/planning/c9-turn-context-convergence/decision-record.md` and `docs/planning/c9-turn-context-convergence/qualification-plan.md`;
- Phase 8 closeout/history when needed: `docs/phase-8-closeout.md`, `docs/phase-8-owner-closeout.md`, `docs/tasks/c8-agentic-context/closeout.md`, `docs/planning/c8-agentic-context/decision-record.md`, `docs/planning/c8-agentic-context/qualification-plan.md`, `docs/planning/p8-context-throughput-optimization/decision-record.md`, `docs/planning/p8-context-throughput-optimization/initial-baseline.md`, and `docs/planning/performance-benchmarking-worksheet.md`;
- Phase 7 closeout/history when needed: `docs/phase-7-closeout.md`, `docs/phase-7-owner-closeout.md`, `docs/planning/p7-inference-runtime-optimization/initial-baseline.md`;
- Phase 6 closeout/history when needed: `docs/phase-6-closeout.md`, `docs/phase-6-owner-closeout.md`, `docs/planning/p6-plugins-external-adapters/decision-record.md`;
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

Model routing for newly authored implementation stacks is GPT-6 Sol-first: Medium is the default, High is the normal escalation for materially harder/riskier work, and XHigh is exceptional. Terra is not used for new prompts. Historical model labels and evidence keep their original meanings and must not be silently remapped. GPT-6 Sol executable labels become active only after the phase runner supports and validates their exact concrete mappings.

Execution-brief philosophy:

> Plan richly; prompt sparsely; validate rigorously.

Correction stacks must repair the defect and install permanent executable regression coverage for the defect class.
