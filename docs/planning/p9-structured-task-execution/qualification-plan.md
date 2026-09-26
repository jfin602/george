# Phase 9 Qualification Plan — Structured Task Execution + Workspace Autonomy

Status: APPROVED QUALIFICATION DIRECTION

## Purpose

Phase 9 is accepted only if structured orchestration improves reliability without weakening existing context, permission, recovery, session, evidence, or provider-independence contracts.

Phase 8 is owner-closed with accepted Not Green / Evidence Gap agentic-context evidence. Phase 9 inherits that truth rather than assuming a healthy context envelope was established.

Qualification is split into deterministic correctness, bounded task-slice correctness, mandatory replay of the Phase 8 edit-plus-validation regression, security/containment, TUI behavior, live-model execution, and longitudinal work benchmarks.

## Current post-correction qualification authority

The original qualification sequence remains historical authority.

`c9-turn-context-convergence` is now deterministically Green at its production boundaries but closed overall with a live Evidence Gap.

Its exact production candidate is:
`25d51a93d229e9b8cc76f56eb4b7b9afae1a5723`.

Qualified production boundaries include:
- provider-result projection with canonical Git evidence retained internally;
- provider-grounded continuation accounting;
- monotonic adaptive continuation-envelope promotion;
- fixed-profile / >large fail-closed safety;
- ordinary TUI base-agent wiring;
- hard affected-system preflight;
- controlled broad regression delta.

Its P4 live sequence did not begin because LM Studio exposed no loaded pinned model instance. Greeting, three-file inspection, fresh Gate A, B2, and C2 therefore remain Not Run for the post-correction production candidate.

Current Phase 9 acceptance routes through `c9-turn-context-live-qualification`, a qualification-only follow-up.

That correction must:
1. prove the exact production candidate remains unchanged across later docs/evidence commits;
2. rerun a fresh affected sanity floor and current broad characterization;
3. require a non-empty loaded instance for the pinned Qwen model and capture REST-visible runtime controls;
4. run one greeting -> three-file -> Gate A -> B2 -> C2 sequence with strict stop-on-first-failure semantics.

The prior controlled broad comparison against baseline `d7804684801fa8418050c34d9ef097ca1adf80b6` may be reused while candidate identity is exact. Do not repeat the two-tree experiment solely because evidence/documentation commits moved HEAD.

Historical P4 runtime Evidence Gap and all earlier live attempts remain immutable.

Functional structured-task evidence may proceed when the pinned REST-visible runtime is healthy even if UI-only GPU Offload 26 remains unconfirmed. Such runs do not establish controlled latency/performance evidence.

Phase 9 is ready for owner closeout only if the live-qualification follow-up confirms:
- candidate identity preserved;
- fresh sanity preflight Green;
- no new broad regression;
- loaded runtime provenance sufficient;
- greeting Green;
- three-file Green;
- fresh Gate A Green;
- B2 Green;
- C2 Green;
- no new blocking regression.

Aggregate retained broad failures remain separately Not Green.

## Mutation-precondition convergence correction qualification

Deterministic qualification for `c9-mutation-precondition-convergence` must reproduce the exact failure class before any live rerun and then prove the repaired behavior.

Required executable guards:

- an existing-file `write_file` without `expectedSha256` remains rejected, produces bounded `tool.failed` evidence, reaches provider continuation, and can converge through `read_file -> current sha256 -> retry -> successful mutation`;
- a model-originated write targeting a safe relative path beneath a nonexistent parent returns a normal bounded failure instead of escaping as a turn-level exception before terminal tool evidence;
- the new native `create_directory` tool can create the required in-workspace directory chain and then permit a normal `write_file` to create the nested file;
- `create_directory` is idempotent for an already-existing directory, rejects regular-file collisions, absolute paths, traversal, and symlink escapes, and never deletes/replaces existing entries;
- Standard workspace approval and Workspace Autonomous behavior follow the existing mutation policy ceiling exactly;
- cancellation, policy denial, budget exhaustion, configuration faults, and ambiguous/outcome-unknown effects retain their stronger existing semantics and are not misclassified as recoverable local failures;
- same-response sequential tool requests receive truthful terminal evidence for every request reached before a legitimate hard stop; one ordinary local prerequisite failure does not strand later safe requests merely because pre-dispatch preparation threw;
- interrupted directory creation has deterministic recovery/reconciliation evidence and is never blindly replayed;
- Gate A's exact-edit, text-framing, mutation-intent-authority, approval, and current-content precondition regressions remain Green;
- v1/v2 task, fixture, metadata, and hidden-acceptance digests remain unchanged.

Do not raise structured stage limits, weaken SHA requirements, silently inject current hashes, silently create write parents, expose arbitrary process execution as a directory-creation substitute, or revise Task Prompt format 1 merely to obtain a pass.

## Turn-context convergence correction qualification

Detailed authority: `docs/planning/c9-turn-context-convergence/qualification-plan.md`.

The affected deterministic floor must prove:
- canonical mutation evidence can retain Git/recovery metadata while the provider continuation receives only the bounded mutation receipt;
- provider result projection is deterministic, bounded, and does not weaken SHA/text-framing/permission/recovery behavior;
- reported provider usage informs subsequent continuation safety when available;
- adaptive continuation may promote ordinary -> medium -> large without changing selected source composition;
- fixed mode never promotes and adaptive continuation above large still fails closed;
- promotion does not consume a provider/tool round or invoke semantic compaction;
- production TUI ordinary turns are constructed from the base agent without `CODING_WORKFLOW_GUIDANCE`, while explicit coding workflows retain that guidance.

