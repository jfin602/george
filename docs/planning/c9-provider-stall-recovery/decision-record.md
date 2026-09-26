# Correction 9 Decision Record — Provider Stall Recovery

Status: **APPROVED DIRECTION — ACTIVE PHASE 9 INSERTED CORRECTION**

Date: 2026-09-26

Correction: `c9-provider-stall-recovery`

Package boundary: `0.9.10` unchanged.

Parent qualification chain:
- `c9-final-live-convergence` P1 — deterministic mission-card alignment and convergence budgets — completed;
- `c9-final-live-convergence` P2 — safe incomplete provider response recovery — completed;
- `c9-final-live-convergence` P3 — first final five-workload qualification attempt — interrupted during Gate A and preserved as historical evidence;
- final P3/P4 rerun deferred until this correction is qualified.

## Trigger

The interrupted Gate A attempt exposed a provider-liveness defect that is distinct from the P2 replay-safety defect.

Observed local LM Studio behavior included:
- a continuation request beginning at approximately 13:07:00 local time;
- prompt processing still only around 57% after roughly 51 seconds, with about 2,048 prompt tokens processed;
- client disconnect at the 120000 ms provider timeout;
- a fresh retry beginning immediately afterward with high LCP reuse (`f_sim_best ~= 0.924`) and completing materially faster;
- repeated provider recovery activity contributing to an approximately 18-minute qualification run before manual interruption.

The exact internal LM Studio prompt-progress percentages are server diagnostics, not an API George can depend on. George can, however, observe request start, provider events, completion, elapsed time, cancellation, canonical effects, context diagnostics, and retry state.

## Decision — separate stall detection from absolute timeout

The existing 120000 ms request timeout remains an absolute emergency ceiling.

It is no longer the only liveness detector.

George must add an application-owned provider stall watchdog that distinguishes:
- awaiting first provider evidence;
- response in progress;
- response completed.

The watchdog is provider-independent. Provider adapters may expose bounded activity heartbeats where their wire protocol allows it, but recovery policy remains in application/core behavior.

The first implementation must use explicit deterministic configuration rather than an adaptive historical-latency model. Initial policy should be conservative relative to the recorded local Qwen timings:
- suspected-stall visibility may occur before recovery;
- recovery-triggering first-evidence inactivity must remain below the 120000 ms absolute ceiling while allowing legitimately slow local prefill;
- post-start inactivity must be separately bounded;
- exact constants must be centralized, validated, testable, and recorded in qualification evidence.

Do not silently convert the existing absolute timeout into a much smaller global timeout.

## Decision — bounded recovery ladder

A stalled/incomplete provider branch is eligible for transparent recovery only when the existing replay-safety rules prove:
- the provider response did not complete;
- no tool proposal from that failed branch executed;
- no canonical assistant response committed;
- no ambiguous local/external/remote effect occurred;
- cancellation/policy/configuration does not prohibit recovery;
- recovery/run budgets remain available.

For one canonical provider round, stall recovery is bounded to:

`original attempt -> at most one identical fresh retry -> at most one canonical rebase attempt -> terminate`

### Fresh retry

The first eligible stall/incomplete failure may receive one fresh retry from the same canonical pre-round state.

The failed branch's:
- provisional text;
- provisional tool proposals;
- incomplete response ID;
- provider-native continuation state

remain diagnostic evidence only and are never executed or promoted into canonical transcript/state.

### Canonical rebase

If the eligible fresh retry also stalls, George must not issue another identical retry.

Where the current application-owned stage can safely reconstruct the request, George may perform one provider-independent canonical rebase:
- discard the failed provider-native continuation branch/response ID;
- rebuild bounded provider-facing input from George-owned canonical task/turn state;
- include current mission-card/alignment projection where applicable;
- include still-valid observed evidence and completed prior-round tool results needed for the current objective;
- preserve unresolved failure/recovery evidence;
- preserve effective permissions/stops;
- preserve current user intent;
- keep canonical session/TaskState/tool evidence authoritative.

Structured Phase 9 implementation/correction stages are the required qualification target for this rebase seam.

Ordinary turns must not gain unsafe inferred replay authority merely to generalize the feature. If a request cannot be safely reconstructed, terminate truthfully instead of guessing.

