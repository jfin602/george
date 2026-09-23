# Phase 4 Implementation Plan

Status: CURRENT IMPLEMENTATION PLAN

Phase: 4 — Coding Workflow + Sessions  
Execution folder: `p4`  
Baseline: main `082eddcf28cd548ae3c6063fd4d0c4ba1e973a9e`, package `0.4.0`.

Read with `BOOT.md`, `AGENTS.md`, `docs/project-overview.md`, `docs/architecture.md`, `docs/workflow.md`, `docs/stability-contract.md`, `docs/roadmap/mvp-roadmap.md`, `docs/planning/p4-coding-workflow-sessions/decision-record.md`, and `docs/tasks/p4/prompt-assessment.md`.

## Target architecture

```text
OpenTUI adapter
      |
coding workflow application service
      |
 +----+----------------+------------------+
 |                     |                  |
agent loop        progress/work       session store
 |                     |                  |
context/tools      event projector    filesystem state
 |                                          |
provider                                  reopen
```

The existing `AgentLoopApplicationService` remains the canonical model -> tool -> result -> model engine. Phase 4 adds workflow/session/projection layers around qualified Phase-2/3 behavior rather than cloning it inside the TUI.

## P1 — durable session model and local store

Target: `0.4.1`.

Create provider-independent durable session primitives.

Resolve the default state directory outside the active repository. Linux follows `$XDG_STATE_HOME/george` with fallback `~/.local/state/george`; tests/config may supply an explicit root.

Persist schema version, session ID, canonical workspace identity, normalized completed transcript/history required for reopen, bounded normalized lifecycle evidence needed to diagnose context/tool/approval/failure state, and stable ordering metadata only where needed by the durable contract.

Provide safe create/write/open behavior. Loading must reject unsupported schema, malformed structure, wrong canonical workspace, invalid normalized event shape, and explicit bound violations.

Classify incomplete write/process/approval/provider-continuation lifecycle as interrupted historical evidence. Never replay anything on load.

Completed durable history must reconstruct the clean user/assistant transcript exactly enough for the next turn's normal conversation assembly.

## P2 — coding workflow, changed files, validation, completion

Target: `0.4.2`.

Create a provider-independent coding workflow that composes the existing agent loop and P1 session/storage substrate.

Capture a pre-run read-only Git/workspace baseline. Preserve and distinguish pre-existing dirty work.

Observe canonical tool events/results. Retain direct `write_file`/`apply_patch` target evidence. At completion, capture final observable state and classify pre-existing dirty, newly observed changed, directly touched by George-native mutation tools where known, and attribution unknown where arbitrary processes could have caused changes.

Validation must be explicit and execute through the existing canonical `run_process` / ApprovalPort path. Record label/intent, executable/argv/cwd, lifecycle linkage, exit/signal/outcome, bounded output evidence, and truncation. Do not infer validation from command names.

Produce structured completion evidence containing change, validation, warning/failure/evidence-gap, terminal-state, and final-assistant-response fields.

## P3 — progress/work projection and context lifecycle

Target: `0.4.3`.

Implement presentation-independent observable work semantics.

Keep authoritative lifecycle events intact. Add normalized high-frequency activity, lower-frequency progress milestones, and persistent concrete-operation work items.

A work item has stable identity and bounded fields sufficient for future OpenTUI/Tauri/daemon consumers. One operation transitions state rather than creating duplicated transcript rows.

Provide deterministic safe summaries for all current built-in tools, approvals, validation, recovery, and completion. Never automatically include file text, write content, patch bodies, arbitrary result JSON, unrestricted stdout/stderr, environment state, secrets, or raw provider payloads.

Add a minimal observer/event seam to context loading so the application can truthfully report source discovery/load outcomes while they happen without changing context policy/output.

## P4 — OpenTUI observable execution transcript

Target: `0.4.4`.

Integrate P3 projection into OpenTUI only as presentation.

Compose a chronological visible conversation surface that can show canonical You/George entries, persistent work/context/validation items, and presentation-only diagnostics.

Running work items update to terminal state rather than appending duplicate lifecycle rows. Retain the separate one-line activity indicator.

Preserve assistant streaming, draft input, approval interaction, cancellation, selection/copy, scrollback/sticky behavior, wrapping/resizing, and terminal cleanup.

## P5 — durable reopen and safe resume integration

Target: `0.4.5`.

Wire P1-P4 into the normal local product path.

A completed session reopens against the same canonical workspace with conversation history, historical work/progress, and completion/validation/change evidence inspectable.

Add only the smallest explicit single-user reopen affordance needed to select a known local session. Do not add a session dashboard, branching model, synchronization, remote session API, or multi-workspace scheduler.

Interrupted operations are shown as historical interruption only and never replayed. A subsequent user request starts a new turn from completed durable history, with no sticky prior skill activation or reused approval.

## P6 — integrated Phase 4 qualification and hardening

Target: `0.4.6`.

Create an end-to-end disposable Git fixture with pre-existing dirty work, Phase-3 context/skill use, read/search inspection, approved mutation, explicit validation, structured completion, persistent work projection, OpenTUI transcript, durable persistence, and reopen + unrelated later turn.

Persist/reopen interrupted mutation/process/approval/provider cases and prove zero automatic replay.

Exercise every built-in tool through the work projection and prove stable identity, bounded safe detail, literal process argv/cwd, and no raw sensitive payload leakage.

Run focused and broad regression evidence, attempt conditional native/live qualification, permit at most two evidence-driven correction cycles with regression guards, and write `docs/tasks/p4/P6-qualification-evidence.md`.

## P7 — evidence-only Phase 4 closeout

Target: `0.4.7`.

Audit the exact P6 candidate/evidence. Write `docs/phase-4-closeout.md` with Implementation Complete / Stability Qualified truth and per-layer Green / Not Green / Evidence Gap outcomes.

Do not repair implementation, owner-close the phase, or advance BOOT/roadmap to Phase 5.

## Phase boundary

Phase 4 does not implement LLM compaction/summarization, automatic semantic skill routing, executable hooks, plugin packaging, browser/network tools, external adapters, remembered approval profiles, OS/container sandboxing, general mutating Git, crash-safe side-effect reconciliation, long-job retries/backoff, daemon/server mode, Tauri, or multi-agent scheduling.
