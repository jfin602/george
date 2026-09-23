# Phase 5 Implementation Plan

Status: CURRENT IMPLEMENTATION PLAN

Phase: 5 — Reliability + Long Runs  
Execution folder: `p5`  
Baseline: package `0.5.0`; exact main SHA must be refreshed to the committed post-Phase-4 hardening candidate before P1 executes.

Read with `BOOT.md`, `AGENTS.md`, `docs/project-overview.md`, `docs/architecture.md`, `docs/workflow.md`, `docs/stability-contract.md`, `docs/roadmap/mvp-roadmap.md`, `docs/planning/p5-reliability-long-runs/decision-record.md`, and `docs/tasks/p5/prompt-assessment.md`.

## Preserved post-Phase-4 hardening

All P1-P8 work builds on and must preserve: per-provider-round assistant buffering; canonical assistant commit only from a completed tool-free round; no durable/provider-facing provisional tool-round text; fast progressive reveal of the committed final answer; bounded allowlisted failed-tool argument diagnostics; `list_directory` root normalization for omitted/empty/`.` paths with unchanged containment; bounded safe provider error metadata; the `Thinking...` provider activity label; and compact consecutive Work grouping with explicit textual per-item status. These remain presentation/diagnostic projections where applicable and never become alternate execution authority.

## Target architecture

```text
OpenTUI adapter
      |
coding workflow / agent application
      |
 +----+------------+-------------+--------------+
 |                 |             |              |
run budget      context       recovery       hook bus
 |              compaction       |              |
 |                 |          session/tool    bounded
 |                 |          evidence        executors
 +--------+--------+-------------+--------------+
          |
 authoritative normalized application events
          |
   +------+------------------+
   |                         |
durable session          diagnostics
store                    + metrics
   |
provider / canonical tools / process executor
```

The Phase-4 `AgentLoopApplicationService`, `CodingWorkflowApplicationService`, `LocalSessionStore`, ToolRegistry, context assembler, and WorkProjection remain the execution/evidence foundation. Phase 5 extends them; it does not create a parallel long-run agent loop.

## P1 — long-run budget and reliability-event foundation

Target: `0.5.1`.

Add provider-independent run-budget types/tracker in the application/core layer and normalized reliability event shapes.

Track finite configured maxima and consumption for the dimensions Phase 5 can observe reliably, including provider attempts, retry attempts, compactions, process executions/cumulative runtime, wall-clock runtime, and context/provider usage. Preserve the existing `maxToolCalls` / `maxToolRounds` behavior as an independent final loop guard.

Budget state must be scoped to one run/turn workflow invocation, not global mutable process state.

Emit bounded events for budget pressure/exhaustion and expose a stable snapshot suitable for persistence/diagnostics. Add an explicit budget terminal error/state rather than overloading provider/tool failure.

Product defaults must be finite, configuration-validated, and not accidentally stricter than the already-supported ordinary Phase-4 workflow. Deterministic tests should inject small budgets to exercise pressure/exhaustion quickly.

Extend durable-event sanitization only as needed for new bounded reliability events. Do not add compaction, retry execution, recovery reconciliation, hooks, or disk diagnostics yet.

## P2 — provider-facing compaction/checkpoints

Target: `0.5.2`.

Introduce a provider-independent `ContextCompactor`-style boundary owned below presentation/provider adapters.

The normal product path may use the already-selected model provider as a semantic compactor with no tools advertised; deterministic tests inject a scripted compactor so correctness does not depend on model quality.

Compaction is considered only for completed prior history and only when raw history materially contributes to soft/hard context pressure. Current user input, current-turn operational state, active George/project guidance, unresolved validation/failure state, pending approvals, and ambiguous/interrupted recovery state must not be hidden inside an unconstrained summary.

Represent provider-facing history as:
- a bounded derived compacted-history source;
- a bounded recent raw transcript tail;
- the normal current user/task source.

Extend context source/trust metadata so compacted model-derived history is visibly derived and cannot acquire instruction authority.

A checkpoint records stable identity, schema/version, covered transcript-entry range or equivalent deterministic range identity, digest/provenance, bounded summary, estimated token counts before/after, and the triggering pressure/budget reason. Persist the checkpoint/lifecycle evidence without deleting transcript/events.

When an existing checkpoint is valid, reuse it and compact only the additional eligible completed prefix as needed. Multiple cycles remain traceable.

Compaction consumes the P1 budget. Cancellation and failure are explicit. If compaction cannot produce a safe bounded working set, preserve canonical state and either use a safe remaining raw set permitted by policy or end with explicit context/budget exhaustion.

