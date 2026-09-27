# Phase 11 Prompt Assessment

Status: READY FOR IMPLEMENTATION

Phase: 11 — Primary Baseline Freeze + Observatory Bridge

Baseline package: `0.11.0`.

## Why this phase changed

Phase 10 is owner-closed with explicit acceptance of live GEP-selection Not Green.

Current evidence shows the remaining problem is increasingly diagnosability:
- deterministic GEP correctness/compatibility/efficiency is Green;
- the live Qwen task completed correctly through legacy fallback;
- the model did not choose GEP;
- current terminal/session evidence cannot efficiently answer why that mechanism was selected.

Another opaque optimization wave would repeat the Phase 10 development pattern.

Phase 11 therefore freezes the baseline and exposes the missing evidence needed by Phase 12/13.

## Current source seams

Existing useful authority:
- `ApplicationEvent` already records provider attempts, context diagnostics, budgets, tools, validation, correction, concurrency, GEP transport and TaskState lifecycle;
- `AgentLoopApplicationService` constructs the exact normalized `ProviderRequest`;
- `ContextDiagnostics` / source events expose profile and source evidence;
- `GeorgeEditReceiptRegistry` knows GEP eligibility/receipt/fallback;
- tool registry definitions know tool effect/replay/schema;
- TaskState/StackState projections already separate authored/canonical state from presentation.

Missing:
- one versioned provider-round/request projection tying these dimensions together;
- explicit GEP eligibility/fallback/selection correlation;
- bounded provider-visible section accounting;
- stable queryable derived record suitable for a daemon/client.

## Prompt decomposition

P1 defines/versioned types and baseline identity.

P2 populates the request/decision projection at the actual application producer.

P3 proves the projection and records one live baseline.

P4 closes directly into Phase 12.

## Model routing

- P1: Sol High — architecture/schema/evidence boundary.
- P2: Sol High — core provider/context/tool/GEP instrumentation.
- P3: Sol Medium — qualification/baseline evidence.
- P4: Sol Medium — evidence-only closeout.

## Main risks

- duplicating canonical state;
- capturing secrets or hidden reasoning;
- projection drift from the actual ProviderRequest;
- TUI-specific logic leaking into core;
- observability fields becoming execution authority;
- unbounded request/body retention;
- turning P3 into another optimization campaign;
- silently treating legacy GEP fallback as a failure after owner waiver.

## Required preserved behavior

No change to:
- permissions;
- tool execution;
- provider continuation;
- task/validation truth;
- recovery;
- context precedence;
- GEP mutation authority;
- TUI ownership boundary;
- historical evidence semantics.
