# Phase 11 — Primary Baseline Freeze + Observatory Bridge — Decision Record

Status: **APPROVED DIRECTION — CURRENT PHASE**

Date: 2026-09-27

Phase: 11

Baseline package: `0.11.0`

Roadmap authority: `docs/roadmap/mvp-roadmap.md`

Parent authority:
- `docs/phase-10-owner-closeout.md`;
- `docs/phase-10-closeout.md`;
- `docs/tasks/c10-generation-bottleneck/closeout.md`;
- `docs/tasks/c10-gep-compatibility/closeout.md`;
- Phase 12 daemon/observability and Phase 13 Agent Observatory planning.

## Purpose

Phase 11 is no longer a broad acceleration campaign.

Its purpose is to:

1. freeze the accepted single-primary-model baseline inherited from owner-closed Phase 10;
2. make the application/core expose the bounded correlated evidence Phase 12 must transport;
3. record one representative primary-model baseline for future daemon/desktop comparison;
4. hand a stable, observable primary-model system into Phase 12 without another opaque optimization wave.

The phase exists because George is now limited less by the absence of individual optimization ideas than by the cost of explaining why the local model/harness behaved as it did.

## Primary design rule

> Make George observable before making George more complicated.

The current target feedback loop is:

```text
run
 -> inspect authoritative correlated evidence
 -> identify divergence/bottleneck
 -> repair
 -> rerun
 -> compare
```

Phase 11 owns the application/core evidence needed for that loop.

Phase 12 owns daemon transport.

Phase 13 owns rich desktop visualization.

## Phase 10 boundary carried forward

Phase 10 is owner-closed at accepted package `0.10.12`.

The owner explicitly accepts the live GEP-selection Not Green result for roadmap progression.

Phase 11 must preserve that truth:
- deterministic GEP correctness/compatibility/efficiency is Green;
- the supported real-model workload completed successfully through legacy mutation fallback;
- Qwen did not emit the required existing-file GEP packet;
- live GEP selection and live GEP transport ratios remain unresolved;
- Phase 10 P7 lifecycle-order failure remains historical/intermittent Not Green evidence;
- all earlier Phase 8/9/10 Not Green and Evidence Gap history remains immutable.

Phase 11 does not attempt to force GEP selection.

It must instead expose enough evidence to make a future selection investigation explainable.

## Baseline freeze

Phase 11 establishes one consolidated primary-only baseline identity.

The baseline includes:
- pinned/default local Qwen model identity;
- Node/runtime/tool architecture;
- Phase 9 structured execution;
- Phase 10 accepted Human/Operation, context, batching, concurrency, correction, timeout, TaskState and GEP behavior;
- inherited permission/recovery/session authority;
- known owner waivers and historical gaps.

The baseline is provenance, not a claim that every historical gate is Green.

## Observatory bridge contract

Phase 11 introduces a presentation-independent **Observability Projection v1** in application/core.

It must expose bounded, versioned, correlated derived evidence sufficient for Phase 12/13 to answer:

- what task/work unit/run/turn/provider attempt is this?
- what normalized provider-facing request did George intentionally assemble?
- which context sources/categories contributed and how much?
- what tool schemas/capabilities were visible?
- was GEP eligible and was a receipt exposed?
- was legacy mutation fallback visible?
- which mutation mechanism did the model actually select?
- where did time and token usage go?
- what tool/approval/validation/correction/budget/recovery state surrounded the round?

The projection is derived diagnostic evidence.

It is not a second execution state machine and cannot authorize or mutate anything.

## Correlation identity

Projection records must use stable George-owned identities where available:

- session ID;
- turn ID;
- run ID;
- structured task fingerprint / stack identity where applicable;
- current work-unit ID where applicable;
- logical provider round;
- provider attempt ID;
- tool call ID;
- validation/correction IDs where applicable.

Do not invent a new correlation identity when existing canonical identities already exist.

## Provider-round projection

Each logical provider round should expose one bounded normalized projection with:

### Request identity
- execution mode;
- logical provider round;
- attempt/retry/rebase relationship;
- effective context profile;
- estimated provider-facing tokens;
- provider input ceiling/headroom/pressure;
- requested/applied output policy when present.

### Provider-facing sections
For each normalized section intentionally visible to the model:
- section kind;
- source/provenance identity where available;
- byte size;
- estimated token contribution;
- ordering;
- whether a bounded safe text preview is available.

