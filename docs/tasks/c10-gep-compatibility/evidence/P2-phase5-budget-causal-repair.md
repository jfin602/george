# Correction 10 P2 — Phase 5 budget causal isolation and bounded repair

Date: 2026-09-27

Pre-task HEAD: `8c26b80a0f0539122e85992d414fa49e1ffb728d`

Package: `0.10.12` unchanged

Runtime: Node `v26.10.0`, npm `11.19.1`

## Historical causal matrix

Each candidate was a clean detached worktree. The installed dependency tree was hard-linked as an ignored real `node_modules` directory; no install ran, no package lock was created, and no historical source or test was edited. The exact command was:

```text
node --test --test-name-pattern='^Phase 5 long workflow compacts durable Phase 4 history, continues safely, and reopens intact$' test/integration/phase5-qualification.test.ts
```

| SHA | Package | Node | Result | Terminal state | Provider rounds | Tool / process executions | Compactions | Exhausted dimension |
| --- | --- | --- | --- | --- | ---: | --- | ---: | --- |
| `a9c5175b6c45a218a7eb5997514b88ce679fc573` | `0.10.12` | `v26.10.0` | Green, 1/1 | `completed` | 3 | 3 / 2 | 2 | none |
| `73885cfc4c09889db876dc4c75af1645ee88e4a9` | `0.10.12` | `v26.10.0` | Green, 1/1 | `completed` | 3 | 3 / 2 | 2 | none |
| `99e5267ca0bc3961003fc0c5877ffbec3f22fa3d` | `0.10.12` | `v26.10.0` | Green, 1/1 | `completed` | 3 | 3 / 2 | 2 | none |
| `384091366fcd1addabf0a2cff456a6ece77f7875` | `0.10.12` | `v26.10.0` | Not Green, 0/1 | `budget_exhausted` | 1 | 3 / 2, including post-failure validation | 1 | fixed provider-input continuation envelope |

For Green candidates, the passing test itself proves the three scripted requests, two model-requested tools plus one George-owned validation, two processes, and two compactions. The P3 failure stops before the second turn. A current diagnostic reproduction of the same Human-mode boundary observed one provider request, two model-requested tools, one process, and one compaction before the failure; George-owned validation then ran, bringing the workflow totals to three tools and two processes.

An initial invocation without dependencies failed during module loading with `ERR_MODULE_NOT_FOUND` before the test body ran. It is setup evidence only and is not represented as a candidate result above. The clean dependency-linked rerun produced the matrix.

First bad boundary: `99e5267` Green -> `3840913` Not Green, the P3 GEP commit.

## Current exhausted-dimension trace

The pre-repair exact current test ended:

```text
Fixed context profile p5-small cannot continue safely: estimated continuation context 2224 tokens above its 2200 token provider-input budget.
```

The exhausted dimension is the fixed-profile continuation provider-input envelope, not a `RunBudget` dimension. No `budget.exhausted` event exists for this failure, so there is no `budget.exhausted.dimension` or exhausted-event snapshot to report. The closest pre-failure `budget.state` snapshot was:

```text
limits: DEFAULT_RUN_BUDGET unchanged
consumed:
  providerAttempts: 1
  toolExecutions: 2
  retryAttempts: 0
  compactionAttempts: 1
  compactionCheckpoints: 1
  processExecutions: 1
  processRuntimeMs: 85
  contextTokens: 2064
  providerInputTokens: 7
  providerOutputTokens: 1
```

Wall-clock and process runtime are observations from the diagnostic run, not fixed thresholds. After the budget-coded turn failure, the workflow still ran its required validation, ending at three tool executions, two process executions, and 146 ms observed cumulative process runtime.

Surrounding evidence:

- context: mode `fixed`, profile `p5-small`, estimated 2,064 / 2,200 provider-input tokens, 136 headroom, soft pressure true; category tokens were core 50, project 69, tools 1,085, task 19, conversation 829;
- compaction: one hard-pressure request completed, checkpoint `start=0`, `end=12`, `beforeTokens=2454`, `afterTokens=4`; zero compaction failures; the second pressure checkpoint was never reached;
- continuation: estimate 2,224 against the fixed 2,200 ceiling; zero envelope-promotion events because fixed profiles cannot promote;
- provider: one completed attempt, zero retries, reported usage 7 input / 1 output tokens;
- execution before failure: two tool executions, one process execution, 85 ms process runtime; validation later passed;
- canonical safety: the write and process completed, provisional tool text stayed non-canonical, and the failure occurred before a continuation request.

## Causal producer and consumer

P3 added 105 characters of GEP-only fallback prose to the always-provider-visible `write_file` and `apply_patch` descriptions. `assembleContext()` includes normalized tool definitions in every mode, so Human-mode tool context increased by 27 estimated tokens even though the GEP protocol is Operation-only. That moved this fixed profile from the passing side of its continuation ceiling to 2,224 tokens.

The producer is `continuationPromotions()` in `src/application/one-turn.ts`: a fixed profile above its provider-input ceiling throws `GeorgeError('budget')` directly. The consumer is `CodingWorkflowApplicationService.execute()` in `src/application/coding-workflow.ts`, which maps a final `turn.failed` carrying code `budget` to `CodingWorkflowCompletion.terminalState = 'budget_exhausted'`. The run budget correctly emits no exhaustion event because none of its finite dimensions was exhausted.

## Bounded repair and permanent guard

The repair restores the two mutation descriptions to their pre-P3 wording. Operation mode already carries the complete GEP preference and legacy-fallback instruction in `GEORGE_OPERATION_PROTOCOL_V1`; repeating it in mode-independent tool descriptions was redundant. No budget, context envelope, adaptive profile, continuation ceiling, error classification, compaction assertion, or provider behavior changed.

The historical `p5-small` integration test remains the permanent fixed-profile guard and now explicitly asserts that the long turn emits neither `budget.exhausted` nor a budget-coded `turn.failed`. The exact test is Green again with both compactions, tool continuation, validation, canonical-history checks, provisional-text exclusion, and LocalSessionStore reopen assertions intact.

## Validation

| Gate | Command | Result |
| --- | --- | --- |
| Exact Phase 5 long workflow | exact command above on current Node 26 | Green, 1/1 |
| Reliability/context affected floor | `node --test test/unit/core/run-budget.test.ts test/unit/core/session-store.test.ts test/unit/context/index.test.ts test/unit/context/profile-selector.test.ts test/unit/application/one-turn.test.ts test/unit/application/coding-workflow.test.ts test/unit/application/recovery.test.ts test/unit/application/provider-stall.test.ts test/integration/phase5-qualification.test.ts` | Green, 116/116 |
| P1 GEP + frozen Phase 8 compatibility | `node --test test/unit/application/george-edit.test.ts test/unit/application/george-edit-loop.test.ts test/unit/application/phase8-structured-replay.test.ts test/unit/tools/mutation.test.ts` | Green, 23/23 |
| TypeScript | `npm run typecheck` | Green |
| Phase runner | `npm run test:runner` | Green, 90/90 |
| Diff hygiene | `git diff --check` | Green |

Root `package-lock.json` is absent. Package remains `0.10.12`.
