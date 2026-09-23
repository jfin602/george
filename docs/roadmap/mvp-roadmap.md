# George MVP Roadmap

Status: CURRENT ROADMAP — PHASE 2 OWNER-CLOSED; PHASE 3 CURRENT

The roadmap deliberately proves the provider, read-only tool foundation, real interactive terminal surface, and safe autonomous tool execution before broader coding workflow, networking, or a desktop GUI.

## Phase 1 — Local Agent Foundation + TUI

Status: OWNER-CLOSED WITH ACCEPTED NATIVE-TERMINAL / LIVE-MODEL EVIDENCE GAPS

Goal: establish a small, testable Node/TypeScript core, a Codex-style OpenTUI interface, one streamed local-model turn, and independently testable read-only tools.

Scope:
- Node.js >=26.4.0 <27 + TypeScript + ESM repository baseline;
- `@opentui/core` production presentation dependency, without React initially;
- launch/runtime wiring that supplies `--experimental-ffi` automatically for native OpenTUI execution;
- interactive TUI entry point;
- in-place terminal redraw and clean terminal restoration;
- persistent input plus streamed assistant output;
- visible model/workspace/status and live agent/read-only-tool activity;
- scrollback, resize handling, and cancellation;
- strict separation between TUI adapter and agent/application core;
- configuration loading;
- typed provider interface;
- LM Studio Responses API adapter;
- SSE streaming normalization;
- basic session/event representation;
- repository root selection;
- BOOT/AGENTS-style instruction discovery;
- read-only tools: file read/list, text search, Git status/diff;
- deterministic provider/tool/TUI-state fixtures where practical;
- explicit test commands that truthfully distinguish unit, runner, provider/TUI/integration, and live-smoke evidence as those layers are introduced;
- exact Petri phase-runner tests exercised under Node 26 before implementation proceeds past the runtime-foundation prompt;
- one bounded live LM Studio/Qwen smoke path;
- every generated P1 prompt uses `Browser required: no.` so the exact phase runner can execute the entire stack.

Non-goals: writes, arbitrary shell/process execution, autonomous multi-turn tool-call cycling, browser, web search, daemon, Tauri desktop GUI.

## Phase 2 — Safe Tool Loop

Status: OWNER-CLOSED WITH ACCEPTED NATIVE-TERMINAL / LIVE-MODEL EVIDENCE GAPS

Goal: turn the Phase 1 one-turn foundation into a bounded, permission-controlled autonomous tool loop without prematurely building the complete coding workflow.

Decision authority: `docs/planning/p2-safe-tool-loop/decision-record.md`.  
Formal evidence: `docs/phase-2-closeout.md`.  
Owner closeout: `docs/phase-2-owner-closeout.md`.

Scope:
- evolve the provider/core contract so George can advertise typed tool schemas and submit structured tool results/continuations;
- canonical tool registry with stable name, description, input schema, risk/permission class, executor, and normalized result/error shape;
- migrate Phase 1 read-only tools through the canonical registry;
- autonomous model -> tool -> result -> model loop owned by George;
- unknown-tool, JSON-parse, and schema validation before executor invocation;
- sequential tool execution in model order;
- simple configurable hard ceiling on tool rounds/calls;
- structured tool lifecycle and approval events;
- minimum permission policy:
  - read-only workspace tools allowed;
  - workspace writes/patches ask;
  - arbitrary process execution asks;
  - destructive filesystem actions denied/deferred;
  - outside-workspace native filesystem access denied;
  - network-native tools unavailable;
- TUI approval presentation with allow-once/deny behavior and cancellation while waiting;
- bounded workspace-native `write_file` / patch behavior with traversal and symlink-escape protection, bounded input, safe/preconditioned application, and no silent partial patching;
- arbitrary process execution using explicit executable/argument arrays, `shell: false` by default, workspace-bounded `cwd`, closed stdin, bounded output, timeout/cancellation, exit/signal capture, sanitized environment inheritance, and best-effort descendant cleanup;
- truthful process trust boundary: approved arbitrary child processes are not an OS sandbox and may exercise host-user privileges;
- capture/preserve pre-existing Git dirty state; no reset/clean/stash/checkout behavior and no general mutating Git toolset;
- recoverable tool failures/permission denials represented as structured loop results where semantics permit;
- fixture-repository integration tests for read/write/process/permission/tool-loop behavior;
- bounded live LM Studio/Qwen tool-cycle qualification when the supported local setup is available;
- native-terminal approval/tool lifecycle qualification when a genuine usable TTY is available;
- evidence gaps remain evidence gaps rather than being inferred Green.

