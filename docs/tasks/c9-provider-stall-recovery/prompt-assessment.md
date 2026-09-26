# c9-provider-stall-recovery Prompt Assessment

Status: READY FOR INSERTED PHASE 9 CORRECTION

Correction: `c9-provider-stall-recovery`  
Roadmap phase: 9  
Required unchanged package version: `0.9.10`

## Trigger

The first `c9-final-live-convergence` P3 attempt was interrupted during Gate A after repeated provider stalls/retries consumed operationally unacceptable wall-clock time.

Owner-supplied LM Studio developer logs showed:
- one request still in prompt processing after roughly 51 seconds;
- the same request eventually reaching George's 120000 ms provider timeout;
- a fresh retry receiving high LCP reuse and completing materially faster;
- the overall qualification run continuing for about 18 minutes before manual interruption.

This proves:
1. replay-safe retry is useful;
2. replay-safe retry alone is insufficient;
3. not every stall is caused by large context;
4. George needs an explicit liveness/recovery ladder and a truthful terminal provider failure.

## Current relevant architecture

At the baseline available to planning:
- `src/provider/lm-studio.ts` owns normalized Responses/SSE wire behavior and the 120000 ms absolute timeout;
- `src/application/one-turn.ts` owns canonical provider rounds, retry decisions, continuation state, tool execution, context estimates, and duplicate/no-progress state;
- `src/application/retry.ts` owns bounded retry count/backoff;
- Phase 5 compaction is provider-facing derived state;
- `ProviderContextCompactor` currently uses the selected provider;
- Phase 9 P1 mission-card/evidence freshness work supplies the intended structured-state projection seam;
- Phase 9 P2 refines replay-safe retry for incomplete provider branches.

Implementation agents must inspect the actual local HEAD because the owner has completed P1/P2 locally and those source commits may be newer than the planning branch snapshot.

## Required behavior

### Liveness detection

Do not replace the 120000 ms provider timeout with one smaller blunt timeout.

Add explicit provider liveness policy for:
- awaiting first evidence;
- active response with no recent provider/wire activity;
- completed response.

Initial intended policy:
- suspected-stall visibility around 60000 ms without useful activity;
- recovery-triggering first-evidence inactivity around 90000 ms;
- recovery-triggering post-activity inactivity around 60000 ms;
- 120000 ms remains the absolute emergency ceiling.

Exact constants must be centralized, validated, deterministic, testable, and may be adjusted only if current code/runtime evidence shows a safer nearby value.

### Recovery ladder

One canonical round may perform only:

`original -> one identical safe fresh retry -> one canonical rebase -> terminal provider failure`

No fourth transparent attempt.

Fresh retry remains subject to P2 replay-safety classification.

Canonical rebase must:
- discard failed provider-native continuation identity;
- rebuild from George-owned canonical state/evidence;
- preserve current task objective, mission card, valid observations, completed prior-round tool evidence needed to continue, unresolved failures, stops, permissions, and user intent;
- avoid inventing state where reconstruction is unsafe.

Structured Phase 9 stages are the required rebase target. Ordinary turns may fail truthfully rather than gaining unsafe inferred reconstruction.

### Compaction routing

A stall is not proof of context pressure.

Use the current request estimate/effective context profile:
- low pressure -> rebase without semantic compaction;
- high pressure + safely compactable completed history -> at most one stall-pressure compaction/reduction before rebase;
- no safely compactable history -> do not silently drop critical state.

Because the default compactor uses the same provider, stall-triggered semantic compaction must not recursively enter the provider stall-recovery ladder.

### Failure truth

After exhausted stall recovery:
- error code remains provider-class;
- bounded cause/evidence identifies stall phase/recovery actions;
- TaskState must not become `budget_exhausted` unless a real George budget actually exhausted.

### Preserve convergence safeguards

Discarded provisional tool proposals are not executed behavior.

But actual completed-round duplicate reads and no-progress attempts remain real evidence and must continue to trip the strict guard.

## Prompt decomposition

### P1 — Sol High

Implement watchdog/activity/recovery/rebase/pressure routing, observability, and permanent regressions.

This crosses provider lifecycle, canonical agent-loop state, context compaction, structured execution, cancellation, and TaskState failure semantics, so High is justified.

### P2 — Sol Medium

Evidence/qualification implementation prompt.

Run focused deterministic/integration floors and broad suite once. Record a qualification report. Do not run the official live five-workload sweep.

### P3 — Sol Medium

Evidence-only correction closeout. If Green, point directly back to the existing final-convergence runner.

## Preserved boundaries

Do not:
- change package version;
- increase absolute provider timeout;
- add helper inference;
- edit live instruments/hidden acceptance;
- weaken permissions/recovery/SHA/framing/containment;
- weaken duplicate/no-progress;
- rewrite the interrupted final-sweep evidence;
- scrape LM Studio logs as runtime authority;
- owner-close Phase 9.