If the durable event/checkpoint schema changes, keep Phase-4 schema-1 files readable through a deterministic compatibility/migration path rather than silently stranding them.

## P3 — replay-safe provider retry/backoff

Target: `0.5.3`.

Create an application-owned retry policy/service with stable attempt identity.

The first automatic retry class is provider request/transport failure **before** the current attempt has emitted `provider.response.started`, text delta, or tool-call evidence. Once response/output evidence is observed, the attempt is not automatically retried.

Do not automatically retry:
- `write_file`;
- `apply_patch`;
- approval requests/decisions;
- `run_process`;
- a provider attempt that emitted partial/accepted response evidence;
- any operation whose side-effect/replay status is unknown.

Known tool failures continue to flow back to the model as normal structured results; a later model proposal is a new operation, not an automatic retry.

Backoff must be finite, cancellation-aware, deterministic under injected clock/sleeper fixtures, and consume the P1 retry/provider budgets.

Emit attempt/retry scheduled/retry exhausted events with bounded cause/category metadata. Preserve provider adapter independence: LM Studio continues to normalize transport/protocol errors rather than owning retry policy.

Do not implement generic "retry every read tool" heuristics unless replay safety and transient-error classification are explicit and tested.

## P4 — interruption reconciliation and process cleanup hardening

Target: `0.5.4`.

Add a provider-independent recovery coordinator over durable Phase-4 interruptions.

Before a workspace-native mutation starts, persist bounded safe intent evidence sufficient for later observation without storing content/patch bodies. For `write_file`, include canonical workspace-relative target, desired bytes/hash, and bounded precondition identity where applicable. For `apply_patch`, retain only evidence that can be safely derived without persisting old/new patch text; if final state cannot be proven after interruption, remain unknown.

Recovery is read/observe/classify only. It may classify:
- `confirmed_complete`;
- `confirmed_incomplete`;
- `interrupted`;
- `outcome_unknown`.

A write may be confirmed complete when the current canonical target matches the recorded desired hash/bytes. It may be confirmed incomplete when evidence proves the intended result is absent and no ambiguous mutation state remains. Otherwise preserve uncertainty.

No reopen/reconcile path may automatically write, patch, rerun a process, approve, or submit a provider continuation.

For process execution, harden in-run tree cleanup and return/emit structured cleanup metadata for timeout/cancellation/error paths. Where platform-specific post-interruption process identity can be proven safely, support observation/cleanup using identity stronger than PID alone. Never signal a stale persisted PID merely because the number still exists; unsupported/unverifiable cases remain outcome unknown.

Recovery results are appended as new normalized evidence. Historical events are never rewritten.

Integrate recovery progress/work projection only through existing application projection semantics.

## P5 — lifecycle hook bus and bounded runtime

Target: `0.5.5`.

Add a reusable George-owned hook registry/bus with explicit programmatic registration.

Freeze a minimal first event set around currently justified lifecycle boundaries such as:
- session start/end or reopen where available;
- turn/user-input start;
- context assembled;
- provider request/response;
- tool before/after;
- turn completion.

Use stable hook ID, lifecycle event, explicit order/priority, enable/disable state, and deterministic registration order. Duplicate/conflicting identity behavior must fail or resolve visibly and deterministically.

Support bounded in-process test hooks and process-backed executable hooks as needed to prove the runtime contract.

Executable/process-backed hooks must:
- receive bounded normalized input, not arbitrary raw session/provider payloads;
- produce bounded output;
- support timeout/cancellation;
- use sanitized environment handling;
- emit structured start/success/failure/timeout/cancel evidence;
- isolate failure from unrelated hooks and the surrounding run according to explicit failure policy;
- use George's canonical executable/tool/approval boundary rather than bypassing process permission policy.

Prevent recursive hook storms when a hook's own approved process execution emits lifecycle events.

Hooks cannot mutate pending tool arguments through hidden return values, manufacture approval, replace canonical validation/session evidence, or raise permissions.

Do not add plugin discovery, manifest/package install lifecycle, workspace hook-file discovery, network hooks, or foreign compatibility adapters.

## P6 — structured diagnostics and performance substrate

Target: `0.5.6`.

Add a bounded structured diagnostic consumer for normalized application events.

Store diagnostics under George's user state area, never the target repository by default. Use stable session/turn/operation/hook/attempt/checkpoint correlation fields where present.

Define a redacted diagnostic record rather than serializing arbitrary `ApplicationEvent` objects wholesale. Exclude raw file bodies, write/patch content, arbitrary tool-result JSON, unrestricted stdout/stderr, unrestricted environment state, secrets, and full provider payloads.

