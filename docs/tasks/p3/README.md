# Phase 3 Task Stack

Status: OWNER-CLOSED WITH ACCEPTED NATIVE-TERMINAL / LIVE-MODEL EVIDENCE GAPS

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

- P1 / `0.3.1` — **preserve; do not regenerate/rerun** — context source model, discovery, ordering, deduplication, and token budget.
- P2 / `0.3.2` — canonical loop integration, initial context profile, smallest-sufficient working set, user config, routed documents, and context/headroom diagnostics.
- P3 / `0.3.3` — portable skill registry, application/TUI-local bounded catalog, and turn-scoped JIT activation.
- P4 / `0.3.4` — OpenTUI skill commands and profile/context/activation observability.
- P5 / `0.3.5` — integrated Phase-3 profile/context/skills qualification and bounded hardening.
- P6 / `0.3.6` — evidence-only Phase-3 closeout; formal record: [`docs/phase-3-closeout.md`](../../phase-3-closeout.md).

Owner closeout: [`docs/phase-3-owner-closeout.md`](../../phase-3-owner-closeout.md).

P1-P5 use Terra High. P6 uses Terra Medium.

Initial Phase-3 qualification profile: Qwen3-Coder-30B-A3B-Instruct / Q4_K_M / LM Studio, 32,768-token physical target, approximately 12k-18k ordinary working set, approximately 20k soft pressure, 24,576-token provider-input ceiling, and approximately 8,192 tokens reserved for generation/tool-loop headroom. These are replaceable operating defaults, not core architectural limits.

The assembly rule is **smallest sufficient working set**. Unused context is valid headroom.

Every prompt is:

`Browser required: no.`

Phase 3 intentionally contains no browser/network requirement, so the ordinary CLI phase runner may execute the entire stack.

## Safety ordering

P1 built the deterministic context-policy substrate and is preserved. P2 extends that exact source/tests with context-profile policy before replacing the current bootstrap instruction concatenation.

P2 integrates context while preserving the existing provider/tool/approval loop; no skill bodies exist yet.

P3 adds only declarative skill content on top of the already-qualified context path and cannot expand executable authority.

P4 adds a small presentation/input surface over reusable application/skill services; OpenTUI does not own discovery, resolution, or policy.

P5 performs the first full Phase-3 context/skill qualification. P6 is evidence-only and must not advance the roadmap.

## Phase boundary

Phase 3 ends at context + declarative skills. Durable sessions/resume, changed-file accounting, validation orchestration, structured coding completion evidence, long-run reliability/hooks, plugins/network adapters, daemon, and Tauri remain later phases.
