# Phase 9 Qualification Plan — Structured Task Execution + Workspace Autonomy

Status: APPROVED QUALIFICATION DIRECTION

## Purpose

Phase 9 is accepted only if structured orchestration improves reliability without weakening existing context, permission, recovery, session, evidence, or provider-independence contracts.

Qualification is split into deterministic correctness, security/containment, TUI behavior, live-model execution, and longitudinal work benchmarks.

## Task-format parser and validator

Deterministic tests cover valid minimal/full v1 tasks, ordinary chat without the marker, unsupported format versions, missing/duplicate/unknown sections, duplicate IDs, unknown references, dependency cycles, invalid KIND, invalid validation discovery, invalid permission values, and prompts attempting to request more authority than configured.

Invalid structured prompts fail closed before provider/tool execution.

## Task state and orchestration

Fixtures prove requirement/work-unit/validation state derives from authoritative events rather than model claims; dependencies prevent premature work; task slices preserve applicable requirements/invariants/stops; READ FIRST follows Phase 3/8 routing; INSPECT requires actual evidence; required validation blocks completion while pending/failed; Planning needed/blocked are explicit; bounded correction retains failure history; correction exhaustion terminates truthfully; interruption/reopen reconstructs state without blind replay; and task state contains no model private reasoning.

## TUI qualification

Deterministic renderer tests prove Transcript and Task are separate first-class views; switching does not mutate authoritative state; the persistent header shows current task/work unit/progress; ordinary chat remains usable; Task shows goal/requirements/workflow/validation/blockers/recent work/effective policy without unsafe payloads; the composer works in both views; approvals/cancellation remain usable; resize/scrollback/selection/draft behavior remains intact; and work removed from Transcript remains available in Task/evidence projections.

Native-terminal qualification additionally exercises keyboard and supported pointer/tab interaction, live updates, cancellation, resize, and clean restoration.

## Workspace Autonomous policy

Tests prove standard mode preserves current approval behavior; workspace autonomous auto-allows only qualified workspace operations; outside reject denies without prompting; outside ask creates one bounded resource-specific approval; deny remains deny; allow-once does not create a broad grant; task permission expectations cannot elevate policy; network remains independent; external effects remain under Phase 6 policy; and environment/credential redaction remains unchanged.

## Process sandbox containment

Workspace-autonomous process execution is not Green until an actual OS-enforced containment path is exercised.

Adversarial integration tests prove a sandboxed process can operate on allowed workspace files and representative Node/npm/test/typecheck/Git-read workflows, but cannot read or modify outside sentinel files, cannot escape through symlinks/traversal, does not inherit unrestricted secret environment state, does not gain host-admin authority, obeys timeout/cancellation/cleanup, and fails closed when sandbox initialization fails.

If the qualification host cannot exercise the chosen containment mechanism, Workspace Autonomous process execution is Evidence Gap/Not Green and must not be represented as sandboxed.

The existing non-sandboxed host-process path remains separately labeled and approval-required.

## Live-model execution

Use the pinned Qwen3-Coder/LM Studio control unless deliberately comparing another model.

Where practical, compare one representative rich legacy/Terra-style implementation brief with equivalent structured-task execution. Record requirement completion, validation truth, provider rounds/attempts, tool calls/duplicates, retries, context exposure, wall time, human intervention, and final functional result.

The structured path is not accepted merely for speed; correctness/evidence must be preserved or improved.

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

Rerun affected Phase 2-8 coverage for workspace/path containment, tool-schema validation, approvals, Git dirty-state preservation, process timeout/cancellation/cleanup, context precedence/routing/budgets/adaptive profiles, durable session/recovery, validation/completion evidence, hooks/plugins/external effects, provider continuation, and transcript commit truth.

Every confirmed regression leaves a permanent executable guard.
