# Phase 12 — Local Daemon + Observability Foundation — Decision Record

Status: APPROVED DIRECTION  
Scheduling: immediately after Phase 11 primary-model baseline freeze  
Roadmap authority: `docs/roadmap/mvp-roadmap.md`

## Purpose

Phase 12 moves the local daemon forward because George now needs a richer, stable way to observe and debug itself before adding more intelligence layers.

The daemon is not primarily a networking feature. Its first purpose is to provide one presentation-independent localhost boundary for:
- long-lived George process ownership;
- session/run/task APIs;
- correlated application-event streaming;
- bounded historical diagnostics;
- safe model/context/tool/validation/recovery introspection;
- attach/reconnect by OpenTUI, Tauri, and later trusted clients.

## Product thesis

The bottleneck is increasingly not merely whether George can act, but whether a developer can quickly explain **why** the local model/harness acted the way it did.

Terminal output is useful but forces the operator to reconstruct multiple dimensions manually: provider attempts, context pressure, tool lifecycle, task progress, validation, correction, recovery, budgets, and timing.

Phase 12 therefore treats observability as development infrastructure.

Target feedback loop:

```text
run
 -> correlated evidence
 -> identify divergence/bottleneck
 -> repair
 -> rerun
 -> compare
 -> better George
```

The goal is compounding development leverage: every future George capability should be easier to diagnose than the capability that preceded it.

## Architectural boundary

```text
OpenTUI             Tauri / later clients
   \                       /
    \                     /
       localhost daemon
              |
      application service
              |
          agent core
```

The daemon owns transport and appropriate long-lived process/session attachment concerns. It does **not** own a second copy of task, permission, validation, recovery, or tool truth.

Canonical application/core/session state remains authoritative.

## Observability contract

The transport should expose bounded correlated projections for:

### Identity
- workspace;
- session;
- turn;
- run;
- provider attempt;
- tool/operation;
- validation;
- correction;
- compaction/recovery where applicable.

### Provider
- attempt started/finished;
- execution mode;
- output-policy request/disposition;
- response acceptance;
- first useful output;
- provider-active duration;
- reported input/output/cached usage when available;
- retries;
- stall suspected/detected/terminal;
- rebase/compaction relationship;
- safe provider error fields.

### Context
- operating mode/profile;
- attempted/promoted profiles;
- estimated provider-facing tokens;
- budget/headroom/reserved headroom;
- soft pressure;
- category contributions;
- active source identities;
- omitted/deferred/duplicate/failed/routed evidence;
- compaction checkpoints.

### Task/orchestration
- task/stack status;
- current work unit;
- requirement/validation state;
- blockers;
- correction cycles;
- George-owned deterministic transitions/model rounds avoided.

### Execution
- tools and effect/replay classification;
- approvals;
- process lifecycle;
- validation;
- recovery;
- run-budget pressure/exhaustion;
- GEP transport;
- read concurrency;
- workflow completion.

## Provider-facing request inspection

George should be able to answer: **what did the model actually receive for this round?**

The answer is a normalized George-owned projection, not a raw HTTP capture.

It may include:
- ordered input sections;
- source identities/provenance;
- category/token/byte contribution;
- eligible normalized text that was intentionally provider-visible;
- tool schema identity/size;
- current task slice;
- bounded tool-result projection.

It must exclude:
- credentials/secrets;
- unrestricted raw provider wire payloads;
- internal-only canonical metadata;
- unbounded mutation/process bodies;
- hidden chain-of-thought or provisional model narration that existing contracts do not retain.

## Snapshot + stream

A newly attached client needs:
1. a bounded current snapshot;
2. a sequence/cursor for future events;
3. deterministic reconciliation rules if events arrive around snapshot acquisition.

The exact protocol is implementation planning work, but a client must never infer a canonical transition solely because the UI appears to need one.

## OpenTUI

OpenTUI remains supported.

Phase 12 may preserve an in-process path where useful, but the application contracts must be usable through the daemon so the desktop does not require agent-core duplication.

TUI-specific rendering behavior remains presentation-only.

## Security/trust

- localhost only by default;
- authenticated local clients;
- no LAN/Internet exposure by implication;
- client input cannot raise George permissions;
- repository/model text cannot register daemon capabilities;
- diagnostics remain bounded/redacted;
- multiple clients cannot race approvals/cancellation into a broader authority state.

## Non-goals

- polished desktop UI;
- browser control;
- visual-model runtime;
- utility/helper model;
- web research;
- multi-agent scheduling;
- hidden-reasoning capture;
- remote/LAN deployment.

## Preserved behavior

Phase 12 must preserve:
- all Phase 1-11 agent/provider/tool/task/session authority;
- OpenTUI as a supported client;
- local-first behavior;
- existing permission and recovery boundaries;
- historical evidence semantics.
