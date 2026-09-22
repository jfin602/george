# Phase 1 Decision Record — Local Agent Foundation

Status: APPROVED INITIAL DIRECTION

## Problem

A local Qwen3-Coder model works well through LM Studio, including the OpenAI-compatible Responses API, but using it inside an existing coding harness exposed orchestration assumptions unrelated to basic inference.

George will own the harness so local-model behavior, tool protocol, context, permissions, and recovery are explicit and testable.

## Decisions

### TypeScript + Node.js 24

Use TypeScript on Node 24 for the core.

Reasoning:
- George is primarily I/O and orchestration;
- inference runs in LM Studio, outside George's hot compute path;
- Node is strong for subprocesses, streaming HTTP/SSE, files, JSON, Git tooling, and future network protocols;
- it matches the owner's existing development ecosystem;
- iteration speed matters more than producing a single Rust binary at this stage.

### CLI first

Build a terminal application first. Do not require a browser.

The difficult problem is the reliable agent/tool loop; GUI work should not hide or delay it.

### Core library, not CLI application logic

CLI handlers translate user interaction into application-service calls. Agent behavior lives in reusable modules.

This is required so a later daemon and Tauri UI do not force a rewrite.

### LM Studio Responses API first

Use LM Studio's OpenAI-compatible `/v1/responses` endpoint as the first provider adapter.

The adapter must normalize the protocol behind George's own provider interface.

### Qwen3-Coder first model

Initial development/qualification targets the locally available Qwen3-Coder 30B A3B GGUF model family.

Do not hard-code one quantization/model ID into core architecture. Model ID is configuration.

### Tauri later

If a desktop GUI becomes useful, prefer Tauri over Electron. The GUI remains an adapter over the reusable core or local daemon.

### Networking-ready boundaries

Design application/core interfaces so a localhost daemon can be inserted later.

Do not build networking in Phase 1.

### Minimal dependencies

Prefer Node built-ins and small libraries. Add dependencies only where they clearly reduce protocol/parser/schema risk or substantial implementation complexity.

## Phase 1 acceptance direction

Phase 1 should prove:
- repository bootstraps and typechecks/tests;
- CLI can select a workspace;
- instructions can be discovered deterministically;
- LM Studio provider can stream a simple response;
- provider events normalize into George events;
- read-only tools can be represented/executed safely;
- deterministic tests do not require LM Studio;
- a separate live smoke can prove the supported local setup without becoming the ordinary test suite.

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
