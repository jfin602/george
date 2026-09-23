# Phase 6 Task Stack

Status: READY TO EXECUTE

Phase: 6 — Plugins + External Adapters  
Execution folder: `p6`  
Baseline package: `0.6.0`  
Baseline main: `2ccf0ceff2908e334062e851ac4c181989dd5d0f`

Current authority:
- `BOOT.md`;
- `AGENTS.md`;
- `docs/project-overview.md`;
- `docs/architecture.md`;
- `docs/workflow.md`;
- `docs/stability-contract.md`;
- `docs/roadmap/mvp-roadmap.md`;
- `docs/planning/p6-plugins-external-adapters/decision-record.md`;
- `docs/tasks/p6/prompt-assessment.md`;
- `docs/tasks/p6/implementation-plan.md`.

## Stack

- P1 / `0.6.1` — effect-aware tool/approval/credential foundation.
- P2 / `0.6.2` — George-native plugin manifest and managed install lifecycle.
- P3 / `0.6.3` — plugin skills/hooks/tools/commands wired into existing registries and TUI surfaces.
- P4 / `0.6.4` — bounded Parallel Search network-read adapter.
- P5 / `0.6.5` — bounded GitHub REST read + remote-mutation adapter.
- P6 / `0.6.6` — bounded MCP stdio/Streamable-HTTP tool adapter.
- P7 / `0.6.7` — Chrome DevTools coding/debugging profile over MCP.
- P8 / `0.6.8` — integrated Phase-6 qualification, conditional live evidence, bounded hardening.
- P9 / `0.6.9` — evidence-only Phase-6 closeout.

P1-P8 use Terra High. P9 uses Terra Medium.

Every prompt is:

`Browser required: no.`

Live Parallel/GitHub/MCP/Chrome checks are conditional runtime evidence. They do not require browser-runner handoff; unavailable credentials/servers/targets are recorded as Evidence Gap.

## Safety ordering

P1 upgrades authority/effect semantics before network capability exists.

P2 proves package lifecycle without executing installed code.

P3 reuses the already-qualified SkillRegistry, HookRegistry, ToolRegistry, process executor, and application/TUI boundaries.

P4 and P5 add narrow native-HTTP adapters independently.

P6 adds the official MCP client boundary with bounded schema translation and conservative authority.

P7 reuses MCP for first-party Chrome DevTools debugging instead of introducing a second browser protocol.

P8 qualifies the complete candidate. P9 is evidence-only.

## Phase boundary

Phase 6 ends with explicit local plugin packaging and bounded external adapters.

It does not add a plugin marketplace, arbitrary in-process third-party modules, automatic plugin updates, OS sandboxing, semantic automatic tool selection, the post-MVP local web-research utility-model stack, detached background services, daemon mode, scheduling, Tauri, or multi-agent execution.
