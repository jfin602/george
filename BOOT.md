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

**Phase 8 — Context Throughput Optimization — remains the current gate under correction `c8-agentic-context`.**

Phase 8 implementation reached package `0.8.8` and is deterministically qualified for adaptive/fixed selection, precedence/routing preservation, large-profile compaction/recovery, diagnostics, and frozen-turn continuation-pressure safety. Phase 8 is **not owner-closed**.

The live follow-up exposed that the synthetic long-context ladder is not sufficient authority for real coding-agent profile boundaries. Real George request shapes with substantial instruction-channel material and normal tool schemas showed much worse latency than similarly sized synthetic long-context cases, while the exact cause remained unresolved because later direct controls lost a healthy LM Studio runtime.

Current correction authority:
- correction decision: `docs/planning/c8-agentic-context/decision-record.md`;
- correction qualification: `docs/planning/c8-agentic-context/qualification-plan.md`;
- original Phase 8 decision/history: `docs/planning/p8-context-throughput-optimization/decision-record.md`;
- measurement/evidence baseline: `docs/planning/p8-context-throughput-optimization/initial-baseline.md`;
- formal `0.8.8` evidence closeout: `docs/phase-8-closeout.md`;
- performance campaign worksheet: `docs/planning/performance-benchmarking-worksheet.md`.

The current gate is **effective agentic working-set measurement and correction**. George must optimize for coding-task correctness, tool-use reliability, and reasonable latency inside the smallest high-signal working set the pinned local model can use competently. Physical 32k context remains headroom/emergency capacity, not a fill target.

Do not guess replacement ordinary/medium/large values before the real agentic benchmark establishes a healthy operating envelope. Preserve the qualified Phase 8 adaptive/fixed, precedence, recovery, and continuation-pressure mechanisms while correcting measurement and routing/profile policy.

Continue the benchmark-gated optimization loop:

`last accepted baseline -> one bounded context optimization -> agentic benchmark -> accept/revise/revert -> new baseline`

Do not stack multiple unmeasured context changes.

## Next planned phase

**Phase 9 — Structured Task Execution + Workspace Autonomy** is the approved next phase after Phase 8 closes. It must not begin implementation until `c8-agentic-context` is implemented, qualified, and Phase 8 is formally owner-closed/accepted.

Phase 9 authority:
- decision record: `docs/planning/p9-structured-task-execution/decision-record.md`;
- task grammar: `docs/planning/p9-structured-task-execution/task-format-v1.md`;
- qualification plan: `docs/planning/p9-structured-task-execution/qualification-plan.md`.

Phase 9 introduces George Task Prompt v1, application-owned structured task/validation/correction state, Transcript/Task TUI separation, and sandbox-backed Workspace Autonomous execution with outside-workspace `reject | ask` policy. The previously planned Agent Loop Throughput phase moves to Phase 10; later roadmap phases shift by one.

Historical Phase 1-8 prompts/evidence are not renumbered or rewritten because of this forward roadmap change.

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
- Phase 8 correction authority: `docs/planning/c8-agentic-context/decision-record.md`, `docs/planning/c8-agentic-context/qualification-plan.md`, plus historical `docs/planning/p8-context-throughput-optimization/decision-record.md`, `docs/planning/p8-context-throughput-optimization/initial-baseline.md`, `docs/phase-8-closeout.md`, `docs/planning/performance-benchmarking-worksheet.md`, and `docs/roadmap/mvp-roadmap.md`;
- planned Phase 9 authority: `docs/planning/p9-structured-task-execution/decision-record.md`, `docs/planning/p9-structured-task-execution/task-format-v1.md`, and `docs/planning/p9-structured-task-execution/qualification-plan.md`;
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

Execution-brief philosophy:

> Plan richly; prompt sparsely; validate rigorously.

Correction stacks must repair the defect and install permanent executable regression coverage for the defect class.
