# c9-provider-stall-recovery P2 qualification report

Date: 2026-09-26. P1 baseline parent: `5013c0245b32ba2ab3a80372d8e6aa59aafbc497`. P1 commit: `88c3253697fafc244fd3a00320c2951c6e001f20` (`c9-provider-stall-recovery/P1: Provider stall watchdog and bounded recovery`). Package: `0.9.10`. Qualification runtime: Node `v26.10.0`; npm `11.19.1`.

No production or test repair was required in P2. The official greeting/three-file/Gate A/B2/C2 live sweep was not run.

## Qualified policy

| Setting | Qualified value |
| --- | ---: |
| Suspected-stall inactivity | `60000 ms` |
| First-evidence recovery | `90000 ms` |
| Post-activity inactivity recovery | `60000 ms` |
| Absolute provider timeout | `120000 ms` unchanged |
| Stall-pressure compactor timeout | `30000 ms` |
| Stall-specific identical fresh retries | `1` maximum |
| Canonical request rebases | `1` maximum |

Stall-pressure semantic compaction is one-shot and independently timed. It does not enter the provider retry/rebase ladder. Failure is recorded as `context.compaction.failed`; a safe non-compacted canonical rebase may proceed, otherwise recovery terminates truthfully. Canonical history remains authoritative and compaction remains derived provider-facing state.

## Focused deterministic qualification

The dedicated fake-time/scripted-provider floor passed **12/12**, 0 failed, 0 skipped:

`node --experimental-ffi --test test/unit/application/provider-stall.test.ts`

The complete affected floor passed **258/258**, 0 failed, 0 skipped. It covered the affected provider adapter; agent loop, recovery, and retry behavior; context assembly/compaction/profile selection; run budgets; structured task/task stack/state/parser behavior; qualification/live-work evidence; focused TUI/work projection; and Phase 5/Phase 9 integration:

`node --experimental-ffi --test test/unit/provider/lm-studio.test.ts test/unit/application/{one-turn,provider-stall,recovery,coding-workflow,phase8-structured-replay,structured-task,structured-task-stack,progress}.test.ts test/unit/context/{index,profile-selector,profiler}.test.ts test/unit/core/{run-budget,session-store}.test.ts test/unit/tasks/{parser,state,stack-state}.test.ts test/unit/qualification/{live-work,preflight,sweep}.test.ts test/unit/tui/{app,composition}.test.ts test/integration/{agent-loop,phase5-qualification,phase9-qualification}.test.ts`

| Required proof | Result and deterministic evidence |
| --- | --- |
| 1. First-evidence stall precedes the absolute timeout | **Green.** Fake time triggers recovery at `10 ms` under the test policy while the asserted absolute ceiling remains `120000 ms`; production values are `90000 < 120000`. |
| 2. Slow active traffic does not false-stall | **Green.** Repeated provider `onActivity` heartbeats refresh liveness, produce no stall events, and complete normally. |
| 3. Started/text/tool-proposal stalls preserve discard safety | **Green.** Scripted response-start, provisional-text, and provisional-tool-call branches are discarded; provisional text is absent from the transcript and proposals never execute. |
| 4. One identical stall retry maximum | **Green.** Each eligible original attempt schedules exactly one fresh retry; repeated stall moves to rebase or terminal failure instead of a second identical retry. |
| 5. At most one canonical rebase | **Green.** Repeated eligible stall emits one `provider.rebase.started`; a stalled rebase terminates after three total attempts. |
| 6. Failed native IDs are not reused | **Green.** Fresh initial attempts have no failed continuation; rebase clears continuation; completed prior-round IDs may be reused only for the identical safe retry and failed incomplete IDs never are. |
| 7. Low-pressure rebase avoids compaction | **Green.** Low-pressure repeated stall rebases once with zero compactor calls and no compaction event. |
| 8. High-pressure rebase is bounded to one reduction | **Green.** Completed provider-visible tool evidence drives one `stall-pressure` compaction and one rebase; checkpoint provenance remains valid. |
| 9. Current continuation/request estimate affects pressure | **Green.** Continuation tests prove usage/tool-result/protocol estimates update the next request and promote the effective envelope; the stall test classifies the current aligned request against the effective profile rather than the initial assembly alone. |
| 10. Stall compaction cannot recurse into recovery | **Green.** A blocking scripted compactor is aborted by its independent timeout; provider calls remain the original/retry/rebase sequence only. |
| 11. Compactor failure is bounded and auditable | **Green.** Exactly one attempt emits one bounded failure and a rebase event with `compaction=failed`; timers are cleared. |
| 12. User cancellation wins | **Green.** Caller abort ends with `turn.cancelled`, no terminal-stall event, no retry, and no pending watchdog timer. |
| 13. Timers/controllers clean up | **Green.** Completion, failure, and cancellation leave zero fake-scheduler tasks; advancing stale time cannot abort a completed attempt. |
| 14. Final repeated stall is provider-class | **Green.** Rebase exhaustion and reconstruction-unsafe ordinary turns end `turn.failed` with error code `provider`. |
| 15. Final stall is not `budget_exhausted` | **Green.** Repeated stall emits terminal provider evidence without a budget terminal state. |
| 16. Genuine RunBudget exhaustion remains budget exhaustion | **Green.** A one-attempt provider budget emits `budget.exhausted` and terminates with error code `budget`. |
| 17. Discarded proposals do not contaminate no-progress state | **Green.** Provisional tool calls emit no `tool.requested`, execute zero tools, and never reach the completed-tool accounting path. |
| 18. Genuine duplicate/no-progress remains bounded | **Green.** The inherited structured duplicate-read regression executes the unchanged read once and terminates at the configured duplicate/no-progress limit. |
| 19. Mission card, TaskState, permissions, SHA/framing, and recovery authority remain intact | **Green.** The inherited final-convergence P1 mission-card/evidence/freshness/convergence tests and Phase 9 integration floor pass; rebuilt requests retain the current structured objective, mission card, effective permissions, valid completed evidence, and pending validation authority. |
| 20. Bounded evidence excludes raw bodies | **Green.** Schema-2 artifact tests retain only bounded stall/rebase fields and reject raw prompt/instruction, provider payload, assistant prose, tool/file/patch bodies, environment data, and secrets. |

