# Correction 9 Qualification Plan — Live Sweep Convergence

Status: **APPROVED QUALIFICATION DIRECTION**

Date: 2026-09-26

Package remains `0.9.10`.

Starting repository HEAD:
`12b1b81c332324566ab2ec409b3326c286009ccf`.

Historical turn-context production candidate:
`25d51a93d229e9b8cc76f56eb4b7b9afae1a5723`.

Authority:
- `docs/planning/c9-live-sweep-convergence/decision-record.md`;
- `docs/tasks/c9-turn-context-live-qualification/closeout.md`;
- current Phase 9 qualification/stability/workflow authority.

## Gate 0 — preserve historical evidence

Before implementation:
- prior turn-context convergence/live-qualification attempts remain immutable;
- greeting Green remains historical evidence;
- three-file Not Green remains historical evidence;
- A/B2/C2 Not Run remain historically correct for that sweep;
- v1/v2 live instruments and hidden acceptance remain unchanged.

## P1 qualification — evidence and sweep infrastructure

P1 may change qualification infrastructure/tests but must not repair the three-file agent/provider behavior yet.

### Failure diagnostics

Permanent tests must prove sanitized artifact evidence retains bounded diagnostics for:
- provider error;
- turn failure/cancellation;
- tool failure;
- validation failure;
- harness/observer failure.

Provider/application failure and harness failure must remain distinguishable.

Raw provider payloads, assistant prose, file bodies, secrets, unrestricted JSON, and unbounded logs remain excluded.

If the artifact shape changes structurally, emit artifact schema version 2 and preserve the ability to treat historical schema-1 artifacts according to their original meaning.

### Full-sweep orchestration

Add a deterministic qualification-layer orchestration/classification boundary that can execute isolated workloads in declared order without short-circuiting on functional Not Green outcomes.

It must:
- abort on common environment/safety/evidence-validity failures;
- continue after ordinary functional workload failures;
- never reuse a mutated workspace/session across isolated workload instruments;
- run each declared workload at most once per sweep;
- retain each workload's observed result;
- separately calculate whether its result is qualifying or diagnostic-only;
- preserve original Phase 9 prerequisite ordering for final qualification truth;
- never promote a diagnostic-only downstream Green into qualifying Green.

Tests must cover representative matrices such as:
- all Green;
- three-file fails, A/B2/C2 still execute and become diagnostic-only;
- A fails, B2/C2 execute diagnostic-only;
- B2 fails, C2 executes diagnostic-only;
- common runtime invalid -> no live workload runs;
- evidence writer invalid -> abort rather than lose attempts.

### Failure ledger

Add a bounded schema/renderer sufficient to aggregate all Not Green/Evidence Gap observations.

Permanent tests must prove:
- multiple simultaneous failures survive;
- retained/new/intermittent/environment-only classifications remain distinct;
- duplicate observations cannot silently collapse different identities;
- bounded diagnostics do not leak raw payloads;
- artifact references remain auditable.

## P2 qualification — complete diagnostic sweep

P2 makes no production repair.

### Common preflight

Require enough Green validity/safety evidence to make later results meaningful:
- candidate/source state identified;
- artifact schema/writer deterministic tests Green;
- core permission/recovery/security floors Green;
- typecheck;
- runner;
- package/diff/root-lockfile hygiene;
- supported Node 26;
- pinned loaded REST-visible LM Studio runtime.

Run complete `npm test` and record every failure/skip.

A functional deterministic/test failure should be entered into the ledger. Only failures that make the target unsafe/unrunnable or invalidate evidence abort the live sweep.

### Live matrix

Execute each once in a fresh isolated environment:
1. greeting;
2. three-file;
3. Gate A;
4. B2;
5. C2.

A functional failure does not stop later workloads.

For each result record:
- observed result;
- qualifying vs diagnostic-only;
- bounded terminal diagnostics;
- attempts/rounds/tokens/tools;
- context profile/promotions;
- TaskState/StackState where applicable;
- hidden acceptance;
- intervention/exhaustion;
- evidence artifact hashes.

### P2 output

Create a consolidated `failure-ledger.json` plus Markdown evidence.

The ledger is the sole input authority for P3/P4 repair scope apart from preserved architectural contracts.

Do not repair between P2 workloads.

## P3 qualification — agent/provider/context repair wave

P3 reads the complete P2 ledger.

Repair all clearly evidenced defects in:
- provider/stream handling;
- agent/tool-loop convergence;
- context continuation;
- structured task/stage behavior;
- live-work evidence/qualification infrastructure;
- related permission/recovery integration.

Requirements:
- preserve workload/instrument acceptance semantics;
- install permanent deterministic regression guards for each repaired defect class;
- do not repair unrelated UI-only failures here unless they share the same root cause;
- preserve every P2 failure as historical evidence.

After P3, run the relevant affected deterministic floor and broad characterization.

## P4 qualification — UI/test-stability repair wave

P4 reads the same P2 ledger plus P3 changes.

Repair all clearly evidenced remaining failures in:
- OpenTUI renderer behavior/tests;
- presentation lifecycle/synchronization;
- sandbox/process test intermittency;
- other non-agent-path integration/test-stability issues.

Do not mask race/lifecycle defects with arbitrary sleep/timeout inflation.

Each repaired defect class receives permanent regression coverage.

If no actionable P4-class defect remains, record a no-op verification with evidence instead of inventing a change.

## P5 qualification — complete post-repair sweep

After P3/P4 changes, rerun the entire matrix.

### Common qualification

Require:
- all correction-specific deterministic regressions Green;
- permission/security/recovery floors Green;
- Phase 9 integration and instrument immutability Green;
- typecheck;
- runner;
- package/diff/root-lockfile hygiene;
- pinned loaded runtime provenance sufficient.

Run full `npm test` and retain every failure/skip.

### Full live matrix

Execute greeting, three-file, Gate A, B2, and C2 exactly once each in isolated environments regardless of functional failures.

Again classify each as:
- observed result;
- qualifying or diagnostic-only.

Produce a fresh consolidated failure ledger covering all remaining failures.

No repair occurs inside P5.

## P6 closeout

P6 is evidence-only.

Report:
- Failure Evidence Diagnostics Qualified;
- Full-Sweep Orchestration Qualified;
- Failure Ledger Qualified;
- P2 Diagnostic Sweep Completed;
- P3 Agent/Provider/Context Repair Wave;
- P4 UI/Test-Stability Repair Wave;
- P5 Post-Repair Sweep Completed;
- Aggregate Broad Suite State;
- Greeting;
- Three-File;
- Gate A;
- B2;
- C2;
- Remaining Failure Count/Classes;
- Evidence Auditability;
- Historical Evidence Preserved;
- Overall `c9-live-sweep-convergence`;
- Phase 9 Ready For Owner Closeout.

Phase 9 readiness requires the post-repair qualifying chain Green. Diagnostic-only downstream passes do not satisfy acceptance.

If ready, state:
`next action: /closeout phase 9`.

Do not owner-close Phase 9 in this correction.
