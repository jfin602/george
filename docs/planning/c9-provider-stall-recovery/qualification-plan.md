# Correction 9 Qualification Plan — Provider Stall Recovery

Status: **APPROVED QUALIFICATION DIRECTION**

Date: 2026-09-26

Correction: `c9-provider-stall-recovery`

Package remains `0.9.10`.

Authority:
- `docs/planning/c9-provider-stall-recovery/decision-record.md`;
- Phase 5 reliability/retry/compaction authority;
- Phase 8 agentic-context qualification principles;
- Phase 9 structured-task authority;
- `docs/planning/c9-final-live-convergence/{decision-record,qualification-plan}.md`;
- interrupted `c9-final-live-convergence` P3 evidence and LM Studio developer-log observations supplied by the owner.

## Gate 0 — preserve historical evidence

Do not rewrite:
- prior Phase 8/9 live attempts;
- the completed P1/P2 commits from `c9-final-live-convergence`;
- the interrupted P3 run/artifacts/logs;
- frozen Gate A/B2/C2 instruments or hidden acceptance.

The interrupted P3 run is diagnostic evidence, not a qualifying final sweep.

## P1 — provider stall watchdog and bounded recovery ladder

### Stall/watchdog contract

Add deterministic application-owned provider-liveness policy with:
- suspected-stall threshold;
- recovery-triggering first-evidence threshold;
- recovery-triggering post-activity inactivity threshold;
- unchanged 120000 ms absolute provider timeout ceiling;
- one identical safe fresh retry maximum for a stalled canonical round;
- one canonical rebase maximum after a repeated eligible stall.

Exact thresholds must be centralized and validated.

Permanent tests must use a fake clock/scripted provider so timing tests complete quickly and deterministically.

### Activity contract

Prove:
- request start begins first-evidence timing;
- semantic provider events refresh liveness;
- adapter-level bounded activity heartbeat can refresh liveness without exposing raw payloads;
- no activity after the configured threshold aborts only that provider attempt;
- user cancellation wins over watchdog classification;
- timer/controller cleanup leaves no later aborts or resource leaks;
- the 120000 ms absolute timeout remains a final ceiling.

### Safe fresh retry

Re-prove P2 safety:
- no completed response;
- no branch tool execution;
- no assistant commit;
- no ambiguous side effect;
- provisional text/tool proposals discarded;
- failed response ID not reused;
- retry consumes ordinary retry/provider/run budget;
- only one stall-specific identical retry occurs.

### Canonical rebase

Script a structured-task-shaped round with valid current evidence and prove:
- repeated eligible stall triggers rebase instead of a second identical retry;
- failed provider-native continuation ID is not reused;
- rebuilt request derives from canonical George state/evidence;
- current objective, mission card, valid observations, unresolved failure state, and permissions remain represented;
- completed prior-round tool evidence required to continue is preserved in bounded provider-facing form;
- no model claim becomes canonical state;
- ordinary unsupported/reconstruction-unsafe cases terminate instead of inventing state.

### Context-pressure routing

Cover both branches.

**Low pressure**
- repeated stall;
- current request estimate below effective soft-pressure threshold;
- no semantic compaction;
- one canonical rebase;
- success or truthful provider-stall termination.

**High pressure**
- repeated stall;
- current request estimate at/above effective soft-pressure threshold;
- safely compactable completed history exists;
- at most one stall-pressure compaction/reduction;
- checkpoint provenance remains valid;
- one canonical rebase.

Also prove:
- continuation/request estimate rather than only initial context size influences pressure;
- critical current/task/recovery evidence cannot be summarized away;
- no compactable history does not permit unsafe truncation.

### Compactor recursion guard

Using a scripted compactor/provider, prove:
- stall-triggered semantic compaction gets one bounded attempt;
- compactor stall/failure cannot recursively invoke the normal provider stall ladder;
- failure is observable;
- recovery either continues with a safe non-compacted rebase or terminates;
- compaction attempts/checkpoints remain within Phase 5 budgets.

### Terminal semantics

Prove:
- original stall + fresh retry stall + rebase stall => provider-class terminal failure;
- structured TaskState is failed/blocked according to current task semantics, not falsely `budget_exhausted`;
- actual stage/run-budget exhaustion still reports `budget_exhausted`;
- bounded diagnostics include attempt/recovery/pressure classification without raw sensitive payloads.

### Duplicate/no-progress preservation

Prove:
- provisional discarded tool proposals do not increment executed-tool/duplicate-read state;
- completed repeated unchanged reads still trip the existing duplicate/no-progress guard;
- a genuine duplicate/no-progress failure is not rewritten as provider stall.

### TUI/derived work evidence

Prove derived presentation can surface:
- suspected stall;
- retry;
- request rebase;
- compaction when used;
- terminal stall;

without becoming execution authority.

## P2 — deterministic/integration qualification

Run one full deterministic qualification pass after P1.

Required focused coverage:
- provider adapter timeout/cancellation/SSE tests;
- provider activity heartbeat/watchdog tests;
- agent-loop retry/recovery tests;
- Phase 5 compaction and run-budget tests;
- P1 mission-card/evidence freshness/no-repeat regressions;
- P2 safe incomplete-response recovery regressions;
- structured-task/task-stack tests;
- qualification/live-work evidence tests;
- TUI/work projection tests affected by new recovery states;
- Phase 5 and Phase 9 integration floors;
- `npm run typecheck`;
- `npm run test:runner`;
- `npm test`;
- `git diff --check`.

Qualification must record:
- selected watchdog constants;
- absolute timeout unchanged;
- max stall-specific fresh retries;
- max canonical rebases;
- compactor recursion behavior;
- package `0.9.10`;
- no root `package-lock.json`.

Do not run the official greeting/three-file/Gate A/B2/C2 final sweep in this correction.

## P3 — correction closeout

Evidence-only.

Create:
`docs/tasks/c9-provider-stall-recovery/closeout.md`

Decision table:
- Provider Stall Watchdog Qualified;
- First-Evidence Detection Qualified;
- Post-Activity Inactivity Detection Qualified;
- Absolute Timeout Preserved;
- Replay-Safe Fresh Retry Qualified;
- Canonical Rebase Qualified;
- Low-Pressure No-Compaction Path Qualified;
- High-Pressure Compaction Path Qualified;
- Compactor Recursion Guard Qualified;
- Provider-Stall Terminal Classification Qualified;
- Duplicate/No-Progress Preservation Qualified;
- Cancellation Qualified;
- TUI/Observability Qualified;
- Phase 5 Reliability Floors Green;
- c9-final-live-convergence P1/P2 Floors Green;
- Broad Suite;
- Historical Interrupted P3 Preserved;
- Remaining Blocking Failure Count;
- Overall `c9-provider-stall-recovery` Qualified;
- Final Five-Workload Sweep Ready To Rerun.

Ready-to-rerun = Yes only when deterministic/integration correction floors are Green and there is no blocking safety/recovery regression.

If ready, state exactly:

`next action: npm run codex:phase -- c9-final-live-convergence --closeout`

Do not run that command in P3.

Do not owner-close Phase 9.
