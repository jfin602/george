# Phase 9 Task Stack — Structured Task Execution + Workspace Autonomy

Status: READY FOR EXECUTION

Phase: 9  
Baseline package: `0.9.0`  
Task folder: `p9`

Authority:
- `BOOT.md`;
- `AGENTS.md`;
- `docs/project-overview.md`;
- `docs/architecture.md`;
- `docs/workflow.md`;
- `docs/stability-contract.md`;
- `docs/roadmap/mvp-roadmap.md`;
- `docs/planning/p9-structured-task-execution/decision-record.md`;
- `docs/planning/p9-structured-task-execution/task-format-v1.md`;
- `docs/planning/p9-structured-task-execution/qualification-plan.md`;
- `docs/phase-8-owner-closeout.md`;
- `docs/tasks/c8-agentic-context/closeout.md`;
- `docs/tasks/p9/prompt-assessment.md`;
- `docs/tasks/p9/implementation-plan.md`.

## Stack

- P1 / 0.9.1 — Task Prompt v1 parser and domain model.
- P2 / 0.9.2 — canonical TaskState, state machine, and durable persistence.
- P3 / 0.9.3 — StructuredTaskApplicationService, READ FIRST / INSPECT, bounded provider task slices, one-pass validation.
- P4 / 0.9.4 — mandatory structured replay of the Phase 8 edit-plus-validation failure and bounded orchestration hardening.
- P5 / 0.9.5 — bounded correction/revalidation, task-stack sequencing, durable resume.
- P6 / 0.9.6 — Transcript/Task OpenTUI split and persistent current-task header.
- P7 / 0.9.7 — Workspace Autonomous filesystem/effective policy and outside `reject | ask`.
- P8 / 0.9.8 — separate Linux Bubblewrap process containment path.
- P9 / 0.9.9 — frozen live-work instruments and integrated Phase 9 qualification.
- P10 / 0.9.10 — evidence-only formal Phase 9 closeout.

P1-P7 and P9 use Terra High.  
P8 uses Terra Ultra because it owns the OS containment boundary.  
P10 uses Terra Medium.

Every prompt uses `Browser required: no.`.

## Locked execution ordering

Phase 9 intentionally proves usefulness early:

```text
parser
  -> TaskState/persistence
  -> structured orchestration + bounded task slices
  -> Phase 8 edit/validation replay
  -> bounded correction/resume
  -> Transcript/Task TUI
  -> Workspace Autonomous filesystem policy
  -> real process containment
  -> frozen live-work/integrated qualification
  -> closeout
```

A later Green result never erases an earlier failure.

## Phase 8 inheritance

Phase 9 does not assume Phase 8 found an optimal context size.

The current ordinary/medium/large values remain provisional inherited policy.

Canonical TaskState is kept durable in George while Qwen receives only the smallest sufficient current-work-unit projection.

The Phase 8 edit-plus-validation failure remains historical Not Green evidence and is replayed in P4 before UI/autonomy work is allowed to stand as proof of usefulness.

## Workspace Autonomous boundary

P7 may auto-permit qualified workspace-native file work but leaves host processes approval-required.

P8 adds the only initial auto-process path: a distinct Linux Bubblewrap backend.

If real Bubblewrap containment is unavailable, autonomous process execution must fail closed or fall back to the existing approval-required host process path and remain Evidence Gap/Not Green for containment.

Outside-workspace `ask` is one exact resource/action approval and never modifies the canonical workspace resolver/root.

## Phase boundary

P10 does not owner-close Phase 9 or open Phase 10.

After the stack and formal closeout are reviewed, owner progression remains an explicit decision.
