# Phase 1 Prompt Assessment

Status: PLANNING NEEDED

Phase: 1 — Local Agent Foundation + TUI  
Execution folder: `p1`  
Assessment baseline: package `0.1.0`.

## Assessment conclusion

Do not proceed to `/prompt-plan` or `/prompt-write p1` yet.

The current repository contains one material runtime incompatibility between two locked Phase-1 decisions:

- George is locked to Node.js 24 (`package.json` requires `>=24.10.0 <25`);
- George is locked to current `@opentui/core` for the initial native TUI.

Current OpenTUI runtime support requires Node.js 26.4.0 or later for the Node host, with ESM and `--experimental-ffi`. Its supported alternative host is Bun 1.3.0 or later.

That means the currently approved Node-24 + current-OpenTUI Phase-1 plan cannot truthfully execute as written.

This is a material architecture/runtime gate under `docs/workflow.md`, not bookkeeping. Generating implementation prompts before resolving it would force the implementation agent to silently violate either the runtime contract or the TUI contract.

## Recommended resolution

Prefer upgrading George's runtime contract to **Node.js 26.4.0 or later** while preserving:
- TypeScript + ESM;
- `@opentui/core` directly, without React;
- the reusable agent/application core;
- LM Studio Responses API;
- the exact Petri phase runner;
- the later Tauri/daemon direction.

This is simpler than introducing Bun as a second production runtime solely for the TUI adapter and keeps George on one JavaScript runtime.

If the owner instead wants to retain Node 24, re-plan the presentation layer before Phase 1. Do not pin an old OpenTUI release merely to evade the current runtime contract without an explicit compatibility decision and qualification plan.

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

## Proposed decomposition after the runtime gate is resolved

The expected Phase-1 size remains reasonable: **five implementation prompts plus one evidence-only closeout**.

### P1 — repository/runtime contracts + core event/config foundation

Establish the accepted runtime, package/test commands, configuration model, provider/application event contracts, and basic session representation without UI or live inference.

### P2 — LM Studio Responses provider

Implement the provider boundary, Responses API request/stream handling, SSE normalization, cancellation/error behavior, deterministic HTTP fixtures, and a separate opt-in live Qwen smoke.

### P3 — workspace context + read-only tools + one-turn application service

Implement workspace selection, root instruction discovery, safe read/list/search/Git status/diff tools, and the bounded one-turn application service. Do not add the autonomous model-tool-result loop.

### P4 — OpenTUI adapter

Build the Codex-style TUI over application events: in-place rendering, persistent input, streamed output, activity/status, scrolling, resize, cancellation and cleanup. Use OpenTUI's test renderer for deterministic presentation/input/lifecycle tests.

### P5 — integrated local qualification + bounded hardening

Exercise exact-source unit/integration/TUI/provider evidence plus the supported LM Studio/Qwen live smoke on the development machine. Record Green / Not Green / Evidence Gap truth and only perform bounded evidence-driven corrections.

### P6 — evidence-only closeout

Audit Phase-1 evidence, reconcile docs/status, bump the final Phase-1 version, and do not add new implementation.

All Phase-1 prompts remain `Browser required: no.`.

## Model recommendation after gate resolution

- P1: Terra High — foundational contracts and test-command semantics.
- P2: Terra High — streaming provider/protocol and cancellation/error boundaries.
- P3: Terra High — filesystem/Git trust boundaries plus application-service separation.
- P4: Terra High — native TUI lifecycle/input/streaming integration.
- P5: Terra High — integrated qualification and bounded hardening.
- P6: Terra Medium — evidence-only closeout.

## Four stability questions

### 1. User-visible / aggregate behavior at risk

Runtime compatibility, startup reliability, terminal restoration, streaming correctness, event ordering, prompt/instruction content, filesystem scope, read-only tool output, Git working-tree preservation, cancellation latency, context/request size, TUI responsiveness and live-model latency.

### 2. Invariants

One reusable agent/application core independent of OpenTUI; LM Studio-specific behavior stays behind the provider adapter; Phase 1 remains read-only; repository/model text cannot widen permissions; no browser/runtime dependency leaks into the core; deterministic tests do not require LM Studio; live smoke remains a distinct evidence layer; runner version/commit semantics remain intact.

### 3. Integrated-only evidence

Actual native OpenTUI startup/cleanup under the selected runtime, real terminal resize/input/cancellation behavior, LM Studio Responses streaming against the installed Qwen model, and the combined TUI + provider experience cannot be fully established by pure unit tests.

### 4. Comparison baseline

The comparison baseline is George package `0.1.0` and the current bootstrap contracts on `main`. There is no prior George implementation behavior to preserve beyond the exact phase runner and documented architecture/workflow contracts.

## Required owner decision

Choose one before planning continues:

1. **Recommended:** move George from Node 24 to Node.js 26.4+ and keep current OpenTUI.
2. Keep Node 24 and reconsider the TUI runtime/library architecture.

After that decision, rerun `/docs-review -> /docs-apply` for the runtime contract if needed, then continue `/prompt-plan -> /prompt-write p1`.
