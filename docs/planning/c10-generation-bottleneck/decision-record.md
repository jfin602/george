# Correction 10 Decision Record — Generation Bottleneck

Status: **APPROVED DIRECTION — ACTIVE PHASE 10 CORRECTION**

Date: 2026-09-27

Correction: `c10-generation-bottleneck`

Package boundary: `0.10.12` unchanged.

Parent state:
- formal Phase 10 closeout exists at `docs/phase-10-closeout.md`;
- Phase 10 is Not Green / not ready for Phase 11 planning;
- the post-closeout Transcript/Task presentation repair is commit `a9c5175b6c45a218a7eb5997514b88ce679fc573`;
- owner-run Express implementation/redesign smoke work exposed the live failures that trigger this correction.

## Trigger

The live Express work exposed one coupled generation/failure chain and one related protocol inefficiency.

Observed behavior:

1. prompt/context size was not near the physical or provider-input limit;
2. stable-prefix/cache reuse was often strong, including exact-prefix retries;
3. Qwen generated several hundred tokens at approximately 6–9 tokens/second for mutation-heavy rounds;
4. healthy output continued until George's 120000 ms absolute provider timeout aborted the response;
5. replay-safe recovery discarded the incomplete response and regenerated the mutation from the same canonical state;
6. repeated long generations therefore multiplied wall time without advancing the workspace;
7. after terminal provider failure during an active work unit, TaskState terminalization cleared `currentWorkUnit` but left the corresponding `workUnits[Wn]` state `active`;
8. durable-session validation correctly rejected that impossible state with `task active work unit is invalid`.

The same run also showed why the current Operation protocol is not yet an efficient mutation language: `apply_patch` requires the model to reproduce the path, full SHA-256, exact old text, exact new text, and JSON framing even though George already holds the read snapshot.

## Decision — one correction stack

These issues are repaired together because they form one operational chain:

`verbose mutation generation -> healthy generation exceeds old absolute ceiling -> incomplete branch recovery/retry -> terminal provider failure -> invalid active-work-unit terminal state`

The correction owns exactly three product changes:
- terminal TaskState consistency;
- generation-aware provider emergency timeout policy;
- compact model-facing text mutation transport.

Context profiles, semantic compaction policy, helper inference, runtime/GPU tuning, additional tool-concurrency work, and frozen B2/C2 redesign are out of scope.

## Decision — terminal TaskState must always be durable

When a task becomes terminal while one authored work unit is active:
- that work unit becomes `blocked`;
- `currentWorkUnit` becomes absent;
- task `status` and `terminalOutcome` become the requested terminal outcome;
- the blocker remains durable.

Do not add new work-unit status variants merely for this correction.

The rule applies to terminalization caused by:
- provider failure;
- permission/policy block;
- planning-needed recovery;
- cancellation;
- run/stage budget exhaustion;
- ordinary task failure.

If no work unit is active, existing work-unit state remains unchanged.

This invariant must also remain valid when the task is nested inside StackState.

The durable-session validator remains strict. Do not weaken it merely to accept inconsistent state.

## Decision — generation-aware provider emergency ceiling

The current 120000 ms provider timeout is too short to be the absolute emergency ceiling for local coding generations on the pinned Qwen/runtime.

Preserve the application-owned liveness guards:
- first useful output remains independently bounded;
- active-output inactivity remains independently bounded;
- caller cancellation remains authoritative;
- retry/rebase safety remains finite.

Change the absolute timeout from the normal liveness detector into an emergency ceiling.

Initial operating policy:

- default absolute provider timeout: **300000 ms**;
- maximum configurable absolute provider timeout: **600000 ms**.

The existing first-useful-output and active-output inactivity thresholds remain unchanged unless current source authority differs at implementation time and a correction-local deterministic defect requires a narrowly documented adjustment.

A response that continues producing useful output beyond 120000 ms must remain alive.

A response with no useful-output progress for the configured active-output inactivity threshold must still terminate.

A response that remains productively active until the finite emergency ceiling must still terminate there.

Do not implement an infinitely extending deadline.

## Decision — George Edit Protocol v1

Phase 10 established a useful Human/Operation split, but mutation-heavy JSON tool calls remain output-token expensive.

Correction 10 introduces **George Edit Protocol v1 (GEP/1)** for text mutation transmission inside Operation mode.

The design law is:

> Compact what the model must transmit; do not weaken what George validates or executes.

### Existing mutation engine remains canonical

GEP/1 is not a second filesystem executor.

