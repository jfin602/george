# Phase 10 Prompt Assessment — Agent Loop Throughput

Status: READY FOR PHASE PROMPTING

Phase: 10 — Agent Loop Throughput  
Execution folder: `p10`  
Baseline package: `0.10.0`  
Planning baseline: `257e0fc812b2cf1797adb4a6710060af07e39064`

## Assessment

Phase 10 is ready for implementation prompting.

Phase 9 established the state/authority substrate needed to optimize aggressively without delegating correctness to the model:
- Task Prompt v1;
- TaskState/StackState;
- George-owned validation/completion;
- permission/containment boundaries;
- evidence freshness;
- convergence/duplicate guards;
- replay-safe provider recovery;
- schema-2 live evidence.

The current loop still incurs unnecessary local-model cost because:
- structured internal work uses the generic conversational provider loop;
- changing mission-card alignment is appended to per-round instructions;
- response acceptance and useful generation are not separated cleanly enough for local prefill timing;
- deterministic transitions can still require model turns;
- multiple provider tool calls execute serially;
- validation correction can re-enter a relatively broad model loop;
- internal prose may be generated where no operator consumes it;
- B2/C2 are too expensive for routine optimization iteration.

Phase 10 should optimize these seams while preserving Phase 9 authority.

## Current source truth

### Provider/application contract

`ProviderRequest` currently exposes:
- instructions;
- input;
- tools;
- toolChoice;
- continuation.

There is no explicit Human/Operation mode, late dynamic round context, output policy, or George application-control response.

These belong in provider-independent core/application contracts first; LM Studio only translates them to wire behavior.

### Agent loop

`AgentLoopApplicationService`:
- owns provider/tool loop;
- buffers assistant output across tool-bearing rounds;
- can collect multiple provider tool calls in one response;
- executes those calls sequentially;
- owns retry/rebase/budget/cancellation authority;
- recomputes optional structured alignment before every provider request.

Phase 10 should preserve that authority while reducing provider boundaries and introducing safe batching/concurrency.

### Structured orchestration

`StructuredTaskApplicationService` already owns:
- inspection;
- implementation;
- validation;
- correction;
- work-unit completion;
- stack progression;
- evidence freshness;
- mission-card projection.

This is enough state to remove model turns that merely confirm deterministic transitions.

### Benchmark harness

The existing harness already measures:
- provider attempts/rounds;
- provider-active time;
- average provider-round time;
- response-start/first-output latency;
- tool calls;
- retries;
- input/output tokens;
- tool/approval/other timing;
- correctness.

It already contains useful cases:
- structured-tool-use-001;
- independent-multi-tool-001;
- multi-round-repository-001;
- coding-edit-001;
- multi-round-coding-workflow-001;
- extended-agent-loop-001;
- agentic-context families.

Extend this harness rather than building a separate performance system.

### Live work

Phase 9 B2/C2 are intentionally expensive:
- B2 is a three-task Express stack with dependency prerequisites;
- C2 is a broad existing Express feature with multiple work units/validations.

They remain longitudinal milestone instruments.

Phase 10 should create small pure-Node B3/C3 instruments for routine efficacy.

## Prompt decomposition

### P1 — baseline telemetry and fast gates — 0.10.1

Add Phase 10 benchmark/live-work metrics, create immutable B3/C3 instruments and hidden acceptance, and capture one fast live + benchmark baseline.

No production loop optimization yet beyond strictly necessary observability.

### P2 — useful-output watchdog — 0.10.2

Distinguish provider acceptance/prefill from useful output, preserve finite recovery, and record attempt timing.

### P3 — stable-prefix round context — 0.10.3

Keep stable instructions stable and move changing mission-card/control state late while preserving task/context authority.

### P4 — Operation Protocol v1 — 0.10.4

Introduce Human/Operation mode and non-executable George handoff control. Internal structured rounds stop generating routine narration.

### P5 — deterministic round elimination — 0.10.5

Remove provider calls used only for state transitions George already knows.

### P6 — multi-tool batching — 0.10.6

Treat multiple provider calls in one response as a validated deterministic batch and return one normalized continuation batch.

Execution remains sequential in P6.

### P7 — read-only concurrency — 0.10.7

Concurrently execute only dependency-safe replay-safe local reads, retain deterministic result order and canonical lifecycle evidence.

### P8 — focused correction path — 0.10.8

Build minimal correction frames from validation failure + fresh evidence and directly revalidate after repair.

### P9 — output budgets and cleanup — 0.10.9

Add conservative per-mode generation budgets where supported and remove residual unnecessary internal rounds/output.

### P10 — primary-only qualification — 0.10.10

Run consolidated deterministic/benchmark/fast live qualification, selected agentic-context comparison, then B2/C2 exactly once as milestone evidence.

No repair-by-rerun.

### P11 — helper A/B — 0.10.11

Run exactly one narrow non-authoritative utility-model experiment versus the accepted primary-only baseline. Do not promote helper authority.

### P12 — closeout — 0.10.12

Evidence-only formal Phase 10 closeout.

## Key risks

- operation protocol accidentally suppresses required model reasoning;
- output ceilings truncate function-call arguments;
- stable-prefix work weakens mission-card freshness;
- batching/concurrency crosses dependency/effect boundaries;
- deterministic round removal skips a real approval/recovery decision;
- correction-frame narrowing hides stale evidence;
- benchmark changes destroy longitudinal comparability;
- fast B3/C3 become too trivial to prove real efficacy;
- helper experiment leaks authority.

Each prompt must add permanent regression coverage for its defect/optimization class.

## Model routing

P1-P9: `Sol High`.  
P10-P12: `Sol Medium`.

No Terra.
