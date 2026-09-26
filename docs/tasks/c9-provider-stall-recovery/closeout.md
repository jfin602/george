# c9-provider-stall-recovery Closeout

Date: 2026-09-26  
Status: **QUALIFIED — FINAL FIVE-WORKLOAD SWEEP READY TO RERUN**

Package remains `0.9.10`. P1 is `88c3253697fafc244fd3a00320c2951c6e001f20`; P2 is `412c9935889d1992973c3ac0ac629e5be61a35a2`.

This is an evidence-only closeout. No production code, tests, frozen instruments, hidden acceptance, or preserved live evidence changed. The official greeting/three-file/Gate A/B2/C2 sweep was not run.

## Decision table

| Decision | Result | Evidence |
| --- | --- | --- |
| Provider Stall Watchdog Qualified | **Yes — Green** | Application-owned `ProviderAttemptWatchdog` and validated centralized policy; dedicated fake-time regressions Green. |
| First-Evidence Detection Qualified | **Yes — Green** | Production recovery threshold is `90000 ms`; no-evidence scripted recovery passed. |
| Post-Activity Inactivity Detection Qualified | **Yes — Green** | Production inactivity threshold is `60000 ms`; semantic events and payload-free provider activity refresh it. |
| Absolute Timeout Preserved | **Yes — Green** | Provider absolute timeout remains `120000 ms`; policy validation requires watchdog thresholds below it. |
| Replay-Safe Fresh Retry Qualified | **Yes — Green** | At most one identical stall retry; incomplete branch text/tool proposals are discarded and never executed or committed. |
| Canonical Rebase Qualified | **Yes — Green** | At most one structured rebase; failed incomplete response IDs are cleared, and the rebuilt request uses George-owned input, mission card, permissions, completed evidence, and unresolved recovery state. |
| Low-Pressure No-Compaction Path Qualified | **Yes — Green** | Repeated low-pressure stall performs one rebase with zero compactor calls. |
| High-Pressure Compaction Path Qualified | **Yes — Green** | Current aligned-request pressure may trigger at most one bounded `stall-pressure` reduction before one rebase; checkpoint provenance remains derived and canonical history remains authoritative. |
| Compactor Recursion Guard Qualified | **Yes — Green** | Stall-pressure compaction has one independent `30000 ms` attempt and cannot enter provider retry/rebase recovery; failure safely falls back or terminates. |
| Provider-Stall Terminal Classification Qualified | **Yes — Green** | Exhausted stall recovery ends with provider-class failure, not `budget_exhausted`; real RunBudget exhaustion remains budget-class. |
| Duplicate/No-Progress Preservation Qualified | **Yes — Green** | Discarded provisional calls do not affect tool accounting; completed equivalent unchanged reads still trip the strict existing guard. |
| Cancellation Qualified | **Yes — Green** | Caller abort wins over watchdog classification, schedules no retry, emits no terminal-stall event, and leaves no watchdog timers. |
| TUI/Observability Qualified | **Yes — Green** | Suspected stall, retry, rebase, pressure compaction, and terminal stall are bounded derived projections; persisted diagnostics omit raw prompts, payloads, prose, file/tool bodies, environment data, and secrets. |
| Phase 5 Reliability Floors Green | **Yes** | P2 affected floor and Phase 5 integration passed; closeout recheck included the Phase 5 integration floor. |
| c9-final-live-convergence P1/P2 Floors Green | **Yes** | Mission-card determinism/bounds, evidence freshness/reuse, hard convergence ceilings, strict duplicate/no-progress, efficiency separation, and safe incomplete-response replay regressions remain Green. |
| Broad Suite | **Not Green, nonblocking** | P2's single `npm test` run: 443 total, 441 passed, 1 failed, 1 skipped. The failure is the retained intermittent progressive-final-reveal identity, which passed in the focused affected floor; the skip is the expected non-TTY native OpenTUI case. No blocking affected-system regression was found. |
| Historical Interrupted P3 Preserved | **Yes** | The committed greeting, three-file, and interrupted Gate A schema-2 artifacts remain byte-unchanged from preserved commit `5013c0245b32ba2ab3a80372d8e6aa59aafbc497`; they are historical evidence, not the final qualifying sweep. |
| Remaining Blocking Failure Count | **0** | No blocking deterministic stall, replay, permission, recovery, context-pressure, TaskState, mission-card, convergence, or bounded-evidence failure remains. |
| Nonblocking Evidence Gaps | **2** | Native OpenTUI behavior was not exercised in the non-TTY P2 environment. Live LM Studio stall/retry/rebase behavior was deliberately not exercised here and remains for the final five-workload rerun. |
| Overall `c9-provider-stall-recovery` Qualified | **Yes** | Deterministic correction behavior and inherited safety/integration floors are Green; aggregate broad-suite truth and scoped gaps remain explicit. |
| Final Five-Workload Sweep Ready To Rerun | **Yes** | Focused recovery, replay/permission/recovery safety, mission-card/evidence/convergence, and Phase 5/9 integration floors are Green, with no blocking broad regression or correction-local deterministic Evidence Gap. |

## Audit findings

- The recovery ladder is finite: original attempt -> one identical replay-safe retry -> one canonical rebase -> provider-class termination. A repeated stall cannot fall into the generic retry loop.
- The activity seam is provider-independent and non-authoritative. LM Studio only reports receipt of valid SSE frames through `onActivity`; it does not own watchdog or recovery policy and exposes no payload through that callback.
- Structured rebase is explicitly enabled by the structured service and recomputes the mission card from current application state. Ordinary reconstruction-unsafe turns terminate rather than inventing state.
- Timer cleanup covers completion, failure, cancellation, stale watchdog generations, and one-shot compactor timeout/controller cleanup.
- P1 introduced no helper/utility-model inference and did not change dependency metadata, frozen live-work instruments, hidden acceptance, package version, or the absolute provider timeout. Root `package-lock.json` remains absent.

## Validation evidence

P2 recorded:

- focused stall suite: 12 passed, 0 failed, 0 skipped;
- complete affected floor: 258 passed, 0 failed, 0 skipped;
- phase runner: 90 passed, 0 failed, 0 skipped;
- typecheck and `git diff --check`: Green;
- broad suite: 441 passed, 1 retained intermittent failure, 1 non-TTY skip.

Closeout recheck on the repository's installed Node `v26.10.0` runtime:

`node --experimental-ffi --test test/unit/application/provider-stall.test.ts test/unit/application/structured-task.test.ts test/unit/application/progress.test.ts test/unit/qualification/live-work.test.ts test/integration/phase5-qualification.test.ts test/integration/phase9-qualification.test.ts`

Result: **55 passed, 0 failed, 0 skipped**.

This closeout does not owner-close Phase 9 or open Phase 10.

`next action: npm run codex:phase -- c9-final-live-convergence --closeout`
