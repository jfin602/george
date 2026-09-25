# Phase 9 Qualification Plan — Structured Task Execution + Workspace Autonomy

Status: APPROVED QUALIFICATION DIRECTION

## Purpose

Phase 9 is accepted only if structured orchestration improves reliability without weakening existing context, permission, recovery, session, evidence, or provider-independence contracts.

Phase 8 is owner-closed with accepted Not Green / Evidence Gap agentic-context evidence. Phase 9 inherits that truth rather than assuming a healthy context envelope was established.

Qualification is split into deterministic correctness, bounded task-slice correctness, mandatory replay of the Phase 8 edit-plus-validation regression, security/containment, TUI behavior, live-model execution, and longitudinal work benchmarks.

## Task-format parser and validator

Deterministic tests cover valid minimal/full v1 tasks, ordinary chat without the marker, unsupported format versions, missing/duplicate/unknown sections, duplicate IDs, unknown references, dependency cycles, invalid KIND, invalid validation discovery, invalid permission values, and prompts attempting to request more authority than configured.

Invalid structured prompts fail closed before provider/tool execution.

## Task state and orchestration

Fixtures prove requirement/work-unit/validation state derives from authoritative events rather than model claims; dependencies prevent premature work; READ FIRST follows Phase 3/8 routing; INSPECT requires actual evidence; required validation blocks completion while pending/failed; Planning needed/blocked are explicit; bounded correction retains failure history; correction exhaustion terminates truthfully; interruption/reopen reconstructs state without blind replay; and task state contains no model private reasoning.

The complete durable TaskState must remain distinct from provider-facing task slices. Deterministic coverage must prove:
- only the current work unit plus applicable requirements/invariants/validation/stops are sent by default;
- completed unrelated work units and old validation/correction history remain durable without being repeated in every provider request;
- bounded relevant failure evidence can be reintroduced for correction;
- a passing correction does not erase the earlier durable failure;
- task slicing preserves Phase 3/8 trust, precedence, routing, whole-source integrity, and required-context behavior;
- no new guessed context-size threshold is introduced merely to implement slicing.

## TUI qualification

Deterministic renderer tests prove Transcript and Task are separate first-class views; switching does not mutate authoritative state; the persistent header shows current task/work unit/progress; ordinary chat remains usable; Task shows goal/requirements/workflow/validation/blockers/recent work/effective policy without unsafe payloads; the composer works in both views; approvals/cancellation remain usable; resize/scrollback/selection/draft behavior remains intact; and work removed from Transcript remains available in Task/evidence projections.

Native-terminal qualification additionally exercises keyboard and supported pointer/tab interaction, live updates, cancellation, resize, and clean restoration.

Native Phase 9 TUI evidence is valid only on the supported Node 26 runtime. If Node 26 or a usable real TTY is unavailable, native TUI behavior remains Evidence Gap rather than being inferred from Node 24 or deterministic renderer tests.

## Workspace Autonomous policy

Tests prove standard mode preserves current approval behavior; workspace autonomous auto-allows only qualified workspace operations; outside reject denies without prompting; outside ask creates one bounded resource-specific approval; deny remains deny; allow-once does not create a broad grant; the canonical workspace resolver is not weakened or taught to treat approved outside paths as ordinary workspace paths; task permission expectations cannot elevate policy; network remains independent; external effects remain under Phase 6 policy; and environment/credential redaction remains unchanged.

## Process sandbox containment

Workspace-autonomous process execution is not Green until an actual OS-enforced containment path is exercised.

Adversarial integration tests prove a sandboxed process can operate on allowed workspace files and representative Node/npm/test/typecheck/Git-read workflows, but cannot read or modify outside sentinel files, cannot escape through symlinks/traversal, does not inherit unrestricted secret environment state, does not gain host-admin authority, obeys timeout/cancellation/cleanup, and fails closed when sandbox initialization fails.

