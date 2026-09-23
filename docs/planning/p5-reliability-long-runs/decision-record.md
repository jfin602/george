# Phase 5 Decision Record — Reliability + Long Runs

Status: APPROVED DIRECTION

Baseline target: package `0.5.0`  
Roadmap gate: Phase 5 — Reliability + Long Runs

## Problem

Phase 4 establishes a durable provider-independent coding workflow with structured completion evidence, persisted normalized session history, observable repository work, and safe non-replay resume semantics.

The next step is to let that workflow operate for materially longer local coding jobs without allowing context growth, retries, interrupted side effects, process cleanup, executable hooks, or diagnostic state to become new sources of hidden authority or corruption.

Phase 5 owns long-run reliability, compaction, budgets, bounded retry/recovery behavior, lifecycle hooks, observability, and performance characterization. It must preserve the Phase 2 permission/process boundary, the Phase 3 context trust model, and the Phase 4 event/session evidence model.

## Decisions

### Canonical evidence remains canonical

George's normalized durable session/event history remains the authoritative record of what was requested, observed, approved, executed, interrupted, validated, and completed.

Compaction summaries, progress/work projections, diagnostic logs, hook results, recovery projections, and provider-native continuation state are derived representations. They must not replace or silently rewrite authoritative normalized evidence.

Long-run reliability work must preserve the ability to diagnose a failed run from bounded durable evidence even when provider-facing history has been compacted multiple times.

### Compaction is provider-facing derived context

Phase 5 may compact older completed conversation/tool history when context pressure justifies it.

A compaction checkpoint is versioned derived state that records enough provenance to identify the durable event/history range it represents. It may be reused for later provider requests but does not delete or become the sole copy of the normalized history it summarizes.

Provider-facing long-run context should preserve the conceptual shape:

```text
current George/user/project instructions
+ current task/turn state
+ compacted older completed history
+ bounded recent raw history
+ current unresolved tool/recovery state
```

Compaction must not silently omit or blur:
- George-owned invariants or executable policy boundaries;
- explicit current user intent;
- active applicable project instructions;
- pending approvals or unresolved failures;
- validation failures/evidence gaps that remain relevant;
- ambiguous or interrupted side effects;
- current tool/recovery state needed to make the next action safe.

Deterministic structural reduction should be preferred when information can be represented without model inference. Semantic summarization remains behind a provider-independent compaction/summarizer interface so a future utility model can assume that role without changing session or context architecture.

A compaction failure must degrade visibly: preserve a safe recent/raw working set, request a new provider turn under the remaining budget, or terminate with explicit context/budget exhaustion. George must not fabricate a successful summary or treat truncated critical state as complete.

### Long-run budgets are application-owned and multidimensional

Phase 2's hard tool-loop ceiling remains a last-resort guard, but Phase 5 adds an application-owned run-budget contract suitable for longer work.

The budget model may track, where measurable:
- provider requests/rounds;
- tool calls;
- retry attempts;
- compaction attempts/checkpoints;
- process executions and cumulative process runtime;
- wall-clock run time;
- provider/context usage;
- persisted/session growth relevant to safe operation.

Exact defaults are configuration decisions, not provider protocol semantics.

Soft pressure may trigger compaction, omission of lower-value optional context, or other documented degradation. Hard budget exhaustion is a truthful structured terminal condition. The model cannot extend its own budget by instruction or tool output.

### Retry policy is explicitly replay-safe

Automatic retry is permitted only where George can classify the attempted operation as safe to repeat or where no side effect was committed.

Examples include bounded provider transport retries before an accepted/ambiguous provider result, explicitly idempotent read-only operations, and similarly classified internal operations.

Writes, patches, approvals, arbitrary processes, and other side-effecting operations must not be transparently reissued after an ambiguous outcome. A known ordinary tool failure may still be returned to the model so a later model decision can propose a new operation through normal validation and approval.

Retry attempts, causes, delays, exhaustion, and terminal outcomes are authoritative lifecycle evidence. Backoff must be bounded and cancellable.

### Recovery reconciles evidence; it does not blindly replay

Phase 4's interrupted state becomes the input to Phase 5 recovery/reconciliation.

For an interrupted or ambiguous operation George should use durable intent/start/completion evidence plus bounded observable current state to classify the operation. The normalized vocabulary should support at least the semantics:
- confirmed complete;
- confirmed incomplete/not applied;
- interrupted;
- outcome unknown.

George may reconcile a workspace-native write as complete when durable intent and current observable file state prove the desired result is already present. It may classify it incomplete when evidence proves it did not apply. When evidence is ambiguous, the result remains unknown/interrupted and requires a new explicit decision rather than hidden replay.

Approved arbitrary child processes are especially conservative because George cannot generally prove all of their side effects. Phase 5 does not claim universal exactly-once execution.

Recovery decisions and their evidence are persisted as new events; prior history is not rewritten.

### Process ownership and cleanup are hardened, not sandboxed

Phase 5 strengthens process-tree ownership, cancellation, timeout cleanup, and post-interruption diagnosis using the existing process executor boundary.

Where the platform permits, George should retain sufficient bounded operation/process identity to detect or clean up descendants it owns after interruption. Cleanup attempts and uncertainty are structured evidence.

This does not change the existing trust statement: an approved arbitrary child process runs with host-user privileges unless a future real sandbox changes that.

### Observability consumes authoritative events

