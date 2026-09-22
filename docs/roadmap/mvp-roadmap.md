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

## Phase 3 — Coding Workflow

Status: CURRENT IMPLEMENTATION GATE — baseline package `0.3.0`

Goal: make George useful for bounded implementation tasks.

Scope:
- token-aware context budgeting with observable instruction/context size;
- compact George-owned model instructions with code-enforced policy kept out of prompt text where practical;
- optional user-global instructions and small user-owned personality loading;
- George-native workspace instructions via `.george/instructions.md`;
- compatible `AGENTS.md` / `BOOT.md` discovery and routing;
- deterministic instruction trust/precedence, stable ordering, and duplicate suppression where possible;
- separation of always-on active instructions from just-in-time project-document retrieval/routing;
- provider-independent assembled context without requiring LLM summarization for instruction compilation;
- changed-file tracking;
- validation command workflow;
- completion summaries;
- session persistence/resume semantics;
- correction/regression testing discipline;
- first end-to-end coding qualification against a disposable fixture repo.

## Phase 4 — Reliability + Long Runs

Goal: support longer autonomous local jobs safely.

Scope:
- compaction/summarization;
- budgets/limits beyond the Phase 2 hard loop guard;
- retries/backoff;
- crash/interruption recovery;
- child-process cleanup hardening;
- observability/logging;
- performance baselines including TUI responsiveness under streaming;
- extended Qwen qualification.

## Phase 5 — External Tool Adapters

Goal: add network/browser intelligence without contaminating the core.

Candidates: Parallel Search, Chrome DevTools, GitHub, and MCP. Each adapter gets an explicit trust/permission boundary and can be disabled independently.

## Phase 6 — Local Daemon

Goal: separate the long-lived George service from presentation clients.

Scope:
- localhost-only server;
- authenticated local client protocol;
- session/run APIs;
- event streaming;
- process ownership;
- single-user concurrency policy.

No LAN/Internet exposure by default.

## Phase 7 — Native Desktop

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