Required section categories include, as applicable:
- George-owned instructions;
- conversation/history/current user input;
- routed/project context;
- authoritative state;
- late `roundContext`;
- completed tool-result continuation evidence.

### Tool/capability exposure
- exposed tool names;
- effect/replay classification;
- schema byte contribution;
- initial tool-choice policy where present.

### GEP/mutation visibility
For each eligible read/mutation opportunity, expose bounded facts such as:
- GEP eligibility;
- receipt exposed or withheld;
- withheld/fallback reason;
- projection bytes;
- legacy mutation fallback availability.

After the completed model round, correlate:
- selected tool call(s);
- selected GEP packet if any;
- selected mutation mechanism: `gep`, `write_file`, `apply_patch`, `create_directory`, other, or none.

This is descriptive evidence only.

George must not infer a model motive.

## Provider outcome projection

Correlate with existing provider lifecycle evidence:
- response acceptance;
- first useful output;
- provider-active duration;
- reported input/output/cached tokens when available;
- retries;
- stall/rebase/compaction relationship;
- terminal outcome/error class.

Do not preserve raw wire payloads.

## Context projection

Phase 11 should reuse existing context diagnostics rather than duplicate authority.

The observability projection should make inspectable:
- context operating mode/profile;
- attempted/promoted profiles;
- provider-input budget and remaining headroom;
- estimated tokens;
- soft-pressure state;
- source/category contributions;
- source identities/status;
- compaction checkpoints;
- omitted/deferred/duplicate/routed/failed evidence where current authority records it.

Where the current context subsystem does not expose a requested detail truthfully, Phase 11 may add a bounded derived field at the source producer.

Do not reconstruct a value in the UI.

## Security/privacy boundary

Observability Projection v1 must exclude:
- secrets/credentials;
- unrestricted environment variables;
- raw LM Studio HTTP/SSE captures;
- hidden chain-of-thought;
- unrestricted provisional Operation narration;
- unbounded mutation/process bodies;
- internal-only data not intentionally provider-visible.

Provider-visible text inspection must be bounded and redacted.

The schema must distinguish:
- canonical evidence;
- derived projection;
- omitted/redacted content.

## Persistence boundary

Phase 11 does not require every observability projection body to become durable session state.

Persist only what is justified by existing evidence/diagnostic retention contracts.

Phase 12 may query a bounded durable/derived history and stream current projections.

The application/core contract must make durability/ephemerality explicit.

## Baseline comparison artifact

Phase 11 records one representative supported primary-model baseline after the projection implementation is Green.

The artifact should record raw dimensions, not an aggregate score:
- functional/validation result;
- provider rounds/attempts/retries/rebases;
- input/cached/output tokens where reported;
- provider-active/total elapsed;
- tool calls;
- corrections;
- context profile;
- GEP eligibility/selection/fallback;
- current known gaps.

The workload is a baseline generator and observability proof, not a new GEP-selection gate.

A legacy mutation selection remains truthful baseline evidence and does not block Phase 11 solely because GEP was not selected.

## Deferred work

Explicitly defer until after the observability foundation:
- speculative decoding;
- further broad primary-model prompt/tool-selection optimization;
- live GEP-selection tuning;
- helper/utility inference;
- GPU/runtime experimentation not required for baseline validity;
- browser/visual model work;
- additional concurrency/parallel mutation experiments.

These may return as measured work once Phase 12/13 make them inspectable.

## Phase order

Phase 11 implementation order:

1. baseline identity + Observability Projection v1 contract;
2. provider-request/decision observability implementation;
3. bounded primary baseline qualification;
4. phase closeout.

## Success condition

Phase 11 is Green when:
- the current primary-model architecture is frozen/versioned;
- Phase 10 historical evidence and owner waivers are preserved;
- Observability Projection v1 is stable, bounded, redacted, versioned and presentation-independent;
- provider request composition and model/tool selection can be correlated truthfully;
- one supported primary-model baseline run is recorded;
- Phase 12 can consume application/core observability without reverse-engineering TUI output or raw session files;
- no new execution authority is introduced.

Phase 11 does not require live GEP selection to become Green.

## Non-goals

- maximizing model speed;
- speculative decoding;
- forcing GEP selection;
- helper inference;
- daemon implementation;
- Tauri implementation;
- browser control;
- visual-model runtime;
- LAN/remote service exposure;
- hidden-reasoning capture.