Phase 5 adds structured diagnostic observability for long runs without turning logs into a second source of truth.

Diagnostics should use stable session/turn/operation correlation identities and bounded/redacted fields. Logging must avoid raw file bodies, patch bodies, unrestricted stdout/stderr, unrestricted environment state, secrets, and provider payloads by default.

Retention/rotation must be bounded so a long local run cannot grow diagnostic state indefinitely.

The Phase 4 user-facing chronological work log remains a presentation projection. Diagnostic logging is a separate consumer of the same authoritative application lifecycle.

### Lifecycle hooks are George-owned and non-authoritative

George defines its own normalized lifecycle hook bus rather than adopting another host's extension lifecycle as the core contract.

Phase 5 should freeze the first normalized hook-event names and payload boundaries for the currently justified lifecycle, including appropriate boundaries around:
- session start/end;
- user input/turn start;
- context assembly;
- provider request/response;
- tool before/after;
- turn completion.

Hook registration and ordering are deterministic. Enable/disable state and duplicate/conflict behavior are explicit.

Hooks may observe or react to lifecycle events, but they cannot:
- raise George's permission ceiling;
- manufacture or reuse an approval decision;
- silently suppress policy checks;
- replace canonical tool/session/validation evidence;
- mutate tool arguments through an undocumented side channel;
- register arbitrary executable authority merely because hook content requested it.

Executable hooks receive bounded inputs, produce bounded outputs, run with timeout/cancellation, use sanitized environments, and emit structured success/error evidence. Failure is isolated so one hook does not corrupt unrelated extension state or the surrounding agent run.

Process-backed hook execution retains the process trust boundary. Any hook action that is semantically a George tool action must use the canonical tool/approval path.

Phase 5 proves the hook bus/runtime only. Plugin manifests, installation/packaging, compatibility adapters, and plugin-provided contribution discovery remain Phase 6.

### Performance limits follow measurements

Phase 5 establishes reproducible baselines before adopting hard regression budgets.

Measure at least:
- provider-facing context growth and compaction cost;
- time to first token;
- tool-loop latency;
- process cleanup latency;
- recovery/reopen cost;
- hook overhead;
- memory growth;
- durable session/log growth;
- OpenTUI responsiveness while streaming and updating a long execution/work history.

Once hard thresholds are adopted they must be explicit and versioned. Baseline characterization is evidence, not an excuse to infer performance from unit tests.

### Extended Qwen qualification exercises pressure and recovery

Deterministic fixtures remain the correctness authority.

When the supported local setup is available, Phase 5 additionally characterizes the pinned Qwen3-Coder/LM Studio configuration through a representative longer coding run that:
- grows beyond an ordinary short-turn working set;
- crosses context pressure;
- performs at least one compaction;
- continues useful tool use afterward;
- validates work and reaches truthful completion.

A separate bounded interruption/recovery characterization should exercise reopening/reconciliation semantics.

Native-terminal qualification should characterize streaming responsiveness and long execution/work-log behavior separately from model correctness.

## Phase boundary

Phase 5 does not include:
- automatic semantic skill selection;
- a dedicated secondary utility-model runtime;
- browser/web/network tools;
- Parallel Search, GitHub, Chrome DevTools, or MCP adapters;
- a frozen George plugin manifest or plugin installation lifecycle;
- compatibility adapters for foreign plugin systems;
- remembered broad approval profiles;
- general mutating Git operations;
- OS/container sandboxing;
- daemon/server mode or detached background-job ownership;
- scheduling;
- Tauri desktop UI;
- multi-agent scheduling/execution.

Long-running in Phase 5 means a bounded attached local George run with durable recovery evidence. Phase 7 remains the boundary for a long-lived local service.

## Qualification direction

Deterministic/integrated Phase 5 coverage must prove at minimum:
- compaction preserves critical instructions, unresolved failures, validation evidence, and current safety-relevant state;
- versioned compaction provenance identifies the durable range summarized and multiple compaction cycles do not replace canonical history;
- compaction failure/budget exhaustion degrades or terminates explicitly rather than silently truncating critical state;
- soft and hard long-run budgets behave deterministically and cannot be expanded by model/repository text;
- retries occur only for operations classified as replay-safe, are bounded/cancellable, and emit explicit retry evidence;
- ambiguous writes/processes/approvals are not automatically replayed;
- recovery can distinguish proven-complete, proven-incomplete, interrupted, and unknown outcomes without rewriting old history;
- process cleanup/cancellation leaves inspectable evidence and does not claim sandboxing;
- structured logs are correlated, bounded, redacted, and retention-limited;
- hook ordering, enable/disable state, duplicate/conflict behavior, timeout, cancellation, malformed output, failure isolation, environment sanitization, and bounded I/O;
- hooks cannot bypass ToolRegistry, approval policy, workspace/process trust boundaries, or canonical evidence;
- repeated long-run operation does not cause unbounded session/log/memory growth within the characterized workload;
- OpenTUI remains responsive enough to use while streaming and rendering long execution history;
- one integrated deterministic long coding workflow crosses context pressure, compacts, continues tool use, validates, persists, and completes truthfully;
- one integrated interrupted workflow reopens and reconciles without blind side-effect replay;
- Phase 2 permission/process/Git safeguards, Phase 3 context trust/precedence, and Phase 4 session/evidence semantics remain intact.

Live LM Studio/Qwen and native-terminal evidence remain separately classified under the stability contract.
