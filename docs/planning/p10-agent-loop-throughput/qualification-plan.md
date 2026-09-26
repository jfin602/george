# Phase 10 Qualification Plan — Agent Loop Throughput

Status: APPROVED QUALIFICATION DIRECTION

Date: 2026-09-26

Baseline package: `0.10.0`

## Evidence hierarchy

Every optimization must preserve:
1. affected deterministic correctness;
2. inherited security/permission/recovery authority;
3. fast live efficacy;
4. benchmark correctness;
5. performance improvement.

A faster failing workload is Not Green.

Performance never overrides correctness.

## Baseline capture

Before accepting Phase 10 optimizations:
- preserve Phase 9 owner-closeout evidence;
- transition package to `0.10.0`;
- add Phase 10 telemetry and fast instruments without changing production loop semantics beyond instrumentation;
- record one fast live baseline;
- record benchmark quick/full baseline as specified by the prompt stack;
- record environment/runtime/model provenance.

The inherited Phase 9 B2/C2 evidence is the milestone baseline. Do not rerun B2/C2 merely to start Phase 10.

## Fast live gate

Routine live qualification is:

1. greeting;
2. three-file;
3. Gate A;
4. B3 compact greenfield stack;
5. C3 compact existing-repository edit.

Each runs in a fresh isolated workspace/session.

Common safety/evidence gates remain fail-fast.

After common gates are Green, ordinary workload failure follows the existing complete-diagnostic-sweep rule: run later isolated workloads once and record their state.

Do not repair between workloads.

## B3 acceptance

B3 must use pure Node with no network/dependency installation.

It must prove:
- valid Task Prompt v1 stack;
- multiple ordered tasks;
- actual workspace mutation;
- George-owned validation;
- at least one meaningful cross-task dependency;
- correction path is executable when a deterministic fixture variant induces a validation failure, without requiring the main happy-path run to fail;
- completed StackState;
- hidden acceptance Green;
- zero human coding intervention;
- no hard task/stage/run exhaustion.

B3 should remain materially smaller than B2.

## C3 acceptance

C3 must use a pure-Node existing fixture.

It must prove:
- real INSPECT evidence;
- existing behavior preserved;
- focused mutation;
- focused validation Green;
- broad validation Green;
- completed/verified TaskState;
- hidden acceptance Green;
- zero human coding intervention;
- no hard task/stage/run exhaustion.

C3 should remain materially smaller than C2.

## Performance metrics

Extend current benchmark/live-work evidence to record where supported:

### Model/provider
- logical provider rounds;
- provider attempts;
- retries/rebases;
- provider-active wall time;
- average provider round time;
- response acceptance latency;
- first useful output latency;
- input tokens;
- cached input tokens;
- output tokens;
- operation-mode versus human-mode rounds;
- internal model text bytes/estimated tokens.

### Harness
- tool calls;
- successful meaningful tool actions;
- tool batches;
- batch width;
- concurrent read batches;
- summed read execution time;
- concurrent read wall time;
- duplicate/rejected reads;
- deterministic model rounds avoided;
- George control calls;
- correction cycles;
- validation count.

### Efficacy
- workload completion;
- TaskState/StackState terminal status;
- hidden acceptance;
- validation status;
- human intervention;
- hard exhaustion;
- correction success.

Derived comparative metric:

`Useful Action Density = successful meaningful actions / logical provider rounds`

This is an optimization metric, not an initial hard product threshold.

## Useful-output watchdog qualification

Use fake-time deterministic tests.

Prove:
- response acceptance does not activate the shorter output-inactivity timer;
- accepted prefill remains under first-useful-output timing;
- text/function/control generation activates useful-output timing;
- active-output inactivity still terminates;
- absolute provider timeout remains a final ceiling;
- cancellation wins;
- retry/rebase safety remains finite;
- provisional incomplete-response proposals remain unexecuted/uncommitted.

Live evidence should record observed acceptance/first-useful-output/completion timing only where actually observable.

## Stable-prefix qualification

Prove:
- invariant instructions remain byte-stable across continuation rounds when semantics are unchanged;
- dynamic control context changes without rewriting the stable prefix;
- mission-card/current-state freshness remains correct;
- context-pressure accounting includes dynamic tail;
- provider adapter remains TaskState-blind;
- canonical state does not depend on provider cache.

