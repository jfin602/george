# Observability Projection v1 — Phase 11 Contract

Status: **APPROVED DESIGN CONTRACT**

Phase: 11 — Primary Baseline Freeze + Observatory Bridge

## Purpose

This contract defines the presentation-independent diagnostic projection Phase 11 must expose before Phase 12 adds daemon transport.

It is intentionally not a transport protocol.

It is intentionally not execution authority.

## Top-level model

A projection should be queryable/serializable as bounded records resembling:

```text
RunObservation
  schemaVersion
  sessionId
  turnId
  runId?
  task?
  providerRounds[]
  tools[]
  validations[]
  corrections[]
  budget/context summary
```

The exact TypeScript decomposition may differ, but the semantics below are required.

## ProviderRoundObservation

Required identity:
- logical round number;
- turn ID;
- run ID when available;
- execution mode;
- attempt IDs associated with the logical round.

Required request summary:
- context profile ID;
- estimated input tokens;
- provider-input ceiling;
- estimated remaining headroom;
- tool choice;
- output-policy request/disposition;
- normalized ordered request sections;
- exposed tools/capabilities.

Required outcome summary:
- provider response/attempt outcome;
- response acceptance;
- first useful output;
- provider-active duration;
- reported input tokens;
- reported cached-input tokens when available;
- reported output tokens;
- retries/rebases/stalls associated with the round.

## RequestSectionProjection

Each intentionally provider-visible section should expose:
- stable kind/category;
- provenance/source identity when available;
- order index;
- bytes;
- estimated tokens;
- redaction/preview disposition.

Text may be inspectable only when:
- it was intentionally provider-visible;
- it passes secret/redaction policy;
- it fits the projection bound.

Otherwise expose metadata only.

## ToolExposureProjection

For each tool exposed to the model:
- name;
- effect;
- replay-safety;
- source kind;
- schema bytes;
- descriptor/resource summary when already safe.

Do not expose secrets embedded in adapter configuration.

## MutationSelectionProjection

Expose descriptive facts needed to diagnose GEP versus legacy selection:
- eligible GEP receipts visible this round;
- receipt/path identity in bounded safe form;
- dual projection bytes;
- GEP unavailable/withheld reason when applicable;
- legacy `write_file` exposed;
- legacy `apply_patch` exposed;
- GEP packet selected;
- selected mutation tool names.

Do not emit inferred reasons such as "the model preferred legacy because..."

## ContextProjection

Reuse/correlate current ContextDiagnostics and source events.

Expose when truthful:
- operating mode;
- selected/attempted/promoted profiles;
- estimated input;
- input ceiling;
- headroom;
- soft pressure;
- source/category contribution;
- source identity/status;
- compaction checkpoint identity/reason;
- routed/omitted/deferred/duplicate/failed disposition.

## TaskProjection

Correlate existing TaskState/StackState projection with:
- current task/work unit;
- requirements;
- validation state;
- corrections;
- blockers;
- permission expectations;
- George-owned avoided model rounds.

Do not duplicate TaskState as an independently mutable observability state.

## Bounds

Initial design bounds:
- no single safe text preview above 8 KiB;
- no complete provider-round projection above 64 KiB without explicit truncation metadata;
- tool schemas may be summarized by name/bytes if the full normalized schema would exceed the projection bound;
- process/mutation bodies remain bounded by existing diagnostic policies.

Implementation may choose lower bounds if current contracts justify them.

## Redaction

Projection construction must use a deterministic redaction boundary.

At minimum:
- environment credentials;
- obvious secret-bearing values already protected by George;
- provider adapter credentials;
- raw process environment;
- unrestricted file/mutation bodies not intentionally provider-visible

must not appear.

No hidden reasoning or unrestricted provisional Operation text may be added merely for observability.

## Canonical versus derived

Every exported projection type/documentation must state that:
- canonical events/session/task/tool evidence remains execution truth;
- observability projections are derived/read-only;
- a missing projection field does not imply a canonical event did not happen;
- clients cannot mutate canonical state by mutating projection state.

## Phase 12 handoff

Phase 12 should be able to:
- query a bounded current observation snapshot;
- stream new observation events/updates;
- correlate them by existing IDs;
- reconnect without inventing state.

Phase 11 does not define HTTP/WebSocket/SSE framing.
