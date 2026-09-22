# Phase 1 Prompt Assessment

Status: READY FOR PLANNING

Phase: 1 — Local Agent Foundation + TUI  
Execution folder: `p1`  
Assessment baseline: package `0.1.0`.

## Assessment conclusion

Proceed to `/prompt-plan` and `/prompt-write p1`.

The former runtime incompatibility is resolved by owner approval:

- George now targets Node.js 26.4.0 or later within the Node 26 major line;
- George keeps current `@opentui/core` for the initial native TUI;
- George remains TypeScript + ESM;
- native OpenTUI launch paths must encode `--experimental-ffi`;
- Bun is not introduced as a second production runtime.

The exact Petri phase runner remains unchanged. Its runner tests must pass under Node 26 before Phase 1 proceeds beyond the runtime-foundation prompt.

The runner also rejects `package-lock.json`; Phase-1 dependency work must preserve that exact contract rather than silently changing runner behavior.

## Current-source findings

George is otherwise a clean Phase-1 starting point:

- repository package is `0.1.0`;
- source/application directories are intentionally empty;
- the exact Petri phase runner and runner grammar tests are present;
- Phase 1 has no browser-required work;
- product/architecture docs consistently separate OpenTUI presentation from the reusable agent core;
- P1/P2 boundary is explicit: Phase 1 proves one streamed model turn plus read-only tool infrastructure; Phase 2 owns autonomous tool cycling, arbitrary process execution and writes;
- LM Studio/Qwen provider independence is already locked;
- deterministic tests must not require a live local model;
- live LM Studio/Qwen qualification is a separate evidence layer.

## Prompt decomposition

Phase 1 uses **five implementation prompts plus one evidence-only closeout**.

### P1 — repository/runtime contracts + core event/config foundation

Establish Node 26.4+ runtime enforcement, package/test commands, no-package-lock behavior, configuration model, provider/application event contracts, and basic session representation without UI or live inference. Prove the exact phase-runner tests under Node 26.

### P2 — LM Studio Responses provider

Implement the provider boundary, Responses API request/stream handling, SSE normalization, cancellation/error behavior, deterministic HTTP fixtures, and a separate opt-in live Qwen smoke.

### P3 — workspace context + read-only tools + one-turn application service

Implement workspace selection, root instruction discovery, safe read/list/search/Git status/diff tools, and the bounded one-turn application service. Do not add the autonomous model-tool-result loop.

### P4 — OpenTUI adapter

Build the Codex-style TUI over application events: in-place rendering, persistent input, streamed output, activity/status, scrolling, resize, cancellation and cleanup. Encode `--experimental-ffi` in normal launch paths. Use OpenTUI's test renderer for deterministic presentation/input/lifecycle tests.

### P5 — integrated local qualification + bounded hardening

Exercise exact-source unit/integration/TUI/provider evidence plus the supported LM Studio/Qwen live smoke on the development machine. Record Green / Not Green / Evidence Gap truth and only perform bounded evidence-driven corrections.

### P6 — evidence-only closeout

Audit Phase-1 evidence, reconcile docs/status, bump the final Phase-1 version, and do not add new implementation.

All Phase-1 prompts remain `Browser required: no.`.

## Model recommendation

- P1: Terra High — foundational runtime/contracts and test-command semantics.
- P2: Terra High — streaming provider/protocol and cancellation/error boundaries.
- P3: Terra High — filesystem/Git trust boundaries plus application-service separation.
- P4: Terra High — native TUI lifecycle/input/streaming integration.
- P5: Terra High — integrated qualification and bounded hardening.
- P6: Terra Medium — evidence-only closeout.

## Four stability questions

### 1. User-visible / aggregate behavior at risk

Runtime compatibility, startup reliability, terminal restoration, streaming correctness, event ordering, prompt/instruction content, filesystem scope, read-only tool output, Git working-tree preservation, cancellation latency, context/request size, TUI responsiveness and live-model latency.

### 2. Invariants

One reusable agent/application core independent of OpenTUI; LM Studio-specific behavior stays behind the provider adapter; Phase 1 remains read-only; repository/model text cannot widen permissions; no browser/runtime dependency leaks into the core; deterministic tests do not require LM Studio; live smoke remains a distinct evidence layer; runner version/commit semantics remain intact; no package lock is left behind.

### 3. Integrated-only evidence

Actual native OpenTUI startup/cleanup under Node 26 with FFI enabled, real terminal resize/input/cancellation behavior, LM Studio Responses streaming against the installed Qwen model, and the combined TUI + provider experience cannot be fully established by pure unit tests.

### 4. Comparison baseline

The comparison baseline is George package `0.1.0` and the current bootstrap contracts on `main`. There is no prior George implementation behavior to preserve beyond the exact phase runner and documented architecture/workflow contracts.
