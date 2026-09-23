# Phase 5 Prompt Assessment

Status: CURRENT IMPLEMENTATION ASSESSMENT

Phase: 5 — Reliability + Long Runs  
Execution folder: `p5`  
Assessment baseline: package `0.5.0`; exact main SHA must be refreshed to the committed post-Phase-4 hardening candidate before P1 executes.

## Assessment conclusion

Proceed as one focused Phase 5 with **six implementation prompts, one integrated qualification prompt, and one evidence-only closeout**.

The safe order is:

1. long-run budget/accounting and lifecycle-event foundation;
2. provider-facing context compaction/checkpoints;
3. replay-safe retry/backoff;
4. interruption reconciliation plus process-cleanup hardening;
5. normalized lifecycle hook bus/runtime;
6. structured diagnostic observability and performance characterization substrate;
7. integrated Phase-5 qualification and bounded hardening;
8. evidence-only closeout.

This ordering preserves the Phase-4 authoritative session/event model while adding long-run control one layer at a time. Compaction, retry, recovery, hooks, and logs all consume or emit normalized evidence rather than becoming independent execution authorities.

### Hardened inherited baseline

The execution baseline also includes the post-closeout corrections validated during live smoke testing: tool-bearing provider-round text is provisional and never canonical; only the final completed tool-free round commits one assistant response; final committed text is progressively revealed without changing durable truth; invalid tool calls expose bounded safe argument summaries; `list_directory` treats omitted/empty/`.` as workspace root without weakening containment; provider failures expose bounded safe normalized metadata; provider activity renders as `Thinking...`; and consecutive Work entries are visually grouped with explicit per-item status. Every Phase 5 prompt must preserve these invariants.

## Current implementation findings

### Canonical loop and context pressure

`src/application/one-turn.ts` owns the canonical provider-independent model -> tool -> model loop.

Today it:
- assembles context once at the start of a turn;
- inserts the whole completed prior transcript as one required conversation source;
- uses the Phase-3 context profile and reports pressure diagnostics;
- continues tool rounds through provider-native `previous_response_id` / normalized continuation state;
- has only the existing hard `maxToolCalls` and `maxToolRounds` loop guards;
- records provider/tool/approval lifecycle directly into the canonical session as events occur.

There is no compaction, retry policy, long-run budget object, retry attempt identity, or recovery coordinator.

`src/context/index.ts` currently treats prior conversation as required context. Optional sources can defer at soft pressure, but a required conversation that pushes the request over the hard provider-input budget fails rather than compacting. This is the correct Phase-5 insertion point: compact completed older history before the final provider request while keeping current instructions, task state, and recent raw history independent.

### Durable sessions

`src/core/session-store.ts` provides the Phase-4 filesystem-backed store.

Current durable constraints include:
- schema version 1;
- one bounded JSON session file;
- 1 MiB maximum durable session size;
- 2,048 maximum durable events;
- 1,024 maximum durable transcript entries;
- sanitized persistence that removes raw provider/tool payloads and process output;
- canonical workspace binding;
- interruption classification for unfinished mutation, process, approval, and provider-continuation lifecycles.

Opening a session only classifies interruptions. It deliberately performs no reconciliation or replay.

Phase 5 should evolve durable evidence compatibly rather than replacing this store. Compaction/retry/recovery events must remain bounded and sanitized. Old Phase-4 session files should remain readable or receive an explicit deterministic migration path if the schema version changes.

### Provider boundary

`src/core/provider.ts` is intentionally small and provider-independent. `src/provider/lm-studio.ts` handles LM Studio transport, timeouts, SSE parsing, tool-call assembly, usage normalization, cancellation, and errors.

The application currently performs no retry.

A provider response may emit canonical events before an error. Therefore automatic retry cannot simply re-run every failed stream: once a response has visibly started or emitted partial model output, replay becomes semantically ambiguous. The first safe retry class should be transport/provider failure before George observes an accepted response/output for that attempt. Later retry classes must remain explicit rather than inferred from broad error codes.

### Tool and mutation boundaries

The canonical `ToolRegistry`, approval gate, workspace mutation executor, and process executor are already the correct authority boundaries.

`write_file` and `apply_patch` are atomic/preconditioned and return safe final path/byte/hash evidence after success. Interrupted writes do not currently persist enough safe intent metadata to prove on reopen that the intended content is already present.

Phase 5 should add bounded recovery-intent evidence rather than persisting write/patch bodies. For example, a write can retain target path, desired byte count/hash, and relevant precondition metadata without storing content. Patch reconciliation may remain outcome-unknown when the durable evidence is insufficient; Phase 5 must not manufacture certainty.

### Process lifecycle

`src/tools/process.ts` already has:
- literal executable/argv;
- workspace-bounded cwd;
- sanitized inherited environment;
- bounded output;
- timeout/cancellation;
- Linux descendant discovery plus TERM/KILL cleanup;
- Windows `taskkill /T /F` cleanup;
- no detached/background execution.

