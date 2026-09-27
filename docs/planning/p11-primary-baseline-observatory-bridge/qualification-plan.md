# Phase 11 — Primary Baseline Freeze + Observatory Bridge — Qualification Plan

Status: **APPROVED QUALIFICATION DIRECTION**

Date: 2026-09-27

Baseline package: `0.11.0`

Authority:
- `docs/planning/p11-primary-baseline-observatory-bridge/decision-record.md`;
- `docs/planning/p11-primary-baseline-observatory-bridge/observability-projection-v1.md`;
- `docs/phase-10-owner-closeout.md`;
- Phase 12/13 observability planning.

## Qualification objective

Prove Phase 11 freezes a truthful primary-model baseline and exposes enough bounded application/core evidence for Phase 12/13 without adding a second execution authority.

## P1 — baseline identity + projection contract

Required:
- transition package from 0.11.0 baseline to P1 target;
- add versioned projection types/contracts in application/core, not TUI;
- preserve exact Phase 10 owner-closeout truth;
- define canonical/derived distinction and redaction/bounds;
- establish stable correlation fields using existing session/turn/run/attempt/tool/task IDs;
- tests for schema/version/bounds/redaction and immutability/read-only semantics.

P1 does not need to populate every provider-round field yet.

## P2 — provider request + decision observability

### Request accuracy

For scripted providers, compare projection against the actual `ProviderRequest` handed to the provider.

Prove:
- execution mode matches;
- normalized section ordering matches;
- instruction/input/roundContext/continuation/tool exposure byte accounting is truthful;
- context profile/budget/headroom/pressure is correlated correctly;
- tool names/effects/replay/schema sizes match the selected registry;
- request projections distinguish initial requests, continuations and canonical rebases.

### Provider lifecycle

Prove:
- logical round and attempts are distinguishable;
- acceptance/first-useful/provider-active timing correlates with existing attempt evidence;
- reported input/output/cached tokens remain unavailable when the provider does not report them;
- retry/stall/rebase relationships are represented without duplicating canonical provider events.

### GEP/legacy selection

Create deterministic cases for:
1. GEP-eligible read with receipt exposed;
2. oversized/ineligible read with legacy-only fallback;
3. model emits GEP packet;
4. model emits legacy `apply_patch`;
5. model emits legacy `write_file`;
6. no mutation selected.

Projection must show availability/selection facts without inventing motive.

### Context

Prove source/category contributions and profile/headroom values reflect actual assembled context diagnostics.

If current context implementation cannot supply a requested field, the projection must mark it unavailable rather than infer it.

### Security/privacy

Negative cases:
- secret-bearing input is redacted/metadata-only as required;
- credentials/environment secrets never enter projection;
- raw provider wire payloads are absent;
- Operation provisional text remains absent;
- unbounded mutation/process bodies remain excluded.

## P3 — bounded baseline qualification

### Common validity

Require:
- Node >=26.4.0 <27;
- package at P3 target;
- known candidate;
- reachable LM Studio;
- loaded recorded Qwen model for live baseline.

### Deterministic

Run:
- observability projection focused tests;
- provider/context/GEP/task/session affected tests;
- Phase 5/9/10 inherited affected floors;
- typecheck;
- runner tests;
- broad `npm test` once;
- diff check.

### Quick benchmark

Run one supported quick benchmark on the exact candidate.

Record raw dimensions and correctness.

Do not optimize between baseline runs.

### Real-model observability baseline

Run one compact supported Qwen coding workload exactly once.

Purpose:
- create a representative Phase 11 primary baseline;
- prove the projection contains enough evidence to explain the run.

Record:
- functional/validation result;
- provider rounds/attempts/retries/rebases;
- input/cached/output usage;
- provider-active/total time;
- context profile/headroom;
- exposed mutation mechanisms;
- GEP eligibility and actual selection;
- tools;
- corrections;
- terminal TaskState/session reopen;
- projection completeness/redaction.

GEP selection is descriptive baseline evidence.

A legacy fallback does not by itself make P3 Not Green.

Functional/safety failures still do.

Do not run B2/C2.

Do not rerun to fish for a different model choice.

## P4 — closeout

Create `docs/phase-11-closeout.md`.

Decision table:
- Phase 10 Owner Waiver Preserved;
- Primary Baseline Identity Frozen;
- Observability Projection v1 Versioned;
- Correlation Identity Qualified;
- Provider Request Projection Accurate;
- Context Projection Accurate;
- Tool Exposure Projection Accurate;
- GEP Eligibility/Selection Projection Qualified;
- Provider Timing/Usage Projection Qualified;
- Canonical/Derived Boundary Preserved;
- Redaction/Privacy Qualified;
- Task/Validation/Correction Correlation Qualified;
- Broad Suite;
- Quick Benchmark;
- Real LM Studio/Qwen Baseline;
- Live GEP Selection Observed State;
- Remaining Blocking Failure Count;
- Evidence Gaps;
- Overall Phase 11 Qualified;
- Phase 12 Ready.

Closeout must not claim live GEP selection Green unless actually observed.

## Phase 12 readiness

Phase 12 is ready when:
- the application/core can produce a bounded versioned current observability projection;
- provider request composition can be inspected without raw wire capture;
- model-selected tools/mutation mechanism can be correlated to what was exposed;
- task/context/provider/tool/validation/budget evidence can be joined through stable IDs;
- deterministic/privacy contracts are Green;
- a representative current primary-model baseline exists.

Phase 12 readiness does not require speculative decoding or further primary-model optimization.
