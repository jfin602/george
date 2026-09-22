# Phase 1 Prompt Assessment

Status: CURRENT IMPLEMENTATION ASSESSMENT

Phase: 1 — Local Agent Foundation + TUI  
Execution folder: `p1`  
Assessment baseline: main `c47cf78d36326bf0a5bd1c13186c56003db9fe2a`, package `0.1.0`.

## Assessment conclusion

Proceed as one Phase 1 with **five implementation prompts plus one evidence-only closeout**.

The former Node/OpenTUI runtime gate is resolved. George now targets Node.js >=26.4.0 <27, TypeScript + ESM, and current `@opentui/core` with `--experimental-ffi` encoded in native TUI launch paths.

The repository is intentionally almost empty outside the exact Petri phase runner and its tests, so Phase 1 can establish clean boundaries without migration debt.

## Current-source findings

- `src/` contains no implementation yet.
- The only existing executable product-independent code is the exact Petri phase runner under `scripts/`.
- The only existing tests are the exact phase-runner grammar/runner tests.
- `package.json` is `0.1.0`, ESM, and now requires Node >=26.4.0 <27.
- `@types/node` is still on the bootstrap Node-24 line and must be updated during P1.
- no `package-lock.json` exists; the exact runner rejects one.
- OpenTUI is approved but not installed yet.
- Phase 1 is explicitly read-only and stops before autonomous model -> tool -> result -> model cycling.
- all P1 prompts are `Browser required: no.`.

## Prompt decomposition

### P1 / 0.1.1 — runtime + core contracts

Establish the Node-26 repository/runtime contract, no-package-lock npm behavior, configuration/event/session foundations, explicit test commands, and runner compatibility under Node 26. No live provider or TUI yet.

### P2 / 0.1.2 — LM Studio Responses provider

Implement the provider interface and LM Studio `/v1/responses` streaming adapter with deterministic SSE fixtures, cancellation/error normalization, loopback-only Phase-1 endpoint policy, and an opt-in live smoke command.

### P3 / 0.1.3 — workspace context + read-only tools + one-turn service

Implement workspace selection, BOOT/AGENTS root instruction loading, bounded read/list/search/Git status/diff tools, and the one-turn application service. The application may normalize model tool-call events but must not execute an autonomous tool loop.

### P4 / 0.1.4 — OpenTUI interface

Install/use `@opentui/core` directly, encode `--experimental-ffi` in normal launch scripts, and build the Codex-style terminal adapter over application events with deterministic OpenTUI test-renderer coverage.

### P5 / 0.1.5 — integrated local qualification + hardening

Run exact-source deterministic suites, native OpenTUI/runtime smoke where the environment permits, and the configured LM Studio/Qwen live smoke when reachable. Record exact evidence and perform at most two bounded evidence-driven correction cycles.

### P6 / 0.1.6 — evidence-only Phase 1 closeout

Audit P1-P5 evidence, reconcile Phase-1 status/docs, and record Green / Not Green / Evidence Gap truth without adding product scope.

## Key planning decisions

### Configuration

Phase 1 uses explicit typed configuration rather than hidden globals.

Initial sources, in precedence order:
1. safe built-in defaults;
2. environment variables;
3. explicit CLI/TUI launch overrides.

Initial settings:
- LM Studio base URL defaults to `http://127.0.0.1:1234`;
- model ID has no hard-coded quantization default and must be supplied explicitly for a live model turn;
- workspace defaults to the launch/current directory unless explicitly supplied;
- request timeout/output/tool limits are bounded constants/config values.

Phase 1 permits only loopback LM Studio endpoints. Remote providers/network configuration are later scope.

### Provider event boundary

Define a small George-owned normalized event union sufficient for:
- response start/metadata;
- text delta;
- tool-call/function-call accumulation/availability;
- completion/usage;
- normalized failure.

LM Studio/OpenAI event names stay inside the provider adapter.

### Instruction authority

For Phase 1, discover root `BOOT.md` then root `AGENTS.md` when present. Load them deterministically, bound their bytes, and mark them as repository-provided instructions beneath George's own policy/context. Do not implement recursive/nested instruction precedence yet.

### Read-only tool boundary

Filesystem tools resolve real paths against the selected workspace and reject traversal/symlink escape. Reads/list/search are bounded by explicit entry/byte/result ceilings.

Text search is implemented without an arbitrary shell command.

Git status/diff may invoke only fixed, read-only `git` argument vectors through `spawn`/equivalent with `shell: false`, workspace cwd, timeout/cancellation and output ceilings. Phase 1 does not expose general command execution.

### One-turn boundary

The Phase-1 application service performs exactly one provider request per submitted user turn. It assembles trusted George context + repository instructions + user input, streams normalized events, and completes/cancels/fails cleanly.

It does not dispatch model-proposed tools and does not send tool results back for another model turn. That loop belongs to Phase 2.

### TUI boundary

OpenTUI consumes application events and emits user intents only. The first UI should have:
- compact model/provider/workspace status;
- scrollable transcript;
- visible activity/status region;
- persistent multiline-capable input;
- streamed assistant text;
- resize handling;
- cancellation;
- clean terminal restoration.

When idle, Ctrl+C exits cleanly. During an active turn, Ctrl+C cancels the turn first rather than killing the process abruptly.

Use OpenTUI's test renderer for deterministic frame/input/resize/lifecycle tests. Do not add React.

### Dependency / package-lock law

Add repository npm configuration so ordinary installs do not create `package-lock.json`. Use npm without a lockfile and preserve the exact runner's rejection behavior.

Do not modify the exact Petri runner merely to accommodate dependencies.

## Model selection

- P1: **Terra High**
- P2: **Terra High**
- P3: **Terra High**
- P4: **Terra High**
- P5: **Terra High**
- P6: **Terra Medium**

## Four stability questions

### 1. User-visible / aggregate quantities at risk

Startup/runtime compatibility, request/context size, event ordering, stream latency, terminal redraw/input responsiveness, cancellation latency, read/search output size, Git command duration/output, workspace boundary size, memory growth during streams, and live-model time-to-first-token/throughput.

### 2. Invariants

Reusable core independent of OpenTUI; provider wire details isolated behind the adapter; Phase 1 remains read-only; repository/model content cannot widen permissions; workspace escape fails closed; Git remains read-only; deterministic tests require no LM Studio; live smoke stays separate; no package lock; exact phase runner remains unchanged.

### 3. Integrated-only evidence

Actual Node-26/OpenTUI native initialization with FFI, real terminal restoration/resize/input behavior, real LM Studio Responses streaming against the configured Qwen model, and their combined local experience cannot be completely proven by unit fixtures.

### 4. Comparison baseline

The exact baseline is main `c47cf78d36326bf0a5bd1c13186c56003db9fe2a`, package `0.1.0`. There is no prior George product implementation to preserve; the durable inherited behavior is the exact Petri phase runner and its tests.
