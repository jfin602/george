# Phase 8 Owner Closeout

Status: OWNER-CLOSED WITH EXPLICIT AGENTIC-CONTEXT NOT-GREEN / EVIDENCE-GAP ACCEPTANCE

Closed: 2026-09-25  
Phase: 8 — Context Throughput Optimization  
Accepted Phase 8 implementation package: `0.8.8`  
Phase 8 implementation closeout candidate: `07241c94ed3cbc0dafc969f0a59676b39e232fb0`  
Agentic-context correction closeout marker: `398b888f6b76b6a67b9a22a9137cf27fd20ab129`  
Phase 9 baseline: `0.9.0`

This record captures the owner's explicit `/closeout phase 8` decision on 2026-09-25.

The owner accepts the completed Phase 8 implementation plus the `c8-agentic-context` correction evidence state for roadmap progression to Phase 9.

This is an owner acceptance/waiver decision. It does **not** rewrite the correction's Not Green results or Evidence Gaps into Green.

## Closeout decision

Formal Phase 8 and correction evidence truth is preserved in:

- `docs/phase-8-closeout.md`;
- `docs/tasks/c8-agentic-context/P2-agentic-envelope-evidence.md`;
- `docs/tasks/c8-agentic-context/P3-policy-decision.md`;
- `docs/tasks/c8-agentic-context/P4-deterministic-qualification-evidence.md`;
- `docs/tasks/c8-agentic-context/P5-live-qualification-evidence.md`;
- `docs/tasks/c8-agentic-context/closeout.md`.

Phase 8's deterministic adaptive-context machinery is accepted as implemented and regression-qualified.

The `c8-agentic-context` correction is **Implementation Complete but Correction Not Qualified**. The owner explicitly accepts that state for roadmap progression.

## Accepted Phase 8 capability state

The owner accepts the Phase 8 foundation establishing:

- explicit adaptive versus fixed context mode;
- deterministic ordinary -> medium -> large probing before the first provider request;
- provider/tool/session-neutral discarded probes;
- one frozen selected profile for each user turn;
- Phase 3 trust, precedence, source identity, whole-source omit/defer/fail behavior, and smallest-sufficient-working-set laws;
- selected-profile and promotion diagnostics;
- promotion before provider-backed semantic compaction for ordinary/medium;
- Phase 5 large/fixed compaction, checkpoint, recovery, and canonical-history authority;
- P7 frozen-turn continuation-pressure fail-closed behavior;
- synthetic long-context benchmarking retained as prefill/runtime characterization;
- a new `agentic-context` benchmark suite v3 / schema 3 using real George application/provider/tool boundaries and inspection, multi-round investigation, and edit-plus-validation families.

The current production profile values remain the historical/provisional `0.8.8` values. They are accepted as the inherited Phase 9 baseline, **not** as empirically proven optimal agentic envelopes.

## Preserved Not Green evidence

The owner explicitly accepts the following Not Green evidence for roadmap progression:

- P2's only requested 2,048-band agentic sweep passed 1/3 families;
- P5's bounded smallest-band diagnostic passed inspection and multi-round investigation but failed edit plus validation;
- the P5 edit-plus-validation run expanded into unrequested tools and repeated calls and did not produce the required edit;
- no all-family healthy agentic envelope was established.

These results must remain Not Green. They are not relabeled as a context-size cliff.

The available evidence does **not** establish that context size caused the edit/validation failure. The failed workflow is consistent with a broader agent/task-orchestration weakness, but Phase 8 does not claim causality.

## Preserved Evidence Gaps

The owner also accepts these Evidence Gaps for roadmap progression:

- no empirically healthy all-family agentic working-set region;
- no adjacent measured risk/cliff region;
- no confirmation repetitions around a healthy/risk boundary;
- main-model GPU Offload 26 was not independently confirmed during the correction measurements;
- controlled comparable latency remains incomplete;
- the correction's P5 run did not obtain supported Node-26 real-TTY/OpenTUI qualification;
- no qualified adaptive-envelope-specific fail/degrade threshold exists beyond the existing hard-profile safety behavior.

Future work may close these gaps, but later documentation must not imply Phase 8 already proved them Green.

## Why progression to Phase 9 is accepted

Phase 9 is intentionally the structured-execution phase.

Its approved design moves requirements, work-unit ordering, validation truth, stop conditions, bounded correction state, and task slicing into George-owned application/core state rather than requiring the coding model to reconstruct the entire workflow from prose.

That work directly addresses the class of practical weakness exposed by the failing agentic edit/validation case: expanded tool planning, unreliable completion of a bounded edit workflow, and weak orchestration around validation.

This owner decision therefore accepts the unresolved Phase 8 agentic-envelope evidence while requiring Phase 9 to:

- inherit all Phase 3/8 context precedence, provenance, budgeting, diagnostics, and continuation-safety contracts;
- use bounded task slices under the smallest-sufficient-working-set law;
- preserve the new agentic-context benchmark as a real coding-agent measurement instrument;
- never present the provisional `0.8.8` profile values as empirically optimal;
- retain raw Not Green/Evidence Gap dimensions in Phase 9 live-work qualification.

Phase 9 progression is not evidence that the Phase 8 agentic correction became Green.

## Authority carried forward

Unless a later approved phase explicitly changes them:

- physical context remains 32,768 for the pinned runtime;
- the current ordinary/medium/large values remain provisional operating policy;
- required/current/tool/recovery context cannot be silently truncated;
- adaptive probes remain local and non-canonical;
- the selected profile remains frozen within one user turn;
- fixed mode remains an explicit concrete-profile override;
- canonical George session/context evidence remains authoritative;
- Phase 5 recovery/compaction and replay-safety rules remain in force;
- P7 continuation-pressure safety remains a required regression boundary;
- synthetic context results remain characterization, not agentic profile-boundary proof;
- real task correctness outranks token-count or latency improvements.

## Phase 9 gate

The next roadmap phase is:

**Phase 9 — Structured Task Execution + Workspace Autonomy**

The Phase 9 baseline is `0.9.0`.

Phase 9 authority:

- `docs/planning/p9-structured-task-execution/decision-record.md`;
- `docs/planning/p9-structured-task-execution/task-format-v1.md`;
- `docs/planning/p9-structured-task-execution/qualification-plan.md`.

Normal workflow resumes with:

`/docs-review phase 9 alignment to final phase 8 evidence -> /docs-apply -> /prompt-ass + /prompt-plan + /prompt-write p9`