Success condition:
- a deterministic fixture can drive George through multiple model/tool rounds to a final answer;
- tool calls are schema-validated and permission-gated;
- approved writes/processes run within George's documented controls;
- denial, malformed calls, timeout, cancellation, tool failure, and loop exhaustion terminate or recover predictably;
- pre-existing user changes remain intact;
- no unrestricted environment dump or silent orphaned process is introduced;
- the TUI remains an adapter over reusable application/core behavior.

Non-goals:
- delete/rm-style destructive filesystem tools;
- remembered approval profiles;
- OS/container sandboxing;
- general mutating Git operations;
- comprehensive changed-file tracking/final summaries;
- validation-command orchestration;
- context budgeting/compaction;
- durable session resume/recovery;
- retries/backoff for long autonomous jobs;
- browser/web/network tools;
- MCP/GitHub/Parallel adapters;
- daemon/server mode;
- Tauri;
- multi-agent scheduling.

## Phase 3 — Context + Skills

Status: CURRENT IMPLEMENTATION GATE — baseline package `0.3.0`

Goal: give George a deterministic, token-conscious, provider-independent context and declarative-skill substrate without weakening the Phase 2 tool/permission boundary.

Decision authority: `docs/planning/p3-context-skills/decision-record.md`.

Scope:
- provider-independent deterministic context assembly rather than raw instruction concatenation;
- compact George-owned model instructions, keeping code-enforced policy out of prompt text where practical;
- optional user-global instructions and small user-owned personality loading;
- George-native workspace instructions via `.george/instructions.md`;
- compatible root `AGENTS.md` / `BOOT.md` discovery, with routing documents used to identify just-in-time project knowledge rather than injecting every referenced document permanently;
- explicit trust/precedence across George invariants, current user intent, workspace/project guidance, user-global defaults, and personality;
- stable source identity/order and deterministic duplicate suppression where possible;
- token-oriented provider-facing context budgets with observable estimated size and actual provider usage when reported;
- provider-independent context profiles so model/quant/runtime-specific operating limits do not leak into the core;
- initial qualification profile for Qwen3-Coder-30B-A3B-Instruct Q4_K_M through LM Studio: 32,768-token physical target, ~12k-18k ordinary working set, ~20k soft pressure, 24,576-token provider-input ceiling, and ~8,192 tokens reserved for generation/tool-loop headroom;
- smallest-sufficient-working-set policy: unused context is valid headroom and discovered material is not injected merely because it fits;
- explicit omit/defer/fail behavior for budget exhaustion instead of silently treating partial critical instructions as complete;
- portable skill registry and discovery with `skills/<name>/SKILL.md` compatibility;
- built-in, user-global, and workspace skill sources with deterministic source identity and visible collision handling;
- compact bounded skill metadata/catalog exposed to application/TUI surfaces without ordinary-turn provider injection, plus no eager full-body loading;
- explicit just-in-time skill activation, scoped to the current user turn across that turn's provider/tool rounds;
- no executable authority granted by declarative skill content;
- deterministic context/skill qualification independent from model nondeterminism;
- correction/regression testing discipline.

Success condition:
- a deterministic repository fixture can be opened and its applicable context sources discovered under the documented trust, precedence, routing, deduplication, and budget contract;
- provider-facing context size/profile/headroom are observable, critical instruction sources are never silently truncated and presented as complete, optional/routed material is explicitly omitted/deferred/rejected when required, and large repositories do not cause eager context filling;
- at least one portable external `SKILL.md` fixture is discovered and explicitly activated just in time for one user turn without leaking into an unrelated later turn;
- repository/personality/skill content cannot expand George's executable permission ceiling;
- provider and TUI code remain adapters over reusable context and skill services.

Non-goals:
- mutating-run changed-file accounting or comprehensive completion summaries;
- validation-command orchestration;
- durable session persistence/resume;
- LLM-based compaction/summarization;
- automatic semantic skill selection;
- executable lifecycle hooks;
- George plugin manifest/package lifecycle;
- browser/web/network tools or Parallel/GitHub/MCP adapters;
- remembered approval profiles or OS/container sandboxing;
- general mutating Git commands;
- crash-safe side-effect replay/reconciliation;
- daemon/server mode, Tauri, or multi-agent scheduling.

## Phase 4 — Coding Workflow + Sessions

Status: PLANNED — baseline established after Phase 3 owner closeout

Goal: turn the Phase 3 context-aware safe agent into a durable bounded coding workflow that can modify, validate, report, persist, and safely resume work.

