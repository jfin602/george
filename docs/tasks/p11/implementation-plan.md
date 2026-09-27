# Phase 11 Implementation Plan

Status: READY FOR PROMPT EXECUTION

Baseline package: `0.11.0`.

## P1 — baseline identity + Observability Projection v1

Likely implementation boundary:
- add a presentation-independent observability module under application/core;
- define schema version 1 projections for run/provider-round/request sections/tool exposure/context/task correlation;
- define bounds/redaction helpers;
- add tests for versioning, canonical/derived separation and bounded serialization.

Avoid daemon/TUI dependencies.

Target: `0.11.1`.

## P2 — request and decision observability

Instrument the actual provider request-construction seam in `AgentLoopApplicationService`.

Record/derive:
- logical round;
- attempt IDs;
- request section sizes/order/provenance;
- context profile/headroom;
- tools exposed/schema sizes/effect/replay;
- GEP eligibility/receipt/fallback;
- selected mutation mechanism;
- provider timing/usage/retry/rebase;
- task/work correlation where available.

Prefer new bounded application events/projection stores only where current canonical events cannot be joined accurately.

Do not store raw provider wire traffic.

Target: `0.11.2`.

## P3 — baseline qualification

Create Phase 11 evidence under `docs/tasks/p11/`.

Run deterministic/broad floors once, quick benchmark once, and one compact real Qwen workload once.

The real workload generates a baseline observability record.

Do not optimize or rerun based on GEP choice.

Target: `0.11.3`.

## P4 — closeout

Create `docs/phase-11-closeout.md`.

Evidence-only.

Phase 12 is unblocked if projection/security/correlation contracts are Green and the baseline is recorded.

Target: `0.11.4`.

## Version path

Repository is transitioned to `0.11.0` by the planning/apply commit before the runner starts.

Runner then owns:
- P1 -> 0.11.1
- P2 -> 0.11.2
- P3 -> 0.11.3
- P4 -> 0.11.4
