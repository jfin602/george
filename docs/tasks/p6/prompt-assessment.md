# Phase 6 Prompt Assessment

Status: CURRENT IMPLEMENTATION ASSESSMENT

Phase: 6 — Plugins + External Adapters  
Execution folder: `p6`  
Assessment baseline: package `0.6.0`, main `2ccf0ceff2908e334062e851ac4c181989dd5d0f`.

## Assessment conclusion

Proceed as one focused Phase 6 with **seven implementation prompts, one integrated qualification prompt, and one evidence-only closeout**.

Safe order:

1. effect-aware tool/approval/credential foundation;
2. George-native plugin manifest + managed lifecycle;
3. plugin contribution wiring and explicit command surfaces;
4. bounded Parallel Search adapter;
5. bounded GitHub adapter;
6. bounded MCP client/adapter;
7. Chrome DevTools debugging profile over the MCP boundary;
8. integrated Phase-6 qualification and bounded hardening;
9. evidence-only closeout.

This order first strengthens George's authority model, then packages local extensions, then adds external capabilities independently. No adapter is allowed to invent its own permission, retry, persistence, or evidence semantics.

## Current implementation findings

### Tool policy is still local-only

`src/tools/registry.ts` exposes `ToolPermission = 'read' | 'write' | 'process'`.

`src/application/one-turn.ts` treats `read` as automatic and constructs approvals only for workspace writes or host processes. Approval rendering and durable approval sanitization likewise understand those two risky cases.

Phase 6 therefore needs a George-owned normalized effect model before any network/browser adapter lands. The effect model must preserve current local behavior while adding external-read, remote-mutation, browser-observation, browser-interaction, and unknown-external semantics.

The current `ToolRegistry.select()` capability-reducing view is already the correct primitive for token-conscious adapter exposure.

### Durable interruption/recovery is name-special-cased

`LocalSessionStore.classifySessionInterruptions()` currently recognizes interrupted side effects primarily by concrete tool names such as `write_file`, `apply_patch`, and `run_process`.

Phase 6 external tools need safe durable execution metadata so interruption handling does not depend on every future adapter/tool name. External side effects must inherit Phase-5 outcome-unknown/no-blind-replay semantics.

### Skills and hooks are reusable but not plugin-aware

`SkillRegistry` currently knows built-in, user, and workspace roots only. It already has bounded discovery, stable identity, collision reporting, lazy body loading, and explicit activation.

`HookRegistry` already provides George-owned event names, ordering, enable/disable, bounded I/O, process hooks, timeout/cancellation, and failure isolation. Process-backed hooks are routed through the canonical application/process/approval path.

Phase 6 should extend these registries rather than replacing them.

### TUI command surface is narrow

The TUI currently recognizes `/skills` and `/skill <id> <message>` directly.

Plugin lifecycle/commands need an application-owned command registry or equivalent bounded service, with the TUI only parsing/presenting it. Initial plugin commands should remain declarative activation surfaces rather than hidden executors.

### No plugin manager or credential boundary exists yet

There is no managed plugin package root/state file, manifest parser, installer, enabled-state model, external adapter registry, or generic credential resolver.

The user config/state roots already established by earlier phases are the correct place for managed plugin/config state. Executable workspace plugin auto-discovery must not be added.

### Package surface is still small

`package.json` currently depends only on `@opentui/core` at runtime.

Parallel Search and GitHub can use Node's native `fetch`. Chrome should not require a bespoke browser protocol in this phase.

For MCP, the current official TypeScript client is a focused justified dependency: the v2 client line targets the 2026-07-28 protocol generation and supports stdio plus Streamable HTTP. Do not hand-roll the evolving MCP transport/protocol when the official client already owns it.

### Current external protocol baseline checked during planning

As of 2026-09-23:

- Parallel Search is a synchronous web-search API that returns ranked URLs and token-dense excerpts. Keep its base/path injectable for deterministic local HTTP fixtures and bound result count/bytes aggressively.
- GitHub REST is explicitly versioned. Use a single adapter-owned API-version header and native fetch rather than spreading endpoint details throughout the core.
- MCP's current 2026-07-28 protocol generation is stateless at the core and the official TypeScript v2 client supports modern/legacy negotiation. MCP tool schemas may use full JSON Schema 2020-12, which is broader than George's current validator.
- Therefore George must **not** pretend every MCP schema is safely importable. Initial MCP import should accept only schemas that can be translated into George's bounded supported subset; unsupported composition/references fail/skip visibly. Never auto-dereference external `$ref` URIs.
- Chrome now ships first-party Chrome DevTools-for-agents support through `chrome-devtools-mcp`. Reuse Phase-6 MCP rather than build a second custom CDP stack. Do not auto-download/run `npx ...@latest`; require an explicitly installed/configured server command. Connecting to an existing authenticated browser session is high-trust and must remain explicit.

## Prompt decomposition

### P1 / 0.6.1 — external effects, approvals, credentials

Generalize `ToolDefinition` from the local permission enum into George-owned execution metadata containing effect/risk, replay-safety, source identity, and a bounded safe operation description.

Preserve exact current local defaults:
- local read: allow;
- workspace write: ask;
- host process: ask.

Initial Phase-6 defaults:
- external/network read: ask;
- remote mutation: ask;
- browser observe: ask;
- browser interact: ask;
- unknown external: ask with conservative warning.

Add generic approval metadata/rendering and bounded durable tool execution descriptors. Generalize interruption classification so external side effects can remain outcome-unknown without hard-coded adapter names.

Add a small credential resolver boundary. Secret values are executor-only and cannot enter tool schemas, approval/work text, normalized events, diagnostics, or errors.

Do not add plugins or live adapters yet.

### P2 / 0.6.2 — plugin manifest and lifecycle