Decision authority: `docs/planning/p4-coding-workflow-sessions/decision-record.md`.

Scope:
- one provider-independent coding workflow owned by the application/core;
- mutating-run workspace/Git baseline capture;
- observed changed-file accounting that preserves and distinguishes pre-existing dirty work;
- conservative attribution when approved arbitrary child processes may have modified files;
- validation-command workflow through the existing canonical process/tool/approval boundary;
- structured validation evidence;
- structured completion evidence covering observed changes, validation, unresolved failures/warnings, completion state, and final assistant output;
- schema-versioned filesystem session persistence outside the repository by default;
- canonical workspace identity binding;
- reconstruction of completed durable history after reopen;
- interrupted writes/processes/approvals/provider continuations surfaced as interrupted and never silently replayed;
- first end-to-end coding qualification against a disposable fixture repo using the already-qualified Phase 3 context and skill substrate;
- preservation of Phase 2 tool, permission, process, and Git safeguards throughout the workflow.

Success condition:
- a deterministic disposable repository with pre-existing dirty work can be opened using the qualified Phase 3 context/skill system, changed through approved tools, validated through the normal process boundary, and completed with structured evidence;
- the run accurately separates pre-existing dirty work from newly observed changes without overclaiming process attribution;
- normalized session state persists outside the repository and a later turn can reopen completed history;
- interruption/resume tests prove incomplete writes, processes, approvals, and provider continuations are not automatically replayed;
- provider/TUI code remains adapters over reusable context, session, tool, and coding-workflow services.

Non-goals:
- LLM-based compaction/summarization;
- automatic semantic skill selection;
- executable lifecycle hooks;
- plugin packaging/install lifecycle;
- browser/web/network tools or external adapters;
- remembered approval profiles or OS/container sandboxing;
- general mutating Git operations;
- crash-safe side-effect replay/reconciliation;
- long-job retries/backoff;
- daemon/server mode, Tauri, or multi-agent scheduling.

## Phase 5 — Reliability + Long Runs

Goal: support longer autonomous local jobs safely and establish George's lifecycle hook runtime.

Scope:
- compaction/summarization;
- budgets/limits beyond the Phase 2 hard loop guard;
- retries/backoff;
- crash/interruption recovery and side-effect reconciliation beyond Phase 4 safe non-replay resume;
- child-process cleanup hardening;
- observability/logging;
- performance baselines including TUI responsiveness under streaming;
- extended Qwen qualification;
- normalized George lifecycle hook bus;
- deterministic hook ordering and enable/disable state;
- hook timeout/cancellation and bounded input/output;
- structured hook result/error events and failure isolation;
- sanitized executable-hook environment and preservation of George's existing process/tool permission boundaries;
- recovery evidence sufficient to diagnose failed hooks without corrupting the surrounding agent run.

## Phase 6 — Plugins + External Adapters

Goal: package extensions and add network/browser intelligence without contaminating the core or weakening George's trust boundaries.

Scope:
- George-native plugin discovery and manifest contract;
- plugin install/enable/disable lifecycle;
- plugin-provided skills, hooks, commands, and tool contributions;
- compatibility adapters for portable or host-specific extension formats where semantics can be translated safely;
- plugin-provided executable tools registered through the canonical ToolRegistry and normal permission policy;
- Parallel Search, Chrome DevTools, GitHub, and MCP adapters;
- explicit trust/permission boundaries for every executable or network-capable adapter;
- independently disableable extension/adaptor capabilities.

The exact George plugin manifest schema is intentionally deferred until this phase; Phase 3 proves the skill substrate and Phase 5 proves hook lifecycle semantics before packaging freezes those interfaces.

## Phase 7 — Local Daemon

Goal: separate the long-lived George service from presentation clients.

Scope:
- localhost-only server;
- authenticated local client protocol;
- session/run APIs;
- event streaming;
- process ownership;
- single-user concurrency policy.

No LAN/Internet exposure by default.

## Phase 8 — Native Desktop

Goal: provide a polished native application without rewriting the agent.

Direction:
- Tauri shell;
- reuse daemon/application-service interfaces;
- preserve the same event/command semantics proven by the OpenTUI adapter;
- session/task UI;
- permission prompts;
- tool/event inspection;
- model/provider controls.

## Later

Only after the local product is reliable: trusted LAN clients, phone/secondary-device control, multiple workspaces/runs, remote inference providers, richer MCP ecosystem, scheduling/background jobs, and multi-agent experiments.
