# c9-gen-op Prompt Assessment

Status: READY FOR INSERTED PHASE 9 CORRECTION

Correction: `c9-gen-op`  
Roadmap phase: 9  
Required unchanged package version: `0.9.10`

## Trigger

The latest attempted final sweep exposed two implementation defects and one optimization opportunity:

1. the stall watchdog treats response acceptance as active generation and can disconnect legitimate local-model prefill at the 60000 ms active-inactivity threshold;
2. the per-round mission card is appended to changing `instructions`, reducing stable-prefix locality for LM Studio continuations;
3. structured tool-bearing rounds can spend tens of seconds generating natural-language text that George never commits or displays.

These affect the validity and practicality of final Phase 9 live qualification.

## Scope

This correction owns:
- useful-output versus response-acceptance stall semantics;
- stable provider instruction prefix;
- late dynamic mission-card/control-frame delivery;
- Gen-Op v1 tool/control-only internal structured rounds;
- one non-executable George `handoff` control;
- cached/output-generation observability;
- final-sweep qualification deadlines.

It does not own:
- parallel tools;
- concurrent mutations;
- model-call batching;
- speculative decoding;
- helper model;
- custom compressed DSL;
- early tool execution before provider completion.

## Source seams

Inspect actual HEAD before implementation.

Primary seams:
- `src/application/provider-stall.ts`;
- `src/application/one-turn.ts`;
- `src/application/structured-task.ts`;
- `src/provider/lm-studio.ts`;
- `src/core/{provider,events}.ts`;
- `src/qualification/{live-work,sweep}.ts`;
- affected integration/unit tests.

## Model routing

- P1 — Sol High: provider liveness/retry safety;
- P2 — Sol High: provider request shape, application control protocol, structured authority, qualification deadlines;
- P3 — Sol Medium: deterministic and bounded live qualification;
- P4 — Sol Medium: evidence-only closeout.
