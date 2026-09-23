# Phase 4 Decision Record — Coding Workflow + Sessions

Status: APPROVED DIRECTION

Baseline: package `0.4.0`  
Roadmap gate: Phase 4 — Coding Workflow + Sessions

## Problem

Phase 3 establishes George's deterministic context assembly, routing, budgeting, personality/global instruction handling, and portable declarative skill substrate.

The next step is to turn that context-aware safe agent into a useful bounded coding workflow without weakening the Phase 2 tool/permission boundary or prematurely importing Phase 5 long-run recovery and hooks.

Phase 4 owns mutation bookkeeping, validation/completion evidence, durable local session history, and safe non-replay resume semantics.

## Decisions

### Phase 4 owns one provider-independent coding workflow

The application/core owns the sequence that uses the qualified Phase 3 context, runs the existing agent/tool loop, records observed changes and validation evidence, persists durable session state, and produces structured completion evidence.

OpenTUI renders that state and accepts user/approval input. Provider adapters translate inference protocol. Neither becomes the owner of context precedence, session persistence, changed-file accounting, validation policy, progress semantics, or completion semantics.

### Progress is a first-class application stream

Phase 4 adds presentation-independent progress/status events owned by the application/core rather than inventing human-facing work state inside OpenTUI.

George distinguishes two cadences:

- **activity** is high-frequency lifecycle state such as provider thinking, a tool starting/completing, or an approval wait;
- **progress** is a lower-frequency human-facing milestone such as assembling context, inspecting repository state, editing, validating, recovering from a failed validation, or preparing completion evidence.

Progress messages are deterministic harness output derived from George-owned workflow/lifecycle state. Phase 4 does not add a model-facing `report_progress` tool and does not require the model to spend inference/tool rounds narrating routine work. Model-authored progress commentary may be reconsidered with Phase 5 long-run orchestration.

Progress is not assistant transcript, hidden reasoning, chain-of-thought, validation evidence, or model-facing context. It must never be fed back into later provider requests merely because it was shown to the user.

The normalized progress contract should carry a turn identity, a small stable category such as context/inspection/editing/validation/recovery/completion, and a bounded user-facing message. Exact event/type names may follow source conventions, but the semantics are presentation-independent so future Tauri/daemon clients can render the same stream.

Authoritative tool/provider/validation/session events remain the source of truth. Progress may summarize or derive from them but must not become a competing authority. Repeated low-value lifecycle churn may be coalesced so progress remains useful rather than noisy.

OpenTUI should retain its fast-changing activity indicator and additionally render a small recent-progress/work log for meaningful milestones.

Durable sessions may retain bounded progress history where useful for diagnosis, but reopening a session must not present a stale status such as "Running tests..." as currently active.

### Changed-file accounting is evidence, not guesswork

At the beginning of a mutating coding run, George records an observable workspace/Git baseline when the repository supports it.

George-native write/patch tools can record their direct effects. At completion George compares the final observable state with the baseline so pre-existing dirty work remains distinguishable from newly observed changes.

An approved arbitrary child process is outside George's precise filesystem-attribution boundary. George may report files that changed during the run, but must not claim the process definitely caused a particular change unless evidence establishes that relationship.

The workflow preserves Phase 2's no-reset/no-clean/no-stash/no-checkout behavior and existing user work.

### Validation uses the canonical process boundary

Phase 4 does not add a privileged validation executor.

Validation commands run through the existing process tool/policy/approval path and inherit its explicit argv, workspace cwd, sanitized environment, bounded output, timeout/cancellation, process cleanup, and non-sandbox trust semantics.

The coding workflow records validation as structured evidence: intent/label, executable and arguments, relevant cwd identity, terminal status, exit/signal information, and bounded result/output evidence.

A validation failure is not silently rewritten into success because the assistant later produces plausible prose.

### Completion is structured evidence plus narrative

The application/core produces a structured completion result suitable for any presentation adapter.

At minimum it can represent:
- observed changed files and their relationship to the baseline where known;
- validation commands and outcomes;
- unresolved failures, warnings, or evidence gaps;
- session/turn completion state;
- final assistant response.

OpenTUI may render a polished summary, but the TUI is not the authoritative source of these facts.

### Persistence is local, filesystem-backed, and outside the repository

Durable session state is stored in a user state location rather than the active repository by default. On Linux, prefer `$XDG_STATE_HOME/george`, falling back to `~/.local/state/george`; use platform-appropriate equivalents elsewhere.

Persisted state is schema-versioned and records canonical workspace identity. Append-friendly normalized events remain the durable evidence source where practical.

Persist enough to reconstruct completed turns and diagnose runs, including relevant normalized provider/tool/approval events, context/source diagnostics, activated-skill identity, change summaries, validation evidence, interruption state, and completion state.

Do not persist secrets, unrestricted environment dumps, or unbounded process output.

### Resume never silently replays an interrupted side effect

Phase 4 resume means continue from durable completed history.

If the prior process ended while a write, process, approval request, or provider continuation was incomplete, George marks that turn interrupted. Reopening the session must not automatically:
- re-run the incomplete write;
- restart the incomplete process;
- synthesize or reuse an approval decision;
- submit an old provider continuation as though the side effects were known complete.

A later user action begins a new turn from durable normalized history. Provider-native response IDs may remain diagnostic/optimization data but are not the sole source of recoverable state.

Crash-safe side-effect replay/reconciliation and richer interruption recovery are Phase 5 work.

### Phase boundary

Phase 4 does not include:
- LLM-based context compaction/summarization;
- automatic semantic skill routing;
- executable lifecycle hooks;
- a frozen George plugin manifest or plugin install lifecycle;
- browser/web/network tools;
- Parallel Search, GitHub, Chrome DevTools, or MCP adapters;
- remembered approval profiles;
- OS/container sandboxing;
- general mutating Git operations;
- crash-safe side-effect replay/reconciliation;
- long-job retries/backoff;
- daemon/server mode;
- Tauri desktop UI;
- multi-agent scheduling.

Phase 5 owns long-run reliability and executable hooks. Phase 6 owns plugin packaging and external/network adapters.

## Qualification direction

Deterministic Phase 4 coverage must prove at minimum:
- schema-versioned filesystem session persistence outside the fixture repository;
- canonical workspace binding;
- completed history reconstruction after reopen;
- malformed or unsupported persisted state fails visibly rather than being partially trusted;
- interrupted write/process/approval/provider-continuation state is surfaced and not automatically replayed;
- resume begins subsequent work as a new turn from durable normalized history;
- secrets, unrestricted environment dumps, and unbounded process output are not introduced into persisted state;
- mutating-run baseline capture with pre-existing dirty work preserved;
- changed-file observation that does not overclaim process attribution;
- validation through the canonical process/approval boundary;
- structured completion evidence;
- presentation-independent progress events in meaningful lifecycle order, with bounded/coalesced messages and separate high-frequency activity state;
- progress/status text never entering assistant transcript or provider-facing context;
- validation failure/recovery, cancellation, and terminal completion producing truthful progress without replacing the underlying authoritative evidence;
- persisted/resumed sessions never presenting stale prior-run activity as currently active;
- progress messages not exposing raw file bodies, process output, unrestricted environment data, or secrets merely because those values exist in underlying tool events;
- one end-to-end disposable-repository workflow using the qualified Phase 3 context/skill substrate, approved mutation, validation, completion, persistence, and resumed later work;
- preservation of the Phase 2 permission, workspace, process, and Git safeguards throughout the flow.

Live LM Studio/Qwen and native-terminal evidence remain separately classified under the stability contract.
