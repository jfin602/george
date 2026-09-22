# Phase 3 Decision Record — Coding Workflow

Status: APPROVED DIRECTION

Baseline: package `0.3.0`  
Current roadmap gate: Phase 3 — Coding Workflow

## Problem

Phase 2 established George's bounded model -> tool -> result -> model loop, canonical typed tool registry, per-call approvals, workspace-native writes/patches, bounded arbitrary process execution, Git dirty-state preservation, and structured tool/approval evidence.

The current Phase 3 baseline still assembles provider instructions by concatenating George-owned text with bounded root `BOOT.md` / `AGENTS.md` content, keeps sessions in memory, and has no canonical changed-file/validation/completion workflow or portable skill registry.

Phase 3 must turn that safe tool foundation into a useful bounded coding workflow without weakening Phase 2 trust boundaries or prematurely importing Phase 4 long-run recovery and Phase 5 plugin/network scope.

## Decisions

### Phase 3 owns one provider-independent coding workflow

The application/core owns the sequence that assembles context, runs the existing agent/tool loop, records observed changes and validation evidence, persists durable session state, and produces structured completion evidence.

OpenTUI renders that state and accepts user/approval input. Provider adapters translate inference protocol. Neither becomes the owner of context precedence, session persistence, changed-file accounting, validation policy, or completion semantics.

### Replace raw instruction concatenation with assembled context

Phase 3 introduces a provider-independent assembled-context representation.

It keeps distinct source identity, trust class, priority/order, active-vs-routed status, size diagnostics, and omission/defer/failure evidence rather than flattening every discovered file into an undifferentiated string as early as possible.

Model-facing sources may include:
- compact George-owned model instructions;
- explicit current user intent/task input;
- user-global instructions;
- a small user-owned personality source;
- workspace-native `.george/instructions.md`;
- compatible repository guidance such as root `AGENTS.md`;
- root `BOOT.md`-style routing guidance;
- selected/routed project documents;
- current conversation history and normalized tool results;
- activated skill content.

The assembled representation is independent from LM Studio/Qwen request wire format.

### Trust and precedence are deterministic

For conflicting model-facing guidance, the Phase 3 precedence contract is:

1. George-owned invariants that cannot be delegated to lower-trust prompt text;
2. explicit current user intent, subject to George's executable permission ceiling;
3. workspace/project guidance for the active repository;
4. user-global instruction defaults;
5. personality as a stylistic/temperamental default.

A lower layer may refine a higher layer where they do not conflict. Personality does not grant tools, filesystem scope, process/network authority, secret access, approval bypass, or any other executable capability.

Repository files, routed documents, skills, and model output remain untrusted relative to George policy.

### Context budgeting is token-oriented and observable

Raw byte limits are not the Phase 3 context-budget contract.

George maintains an observable provider-facing context-size estimate. If the exact tokenizer for the active provider/model is unavailable, a deterministic documented estimate is acceptable but must be labeled as estimated. Actual provider usage may be recorded separately when reported by the provider.

Budget handling is explicit:
- required compact George invariants are retained;
- lower-priority/routed material may be omitted or deferred with recorded reason;
- an oversized optional source may be rejected/deferred;
- George must not silently cut a critical instruction source and present the fragment as if it were complete.

LLM-based summarization/compaction is not required in Phase 3 and remains Phase 4 scope.

### Routing is distinct from always-on instructions

A discovered project document does not automatically belong in every provider request.

Root `BOOT.md` is primarily a routing source: it may identify relevant project contracts/documents that George can retrieve when needed. Phase 3 should prove deterministic routed retrieval/selection without requiring an LLM summarizer.

Always-on active instructions stay compact. Project knowledge that can be loaded just in time should not be permanently repeated across unrelated turns.

### User-global instructions and personality are small optional sources

User-level George configuration may reference optional global instructions and a small personality source from George's user configuration area.

Missing optional files are normal and must not break startup. Oversized or malformed configured sources fail/degrade explicitly according to the context contract.

Personality affects communication style and engineering temperament only. It cannot alter executable policy.

### Phase 3 establishes the declarative skill substrate

Skill sources are:
- built-in George skills;
- user-global skills;
- workspace-native skills under `.george/skills/`;
- later plugin-provided skills.

The portable compatibility target is a directory containing `SKILL.md`, compatible with `skills/<name>/SKILL.md`. George should understand a stable skill name and description plus optional noncritical help/argument metadata when present. Unknown noncritical metadata is ignored safely.

