# Phase 1 Decision Record — Local Agent Foundation

Status: APPROVED INITIAL DIRECTION

## Problem

A local Qwen3-Coder model works well through LM Studio, including the OpenAI-compatible Responses API, but using it inside an existing coding harness exposed orchestration assumptions unrelated to basic inference.

George will own the harness so local-model behavior, tool protocol, context, permissions, recovery, and terminal presentation are explicit and testable.

## Decisions

### TypeScript + Node.js 24

Use TypeScript on Node 24 for the core.

George is primarily I/O and orchestration; inference runs in LM Studio outside George's hot compute path. Node is strong for subprocesses, streaming HTTP/SSE, files, JSON, Git tooling, terminal applications, and future network protocols.

### Codex-style TUI first

The initial application is an interactive terminal UI, not a print-only CLI and not a browser application.

The TUI should rewrite owned terminal regions in place, stream assistant output, show tool/progress state, retain interactive input and scrollback, handle resize/cancellation, and restore terminal state cleanly.

### OpenTUI

Use `@opentui/core` as the Phase 1 TUI renderer.

Use the core TypeScript API directly; do not add React initially.

OpenTUI is strictly a presentation adapter. Agent behavior, model protocol, tool policy, context, and sessions remain outside TUI components.

### Core library, not TUI application logic

TUI handlers translate user interaction into application-service calls and render events. Agent behavior lives in reusable modules.

This is required so a later daemon and Tauri UI do not force a rewrite.

### LM Studio Responses API first

Use LM Studio's OpenAI-compatible `/v1/responses` endpoint as the first provider adapter. Normalize the protocol behind George's own provider interface.

### Qwen3-Coder first model

Initial development/qualification targets the locally available Qwen3-Coder 30B A3B GGUF model family.

Do not hard-code one quantization/model ID into core architecture. Model ID is configuration.

### Tauri later

If a desktop GUI becomes useful, prefer Tauri over Electron. The GUI remains an adapter over the reusable core or local daemon.

### Networking-ready boundaries

Design application/core interfaces so a localhost daemon can be inserted later. Do not build networking in Phase 1.

### Minimal dependencies

Prefer Node built-ins and small libraries. `@opentui/core` is explicitly approved for presentation. Do not add React merely to structure the initial TUI.

## Phase 1 acceptance direction

Phase 1 should prove:
- repository bootstraps and typechecks/tests;
- TUI starts/restores terminal state correctly;
- TUI can select/display a workspace and model/provider status;
- streamed model text updates in place without corrupting input;
- resize and cancellation are handled;
- TUI state is driven by application events rather than agent logic embedded in widgets;
- instructions can be discovered deterministically;
- LM Studio provider can stream a simple response;
- provider events normalize into George events;
- read-only tools can be represented/executed safely and visibly;
- deterministic tests do not require LM Studio;
- a separate live smoke proves the supported local setup without becoming the ordinary test suite.

## Deferred decisions

Do not decide yet:
- Tauri UI structure;
- daemon protocol;
- remote authentication;
- database choice;
- multi-agent architecture;
- browser automation stack;
- Parallel Search contract;
- general MCP host implementation;
- public plugin API.
