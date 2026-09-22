# George MVP Roadmap

Status: INITIAL ROADMAP

The roadmap deliberately proves the provider, read-only tool foundation, and real interactive terminal surface before autonomous editing, networking, or a desktop GUI.

## Phase 1 — Local Agent Foundation + TUI

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

Goal: let the model repeatedly call tools under explicit policy.

Scope:
- tool registry/schema completion for executable calls;
- autonomous model -> tool -> result -> model loop;
- process execution with timeout/cancellation;
- write/patch tools;
- permission classes and approvals rendered through the TUI;
- Git dirty-state safeguards;
- structured errors;
- fixture-repository integration tests.

## Phase 3 — Coding Workflow

Goal: make George useful for bounded implementation tasks.

Scope:
- context budgeting;
- project instruction precedence;
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
- budgets/limits;
- retries/backoff;
- crash/interruption recovery;
- child-process cleanup;
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
