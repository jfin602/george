# Phase 4 Prompt Assessment

Status: CURRENT IMPLEMENTATION ASSESSMENT

Phase: 4 — Coding Workflow + Sessions  
Execution folder: `p4`  
Assessment baseline: main `082eddcf28cd548ae3c6063fd4d0c4ba1e973a9e`, package `0.4.0`.

## Assessment conclusion

Proceed as one focused Phase 4 with **six implementation prompts plus one evidence-only closeout**.

The safe order is:
1. durable session representation/storage and interruption classification;
2. provider-independent coding-run evidence, changed-file accounting, validation evidence, and structured completion;
3. presentation-independent progress/work projection plus truthful context-source lifecycle observability;
4. OpenTUI observable execution transcript;
5. durable reopen/resume wiring across the application/TUI path;
6. integrated Phase-4 qualification and bounded hardening;
7. evidence-only closeout.

This split keeps filesystem persistence, coding-workflow accounting, progress semantics, TUI rendering, and resume behavior independently auditable before the integrated qualification gate.

All Phase 4 prompts are `Browser required: no.`. Phase 4 has no browser/network requirement. Genuine native-terminal and live LM Studio/Qwen evidence remain conditional runtime evidence and may be recorded as Evidence Gap when unavailable; they are not browser handoffs.

## Current-source findings

- `package.json` is `0.4.0`; Node is >=26.4.0 <27; TypeScript/ESM/OpenTUI boundaries remain unchanged.
- `Session` is currently an in-memory object containing only `id`, `workspace`, canonical user/assistant transcript entries, and normalized application events.
- `appendSessionEvent()` already keeps displayed diagnostics out of canonical transcript and accumulates assistant deltas into clean assistant messages.
- no durable session store, schema version, state-root resolver, workspace-bound reopen path, interruption classification, or safe resume behavior exists yet.
- the canonical `AgentLoopApplicationService` already owns context assembly, provider streaming, tool validation, approvals, dispatch, continuation, cancellation, and hard loop limits.
- tool lifecycle is already authoritative and normalized: `tool.requested`, `tool.started`, `tool.completed`, `tool.failed`, plus approval/provider/turn events.
- `captureGitWorkingTreeSnapshot()` already provides read-only Git working-tree evidence and dirty-target inspection without reset/clean/stash/checkout behavior.
- George-native `write_file` / `apply_patch` results already carry bounded path/bytes/hash/Git evidence suitable for direct-effect bookkeeping.
- `run_process` already executes literal executable/argv with `shell: false`, workspace-bounded cwd, sanitized environment inheritance, bounded stdout/stderr, timeout/cancellation, exit/signal/outcome evidence, and descendant cleanup.
- approved processes are explicitly not an OS/workspace sandbox; Phase 4 changed-file reporting must therefore distinguish direct George-native mutations from files merely observed changed during a run.
- there is no structured coding-workflow completion object and no explicit validation-evidence layer today.
- validation must reuse the canonical process/approval boundary. Phase 4 should use explicit validation intent/labels tied to real process execution; it must not guess validation from command names and must not add a privileged validation executor.
- context assembly currently performs bounded loading of workspace `.george/instructions.md`, `AGENTS.md`, `BOOT.md`, routed documents, user-global instructions, personality, and activated skills, but emits only the final `context.assembled` application event.
- therefore truthful live context-source progress requires a small presentation-independent observation hook/event path during context loading; post-hoc source IDs alone are not proof that a source was visibly loading in real time.
- the TUI currently compresses provider/tool lifecycle into one ephemeral `activityView`; persistent visible history contains only canonical user/assistant transcript plus presentation-only failure diagnostics.
- `renderTranscript()` deliberately keeps styling/diagnostics out of provider-facing context, which must remain true when work items become visually interleaved.
- the TUI creates a fresh in-memory session directly in its constructor. There is no durable reopen affordance.
- Phase-3 context/skills, Phase-2 permission/process safeguards, draft preservation, approvals, cancellation, resize, scrollback, selection/copy behavior, and terminal restoration are the regression baseline.

## Prompt decomposition

### P1 / 0.4.1 — durable session model and local store

Introduce schema-versioned filesystem session persistence outside the repository, canonical workspace binding, bounded normalized durable evidence, completed-history reconstruction, and interruption classification.

A reopened interrupted session may be inspected, but incomplete writes/processes/approvals/provider continuations are never automatically replayed.

Do not wire the TUI or implement coding-run change/validation/completion semantics yet.

### P2 / 0.4.2 — coding workflow, change accounting, validation, completion