## Inherited floors

- Phase 5 reliability floor: **Green**. `test/integration/phase5-qualification.test.ts` passed, with compaction, retry, recovery, run-budget, session, and cancellation unit coverage included in the 258-test affected floor.
- `c9-final-live-convergence` P1 mission-card/evidence/convergence floor: **Green**. Mission-card determinism/bounds, per-round refresh, path-aware freshness, no-repeat/duplicate limits, hard-stage ceilings, and efficiency-state separation passed.
- `c9-final-live-convergence` P2 replay-safe incomplete-provider floor: **Green**. No-evidence, response-start, provisional-text, provisional-tool-call, cancellation, continuation retry, ambiguous-effect, and exhaustion regressions passed.
- Phase 9 integration: **Green**. Frozen v1/v2 identity, structured projection/state, task slicing, permissions, evidence, and inherited deterministic floors passed.
- TUI/work projection focused floor: **Green**. Provider suspected-stall, retry, rebase, compaction, and terminal recovery states project as bounded derived status; focused TUI/application composition passed within the 258-test floor.

## Static, runner, broad, and hygiene results

- `npm run typecheck`: **Green**.
- `npm run test:runner`: **90 passed, 0 failed, 0 skipped**.
- The single required `npm test` run: **443 total; 441 passed, 1 failed, 1 skipped**. Aggregate broad state is **Not Green**. The failure was `committed final answers reveal progressively without delaying canonical durability, and cancellation stops the reveal`, the same previously recorded intermittent OpenTUI progressive-reveal identity. It passed in the focused affected floor earlier in this qualification. The skipped test was `native OpenTUI launches and restores a real Node 26 terminal` because the runner was non-TTY. The broad run was not repeated.
- `git diff --check`: recorded after this report as Green.
- Root `package-lock.json`: absent. Package version remains exactly `0.9.10`.
- P1 changed only its recorded 18 source/test files. P2 adds only this report; it changes no production source, tests, fixtures, instruments, acceptance, dependency metadata, or lockfile.

## Remaining Not Green and Evidence Gaps

- **Not Green:** aggregate broad suite due to the retained intermittent progressive-final-reveal failure above. The focused affected TUI floor is Green, but the broad failure remains an observed failure and is not erased by the earlier pass.
- **Evidence Gap:** native OpenTUI behavior was skipped in the non-TTY environment.
- **Evidence Gap by scope:** no live LM Studio provider-stall/retry/rebase behavior was exercised in P2. The official final five-workload sweep is deliberately reserved for the later `c9-final-live-convergence` P3 rerun.
- No blocking deterministic provider-stall, replay-safety, permission, recovery, context-pressure, TaskState, mission-card, or bounded-evidence regression was found.
