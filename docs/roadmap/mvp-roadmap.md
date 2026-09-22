# George MVP Roadmap

Status: INITIAL ROADMAP

The roadmap deliberately proves the agent loop before adding UI or networking.

## Phase 1 — Local Agent Foundation

Goal: establish a small, testable Node/TypeScript core and prove one streamed local-model turn.

Scope:
- Node 24 + TypeScript + ESM repository baseline;
- CLI entry point;
- configuration loading;
- typed provider interface;
- LM Studio Responses API adapter;
- SSE streaming normalization;
- basic session/event representation;
- repository root selection;
- BOOT/AGENTS-style instruction discovery;
- read-only tools: file read/list, text search, Git status/diff;
- deterministic provider/tool fixtures;
- one bounded live LM Studio/Qwen smoke path.

Non-goals: writes, arbitrary shell, autonomous multi-turn editing, browser, web search, daemon, GUI.

## Phase 2 — Safe Tool Loop

Goal: let the model repeatedly call tools under explicit policy.

Scope:
- tool registry/schema;
- multi-turn tool-call loop;
- process execution with timeout/cancellation;
- write/patch tools;
- permission classes and approvals;
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
- performance baselines;
- extended Qwen qualification.

## Phase 5 — External Tool Adapters

Goal: add network/browser intelligence without contaminating the core.

Candidates:
- Parallel Search;
- Chrome DevTools;
- GitHub;
- MCP.

Each adapter gets an explicit trust/permission boundary and can be disabled independently.

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
- session/task UI;
- permission prompts;
- tool/event inspection;
- model/provider controls.

## Later

Only after the local product is reliable:
- trusted LAN clients;
- phone/secondary-device control;
- multiple workspaces/runs;
- remote inference providers;
- richer MCP ecosystem;
- scheduling/background jobs;
- multi-agent experiments.