Cleanup is best-effort and is not represented as structured recovery evidence. Persisted process interruption state does not include a safely verifiable OS-process identity.

Phase 5 may strengthen runtime process-tree cleanup and record cleanup uncertainty. Any post-crash process reconciliation must verify identity strongly enough to avoid signaling a reused PID; when the platform cannot prove identity, record outcome unknown instead of killing by stale PID.

### Progress and presentation

Phase 4 centralized event recording in `AgentLoopApplicationService.record()` and derives presentation-safe work/progress through `WorkProjection`.

This is valuable for Phase 5:
- new reliability events can remain authoritative application events;
- progress/work can project compaction/retry/recovery/hook state without entering the canonical user/assistant transcript;
- diagnostic logging can consume the same event stream without making OpenTUI authoritative.

OpenTUI should require little or no Phase-5 business logic. The TUI remains a renderer and a qualification target for long-history responsiveness.

### Hooks and diagnostics

There is no current lifecycle-hook registry/runtime or structured diagnostic log subsystem.

The Phase-5 hook runtime should therefore begin with a George-owned typed registry and explicit programmatic registrations. Do not add plugin discovery, package manifests, install lifecycle, or foreign compatibility formats.

Executable/process-backed hooks must preserve normal process/tool/approval semantics and must avoid recursively retriggering their own hook boundaries.

Diagnostic observability should be a bounded/redacted consumer of normalized lifecycle events, with stable session/turn/operation correlation and bounded retention outside the target repository.

## Prompt decomposition

### P1 / 0.5.1 — long-run budgets and reliability events

Create the provider-independent run-budget/accounting substrate and normalized reliability lifecycle events before any feature consumes it.

Keep the existing Phase-2 hard tool-call/tool-round guard as a final guard. Add bounded application-owned accounting for provider attempts, retry attempts, compactions, process executions/runtime, wall-clock runtime, and context/provider usage where measurable.

Hard exhaustion must produce explicit terminal evidence rather than masquerading as provider/tool failure. Soft pressure remains observable and later prompts may consume it.

Do not implement compaction/retry/reconciliation/hooks/logging yet.

### P2 / 0.5.2 — context compaction and checkpoints

Add provider-facing compaction over completed older history while leaving canonical transcript/events intact.

Introduce a provider-independent compactor interface, deterministic fixture compactor, and normal product compactor using the existing provider boundary without tools. Compaction output is derived text with bounded size and explicit provenance over the transcript/history range it summarizes.

At context pressure, assemble:
- current authoritative instructions;
- current task;
- compacted older completed history;
- a bounded recent raw-history tail;
- current unresolved/recovery-relevant state.

Persist bounded compaction lifecycle/checkpoint evidence. A failed compaction must fall back safely or terminate explicitly.

### P3 / 0.5.3 — replay-safe retry and backoff

Add one explicit retry policy rather than broad implicit retries.

Provider transport/request failure may retry only while the current attempt has not produced response-start/output/tool-call evidence that would make replay ambiguous. Backoff is bounded and cancellable, consumes the run budget, and emits attempt/scheduled/exhausted evidence.

Do not automatically retry writes, patches, approvals, processes, or ambiguous provider attempts. Known tool failure continues to be returned normally so the model may choose a new operation.

### P4 / 0.5.4 — reconciliation and process cleanup

Add a recovery coordinator over Phase-4 interruption evidence.

Persist safe mutation/process intent/identity evidence before side effects where useful. Reopen/reconcile may classify:
- confirmed complete;
- confirmed incomplete/not applied;
- interrupted;
- outcome unknown.

Positive write reconciliation should use target path plus desired hash/bytes rather than stored file bodies. Patch/process outcomes remain unknown unless evidence really proves them.

Harden runtime process cleanup and expose structured cleanup outcome/uncertainty. Never signal a persisted PID after restart unless identity is safely verified.

Recovery emits new evidence and never rewrites old history or blindly replays side effects.

### P5 / 0.5.5 — lifecycle hook bus/runtime

Implement George-owned hook event names, stable hook identity, deterministic ordering, enable/disable state, duplicate/conflict handling, bounded I/O, timeout/cancellation, structured results, and failure isolation.

Begin with explicit programmatic registrations. No plugin discovery.

Process-backed hooks must run through George's canonical executable boundary and normal approval semantics, and hook-origin execution must not recursively invoke the same lifecycle hooks.

Hooks cannot mutate tool arguments by hidden side channel, manufacture approval, replace canonical evidence, or raise permissions.

### P6 / 0.5.6 — observability and performance substrate

Add structured diagnostic observability outside the target repository.

Log only bounded/redacted normalized records with session/turn/operation correlation. Provide bounded rotation/retention. Do not copy raw file bodies, patch/write bodies, unrestricted process output/environment, secrets, or provider payloads.

