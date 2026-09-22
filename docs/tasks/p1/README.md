# Phase 1 Task Stack

Status: IMPLEMENTATION COMPLETE — NOT STABILITY QUALIFIED

Phase: 1 — Local Agent Foundation + TUI  
Execution folder: `p1`  
Baseline package: `0.1.0`  
Baseline main: `c47cf78d36326bf0a5bd1c13186c56003db9fe2a`

P1–P6 closeout is recorded in `docs/phase-1-closeout.md`. Deterministic
qualification is Green; native-terminal and live LM Studio/Qwen qualification
remain Evidence Gaps. They are not passes or waived evidence.

Current authority:
- `BOOT.md`;
- `AGENTS.md`;
- `docs/project-overview.md`;
- `docs/architecture.md`;
- `docs/workflow.md`;
- `docs/stability-contract.md`;
- `docs/roadmap/mvp-roadmap.md`;
- `docs/planning/p1-local-agent-foundation/decision-record.md`;
- `docs/tasks/p1/prompt-assessment.md`;
- `docs/tasks/p1/implementation-plan.md`.

## Stack

- P1 / `0.1.1` — Node-26 runtime + core config/event/session contracts.
- P2 / `0.1.2` — LM Studio Responses provider + deterministic SSE coverage.
- P3 / `0.1.3` — workspace instructions + read-only tools + one-turn application service.
- P4 / `0.1.4` — Codex-style OpenTUI interface.
- P5 / `0.1.5` — integrated local qualification + bounded hardening.
- P6 / `0.1.6` — evidence-only Phase-1 closeout.

P1-P5 use Terra High. P6 uses Terra Medium.

All prompts are:

`Browser required: no.`

## Execution

Before starting the runner, the operator environment must itself be Node >=26.4.0 <27. The runner process cannot upgrade its own parent runtime.

Validate grammar:

`npm run codex:phase:validate -- p1`

Run P1-P5:

`npm run codex:phase -- p1`

Run including closeout:

`npm run codex:phase -- p1 --closeout`

The exact runner owns staging/commits and rejects `package-lock.json`.

## Phase boundary

Phase 1 proves:
- one provider request per user submission;
- local LM Studio Responses streaming;
- read-only workspace/tool infrastructure;
- a Codex-style OpenTUI presentation adapter;
- deterministic qualification plus bounded live local evidence.

Phase 2 owns:
- autonomous model -> tool -> result -> model cycling;
- arbitrary process execution;
- writes/patches;
- write/destructive permission prompts;
- mutating Git.