Add a versioned bounded `george-plugin.json` parser and a George-owned PluginManager.

Implement explicit install/list/enable/disable/uninstall under George user state/config. Install from an explicit local directory only. Validate before publication, reject traversal/symlinks and unsafe/oversized package trees, use atomic staging/publish, execute no lifecycle code, and never auto-enable.

Track a capability fingerprint so replacing an enabled plugin with materially new executable contributions cannot silently retain execution enablement.

Do not wire contributions into the live agent yet.

### P3 / 0.6.3 — plugin contributions and commands

Load enabled plugin skills through the existing lazy skill substrate with namespaced identity.

Translate plugin process hooks into the existing HookRegistry.

Translate plugin executable tools into canonical ToolRegistry registrations using a bounded JSON-stdin/JSON-stdout process protocol. Third-party executable plugin tools are always conservatively host-process/unknown-external authority from George's perspective; manifest metadata cannot self-downgrade them.

Add an application-owned command registry. Initial plugin commands may activate a declared plugin skill/workflow. Add TUI lifecycle/catalog command surfaces without moving business logic into OpenTUI.

### P4 / 0.6.4 — Parallel Search

Add one smallest-useful `parallel_search` network-read tool using native fetch.

Credential: explicit resolver reference/default `PARALLEL_API_KEY`. Keep base URL/path injectable. Bound objective/query count/result count/excerpt bytes/whole response/time. Normalize URL/title/excerpts/source metadata. Treat all result text as untrusted data.

No page crawler, Extract orchestration, Task API, Chat API, SearXNG, or utility model.

### P5 / 0.6.5 — GitHub

Add a narrow native-fetch GitHub REST adapter rather than replacing local Git.

Initial read capabilities should cover repository file/content lookup plus issue/PR inspection sufficient for coding workflows. Add one clearly remote-mutating operation such as creating an issue comment so approval/non-replay semantics are actually exercised.

Use explicit REST API versioning, bounded pagination/results/body sizes, executor-only token resolution, and test-injectable API base URL.

### P6 / 0.6.6 — MCP

Add the official `@modelcontextprotocol/client` v2 dependency and a George MCP adapter for explicit user-global server configuration.

Support attached stdio and Streamable HTTP. Use current protocol negotiation via the SDK rather than hand-rolled wire logic.

Discover/list tools with hard count/schema/name/description bounds and explicit allowlists. Import only schemas safely representable by George's validator; unsupported JSON Schema features become visible catalog issues, not silently weakened validation.

Namespace imported tools. Ignore server risk/read-only annotations for authority. Unknown tools default to conservative external effect. Resources/prompts/tasks/MRTR are not required for the initial tool adapter.

### P7 / 0.6.7 — Chrome DevTools debugging

Build a first-class browser-debugging profile over the Phase-6 MCP adapter and an explicitly configured `chrome-devtools-mcp` server.

Do not auto-download packages and do not automatically attach to a personal browser profile.

Expose a curated useful debugging subset: page/list/snapshot/console/network inspection plus minimal navigation/interaction needed to reproduce bugs. Classify observation separately from interaction. Keep screenshots/DOM/network payloads bounded. Do not expose cookies/storage/auth headers by default.

Chrome-specific policy/profile code may map known first-party DevTools tool names to George browser effects; unknown/experimental/third-party tools remain excluded unless explicitly allowed.

### P8 / 0.6.8 — integrated qualification

Build deterministic plugin and local stub-service fixtures covering P1-P7, plus conditional live Parallel/GitHub/MCP/Chrome evidence when configured.

Stress schema bounds, secrets redaction, hostile remote text, adapter disablement, unknown MCP effects, ambiguous mutation interruption, process cleanup, token-conscious tool selection, and inherited Phase-2-5 regressions.

Allow bounded evidence-driven corrections with permanent regression tests.

### P9 / 0.6.9 — evidence-only closeout

Audit P8 evidence and write the formal Phase-6 closeout truth.

Do not repair implementation, owner-close Phase 6, or move BOOT/roadmap to Phase 7.

## Model selection

- P1-P8: **Terra High**
- P9: **Terra Medium**

All prompts use `Browser required: no.`

Chrome live qualification is an external-adapter/runtime evidence layer, not a manual browser-runner handoff. If an explicitly configured browser target/server is unavailable, record Evidence Gap.

## Four stability questions

### 1. User-visible / aggregate quantities at risk

Advertised tool count/schema bytes, approval count/type, plugin count/enabled state, installed package bytes/files, external request count/duration/response bytes, Parallel result count, GitHub pagination/body size, MCP imported/skipped tool counts, Chrome tool count/browser payload bytes, credential-configured state, external interruption/outcome-unknown count, and provider-facing context size.

### 2. Invariants

Phase-2 schema/permission/workspace/process/Git safeguards remain intact; Phase-3 context/skill laziness remains intact; Phase-4 canonical session/workflow evidence remains authoritative; Phase-5 retry/recovery/hook/diagnostic laws remain intact; no repository or remote content can install/enable/elevate executable authority; secrets stay executor-only; external side effects are not blindly replayed; TUI/provider adapters remain non-authoritative.

### 3. Integrated-only evidence

Real plugin process contribution execution, attached MCP child lifecycle, remote HTTP cancellation/timeouts, ambiguous remote mutation handling, Chrome authenticated-session risk, provider-facing tool-schema growth, and conditional live service compatibility cannot be established from isolated parser tests alone.

### 4. Comparison baseline

Package `0.6.0` at main `2ccf0ceff2908e334062e851ac4c181989dd5d0f`. Preserve all owner-accepted Phase-1-5 behavior/evidence truth except where Phase 6 explicitly extends extension packaging and external capability policy.