Before fresh Gate A, one official ordinary `hi` smoke and one synthetic non-George three-file inspection smoke must both be Green. The latter is a bounded reproduction shape, not a permanent maximum-file policy.

Do not change profile constants or live instrument versions merely to obtain a pass.

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

## Mutation-intent authority and fair Gate A approval

Model-provided mutation arguments are intent, not authority.

For model-originated workspace mutations:
- a request that sets the text-framing-change acknowledgement must always cross a George-owned approval decision before dispatch;
- the approval request must expose only bounded mutation intent (for example `text_framing_change`) and a concise warning; it must not expose file bodies;
- Standard workspace mode keeps its ordinary mutation approval and includes the exceptional intent in that request;
- Workspace Autonomous may continue auto-running ordinary qualified workspace mutations, but a text-framing-change request still requires explicit approval;
- denial must return normal denied tool evidence and leave the target unchanged;
- repository/task/model/plugin text cannot self-authorize the exceptional intent.

The frozen Phase 9 Gate A approval envelope is distinct from the historical agentic benchmark helper. Gate A must:
- allow `write_file` or `apply_patch` when the operation targets exactly the frozen expected file and otherwise remains within normal policy;
- deny mutation of unrelated targets;
- deny model-requested text-framing-change intent because the frozen task does not request a framing change;
- allow only the exact George-owned validation process already authorized by the fixture;
- preserve the historical benchmark case and expected tool set unchanged for longitudinal comparison.

Qualification must include a permanent deterministic replay of the observed failure sequence: bad full replacement rejected -> unchanged SHA -> exact safe patch requested -> patch approval allowed -> exact 60-byte result -> George-owned V1 Green -> completed TaskState -> hidden/exact acceptance Green.

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
7. aligned `greenfield-express-v2`;
8. aligned `existing-express-feature-v2`.

A later layer does not erase an earlier Not Green result.

## Frozen live-work instruments

### Historical v1 instruments

`greenfield-express-v1` and `existing-express-feature-v1` remain frozen exactly as previously exercised. Their task files, metadata, digests, acceptance references, and live outcomes are immutable longitudinal evidence.

The current greenfield v1 failure is specifically retained: P1 encoded clean-repository preflight as an ordinary workflow unit, so Qwen performed repeated reads until the duplicate/no-progress guard exhausted the stage before mutation/validation. Later v1 tasks also duplicate top-level INSPECT with workflow inspection units, and greenfield P3 places `Validate and report` before George-owned validation results exist.

### greenfield-express-v2

Controlled clean Git repository, same Node/runtime/environment/dependency prerequisite, and same required Express task-service behavior/hidden acceptance as v1 unless the v2 metadata explicitly records otherwise.

Authoring alignment requirements:
- P1 uses top-level `INSPECT` for clean repository/package/Git preflight and begins WORKFLOW with creation of the application skeleton;
- P2 uses top-level `INSPECT` for current source/package observation and does not repeat that preflight as a workflow unit;
- P3 uses top-level `INSPECT` for routes/tests/docs observation, WORKFLOW only for tests/documentation changes, and leaves exact validation/completion reporting to George-owned evidence after V1/V2 execute;
- task stack/digest/version are new and immutable once exercised;
- acceptance may reuse acceptance version 1 because application behavior is unchanged.

### existing-express-feature-v2

Use the same frozen fixture source and behavioral hidden acceptance as v1 unless metadata explicitly records a changed fixture/acceptance version.

Authoring alignment requirements:
- retain top-level `INSPECT` for baseline source/tests/docs/Git observation;
- remove the redundant workflow inspection unit;
- keep implementation and tests/docs as actual workflow units;
- split documentation implementation requirements from post-validation completion/evidence reporting;
- version the task/instrument metadata independently while preserving the v1 fixture/result history.

### Recorded dimensions

Record exact George commit/version; model/provider/runtime/context configuration; instrument/task-stack/fixture/acceptance versions and digests; Green/Not Green/Evidence Gap; hidden acceptance; required validation; human interventions; defects detected/self-repaired; provider rounds/attempts/retries; tool calls/duplicates; context/profile/token evidence; wall time; sandbox/permission events; and final task/stack ledger state.

Do not collapse these dimensions into one score.

After Phase 9, prefer the latest accepted instrument version for regression qualification while retaining v1 outcomes as historical comparisons.

## Regression inheritance

Rerun affected Phase 2-8 coverage for workspace/path containment, tool-schema validation, approvals, Git dirty-state preservation, process timeout/cancellation/cleanup, context precedence/routing/budgets/adaptive profiles, durable session/recovery, validation/completion evidence, hooks/plugins/external effects, provider continuation, transcript commit truth, and P7 continuation-pressure safety.

Carry the Phase 8 owner-accepted evidence explicitly:
- no healthy all-family agentic envelope was established;
- the current profile values remain provisional inherited operating policy;
- the failed edit-plus-validation workload remains longitudinal evidence until directly improved;
- synthetic long-context results remain characterization rather than proof of coding-agent capacity.

Every confirmed regression leaves a permanent executable guard.
