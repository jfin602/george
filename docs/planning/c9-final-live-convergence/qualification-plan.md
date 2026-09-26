# Correction 9 Qualification Plan — Final Live Convergence

Status: **APPROVED QUALIFICATION DIRECTION**

Date: 2026-09-26

Package remains `0.9.10`.

Authority:
- `docs/planning/c9-final-live-convergence/decision-record.md`;
- `docs/tasks/c9-final-qualification/report.md`;
- `docs/tasks/c9-final-qualification/failure-ledger.json`;
- current Phase 9 qualification/stability/workflow authority.

## Gate 0 — preserve current evidence

The final sweep at HEAD `e6f19645d6ed65e670bacff2f22924990c53b37b` and repository commit `3d1b801f41354f78584b81b444c6faabbdc6fa44` remains historical evidence.

Preserve:
- broad 417/0/1 result;
- greeting Green;
- three-file Green;
- Gate A exact-functional success plus old call-ceiling Not Green result;
- B2 P2 timeout;
- C2 stage-tool-limit exhaustion;
- all prior Phase 8/9 attempts.

## P1 — deterministic mission-card alignment + convergence policy

### Mission-card projection

Add a pure bounded projection from canonical structured state/evidence plus a provider-independent continuation-alignment seam in the canonical agent loop.

The structured service must be able to recompute/provide the current mission card before every implementation/correction provider request, including continuation rounds after tool results. Expanding only the initial `renderSlice()` text is insufficient.

Deterministic tests must prove:
- identical canonical state -> identical mission card;
- current work unit/objective is present;
- only applicable requirements/invariants/stops are present;
- prior successful inspection evidence is reused;
- mutation invalidates stale observations but preserves unaffected observations;
- current SHA/text-framing facts are available when already observed;
- pending George-owned validation is represented as the next completion condition;
- unresolved failures/recovery evidence cannot be silently omitted when relevant;
- completed unrelated history is excluded;
- no model claim can mark canonical completion;
- provider projection cannot raise permissions;
- output is bounded by explicit byte/token limits;
- round N+1 reflects authoritative/tool evidence produced in round N;
- a mutation invalidates only stale path/resource observations while unaffected evidence remains reusable;
- ephemeral freshness evidence is never mistaken for durable TaskState;
- reopen without reconstructible freshness re-inspects rather than trusting stale derived state.

### No-repeat / alignment behavior

Permanent structured-task tests must reproduce the final sweep shapes:

**Gate A shape**
- required edit succeeds;
- enough post-mutation evidence exists for George-owned validation;
- mission-card guidance prevents unrelated completion-artifact creation/redundant stale mutation attempts from being necessary for functional completion.

**C2 shape**
- INSPECT observes package/source/test paths;
- implementation receives those observations;
- implementation can reach its first legitimate mutation without spending the entire stage budget redoing the same inspection;
- duplicate/no-progress protection remains Green.

Do not script exact model choices; test the provider-facing authority/evidence contract.

### Convergence budget policy

Create explicit distinction between:
- hard stage/runaway ceiling;
- duplicate/no-progress limit;
- measured efficiency target.

Deterministic tests must prove:
- hard ceiling still terminates runaway behavior;
- duplicate/no-progress still terminates repeated unchanged reads;
- exceeding an efficiency target alone does not rewrite a functionally completed workload to Not Green;
- qualification reports functional and efficiency states separately.

Select revised hard stage ceilings from bounded current-workload evidence. Do not remove task-wide budgets.

This plan supersedes the earlier current-qualification prohibition on raising structured stage limits, but only for this deliberate hard-budget/efficiency separation. Preserve strict duplicate/no-progress, permission, recovery, cancellation, and task-wide budget behavior.

## P2 — safe provider partial-response timeout convergence

Reproduce with scripted provider streams:

