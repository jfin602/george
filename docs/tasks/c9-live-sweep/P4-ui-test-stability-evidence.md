# c9 live sweep P4 UI/test-stability evidence

Status: **COMPLETE — ACTIONABLE UI TEST-STABILITY FAILURES REPAIRED**

Date: 2026-09-26

Pre-task HEAD: `2c66c867958d8746f5797093826c2b3b390cd4ab`

Package: `0.9.10` (unchanged)

P4 enumerated exactly the five P2 ledger entries whose `repairCluster` is `ui-test-stability`: four retained OpenTUI renderer failures and one historical sandbox-process intermittent. P3 changed only structured-stage guidance and its focused test, so it did not already repair a shared UI/process cause.

## Ledger dispositions

| P2 identity | Classification | Disposition |
| --- | --- | --- |
| `broad:streamed-answer-visibility` | test viewport/lifecycle defect | **Fixed** |
| `broad:inactive-task-text-rendering` | test viewport/lifecycle defect | **Fixed** |
| `broad:progressive-final-answer-reveal` | test viewport/lifecycle defect | **Fixed** |
| `broad:draft-preservation-rendering` | test viewport/lifecycle defect | **Fixed** |
| `deterministic:sandbox-process-historical-intermittent` | historical intermittent; no established cause | **Unresolved/intermittent** |

No P2 entry was already fixed by P3, environment-only, or not applicable.

## OpenTUI diagnosis and repair

The four P2 failures reproduced on supported Node `v26.10.0`. Canonical transcript/task/draft state and the pure presentation projections were correct. The common renderer fixture remained only 18 rows high after Phase 9 added the required persistent task header and Transcript/Task selector. At that height the retained fixed chrome and composer collapsed the content viewport into its border, so assertions for streamed text and inactive-task text could not observe content and the progressive-reveal predicate could never match.

This was a test-fixture defect, not a product semantic defect or an asynchronous reveal bound. The common behavior fixture now uses a 24-row terminal shape. Existing explicit resize tests still exercise 48x12 constrained rendering, scrollback, selection, draft preservation, and positive composer/view dimensions. No production OpenTUI behavior, reveal delay, assertion, draft behavior, approval behavior, final-response singularity, resize logic, or scrollback logic changed.

P3's broad characterization additionally exposed `tool activity, provider failure, cancellation, and teardown clear the thinking timer` through the same frame-wait surface. Approval tests also still used a fixed 50 ms delay before asking OpenTUI's renderer-only waiter to observe future application work. That waiter may correctly stop when the renderer is temporarily idle while Git/approval preparation is still running. The tests now synchronize on the actual `PendingApprovalPort.request` lifecycle before waiting for the corresponding frame. The affected assertions remain unchanged.

Permanent detector: `test/unit/tui/app.test.ts` retains the four original semantic assertions, the thinking-timer lifecycle assertions, approval allow/deny/cancel/framing/process/external/browser assertions, and explicit small-resize coverage. Five consecutive focused runs passed `35/35` each.

## Sandbox/process historical intermittent

The historical nested sandbox-process non-completion did not reproduce. The focused process/sandbox invocation passed `5/5`, including real Bubblewrap containment and nested repository Node/npm/test/typecheck/Git reads. The complete `npm test` run also passed the same sandbox identity. No startup/wait/cleanup/cancellation cause could be established, so P4 makes no process or sandbox code change and retains this entry as unresolved/intermittent rather than fabricating a repair.

## Preserved scope

- No official live workload ran.
- The P2 ledger and pre-repair artifacts remain unchanged; their SHA-256 values remain `c5330441...` and `75d6121f...`.
- Frozen live-work tasks, fixtures, metadata, and hidden acceptance have no diff; Phase 9 integration/immutability passed.
- No production source, dependency, runtime/profile setting, permission, sandbox containment, task grammar, provider behavior, or session behavior changed.
- Phase 9 remains open and Phase 10 is not opened.

## Validation

All executable validation used Node `v26.10.0` and npm `11.19.1`.

| Check | Result |
| --- | --- |
| Focused OpenTUI renderer | **Green: 35/35 passed**; five consecutive repetitions also passed `35/35` each |
| Process and sandbox | **Green: 5/5 passed** |
| Affected application/TUI/session plus Phase 9 integration/immutability | **Green: 102/102 passed** |
| Complete `npm test` | **413 passed, 0 failed, 1 skipped; 414 total** |
| Native real-TTY identity | **Evidence Gap:** skipped in the non-TTY environment; this is the separate `environment-only` ledger cluster |
| `npm run typecheck` | **Green** |
| `npm run test:runner` | **Green: 90/90 passed** |
| Package | **Green: exactly `0.9.10`** |
| Root `package-lock.json` | **Green: absent** |
| `git diff --check` | **Green** |

All actionable P2 `ui-test-stability` failures are repaired. The only retained entry in this cluster is the explicitly unresolved historical sandbox-process intermittent, which did not reproduce in P2 or P4.