After a completed provider response:
1. George parses and validates the GEP packet;
2. George resolves its ephemeral read receipt(s);
3. George derives canonical path, full current SHA-256, exact old bytes/text, framing, and edit intent;
4. George expands the compact packet into the existing SHA/framing-guarded mutation path;
5. normal ToolRegistry/effect/policy/approval/recovery/Git evidence remains authoritative.

Response completion remains required before mutation execution.

Existing `write_file`, `apply_patch`, and `create_directory` remain compatibility/canonical executable surfaces.

### Ephemeral read receipts

For eligible complete UTF-8 Operation-mode reads, George may issue a short run-local receipt such as `R3`.

The receipt maps only in ephemeral application state to:
- canonical path;
- exact full-file SHA-256;
- exact read snapshot;
- text framing;
- mutation/freshness epoch.

The receipt:
- is not canonical durable file-body state;
- cannot expand permissions;
- is invalidated when freshness/current-content evidence no longer matches;
- is not reused after restart without a fresh read;
- never substitutes for the mutation engine's current-content SHA check.

### Provider-visible line addressing

Eligible GEP reads should expose deterministic compact line addresses sufficient for the model to identify replacement ranges without echoing old text.

GEP/1 initially applies only when George has a complete, untruncated UTF-8 snapshot with framing it can transform deterministically.

Mixed/unsupported/truncated/binary cases use the inherited mutation path rather than guessing.

### Edit packet

GEP/1 must support at least:
- replacement of one or more non-overlapping line ranges in an eligible existing receipt;
- creation of a new UTF-8 text file;
- multiple independent file edits in one completed packet when deterministically valid.

The concrete grammar must:
- be versioned;
- be substantially smaller than legacy `oldText/newText` JSON for representative existing-file edits;
- use deterministic bounded framing that cannot be confused with arbitrary source content;
- have strict byte/edit/file limits;
- fail closed on malformed, overlapping, stale, out-of-range, unknown-receipt, unsupported-framing, or ambiguous packets.

Ranges in one packet are interpreted against the original receipt snapshot, not incrementally shifted post-edit line numbers.

### Operation-mode behavior

Operation mode may now produce:
- normal typed control/read/process tool calls where needed;
- GEP/1 mutation packets;
- the existing non-executable George handoff control.

Internal narration remains non-authoritative and bounded.

For eligible structured text mutations, George should prefer GEP/1 rather than requiring the model to echo path/SHA/oldText in a legacy mutation call.

Legacy mutation tools remain available for compatibility/fallback where GEP/1 cannot safely represent the target.

## Decision — generation evidence

Qualification must measure generation transport, not merely total task time.

For representative existing-file edits record:
- provider-emitted mutation bytes/tokens;
- expanded canonical mutation bytes;
- path/SHA/old-text bytes avoided;
- provider attempts/rounds;
- retries/rebases;
- provider-active time;
- response acceptance and first-useful-output timing where available;
- validation/task result;
- durable session reopen.

Define:

`Mutation Transmission Ratio = provider-emitted edit bytes / expanded canonical mutation bytes`

For the representative existing-file edit fixture, GEP/1 must achieve a ratio of **0.70 or lower** while preserving byte-correct mutation semantics.

This threshold does not apply to new-file creation, where the new content itself necessarily dominates output.

## Preserved Phase 10 authority

Do not weaken:
- Human/Operation boundary;
- TaskState/StackState and George-owned validation/completion;
- workspace/outside/network/remote permission ceilings;
- response-completion-before-side-effect semantics;
- retry/rebase and outcome-unknown safety;
- evidence freshness;
- stable-prefix/late round context;
- duplicate/no-progress;
- batching/read-concurrency boundaries;
- focused correction history/revalidation;
- session durability;
- historical Phase 10 and Phase 9 evidence.

The Phase 10 P7 intermittent lifecycle-order evidence remains historical truth and is not relabeled by this correction.

## Non-goals

Do not:
- change context profiles or compaction thresholds;
- add helper inference;
- tune LM Studio GPU/runtime parameters;
- introduce speculative decoding;
- expand concurrent mutation/process behavior;
- rewrite frozen B2/C2;
- add browser/visual feedback;
- optimize arbitrary non-text/binary mutation formats;
- owner-close Phase 10.

## Rerun consequence

After this correction closes Green, Phase 10 closeout/readiness should be reassessed against:
- the corrected production candidate;
- supported Node 26;
- live LM Studio/Qwen evidence from this correction;
- preserved Phase 10 P7 historical/intermittent evidence.

The correction itself does not open Phase 11.
