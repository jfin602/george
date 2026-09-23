# Phase 3 Task Stack

Status: READY FOR EXECUTION

Phase: 3 — Context + Skills  
Execution folder: `p3`  
Baseline package: `0.3.0`  
Baseline main: `e7883db6f5ea481883fca5e07ae3a28937e1bd5b`

Current authority:
- `BOOT.md`;
- `AGENTS.md`;
- `docs/project-overview.md`;
- `docs/architecture.md`;
- `docs/workflow.md`;
- `docs/stability-contract.md`;
- `docs/roadmap/mvp-roadmap.md`;
- `docs/planning/p3-context-skills/decision-record.md`;
- `docs/tasks/p3/prompt-assessment.md`;
- `docs/tasks/p3/implementation-plan.md`.

## Stack

- P1 / `0.3.1` — context source model, discovery, ordering, deduplication, and token budget.
- P2 / `0.3.2` — canonical loop integration, user config, routed documents, and context diagnostics.
- P3 / `0.3.3` — portable skill registry, bounded catalog, and turn-scoped activation.
- P4 / `0.3.4` — OpenTUI skill commands and context/activation observability.
- P5 / `0.3.5` — integrated Phase-3 qualification and bounded hardening.
- P6 / `0.3.6` — evidence-only Phase-3 closeout.

P1-P5 use Terra High. P6 uses Terra Medium.

Every prompt is:

`Browser required: no.`

Phase 3 intentionally contains no browser/network requirement, so the ordinary CLI phase runner may execute the entire stack.

## Safety ordering

P1 builds deterministic context policy independently before P2 replaces the current bootstrap instruction concatenation.

P2 integrates context while preserving the existing provider/tool/approval loop; no skill bodies exist yet.

P3 adds only declarative skill content on top of the already-qualified context path and cannot expand executable authority.

P4 adds a small presentation/input surface over reusable application/skill services; OpenTUI does not own discovery, resolution, or policy.

P5 performs the first full Phase-3 context/skill qualification. P6 is evidence-only and must not advance the roadmap.

## Phase boundary

Phase 3 ends at context + declarative skills. Durable sessions/resume, changed-file accounting, validation orchestration, structured coding completion evidence, long-run reliability/hooks, plugins/network adapters, daemon, and Tauri remain later phases.