Add the smallest reusable timing/counter instrumentation required to characterize context growth/compaction, TTFT where observable, tool-loop latency, cleanup, recovery/reopen, hook overhead, memory/session/log growth, and long-history rendering. Do not freeze arbitrary hard performance budgets before measurements exist.

### P7 / 0.5.7 — integrated Phase 5 qualification

Exercise the exact P1-P6 candidate with deterministic long-run fixtures.

Require a long coding workflow that crosses context pressure, compacts, continues tool use, validates, persists, and completes; a retry-safe provider failure; ambiguous non-retry cases; interruption/reopen/reconciliation; process cleanup evidence; hooks including failure isolation; bounded/redacted diagnostic logs; repeated-run growth characterization; and OpenTUI long-history rendering.

Attempt conditional native terminal and pinned Qwen3-Coder/LM Studio qualification. Record exact evidence truth and allow only bounded evidence-driven correction cycles with permanent regression tests.

### P8 / 0.5.8 — evidence-only Phase 5 closeout

Audit the exact P7 candidate/evidence and write formal closeout truth.

Do not repair implementation, owner-close the phase, or advance Phase 6.

## Key planning decisions

### Canonical versus derived state

Canonical normalized session/event history remains authoritative.

A compaction checkpoint is durable evidence that a derived summary was produced, not a replacement for the transcript/events it covers. Diagnostic records and hook results are likewise not alternative execution authorities.

### Compaction lifetime

Compaction covers only completed older history. Current turn state, unresolved failures, pending approvals, interrupted/ambiguous operations, active instructions, and current user intent stay outside the summarized range.

Keep a recent raw tail after the checkpoint. Re-compaction may summarize an earlier checkpoint plus additional completed raw history, but provenance must remain traceable and bounded.

### Retry safety

The first supported automatic retry class is deliberately narrow: a provider attempt that fails before George observes response acceptance/output for that attempt.

Do not buffer and replay arbitrary partial assistant streams merely to manufacture retryability in this phase.

### Recovery evidence

Recovery is read/observe/classify first.

No reconciliation path may write a file, rerun a process, synthesize approval, or submit an old provider continuation automatically. A later user/model action can propose a new ordinary operation through normal policy.

### Hook authority

Hooks are reactive extension runtime, not policy.

A process-backed hook may be configured programmatically, but its process invocation still uses George's normal process/tool/approval path. A hook failure is evidence, not permission to bypass the failed hook or surrounding policy.

### Storage bounds

Long-run does not mean unbounded.

Keep explicit durable session/event/text limits and add run/log budgets so George terminates or degrades before persistence silently becomes unsafe. If Phase-5 evidence needs larger bounds, change them explicitly with tests and document the new values; do not remove them.

### TUI role

Do not create a Phase-5 TUI reliability engine.

Expose new reliability work through normalized application events/projection. OpenTUI only renders historical/current state and is tested for responsiveness under representative long history.

## Model selection

- P1: **Terra High**
- P2: **Terra High**
- P3: **Terra High**
- P4: **Terra High**
- P5: **Terra High**
- P6: **Terra High**
- P7: **Terra High**
- P8: **Terra Medium**

## Four stability questions

### 1. User-visible / aggregate quantities at risk

Provider attempt count, retry count/backoff duration, compaction count/summary size, provider-facing context size, remaining headroom, tool/process counts, cumulative process runtime, wall-clock run time, durable event/session bytes, diagnostic-log bytes/files, interruption/recovery count, hook count/order/duration/failure count, time-to-first-token, memory growth, work-item count, and OpenTUI long-history rendering responsiveness.

### 2. Invariants

Phase-2 schema/permission/workspace/process/Git safeguards remain intact; Phase-3 context precedence and skills remain deterministic/non-sticky; Phase-4 canonical transcript/session/workflow evidence remains authoritative; compaction never becomes authority; provider-native continuation remains non-authoritative; ambiguous side effects are never blindly retried/replayed; pre-existing dirty work survives; hooks cannot grant permissions or alter execution secretly; diagnostics remain bounded/redacted; no browser/network/plugins/daemon/Tauri/multi-agent scope is introduced.

### 3. Integrated-only evidence

Context pressure followed by compaction and continued tool use, retry timing/cancellation around real provider streams, interruption/reopen reconciliation against actual workspace state, descendant cleanup under cancellation/timeout, hook execution around real tool/provider lifecycle, long-run persisted/log growth, OpenTUI behavior with a large work history, and pinned live Qwen behavior cannot be established by isolated unit tests alone.

### 4. Comparison baseline

The execution baseline is package `0.5.0` plus the committed post-Phase-4 hardening candidate described above; its exact main SHA must be captured before P1 runs. Preserve all qualified provider/context/skill/tool/approval/process/coding-workflow/session/progress/TUI behavior—including the hardened provider-round, diagnostics, root-list, final-reveal, `Thinking...`, and compact Work semantics—except where Phase 5 explicitly adds bounded reliability, compaction, retry/recovery, hooks, observability, and performance evidence.