Create the first provider-independent coding-workflow application layer over the existing agent loop.

Capture an observable pre-run baseline, preserve/directly account for George-native mutations, compare final observable state, distinguish direct mutation evidence from merely observed changes after arbitrary processes, record explicit validation executions through the canonical process/approval boundary, and produce structured completion evidence plus sufficiently detailed final coding narration.

Do not implement OpenTUI work-log rendering yet.

### P3 / 0.4.3 — progress/work projection and context lifecycle

Add presentation-independent activity/progress/work semantics over authoritative lifecycle evidence.

Create stable operation identity and bounded safe summaries for context loading, read/list/search, Git inspection, mutation, approvals, process execution, validation, recovery, and completion. One operation updates one work item rather than producing duplicated requested/started/completed rows.

Add the minimum context-loader observation seam needed to truthfully expose source loading without copying source bodies or moving progress semantics into OpenTUI.

### P4 / 0.4.4 — OpenTUI observable execution transcript

Render the Phase-4 work projection chronologically in the conversation surface while keeping canonical transcript/provider context clean.

Preserve one ephemeral activity line, persistent work history, literal process executable/argv/cwd, bounded outcomes, work-item lifecycle updates, and all existing input/approval/selection/resize/cancellation behavior.

### P5 / 0.4.5 — durable reopen and safe resume integration

Wire the durable session store into the normal application/TUI path and provide the smallest explicit reopen affordance suitable for the current single-user CLI/TUI.

Reopened completed history becomes inspectable conversation/work history. Interrupted state is shown as historical interruption only. A subsequent user action starts a new turn from durable normalized history and must not replay prior writes, processes, approvals, or provider continuations.

Do not build Phase-5 crash reconciliation or a session-management dashboard.

### P6 / 0.4.6 — integrated Phase 4 qualification and hardening

Exercise the exact full Phase-4 candidate with deterministic disposable repositories and session-state fixtures.

Cover pre-existing dirty work, context/skill substrate, approved mutation, explicit validation, completion evidence, observable execution transcript, durable reopen, later unrelated turn, interrupted write/process/approval/provider continuation, no replay, bounded/redacted work history, and Phase-2/3 regressions.

Attempt conditional native-terminal/live LM Studio evidence where available, record exact truth, and permit only bounded evidence-driven corrections.

### P7 / 0.4.7 — evidence-only Phase 4 closeout

Audit the exact P6 candidate/evidence and write formal Phase-4 closeout truth without repairing implementation, owner-closing the phase, or moving the roadmap to Phase 5.

## Key planning decisions

### Durable state shape

Keep the canonical in-memory `Session` / normalized event concepts provider-independent. Add a versioned durable representation and storage service rather than serializing arbitrary provider wire objects or OpenTUI state.

Default state root:
- Linux: `$XDG_STATE_HOME/george` when set, else `~/.local/state/george`;
- platform-appropriate user state location elsewhere;
- explicit test/config override for deterministic fixtures.

A durable session is bound to the canonical workspace identity it was created for. Opening it against another workspace fails visibly.

### Persistence safety and bounds

Persist enough normalized evidence to reconstruct completed user/assistant history and diagnose context/tool/approval/validation/change/completion state.

Do not persist unrestricted environment dumps, raw provider SSE/wire payloads, unbounded process output, TUI renderables/layout state, hidden reasoning, or arbitrary duplicated file bodies merely because a tool result contained them.

Existing tool outputs are already bounded, but the persistence layer should still define explicit durable-event/output bounds and avoid turning runtime payloads into an unbounded historical log.

Use safe write semantics so a failed store update does not silently replace a valid prior session with malformed partial state.

### Interruption classification

Durable load/reopen must inspect normalized lifecycle evidence and identify incomplete write/process/approval/provider-continuation lifecycle as interrupted historical evidence.

Such state is historical `interrupted` evidence. Phase 4 never assumes the side effect completed and never retries it automatically.

A new user request after reopen is a new turn. Existing completed normalized history may inform context, but incomplete operational state is not replay input.

### Coding workflow ownership

Add a reusable application/core coding workflow rather than teaching OpenTUI how to capture baselines, compare changes, classify validation, persist sessions, or construct completion evidence.

The existing agent loop remains the canonical model/tool engine and should be reused rather than duplicated.

### Changed-file evidence

At coding-run start, capture a read-only Git/workspace baseline when available.

George-native write/patch tool results are direct evidence that those tools affected their target paths.

At completion, compare observable final state with the baseline. Pre-existing dirty work remains separate from newly observed changes.