Add bounded rotation/retention by bytes/files or equivalent deterministic policy. A logging failure must not corrupt the canonical run; it should surface bounded observability degradation evidence where practical.

Add small reusable measurement helpers/counters needed by qualification for:
- context size/growth and compaction cost;
- provider attempt/TTFT where observable;
- tool-loop latency;
- process cleanup duration/outcome;
- reopen/reconciliation latency;
- hook overhead;
- memory snapshots;
- durable session/log growth.

Do not freeze speculative hard performance budgets. Produce comparable measurements with units and workload identity.

OpenTUI remains a consumer of existing work/progress state. Add only presentation changes required to render new reliability work correctly; do not move diagnostics/performance authority into TUI.

## P7 — integrated qualification and bounded hardening

Target: `0.5.7`.

Create deterministic integrated Phase-5 fixtures over the exact P1-P6 candidate.

At minimum exercise one long coding workflow that:
- starts from known Phase-4 durable state;
- accumulates enough completed history to cross configured context pressure;
- creates at least one provenance-bearing compaction checkpoint;
- continues with useful provider/tool work after compaction;
- performs approved mutation/process activity;
- validates;
- persists;
- reaches truthful structured completion;
- reopens with canonical transcript/events intact.

Exercise retry evidence with a provider failure before response-start that succeeds after bounded backoff. Separately exercise provider failure after response/output begins and prove there is no automatic retry.

Exercise budget soft pressure and hard exhaustion with deterministic tiny limits.

Exercise interrupted write/process/approval/provider cases. Prove write reconciliation only when hash/bytes evidence establishes the state, ambiguous patch/process cases remain explicit, and no side effect is replayed.

Exercise process timeout/cancellation cleanup evidence and descendant cleanup on supported local platforms without claiming sandboxing or cross-platform proof not observed.

Exercise hook order, enable/disable, duplicate/conflict behavior, timeout/cancellation/malformed output/failure isolation, process approval, recursive-hook suppression, and inability to bypass tool/approval policy.

Exercise diagnostic redaction/rotation and repeated-run storage/memory/session growth.

Exercise OpenTUI test-renderer behavior with representative long work history, streaming, cancellation, resize/scrollback/selection/draft preservation, and terminal cleanup.

Run focused tests plus Phase-2 tool/process/approval, Phase-3 context/skills, Phase-4 sessions/workflow/progress/TUI/integration, exact runner tests, typecheck, broad deterministic aggregate checks, `git diff --check`, and explicit no-`package-lock.json`.

Record Node/npm/platform versions.

If a genuine usable TTY is available, perform Phase-5 native-terminal responsiveness/cancellation/cleanup characterization; otherwise record Evidence Gap.

If loopback LM Studio with the pinned/default Qwen3-Coder model is available, run a bounded live longer coding flow that crosses pressure, compacts, continues tool use, validates, and completes, plus one bounded reopen/recovery characterization. Record exact model/provider/runtime, estimated/provider-reported context usage where available, compaction/retry/recovery evidence, and outcome. Otherwise record Evidence Gap.

Permit at most two substantial evidence-driven correction cycles. Every correction adds a permanent executable regression guard and reruns focused plus broad affected evidence.

Create `docs/tasks/p5/P7-qualification-evidence.md` tied to the exact final candidate.

## P8 — evidence-only Phase 5 closeout

Target: `0.5.8`.

Audit the exact P7 implementation candidate and qualification evidence.

Write `docs/phase-5-closeout.md` with explicit Implementation Complete / Stability Qualified truth and per-layer Green / Not Green / Evidence Gap outcomes.

Do not repair implementation, owner-close Phase 5, advance BOOT/roadmap to Phase 6, or add Phase-6 features.

## Cross-prompt preservation requirements

Every implementation prompt must preserve:
- provider independence;
- Phase-2 ToolRegistry/schema/permission/approval/workspace/process/Git safeguards;
- Phase-3 instruction precedence, token-conscious routing, context-profile policy, and non-sticky skills;
- Phase-4 canonical transcript/session/workflow evidence, dirty-work preservation, validation truth, stable work projection, and safe non-replay reopen;
- local-first/no implicit network-tool authority;
- minimal dependency surface;
- no `package-lock.json`.

## Phase boundary

Phase 5 does not implement automatic semantic skill selection, a dedicated utility-model runtime, plugin packaging/install/discovery, browser/web/network tools, Parallel/GitHub/Chrome DevTools/MCP adapters, remembered broad approval profiles, general mutating Git, OS/container sandboxing, daemon/background-job ownership, scheduling, Tauri, or multi-agent execution.
