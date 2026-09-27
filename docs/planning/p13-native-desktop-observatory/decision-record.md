# Phase 13 — Native Desktop + Agent Observatory — Decision Record

Status: APPROVED DIRECTION  
Scheduling: after Phase 12 daemon + observability foundation  
Roadmap authority: `docs/roadmap/mvp-roadmap.md`

## Purpose

Phase 13 builds the Tauri desktop first as George's **Agent Observatory**.

Its initial purpose is not visual polish. It is to make the model/harness dramatically easier to understand, debug, compare, and improve.

The end-user coding experience grows on top of that observability substrate.

## Product thesis

George's local model is only as useful as our ability to diagnose its interaction with:
- context;
- structured task state;
- tools;
- permissions;
- provider/runtime behavior;
- validation;
- correction;
- recovery;
- run budgets;
- performance.

The desktop should reduce the cost of answering:
- Why did the model stall?
- Why did this round happen?
- What context did it receive?
- What context was omitted or compacted?
- Why did it choose this tool?
- Why was an edit rejected?
- Why did validation fail?
- Why did correction repeat work?
- Where was time spent?
- What changed between a bad run and a better run?

## Core views

### Run Timeline
One correlated chronology across context, provider attempts, tools, approvals, validation, correction, recovery, and completion.

### Model / Provider Inspector
Per attempt: provider/model identity, Human/Operation mode, attempt/round, response acceptance, first useful output, provider-active duration, usage, output policy, tool proposals, retries/stalls/rebases, terminal outcome, avoided rounds, and GEP/protocol metrics where applicable.

### Context Inspector
Show profile/mode, input budget/headroom, category contributions, source provenance, omitted/deferred/routed/failed sources, promotions, compaction, and the provider-facing request projection.

### Task / Orchestration Inspector
Show task goal, requirements, work units, validation, corrections, blockers, permission expectations, and deterministic George-owned transitions. Authored requirements, model proposals, George-observed evidence, and validated truth must not be visually conflated.

### Tool / Approval Inspector
Show safe requested operation, effect/replay classification, bounded arguments, permission/approval lifecycle, timing, result/failure, and associated provider round/work unit.

### Changes / Diff
Provide a proper diff/change viewer and keep expected impact, inspected files, changed files, and validated files distinct.

### Validation
Present validation as first-class state rather than transcript noise: pending/running/passed/failed, duration, bounded evidence, and correction linkage.

### Diagnostics
Surface stalls/retries, context pressure, run budgets, recovery, duplicate reads, concurrency, GEP ratios, avoided rounds, provider/tool latency, and relevant warnings/errors.

## Run comparison

Baseline/candidate comparison is an early feature, not deferred polish.

Compare raw dimensions such as:
- functional/validation result;
- terminal failure class;
- provider rounds/attempts;
- input/output/cached tokens where available;
- provider-active/total time;
- tool calls;
- duplicate reads;
- concurrency;
- correction cycles;
- validation outcomes;
- GEP/model-round-avoidance metrics.

Do not collapse these into one opaque score.

## UI authority boundary

Tauri never owns canonical transcript, TaskState/StackState truth, tool execution, permission decisions, validation truth, recovery, provider continuation, or session durability. It consumes Phase 12 daemon/application contracts.

## Hidden reasoning boundary

The observatory is not a chain-of-thought viewer. It may display George-assembled provider input/provenance, protocol-visible outputs, tool proposals/results, bounded provider lifecycle/error data, token/timing metrics, and George-owned state transitions. It must not persist or expose hidden model reasoning or unrestricted provisional narration that current contracts intentionally discard.

## Browser/visual future

The desktop should have an extensible artifact/evidence surface capable of showing screenshots and visual/browser evidence later. Phase 13 does **not** itself add browser automation, Chrome DevTools authority, or a visual-model runtime.

## OpenTUI

OpenTUI remains a supported lightweight terminal client. The desktop becomes the preferred rich debugging/observability surface, while the TUI remains valuable for fast local usage, recovery, SSH/terminal-native workflows, and minimal environments.

## Non-goals

- browser automation implementation;
- visual-model implementation;
- utility model;
- local web research;
- Living Project Map implementation;
- multi-agent scheduling;
- replacing George core with frontend state.
