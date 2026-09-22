# Phase 2 Task Stack

Status: IMPLEMENTATION COMPLETE; FORMAL EVIDENCE RECORDED; OWNER CLOSEOUT PENDING

Phase: 2 — Safe Tool Loop  
Execution folder: `p2`  
Baseline package: `0.2.0`  
Baseline main: `30f6ff7e5dc10b701e2a153aed13b982f06c4368`

Current authority:
- `BOOT.md`;
- `AGENTS.md`;
- `docs/project-overview.md`;
- `docs/architecture.md`;
- `docs/workflow.md`;
- `docs/stability-contract.md`;
- `docs/roadmap/mvp-roadmap.md`;
- `docs/planning/p2-safe-tool-loop/decision-record.md`;
- `docs/tasks/p2/prompt-assessment.md`;
- `docs/tasks/p2/implementation-plan.md`.

## Stack

- P1 / `0.2.1` — canonical tool registry + LM Studio tool protocol.
- P2 / `0.2.2` — bounded autonomous read-only agent loop.
- P3 / `0.2.3` — workspace write/patch + Git safeguards.
- P4 / `0.2.4` — bounded arbitrary process executor.
- P5 / `0.2.5` — approval gate + full OpenTUI integration.
- P6 / `0.2.6` — integrated qualification + bounded hardening.
- P7 / `0.2.7` — evidence-only Phase-2 closeout.

P1-P6 use Terra High. P7 uses Terra Medium.

Every prompt is:

`Browser required: no.`

## Execution

Validate grammar:

`npm run codex:phase:validate -- p2`

Run P1-P6:

`npm run codex:phase -- p2`

Run including formal evidence closeout:

`npm run codex:phase -- p2 --closeout`

The exact runner owns staging/commits/version verification and rejects `package-lock.json`.

Formal Phase-2 evidence closeout: `docs/phase-2-closeout.md`. Native-terminal and live LM Studio/Qwen evidence remain Evidence Gaps; this pointer does not owner-close Phase 2 or advance the roadmap.

## Safety ordering

P3 write/patch and P4 process executors are deliberately implemented before they are advertised to the model. P5 adds the approval port/policy and only then activates these risky tools in the normal agent loop.

## Phase boundary

Phase 2 proves the safe autonomous tool loop. Phase 3 owns the broader coding workflow: context budgeting, instruction precedence, comprehensive changed-file tracking, validation workflow, completion summaries, durable session persistence/resume, and first full disposable-repository coding qualification.
