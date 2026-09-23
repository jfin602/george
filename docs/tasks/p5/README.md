# Phase 5 Task Stack

Status: READY AFTER POST-HARDENING BASELINE REFRESH

Phase: 5 — Reliability + Long Runs  
Execution folder: `p5`  
Baseline package: `0.5.0`  
Baseline main: **pending refresh to the committed post-Phase-4 hardening candidate; do not execute P1 from the older planning SHA**

Current authority:
- `BOOT.md`;
- `AGENTS.md`;
- `docs/project-overview.md`;
- `docs/architecture.md`;
- `docs/workflow.md`;
- `docs/stability-contract.md`;
- `docs/roadmap/mvp-roadmap.md`;
- `docs/planning/p5-reliability-long-runs/decision-record.md`;
- `docs/tasks/p5/prompt-assessment.md`;
- `docs/tasks/p5/implementation-plan.md`.

## Stack

- P1 / `0.5.1` — application-owned long-run budgets/accounting and normalized reliability lifecycle events.
- P2 / `0.5.2` — provider-facing completed-history compaction with bounded provenance-bearing checkpoints.
- P3 / `0.5.3` — replay-safe provider retry/backoff with explicit attempt evidence.
- P4 / `0.5.4` — interruption reconciliation plus process cleanup hardening.
- P5 / `0.5.5` — George-owned lifecycle hook bus and bounded executable-hook runtime.
- P6 / `0.5.6` — bounded structured diagnostics and performance-characterization substrate.
- P7 / `0.5.7` — integrated Phase-5 qualification, conditional native/live evidence, bounded hardening.
- P8 / `0.5.8` — evidence-only Phase-5 closeout.

P1-P7 use Terra High. P8 uses Terra Medium.

Every prompt is:

`Browser required: no.`

Phase 5 adds no browser/network tool requirement. Native-terminal and live LM Studio/Qwen evidence are conditional runtime qualification, not browser handoff points.

## Baseline execution gate

Before running P1, update this folder's baseline references to the exact commit that contains the approved post-Phase-4 hardening: provider-round assistant buffering/canonical commit semantics, safe failed-tool argument summaries, root-list omitted/empty/`.` normalization, bounded provider diagnostics, progressive final-answer presentation, `Thinking...`, and compact consecutive Work grouping with explicit per-item status. P1-P8 must preserve that behavior unless a prompt explicitly changes it.

## Safety ordering

P1 creates the finite run-control/event substrate before later reliability features consume it.

P2 compacts only provider-facing completed history while preserving canonical durable transcript/events.

P3 adds only retry classes that can prove replay safety.

P4 reconciles interrupted evidence without replay and hardens the existing process lifecycle.

P5 proves lifecycle-hook semantics only after retry/recovery/process boundaries are explicit.

P6 adds diagnostics/measurements as consumers of authoritative events rather than execution authority.

P7 qualifies the complete candidate. P8 is evidence-only.

## Phase boundary

Phase 5 ends at bounded attached long-run coding reliability, provider-facing compaction, replay-safe retry, evidence-based interruption reconciliation, hardened process cleanup, lifecycle hooks, structured diagnostics, and characterized performance.

Plugins/external adapters, browser/network tools, daemon/background service ownership, utility-model specialization, Tauri, scheduling, and multi-agent execution remain later phases.
