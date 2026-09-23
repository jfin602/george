# Phase 4 Task Stack

Status: OWNER-CLOSED WITH ACCEPTED NATIVE-TERMINAL / LIVE-MODEL EVIDENCE GAPS

Phase: 4 — Coding Workflow + Sessions  
Execution folder: `p4`  
Baseline package: `0.4.0`  
Baseline main: `082eddcf28cd548ae3c6063fd4d0c4ba1e973a9e`

Current authority:
- `BOOT.md`;
- `AGENTS.md`;
- `docs/project-overview.md`;
- `docs/architecture.md`;
- `docs/workflow.md`;
- `docs/stability-contract.md`;
- `docs/roadmap/mvp-roadmap.md`;
- `docs/planning/p4-coding-workflow-sessions/decision-record.md`;
- `docs/tasks/p4/prompt-assessment.md`;
- `docs/tasks/p4/implementation-plan.md`.

## Stack

- P1 / `0.4.1` — schema-versioned local durable sessions, workspace binding, reconstruction, interruption classification, no replay.
- P2 / `0.4.2` — provider-independent coding workflow, baseline/change accounting, explicit validation evidence, structured completion.
- P3 / `0.4.3` — presentation-independent activity/progress/work projection plus truthful context-source lifecycle observability.
- P4 / `0.4.4` — OpenTUI chronological observable execution transcript.
- P5 / `0.4.5` — durable reopen and safe new-turn resume integration.
- P6 / `0.4.6` — integrated Phase-4 qualification, conditional native/live evidence, bounded hardening.
- P7 / `0.4.7` — evidence-only Phase-4 closeout; formal record: [`docs/phase-4-closeout.md`](../../phase-4-closeout.md).

Owner closeout: [`docs/phase-4-owner-closeout.md`](../../phase-4-owner-closeout.md).

P1-P6 use Terra High. P7 uses Terra Medium.

Every prompt is:

`Browser required: no.`

Phase 4 adds no browser/network requirement. Native-terminal/live-LM-Studio evidence remains conditional runtime qualification, not a browser handoff.

## Safety ordering

P1 establishes durable state without changing normal TUI behavior.

P2 creates coding-workflow evidence over the already-qualified agent/tool loop; it does not add presentation behavior.

P3 derives work/progress state from authoritative lifecycle evidence and instruments context loading only enough to report safe source lifecycle.

P4 renders that reusable projection in OpenTUI without making the TUI an execution authority.

P5 wires persistence/reopen only after the workflow and transcript semantics exist independently.

P6 qualifies the complete candidate. P7 is evidence-only.

## Phase boundary

Phase 4 ends at bounded coding workflow + durable local session reopen + safe non-replay resume + observable execution transcript.

Long-run crash reconciliation, retries/backoff, compaction, executable hooks, plugins/network/browser adapters, daemon, Tauri, and multi-agent behavior remain later phases.