## Decision — context pressure is a recovery input, not a stall diagnosis

A provider stall does not prove context overload.

Stall recovery must evaluate current provider-facing pressure using the actual current request estimate/effective profile, not only the initial assembled-context size.

When repeated stall occurs:

- **low pressure:** canonical rebase without semantic compaction, then one bounded attempt;
- **high pressure + compactable completed history:** a single bounded stall-pressure compaction/reduction may feed the canonical rebase;
- **high pressure without safely compactable history:** rebase with deterministic safe reduction/selection if already supported, otherwise terminate explicitly rather than silently dropping critical evidence.

Compaction must preserve Phase 5 authority:
- canonical history is not deleted;
- current user intent, George invariants, TaskState, mission card, unresolved failures, permission/recovery state, and required evidence are not summarized away;
- checkpoint provenance remains versioned/bounded.

## Decision — no recursive unhealthy-provider recovery

George's default semantic `ProviderContextCompactor` uses the selected provider.

Therefore a stall-triggered compaction attempt cannot itself enter the same automatic stall-retry/rebase ladder recursively.

If semantic compaction is attempted during provider-stall recovery:
- it is one bounded compaction attempt;
- it uses a strict independent timeout/budget;
- failure/stall is recorded;
- no compaction retry recursion occurs;
- George either performs a safe non-compacted rebase if still valid or terminates truthfully.

A future helper model may later own compaction, but helper inference remains out of Phase 9.

## Decision — provider activity observation

Application stall detection must not require LM Studio-specific log scraping.

The provider contract may expose a minimal non-authoritative activity heartbeat/callback so an adapter can indicate bounded wire activity that does not otherwise become a semantic `ProviderEvent`.

For LM Studio, receipt of valid SSE frames may refresh activity even when a function-call assembler has not yet emitted a complete tool call.

Do not persist raw SSE payloads or emit unbounded heartbeat event spam.

## Decision — truthful terminal classification

Repeated provider liveness failure must remain a provider-class failure.

It must not surface as TaskState `budget_exhausted` unless an actual George-owned run/stage budget was the terminal cause.

A structured task may finish in ordinary failed state with bounded provider-stall diagnostics such as:
- attempts made;
- stall phase;
- elapsed/inactivity evidence;
- current request estimate/profile;
- context pressure classification;
- recovery action(s);
- compaction attempted/not attempted;
- provisional side effects executed: no/yes.

No raw prompts, file bodies, tool bodies, provider streams, or private reasoning are committed.

## Decision — duplicate/no-progress remains independent

Discarded incomplete provider branches do not count as executed tool behavior merely because they streamed provisional tool proposals.

However:
- completed provider rounds;
- actual tool requests;
- rejected duplicate reads;
- executed unchanged replay-safe reads

remain real convergence evidence.

The correction must not weaken the strict duplicate/no-progress guard or relabel genuine model looping as provider stall.

## User-facing behavior

The TUI/work projection should distinguish:
- normal `Thinking...`;
- suspected provider stall;
- provider retry;
- canonical request rebuild/rebase;
- stall-pressure compaction when actually used;
- terminal provider-stall failure.

Presentation remains derived and cannot control recovery policy.

## Preserved boundaries

Do not:
- change package version from `0.9.10`;
- increase the 120000 ms absolute timeout merely to pass;
- introduce helper/utility inference;
- edit frozen live-work instruments or hidden acceptance;
- weaken replay safety, permissions, SHA/framing, containment, cancellation, recovery, TaskState, mission-card, evidence freshness, or duplicate/no-progress contracts;
- rewrite the interrupted P3 attempt;
- treat LM Studio developer logs as canonical application events;
- owner-close Phase 9 inside this correction.

## Rerun consequence

After this correction's deterministic/integration qualification and evidence-only closeout are Green:

`npm run codex:phase -- c9-final-live-convergence --closeout`

is the intended rerun path.

The runner may reuse the already committed `c9-final-live-convergence` P1/P2 prefix by commit subject and execute a new P3 attempt followed by P4 closeout. The interrupted uncommitted P3 attempt remains historical evidence and is not counted as a completed prompt.
