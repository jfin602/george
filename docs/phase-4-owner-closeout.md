# Phase 4 Owner Closeout

Status: OWNER-CLOSED WITH EXPLICIT NATIVE-TERMINAL / LIVE-MODEL QUALIFICATION WAIVER

Closed: 2026-09-22  
Phase: 4 — Coding Workflow + Sessions  
Accepted implementation/qualification candidate: `ceac33dd09c85e141a4ff8a892a7e0dca8198ea2` (`0.4.6`)  
Formal P7 closeout marker: `8374f3b3453c3ebc66942f2cf8796b34736c588d` (`0.4.7`)  
Phase 5 baseline: `0.5.0`

This record captures the owner's explicit `/closeout phase 4` decision on 2026-09-22.

The owner accepts the completed Phase 4 implementation and formal evidence state, including the recorded Evidence Gaps, and authorizes roadmap progression to Phase 5 planning.

This is an owner waiver/acceptance decision for roadmap progression. It does **not** rewrite missing native OpenTUI or live LM Studio/Qwen evidence into Green.

## Closeout decision

The accepted Phase 4 implementation/qualification candidate is:

`ceac33dd09c85e141a4ff8a892a7e0dca8198ea2`

at package `0.4.6`.

The formal P7 marker is:

`8374f3b3453c3ebc66942f2cf8796b34736c588d`

at package `0.4.7`.

Formal Phase 4 evidence truth is preserved in:

- `docs/phase-4-closeout.md`;
- `docs/tasks/p4/P6-qualification-evidence.md`.

The P7 commit referenced `docs/phase-4-closeout.md` but did not actually include it; the owner-closeout transition restores that missing documentation record without changing implementation or qualification evidence.

Phase 4 is therefore **owner-closed with known Evidence Gaps accepted for roadmap progression**.

## Accepted capability state

The owner accepts the Phase 4 Coding Workflow + Sessions foundation that establishes:

- one provider-independent coding workflow around the canonical agent loop;
- pre-run and final workspace/Git evidence with pre-existing dirty work preserved;
- conservative changed-file accounting and direct George-native mutation evidence without false arbitrary-process attribution;
- explicit validation through the canonical process/tool/approval boundary;
- structured validation and completion evidence;
- sufficiently detailed final coding responses while routine progress remains harness-generated;
- presentation-independent activity, progress, and stable concrete-operation work items;
- truthful context-source lifecycle observability;
- bounded safe summaries for file reads/listing/search, Git inspection, writes/patches, approvals, process execution, validation, recovery, and completion;
- literal process executable/argv/cwd visibility without unrestricted output/environment leakage;
- a chronological OpenTUI execution transcript that remains separate from canonical model conversation context;
- schema-versioned local filesystem session persistence outside target repositories;
- canonical workspace binding and completed-history reconstruction;
- interrupted mutation/process/approval/provider state surfaced as historical interruption and never silently replayed;
- explicit durable reopen followed by fresh new-turn semantics;
- preserved Phase 2 tool/approval/process/Git safeguards and Phase 3 context/skill boundaries.

## Preserved evidence and limitations

Deterministic qualification is Green as recorded by P6.

The following remain **Evidence Gap**, not passes:

- genuine native-terminal qualification of the full Phase 4 execution transcript, approvals, cancellation, durable reopen, draft behavior, resize/scrollback, and terminal restoration;
- live LM Studio/Qwen qualification through the Phase 4 coding/session/work-projection path, including exact configured model/runtime, provider usage where available, live tool/validation behavior, and live completion/transcript characterization.

The owner explicitly accepts these gaps for roadmap progression. Later qualification may close them, but future documentation must not imply they were already proven in Phase 4.

## Authority carried forward

Unless a later approved phase explicitly changes them:

- the canonical model/tool loop remains application/core-owned and presentation-independent;
- OpenTUI remains an adapter;
- tool execution, validation, and approvals remain governed by George's typed canonical boundaries;
- approved arbitrary processes remain explicitly non-sandboxed;
- pre-existing user work must remain preserved;
- changed-file evidence must distinguish observation from causal attribution;
- validation failures remain authoritative even when assistant prose disagrees;
- work/progress presentation does not become provider-facing conversation merely because it was shown;
- persisted state remains workspace-bound, schema-versioned, bounded, and outside the target repository by default;
- interrupted side effects are not automatically replayed;
- prior skill activation and approval decisions do not silently become sticky on reopen;
- Phase 2 and Phase 3 permission/context/skill safeguards remain in force;
- exact phase-runner/no-package-lock workflow invariants remain in force;
- native/live evidence remains distinct from deterministic fixture evidence.

## Phase 5 gate

The next roadmap phase is:

**Phase 5 — Reliability + Long Runs**

The Phase 5 baseline is `0.5.0`.

Phase 5 owns the next reliability layer already recorded in the roadmap: compaction/summarization, richer budgets/limits, retries/backoff, crash/interruption reconciliation beyond Phase 4 non-replay semantics, child-process cleanup hardening, observability/performance characterization, extended Qwen qualification, and the executable lifecycle-hook runtime.

Phase 5 is a planning gate, not yet an approved implementation stack. Normal workflow resumes with:

`/docs-review -> /docs-apply -> /prompt-ass -> /prompt-plan -> /prompt-write p5`