If the qualification host cannot exercise the chosen containment mechanism, Workspace Autonomous process execution is Evidence Gap/Not Green and must not be represented as sandboxed.

The existing non-sandboxed host-process path remains separately labeled and approval-required. Workspace Autonomous process execution must use a distinct qualified containment path; merely changing approval policy on the existing `run_process` path is Not Green.

## Live-model execution

Use the pinned Qwen3-Coder/LM Studio control unless deliberately comparing another model.

Functional structured-task evidence may proceed when the REST-visible pinned runtime is healthy even if the UI-only GPU Offload 26 value is unconfirmed, but such runs are not controlled performance comparisons. Controlled latency comparisons require the relevant runtime controls to be independently established.

### Mandatory Phase 8 edit-plus-validation replay

Before the larger live-work instruments, replay the owner-accepted Phase 8 agentic edit-plus-validation failure as an equivalent structured-task workload.

The original Phase 8 result remains authoritative historical evidence and must not be overwritten. Record side-by-side:
- functional edit and validation outcome;
- expected/observed tool names and total calls;
- duplicate/redundant/unrequested tool behavior;
- provider rounds/attempts/retries;
- context/profile/provider-token evidence;
- wall time;
- human intervention;
- final requirement/work-unit/validation ledger state.

This replay is the earliest live gate for the core Phase 9 premise. If structured execution still fails, keep the result Not Green and continue debugging within Phase 9 rather than claiming usefulness from parser/TUI work alone.

A representative legacy/Terra-style versus structured-task comparison may additionally be retained where useful, but it does not replace this mandatory Phase 8 regression replay.

The structured path is not accepted merely for speed; correctness/evidence must be preserved or improved.

## Qualification order

Use this order so the central structured-execution hypothesis is tested early:

1. task parser/validator and TaskState determinism;
2. bounded provider task slicing;
3. mandatory Phase 8 edit-plus-validation structured replay;
4. validation/correction/resume orchestration;
5. Transcript/Task TUI;
6. Workspace Autonomous policy and process containment;
7. `greenfield-express-v1`;
8. `existing-express-feature-v1`.

A later layer does not erase an earlier Not Green result.

## Frozen live-work instruments

### greenfield-express-v1

Controlled clean Git repository, fixed Node/runtime/environment assumptions, fixed Task Prompt v1 stack, fixed user policy. The stack builds a small Node/Express application with meaningful API behavior, validation, tests, docs, and closeout.

### existing-express-feature-v1

One frozen fixture repository commit, one fixed structured feature stack, and hidden acceptance tests outside the model-visible workspace. The feature requires inspection, multiple edits, regression preservation, focused tests, broad validation, and completion reporting.

### Recorded dimensions

Record exact George commit/version; model/provider/runtime/context configuration; task-format/fixture/acceptance-suite versions; Green/Not Green/Evidence Gap; hidden acceptance; required validation; human interventions; defects detected/self-repaired; provider rounds/attempts/retries; tool calls/duplicates; context/profile/token evidence; wall time; sandbox/permission events; and final task ledger state.

Do not collapse these dimensions into one score.

After Phase 9, rerun both v1 instruments at every later phase closeout when available.

## Regression inheritance

Rerun affected Phase 2-8 coverage for workspace/path containment, tool-schema validation, approvals, Git dirty-state preservation, process timeout/cancellation/cleanup, context precedence/routing/budgets/adaptive profiles, durable session/recovery, validation/completion evidence, hooks/plugins/external effects, provider continuation, transcript commit truth, and P7 continuation-pressure safety.

Carry the Phase 8 owner-accepted evidence explicitly:
- no healthy all-family agentic envelope was established;
- the current profile values remain provisional inherited operating policy;
- the failed edit-plus-validation workload remains longitudinal evidence until directly improved;
- synthetic long-context results remain characterization rather than proof of coding-agent capacity.

Every confirmed regression leaves a permanent executable guard.