Record cached input tokens only when the provider reports them.

Do not infer cache hit rates from timing alone.

## Operation Protocol qualification

Prove:
- Human mode preserves ordinary conversation behavior;
- Operation mode suppresses routine natural-language narration;
- executable tool calls continue through canonical validation/policy/approval;
- George control is non-executable/non-authoritative;
- malformed control fails closed;
- model text cannot mark TaskState or validation complete;
- a deterministic next transition may proceed without an extra handoff/model round;
- no raw internal prose must be persisted to measure aggregate text volume.

## Deterministic model-round elimination qualification

For each removed model boundary, prove:
- George already held all authority/data needed for the transition;
- no reasoning/approval/recovery decision was silently skipped;
- canonical events remain sufficient to explain the transition;
- cancellation/budget/stop conditions still interrupt correctly.

Track removed/avoided rounds explicitly.

## Batching qualification

Prove:
- multiple provider tool calls from one response can be treated as one batch;
- every call still receives independent validation/policy/effect classification;
- provider result projection remains complete;
- deterministic result ordering follows original provider call order;
- failure of one call remains visible;
- sequential batch behavior is correct before concurrency is added.

## Read-only concurrency qualification

Only dependency-safe replay-safe local reads may execute concurrently in the initial implementation.

Prove:
- independent calls overlap in wall time under a deterministic delayed executor fixture;
- dependent calls remain sequential;
- mutations/processes/approvals/external/ambiguous effects remain sequential;
- cancellation propagates to the batch;
- one failed read does not fabricate peer success/failure;
- results returned to the provider retain original call ordering;
- tool lifecycle/work evidence retains unique call identity;
- duplicate/no-progress and run budgets remain correct.

## Focused correction qualification

Prove:
- validation failure creates a bounded correction frame from canonical state;
- valid current evidence is reused;
- broad re-inspection does not occur merely to regain orientation;
- stale evidence still causes necessary reinspection;
- repair completion directly triggers George-owned revalidation;
- successful revalidation advances state without an unnecessary model completion round;
- failures remain durable.

## Output-budget qualification

Every per-mode output ceiling must:
- be provider-independent at the application contract;
- degrade explicitly when unsupported;
- leave enough room for structured function-call/control payloads;
- preserve benchmark/live correctness;
- show a measured output-token/wall-time benefit before retention.

## Keep / revise / revert discipline

Each performance optimization gets one explicit disposition.

Accept only when:
- affected correctness is Green;
- fast live efficacy is preserved/improved;
- benchmark correctness is preserved;
- at least one intended performance metric materially improves or a documented structural simplification justifies the change without regression.

Revise when a bounded fix is evident.

Revert when:
- no meaningful benefit;
- correctness/efficacy worsens;
- retries/no-progress materially increase;
- the optimization weakens Phase 9 authority;
- evidence cannot isolate the optimization's effect.

Rejected experiments remain documented.

## Milestone B2/C2

After primary-only optimization, run B2 and C2 exactly once each on the accepted primary-only candidate.

Do not repair between them.

Preserve Phase 9 historical results.

A new Green result does not erase Phase 9 Not Green evidence.

A new Not Green result is recorded and may inform future work without automatically blocking Phase 10 closeout if owner/phase authority explicitly accepts the optimized primary baseline and the phase's fast efficacy/benchmark gates are Green.

## Helper A/B

Run only after the primary-only milestone.

Use one narrow helper role.

Compare against the accepted primary-only candidate on the same bounded fixture(s).

Record:
- helper latency;
- primary rounds saved;
- primary input/output tokens saved;
- total elapsed delta;
- memory/runtime overhead;
- correctness;
- new failure modes.

Do not promote helper behavior to production Phase 10 authority.

## Closeout requirements

Phase 10 closeout must report:
- accepted/rejected/revised optimization list;
- original Phase 10 baseline;
- final accepted primary-only baseline;
- cumulative performance delta;
- fast live gate state;
- benchmark state;
- B2/C2 milestone state;
- helper A/B result;
- preserved Phase 9 evidence;
- remaining Not Green/Evidence Gaps;
- readiness for Phase 11 planning.

Closeout does not owner-close Phase 10.