1. timeout before response evidence;
2. response started then timeout;
3. response started + tool proposals then timeout before response completion;
4. completed provider response followed by tool execution and later timeout;
5. ambiguous external effect;
6. cancellation;
7. bounded retry exhaustion.

The safe retry rule may retry only when:
- the provider round did not complete;
- no tool from that round executed;
- no canonical assistant response committed;
- no ambiguous external/remote side effect occurred.

A retry must:
- use a fresh provider attempt identity;
- preserve the failed attempt as evidence;
- discard provisional text/tool proposals from the incomplete branch;
- never execute proposals from the incomplete branch;
- never reuse that incomplete response's response ID as a continuation;
- restart from the same canonical pre-round application state;
- consume retry/run budget;
- remain cancellable;
- never synthesize success from partial proposals.

Do not raise LM Studio timeout merely to obtain Green.

## P3 — final complete qualification sweep

After P1/P2 production changes, run once each in fresh isolated environments:

1. greeting;
2. three-file;
3. Gate A;
4. B2;
5. C2.

No repair between workloads.

Common hard gates:
- supported Node 26;
- exact pinned loaded model/runtime provenance;
- qualification evidence writer;
- permission/recovery/security floors;
- typecheck;
- runner;
- instrument/acceptance identity;
- package/diff/root-lockfile hygiene.

Run complete `npm test` once and record pass/fail/skip.

### Gate A final classification

Functional Green requires:
- exact 60-byte result;
- George-owned V1 Green;
- completed/verified TaskState;
- hidden acceptance Green;
- zero human coding intervention;
- no hard stage/task/run-budget exhaustion;
- permission/recovery/framing invariants Green.

Also report separately:
- model-requested tool calls;
- logical provider rounds;
- whether historical efficiency target <=10 calls/rounds was met.

Efficiency target miss alone is not a functional failure under this correction.

### B2

Require full P1/P2/P3 StackState completion, declared validations Green, hidden acceptance Green, zero intervention, and no hard convergence exhaustion/provider terminal failure.

### C2

Require completed/verified TaskState, focused/broad validation Green, baseline preservation, hidden acceptance Green, zero intervention, and no hard convergence exhaustion.

### Evidence

Use schema-2 bounded attempt/trace artifacts and consolidated failure ledger.

Record:
- functional state;
- efficiency metrics;
- hard-budget state;
- provider retries and their safety classification;
- artifact hashes.

## P4 — closeout

Evidence-only.

Report:
- Mission Card / Alignment Projection Qualified;
- Evidence Reuse / No-Repeat Qualified;
- Hard Convergence Budget Qualified;
- Efficiency Metric Separation Qualified;
- Partial Provider Timeout Recovery Qualified;
- Broad Suite;
- Greeting;
- Three-file;
- Gate A Functional;
- Gate A Efficiency Target;
- B2;
- C2;
- Remaining blocking failures;
- nonblocking Evidence Gaps;
- Historical Evidence Preserved;
- Overall correction;
- Phase 9 Ready For Owner Closeout.

Phase 9 Ready = Yes only when:
- deterministic correction floors Green;
- no blocking broad/security/recovery regression;
- greeting Green;
- three-file Green;
- Gate A functional Green;
- B2 Green;
- C2 Green;
- no blocking Evidence Gap.

The historical <=10 Gate A efficiency target is reported but is no longer independently blocking.

If ready, next action:
`/closeout phase 9`.


## Inserted prerequisite — provider stall recovery

Before starting a new official P3 final sweep, `c9-provider-stall-recovery` must be qualified and closed.

The rerun must:
- preserve the first interrupted P3 attempt as historical evidence;
- start a new candidate sweep at greeting;
- run greeting -> three-file -> Gate A -> B2 -> C2 once each without repair between workloads;
- record provider stall/retry/rebase observations from the new correction;
- classify a repeated terminal provider stall as a provider failure rather than task budget exhaustion unless a real George budget is the terminal cause.

The existing P3/P4 readiness rules otherwise remain unchanged.