If an approved arbitrary process occurred, completion may report files observed changed during the run but may not attribute a specific file change to that process without additional evidence.

Never reset, clean, stash, checkout, or overwrite unrelated user work to obtain a clean comparison.

### Validation evidence

Validation is not a privileged executor.

Use an explicit validation intent/label associated with an actual canonical `run_process` execution and its approval/lifecycle evidence. The implementation may extend normalized process-call metadata or use an application-owned validation request that dispatches through the same ToolRegistry/ApprovalPort, but it must preserve literal executable/argv/cwd semantics, normal approval requirements, timeout/cancellation/output/environment/process-cleanup behavior, and avoid executable-name heuristics.

A failed validation stays failed even if the model later writes confident prose.

### Completion evidence and narrative

The coding workflow produces a structured completion object representing observed changes vs baseline, direct George-native mutation evidence where known, validation executions/outcomes, unresolved failures/warnings/evidence gaps, terminal state, and final assistant response.

Add only compact workflow-scoped guidance needed for a useful final coding response: what was inspected, what changed, validation performed, and unresolved issues/evidence gaps. Do not make the model narrate routine tool progress; the harness owns that.

### Progress and work projection

Authoritative application/tool/provider/approval/validation/session events remain source of truth.

Introduce a presentation-independent projection with stable turn/operation identity, category, bounded user-facing title/detail, lifecycle state, and optional safe metadata such as path, counts, byte size, literal process argv, cwd, exit/signal, duration, truncation.

The projection is not a second execution authority and is never appended to canonical user/assistant transcript merely because it was displayed.

### Context-source observability

Because context files are currently loaded inside `assembleContext()` before `context.assembled`, add a minimal observer/callback/event seam that reports bounded source identity/lifecycle only.

Do not expose source text through progress. Do not move context policy into the observer. Deterministic context assembly output/ordering/budget behavior must remain unchanged.

### TUI transcript composition

The visible transcript may interleave canonical user entries, persistent work items, canonical assistant text, and presentation-only diagnostics/completion summaries.

Internally, user/assistant canonical transcript stays clean. Prefer rendering from normalized event/work history or another presentation model that preserves chronological placement without injecting visible work text into future provider input.

Repeated lifecycle events for one operation update the same visible item.

### Resume UX

Phase 4 needs reopen capability, not a session product.

Use the smallest explicit affordance consistent with the current CLI/TUI, such as an explicit launch/resume argument or equally small command surface. Do not add search, naming, branching, synchronization, remote sessions, or a dashboard.

Workspace binding is authoritative. Reopened historical work is visibly historical; stale work never appears active.

## Model selection

- P1: **Terra High**
- P2: **Terra High**
- P3: **Terra High**
- P4: **Terra High**
- P5: **Terra High**
- P6: **Terra High**
- P7: **Terra Medium**

## Four stability questions

### 1. User-visible / aggregate quantities at risk

Session-file count/size, persisted event count, session reopen latency, context/history growth after resume, baseline/final changed-file counts, validation count/outcomes, work-item count, work-log size, process-output summaries, TUI scrollback height, time-to-first-token, provider turn count, tool-loop latency, and final completion-summary size.

### 2. Invariants

Phase-2 permission/workspace/process safety remains intact; Phase-3 context/skills remain deterministic and non-sticky; provider-specific state stays adapter-local; canonical user/assistant transcript remains free of harness work-log prose; progress/work items cannot grant authority; pre-existing dirty work is preserved; arbitrary process side effects are not falsely attributed; validation uses the canonical approval boundary; interrupted side effects are never replayed automatically; durable state is workspace-bound and schema-versioned; no browser/network/hooks/plugins/daemon/Tauri/multi-agent scope is introduced.

### 3. Integrated-only evidence

Exact durable reopen behavior, interrupted-state reconstruction, end-to-end changed-file accounting across tool/process activity, approval-gated validation, chronological TUI work rendering during streamed model/tool activity, real native-terminal ergonomics, and live LM Studio/Qwen behavior cannot be established by isolated unit tests alone.

### 4. Comparison baseline

The exact planning baseline is main `082eddcf28cd548ae3c6063fd4d0c4ba1e973a9e`, package `0.4.0`, with Phase 1-3 owner-closed and the observable execution-transcript Phase-4 docs applied. Preserve all existing provider/context/skill/tool/approval/process/TUI behavior except where Phase 4 explicitly adds durable sessions, coding-workflow evidence, progress/work projection, execution-transcript presentation, and safe reopen/resume semantics.
