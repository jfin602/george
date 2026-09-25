# Phase 9 Qualification Plan — Structured Task Execution + Workspace Autonomy

Status: APPROVED QUALIFICATION DIRECTION

## Purpose

Phase 9 is accepted only if structured orchestration improves reliability without weakening existing context, permission, recovery, session, evidence, or provider-independence contracts.

Phase 8 is owner-closed with accepted Not Green / Evidence Gap agentic-context evidence. Phase 9 inherits that truth rather than assuming a healthy context envelope was established.

Qualification is split into deterministic correctness, bounded task-slice correctness, mandatory replay of the Phase 8 edit-plus-validation regression, security/containment, TUI behavior, live-model execution, and longitudinal work benchmarks.

## Current post-correction qualification authority

The original qualification sequence remains historical authority, but current Phase 9 acceptance uses the following strict live gates after deterministic regression floors pass:

1. **Gate A — frozen Phase 8 structured edit-plus-validation replay.**
   - Must make the exact edit, pass George-owned validation, finish with completed/verified TaskState, use zero human coding intervention, avoid task/stage/correction exhaustion, and remain within the currently locked `<=10` model-requested tool calls and `<=10` logical provider rounds.
   - Must retain bounded attempt/trace artifacts even when production execution throws.
   - Record first INSPECT tool-choice mode, selected inspection tools, read SHA/mutation-precondition provenance, mutation tool and requested/result byte counts, pre/post SHA, final-newline state, recognized line-ending convention where applicable, validation/correction state, provider rounds/attempts/retries/tokens, context profile/estimated input, task/stage/run budgets, and timing where observable.
2. **Gate B — `greenfield-express-v1`.**
   - Runs only after Gate A Green.
   - Must execute through the production structured task-stack service, preserve strict fail-stop ordering, complete declared validations, and pass hidden acceptance.
3. **Gate C — `existing-express-feature-v1`.**
   - Runs only after Gate B Green.
   - Must preserve baseline behavior, pass focused/broad validation and hidden acceptance.

An official Not Green workload is not immediately rerun merely to obtain a pass. The failed attempt remains evidence; implementation must change under an approved correction before a new official attempt is spent.

Current qualified sub-boundaries:
- production StackState/task-stack validation, ordering, fail-stop, history, and durable resume — Green deterministically;
- Bubblewrap Workspace Autonomous containment — Green;
- full-file `read_file.sha256` -> mutation current-content precondition — Green;
- mandatory first-round structured INSPECT tool call — Green;
- exception-safe official live-attempt retention/artifact persistence — Green;
- application-owned INSPECT completion after one successful tool round — Green.

Current live Gate A remains **Not Green** only on byte-exact text-file fidelity. Qwen advanced from INSPECT into implementation, reused the observed target SHA as `write_file.expectedSha256`, made the semantic repair, passed George-owned V1, and ended with completed TaskState. However the requested full replacement was 59 bytes and omitted the existing final newline while the frozen exact requirement is 60 bytes. The mutation engine wrote the requested bytes exactly. The active qualification question is therefore preservation of existing text framing during model-authored edits.

## Task-format parser and validator

Deterministic tests cover valid minimal/full v1 tasks, ordinary chat without the marker, unsupported format versions, missing/duplicate/unknown sections, duplicate IDs, unknown references, dependency cycles, invalid KIND, invalid validation discovery, invalid permission values, and prompts attempting to request more authority than configured.

Invalid structured prompts fail closed before provider/tool execution.

## Task state and orchestration

Fixtures prove requirement/work-unit/validation state derives from authoritative events rather than model claims; dependencies prevent premature work; READ FIRST follows Phase 3/8 routing; INSPECT requires actual evidence and its first provider round requires a read-only tool call; required validation blocks completion while pending/failed; Planning needed/blocked are explicit; bounded correction retains failure history; correction exhaustion terminates truthfully; interruption/reopen reconstructs state without blind replay; and task state contains no model private reasoning. Deterministic qualification must also prove that whatever completion rule advances INSPECT into implementation is George-owned, bounded, and cannot be satisfied by narration alone.

The complete durable TaskState must remain distinct from provider-facing task slices. Deterministic coverage must prove:
- only the current work unit plus applicable requirements/invariants/validation/stops are sent by default;
- completed unrelated work units and old validation/correction history remain durable without being repeated in every provider request;
- bounded relevant failure evidence can be reintroduced for correction;
- a passing correction does not erase the earlier durable failure;
- task slicing preserves Phase 3/8 trust, precedence, routing, whole-source integrity, and required-context behavior;
- no new guessed context-size threshold is introduced merely to implement slicing.

## Text-file edit fidelity qualification

Phase 9 exact-edit qualification must distinguish semantic correctness from byte-exact file fidelity.

For existing UTF-8 text files, deterministic and integrated coverage must prove:
- `read_file` can expose bounded framing metadata without changing its full-file SHA authority, including whether the file ends in a newline and the recognized line-ending convention where safely determinable;
- localized `apply_patch` preserves all untouched bytes, including an existing final newline and surrounding LF/CRLF framing;
- full-replacement `write_file` remains exact caller-supplied content and never silently appends/removes/normalizes newlines;
- accidental final-newline removal/addition or line-ending conversion on an existing text file is rejected recoverably by default;
- an intentional framing change requires an explicit bounded opt-in and remains visible in tool/evidence state;
- a fidelity rejection supplies bounded diagnostic evidence so the model can retry while preserving normal mutation preconditions;
- non-text or framing-ambiguous files do not gain invented normalization semantics;
- hidden/exact acceptance remains independent from semantic test success when a task requires exact content.

A passing behavior test or completed TaskState does not by itself establish byte-exact acceptance. Official Gate A records the requested mutation bytes and the observed final bytes separately.

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
