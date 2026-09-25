# c8-agentic-context Task Stack

Status: READY FOR EXECUTION

Correction: `c8-agentic-context`  
Parent phase: 8 — Context Throughput Optimization  
Required unchanged package version: `0.8.8`

Authority:
- `BOOT.md`;
- `AGENTS.md`;
- `docs/project-overview.md`;
- `docs/architecture.md`;
- `docs/workflow.md`;
- `docs/stability-contract.md`;
- `docs/roadmap/mvp-roadmap.md`;
- `docs/planning/c8-agentic-context/decision-record.md`;
- `docs/planning/c8-agentic-context/qualification-plan.md`;
- `docs/planning/performance-benchmarking-worksheet.md`;
- historical Phase-8 decision/evidence;
- `docs/tasks/c8-agentic-context/prompt-assessment.md`;
- `docs/tasks/c8-agentic-context/implementation-plan.md`.

## Stack

- P1 — agentic-context benchmark instrument; no production policy change.
- P2 — live ascending 2k/4k/6k/8k/10k/12k empirical envelope measurement.
- P3 — evidence-backed production context-policy correction, or explicit Evidence Gap with no guessed change.
- P4 — deterministic qualification and permanent regression guards.
- P5 — real LM Studio/Qwen + supported George/TUI qualification.
- P6 — evidence-only correction closeout.

P1-P5 use Terra High. P6 uses Terra Medium.

Every prompt uses:

`Browser required: no.`

Every prompt requires package version to remain exactly:

`0.8.8`

## Safety ordering

P1 fixes the measurement instrument first.

P2 measures the real local coding-agent envelope before any production profile/routing values are changed.

P3 is explicitly conditional on P2 evidence and may not guess replacement values.

P4 protects the exact accepted policy and the original Phase-3/5/P7 boundaries.

P5 qualifies the final candidate with real model/tool/TUI evidence when the runtime is healthy.

P6 records correction truth only; it does not repair implementation or owner-close Phase 8.

## Measurement doctrine

The synthetic `context` suite remains useful for raw long-context prefill/retrieval characterization.

The new `agentic-context` suite is the authority for coding-agent working-set decisions.

A larger band is not accepted merely because it fits.

A smaller band is not accepted merely because it is faster.

The accepted operating envelope must preserve:
- task correctness;
- instruction/fact retention;
- tool correctness;
- reasonable provider/workflow latency;
- Phase-3 precedence/source integrity;
- Phase-5 recovery;
- P7 continuation-pressure safety.

## Phase boundary

Phase 9 remains blocked until this correction is implemented, qualified, and Phase 8 is formally owner-closed/accepted.

This correction does not add a helper model, semantic model routing, parallel tool execution, batching, speculative decoding, daemon/desktop behavior, a new primary model, or provider-native state authority.
