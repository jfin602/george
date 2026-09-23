# Phase 3 Task Stack

Status: READY FOR EXECUTION

Phase: 3 — Coding Workflow  
Execution folder: `p3`  
Baseline package: `0.3.0`  
Baseline main: `831d371d21c4527a7f70beddc6afb6e704e2add3`

Current authority:
- `BOOT.md`;
- `AGENTS.md`;
- `docs/project-overview.md`;
- `docs/architecture.md`;
- `docs/workflow.md`;
- `docs/stability-contract.md`;
- `docs/roadmap/mvp-roadmap.md`;
- `docs/planning/p3-coding-workflow/decision-record.md`;
- `docs/tasks/p3/prompt-assessment.md`;
- `docs/tasks/p3/implementation-plan.md`.

## Stack

- P1 / `0.3.1` — context source model, discovery, routing, and token-oriented budgeting.
- P2 / `0.3.2` — canonical agent-loop context integration and diagnostics.
- P3 / `0.3.3` — portable skill registry and turn-scoped activation.
- P4 / `0.3.4` — durable filesystem sessions and safe non-replay resume.
- P5 / `0.3.5` — changed-file evidence, validation workflow, and structured completion.
- P6 / `0.3.6` — Phase-3 TUI/CLI usability: skills, resume, context, and completion.
- P7 / `0.3.7` — integrated coding-workflow qualification and bounded hardening.
- P8 / `0.3.8` — evidence-only Phase-3 closeout.

P1-P7 use Terra High. P8 uses Terra Medium.

Every prompt is:

`Browser required: no.`

Phase 3 intentionally contains no browser/network requirement, so the ordinary CLI phase runner may execute the entire stack.

## Safety ordering

P1 builds context policy independently before P2 replaces the bootstrap raw instruction concatenation.

P3 adds only declarative skills and cannot expand tool authority.

P4 makes normalized evidence durable before P5 relies on it for coding-run completion state.

P5 reuses the existing process executor and approval gate for validation; it does not introduce a privileged execution path.

P6 adds only presentation/CLI affordances over already-qualified core/application behavior.

P7 performs the first full disposable-repository coding qualification. P8 is evidence-only and must not advance the roadmap.

## Phase boundary

Phase 3 does not implement LLM-based compaction, automatic semantic skill routing, executable lifecycle hooks, plugin packaging/install lifecycle, browser/web/network tools, external adapters, remembered approvals, OS/container sandboxing, general mutating Git, crash-safe side-effect replay, daemon/Tauri work, or multi-agent scheduling.
