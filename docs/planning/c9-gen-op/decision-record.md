# Correction 9 Decision Record — Generation Operation Protocol

Status: **APPROVED DIRECTION — ACTIVE PHASE 9 INSERTED CORRECTION**

Date: 2026-09-26

Correction: `c9-gen-op`  
Package boundary: `0.9.10` unchanged.

## Trigger

The latest attempted final sweep exposed three distinct problems:

1. response acceptance is currently treated as active model output, so legitimate LM Studio prompt prefill can be disconnected at the 60000 ms active-inactivity threshold;
2. the recomputed mission card is appended to `instructions` every structured provider round, changing the request prefix and reducing cache locality;
3. structured tool-bearing rounds can spend tens of seconds generating natural-language text that George does not commit or show to the operator.

That attempted sweep is historical diagnostic evidence, not the final qualifying Phase 9 chain.

## Useful-output watchdog semantics

Provider liveness must distinguish:

`awaiting acceptance -> accepted/prefilling -> useful output active -> completed`

Locked semantics:

- `provider.response.started` / Responses `response.created` establishes response identity/acceptance only;
- acceptance does not switch to the shorter active-output inactivity threshold;
- first-useful-output timing continues through prefill;
- text generation and function/control-call generation progress count as useful output;
- once useful output begins, the active-output inactivity threshold applies;
- completion clears timers;
- caller cancellation remains authoritative.

Preserve the existing 120000 ms absolute provider timeout and bounded retry/rebase ladder. Do not inflate timeouts merely to pass.

The LM Studio adapter may report payload-free activity classes such as `accepted` and `output_progress`; recovery policy remains application-owned.

## Stable prefix and late round context

George-owned invariant instructions and Gen-Op protocol instructions should remain byte-stable across provider continuations whenever their semantic content is unchanged.

The mission card remains deterministic, bounded, recomputed each structured implementation/correction round, and included in context-pressure accounting.

Move that changing state out of the stable instruction prefix and into a bounded **late dynamic round-context** seam.

Conceptually:

```text
stable instructions
stable task/tool protocol
provider continuation + tool results
late dynamic mission-card/control frame
```

Provider adapters own wire translation only. Structured TaskState logic must not move into the LM Studio adapter.

If a provider cannot represent late round context safely, fail/retain the safe path rather than silently omitting mission-card authority.

## Generation Operation Protocol v1

Structured implementation and correction rounds become explicit internal operation rounds.

Ordinary user-facing turns remain conversational.

Internal rounds should emit only:
1. permitted executable tool call(s), or
2. one George-owned handoff control.

Routine narration, progress prose, explanations, and completion prose are not useful internal outputs.

## George handoff control

Expose one provider-visible, application-owned non-executable control, conceptually:

```text
george_control {"op":"handoff"}
```

`handoff` means only: return control to George's structured orchestrator.

It does not complete TaskState, verify requirements, pass validation, grant permission, mutate files, or execute processes.

It must not be registered as a normal executable ToolRegistry capability.

Malformed or unknown control operations fail closed.

## Response completion remains the side-effect boundary

Do not execute streamed tool/control proposals before `provider.response.completed`.

Phase 9 replay safety depends on incomplete branches remaining provisional and discardable.

Gen-Op reduces generation by changing output shape, not by moving execution earlier.

## Safe aggregate metrics

Where available, record bounded aggregates for:
- input tokens;
- cached input tokens;
- output tokens;
- internal text bytes/estimated tokens;
- executable tool-call count;
- George control count;
- provider attempts/rounds;
- time to response acceptance;
- time to first useful output;
- provider elapsed;
- retries/rebases;
- context profile/pressure.

Do not persist raw internal prose merely to measure it.

## Qualification-only workload deadlines

Production RunBudget remains unchanged.

The final Phase 9 sweep gets an independent outer qualification deadline per workload:

- greeting: 180000 ms;
- three-file: 300000 ms;
- Gate A: 600000 ms;
- B2: 1200000 ms for the whole P1/P2/P3 stack;
- C2: 900000 ms.

Deadline expiry cancels the workload through the normal signal path, writes bounded evidence, classifies the workload Not Green, and does not suppress later diagnostic workloads while common sweep validity remains Green.

## Deferred to Phase 10+

This correction does not implement:
- parallel tools;
- model-call batching;
- speculative decoding;
- helper model;
- custom compressed George DSL;
- early tool execution before response completion.

## Preserved boundaries

Do not weaken permissions, recovery, SHA/framing, containment, TaskState, validation authority, mission-card freshness, retry/rebase safety, duplicate/no-progress, or historical evidence.

Package remains `0.9.10`.

After `c9-gen-op` closes Green, rerun the existing final-convergence P3 from greeting through C2 on a fresh candidate sweep.