Discovery is cheap and token-conscious. George may expose compact bounded metadata/catalog entries broadly, but full skill bodies are not inserted into every model request.

Phase 3 requires deterministic explicit activation. An activated skill body is loaded just in time, participates in the same trust/precedence/budget machinery as other model-facing context, remains available across that current user turn's model/tool rounds, and drops out for unrelated later turns unless explicitly activated again.

Stable source identities and collisions are explicit. Ambiguous unqualified names fail visibly instead of silently picking a winner. Plugin-style namespaced identities such as `plugin:skill` remain compatible with later phases without requiring Phase 3 to implement plugin packaging.

Skill text is declarative guidance only. It cannot register an executor or raise George's process, filesystem, network, secret, or approval authority.

Automatic semantic skill selection is deferred until after deterministic explicit activation is qualified.

### Phase 3 persistence is local, filesystem-backed, and outside the repository

Durable session state is stored in a user state location rather than the active repository by default. On Linux, prefer `$XDG_STATE_HOME/george`, falling back to `~/.local/state/george`; use platform-appropriate equivalents elsewhere.

Persisted state is schema-versioned and records canonical workspace identity. Append-friendly normalized events remain the durable evidence source where practical.

Persist enough to reconstruct completed turns and diagnose runs, including relevant normalized provider/tool/approval events, context/source diagnostics, activated-skill identity, change summaries, validation evidence, interruption state, and completion state.

Do not persist secrets, unrestricted environment dumps, or unbounded process output.

### Resume never silently replays an interrupted side effect

Phase 3 resume means continue from durable completed history.

If the prior process ended while a write, process, approval request, or provider continuation was incomplete, George marks that turn interrupted. Reopening the session must not automatically:
- re-run the incomplete write;
- restart the incomplete process;
- synthesize or reuse an approval decision;
- submit an old provider continuation as though the side effects were known complete.

A later user action begins a new turn from durable normalized history. Provider-native response IDs may remain diagnostic/optimization data but are not the sole source of recoverable state.

Crash-safe side-effect replay/reconciliation and richer interruption recovery are Phase 4 work.

### Changed-file accounting is evidence, not guesswork

At the beginning of a mutating coding run, George records an observable workspace/Git baseline when the repository supports it.

George-native write/patch tools can record their direct effects. At completion George compares the final observable state with the baseline so pre-existing dirty work remains distinguishable from newly observed changes.

An approved arbitrary child process is outside George's precise filesystem-attribution boundary. George may report files that changed during the run, but must not claim the process definitely caused a particular change unless evidence establishes that relationship.

The workflow must preserve Phase 2's no-reset/no-clean/no-stash/no-checkout behavior and existing user work.

### Validation uses the canonical process boundary

Phase 3 does not add a privileged validation executor.

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

### Phase boundary

Phase 3 does not include:
- LLM-based context compaction/summarization;
- automatic semantic skill routing;
- executable lifecycle hooks;
- a frozen George plugin manifest or plugin install lifecycle;
- Ponytail/host-specific executable plugin compatibility beyond portable declarative skill compatibility;
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

Phase 4 owns long-run reliability and executable hooks. Phase 5 owns plugin packaging and external/network adapters.

## Qualification direction

Deterministic Phase 3 coverage must prove at minimum:
- context-source discovery, precedence, stable ordering, duplicate handling, and provider independence;
- estimated provider-facing context sizing and explicit budget exhaustion behavior;
- required instructions are not silently truncated and presented as complete;
- missing optional user-global/personality/workspace sources;
- repository/personality/skill text cannot raise executable permissions;
- skill discovery across built-in, user-global, and workspace sources;
- visible skill collision behavior and malformed/oversized skill handling;
- compact skill catalog behavior without eager full-body injection;
- explicit skill activation scoped to one user turn and absent from an unrelated later turn;
- at least one portable external `SKILL.md` fixture;
- schema-versioned filesystem session persistence outside the fixture repository;
- completed history reconstruction after reopen;
- interrupted write/process/approval/provider-continuation state not being automatically replayed;
- mutating-run baseline capture with pre-existing dirty work preserved;
- changed-file observation that does not overclaim process attribution;
- validation through the canonical process/approval boundary;
- structured completion evidence;
- one end-to-end disposable-repository workflow combining context assembly, skill activation, approved mutation, validation, completion, persistence, and resumed later work.

Live LM Studio/Qwen and native-terminal evidence remain separately classified under the stability contract. Deterministic fixture coverage does not retroactively close the accepted Phase 1/2 live/native Evidence Gaps.
