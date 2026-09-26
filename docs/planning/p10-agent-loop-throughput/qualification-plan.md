# Phase 10 Qualification Plan — Agent Loop Throughput

Status: APPROVED QUALIFICATION DIRECTION

Date: 2026-09-26

## Evidence inheritance

Preserve Phase 9 owner closeout and all Phase 8/9 Not Green/Evidence Gap states unchanged.

The latest B2/C2 failures are baseline longitudinal evidence, not mandatory inner-loop reruns.

## Baseline

Before accepting optimizations:
- transition to the Phase 10 version line;
- capture benchmark quick/full or selected baseline evidence sufficient for comparison;
- create immutable B3/C3 fast instruments and hidden acceptance;
- capture the fast live gate baseline;
- record exact model/runtime/context provenance.

## Required metric classes

### Provider/model
- attempts;
- logical rounds;
- retries/rebases;
- input/output tokens;
- cached input tokens when available;
- response acceptance latency;
- first useful output latency;
- provider-active time;
- average round time;
- operation vs human rounds;
- internal prose amount.

### Harness
- tool calls;
- successful meaningful actions;
- batches;
- batch width;
- duplicate/rejected reads;
- sequential vs concurrent read timing;
- validations;
- correction cycles;
- deterministic model rounds avoided.

### Efficacy
- terminal task/stack state;
- declared validation;
- hidden acceptance;
- human intervention;
- permission/recovery/evidence integrity.

## Fast live gate

Routine optimization gate:
1. greeting;
2. three-file;
3. Gate A;
4. B3 compact greenfield stack;
5. C3 compact existing edit.

Use fresh isolated workspace/session per workload and bounded workload deadlines.

Ordinary functional failure is recorded; later diagnostic workloads continue when common validity remains Green.

## Fast live deadlines

Use one qualification-owned outer deadline per complete fast workload:
- greeting: 120000 ms;
- three-file: 240000 ms;
- Gate A: 360000 ms;
- B3: 300000 ms;
- C3: 240000 ms.

Deadline expiry is bounded Not Green evidence and does not modify production RunBudget.

Milestone-only B2/C2 use 900000 ms / 600000 ms respectively.

## B3 acceptance

Must prove:
- ordered stack progression;
- at least two structured tasks;
- real workspace mutation;
- declared validation;
- correction path is reachable/qualified;
- completed StackState;
- hidden acceptance;
- zero human coding intervention;
- no permission/recovery/evidence regression.

No network/dependency install.

## C3 acceptance

Must prove:
- existing code inspection;
- baseline behavior preservation;
- focused mutation;
- focused validation;
- broad validation;
- completed TaskState;
- hidden acceptance;
- zero human coding intervention.

No network/dependency install.

## Optimization acceptance

Each optimization records before/after:
- functional result;
- provider rounds/attempts;
- provider-active/total time;
- tool calls;
- output tokens/internal prose where available;
- relevant batch/concurrency metrics.

Accept only when efficacy is preserved/improved and the targeted performance dimension materially improves or removes a known failure/latency class.

## Milestone B2/C2

After the primary-only optimization campaign:
- run frozen B2 once;
- run frozen C2 once;
- no repair between them;
- preserve Phase 9 historical outcomes;
- classify improvement/regression without requiring them as the inner-loop gate.

Their outcome informs Phase 10 closeout but does not erase owner-accepted Phase 9 evidence.

## Regression floors

Every prompt runs the narrow affected tests plus:
- Phase 5 replay/recovery floors when provider/continuation behavior changes;
- Phase 9 structured/permission/evidence floors when task orchestration changes;
- runner grammar;
- typecheck;
- `git diff --check`;
- broad suite at major checkpoints.

## Concurrency qualification

Read-only concurrency must prove:
- only explicitly qualified replay-safe observations run concurrently;
- original call/result identities remain stable;
- normalized result order is deterministic;
- cancellation reaches all children;
- one failure does not silently cancel unrelated successful evidence unless policy says so;
- no mutation/process/approval/ambiguous effect crosses the parallel boundary.

## Operation protocol qualification

Must prove:
- Human mode retains operator-facing natural language;
- Operation mode suppresses routine narration;
- executable tools still use canonical ToolRegistry/policy/approval;
- George control is non-executable/non-authoritative;
- response completion remains the side-effect boundary;
- malformed/mixed operation output fails closed;
- deterministic transitions can bypass unnecessary model rounds without hiding validation/evidence.

## Correction path qualification

Must prove a failed declared validation produces a bounded focused correction frame, reuses fresh evidence, does not broad-rediscover unchanged state, repairs, and directly revalidates.

## Helper A/B qualification

One bounded experiment only after primary optimization:
- same frozen workload/control;
- helper output treated as derived evidence;
- helper failure/disablement degrades explicitly;
- report primary tokens/rounds saved, helper latency/cost, task success, and failure rate;
- do not promote helper to baseline in Phase 10.

## Closeout

Phase 10 closeout must include:
- accepted/revised/reverted optimization ledger;
- baseline vs final fast-gate comparison;
- benchmark comparison;
- milestone B2/C2 result;
- inherited Phase 9 safety/evidence status;
- helper A/B result;
- remaining bottlenecks for Phase 11.
