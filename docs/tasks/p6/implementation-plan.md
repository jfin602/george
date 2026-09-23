# Phase 6 Implementation Plan

Status: CURRENT IMPLEMENTATION PLAN

Phase: 6 — Plugins + External Adapters  
Execution folder: `p6`  
Baseline: package `0.6.0`, main `2ccf0ceff2908e334062e851ac4c181989dd5d0f`.

Read with `BOOT.md`, `AGENTS.md`, current product/architecture/workflow/stability/roadmap contracts, `docs/planning/p6-plugins-external-adapters/decision-record.md`, and `docs/tasks/p6/prompt-assessment.md`.

## Target architecture

```text
OpenTUI
   |
application / agent loop
   |
   +---------------- ToolRegistry ----------------+
   |                       |                      |
local tools          plugin tools         external adapters
                         |                  |  |  |  |
                    bounded process       Parallel GitHub MCP
                                               |
                                      Chrome DevTools profile
   |
George-owned effect / approval / retry-evidence policy
   |
canonical events + durable sanitized session evidence

user config/state
   |
   +-- managed plugins
   +-- enabled state
   +-- external/MCP configuration
   +-- credential references (never secret copies)
```

No plugin/adapter becomes a second execution loop. Provider-facing tools remain a capability-reducing view of the same canonical registry.

## P1 — effect-aware execution foundation

Target: `0.6.1`.

Introduce a normalized `ToolEffect` or equivalent with at least:
- local read;
- workspace mutation;
- host process;
- external/network read;
- remote mutation;
- browser observation;
- browser interaction;
- unknown external.

Add explicit replay-safety metadata and source identity (`builtin`, plugin identity, adapter/server identity) to executable tool registrations.

Preserve provider tool definitions as name/description/schema only unless safe bounded metadata is intentionally surfaced; model text must not decide policy.

Generalize approval construction to use effect metadata and a bounded safe operation description. External approvals should be able to show service/origin/resource/operation/credential-configured state without raw payloads or secrets.

Default policy remains allow for local reads and ask for all currently supported mutating/process/external effects. Destructive filesystem behavior remains unavailable.

Extend TUI approval rendering generically while preserving existing write/process UX.

Add sanitized durable execution metadata sufficient for interruption classification. Generalize recovery interruption classification away from only concrete built-in tool names; interrupted external side effects remain explicit and are never blindly replayed.

Add a credential resolver interface plus environment-backed implementation suitable for later built-in adapters. Resolver errors/status must never echo secret values.

Regression focus: current read/write/process behavior, Phase-5 recovery, session sanitization, approval cancellation, work projection, TUI approval rendering.

## P2 — plugin package and managed lifecycle

Target: `0.6.2`.

Create a `src/plugins/` package boundary.

Manifest v1 should be deliberately small:
- manifestVersion;
- plugin id;
- plugin version;
- optional skills;
- optional process hooks;
- optional declarative commands;
- optional process-backed tools.

All paths are package-relative. IDs/names are bounded safe identifiers. Tool schemas use George's existing supported schema subset.

Plugin storage belongs under George-owned user state/config, not the target workspace.

Install flow:
1. resolve explicit source directory;
2. reject source symlink/root escape;
3. inspect bounded tree without executing code;
4. reject symlinks/special files and unsafe paths;
5. validate manifest + referenced files;
6. compute deterministic executable-capability fingerprint;
7. copy into a private staging directory;
8. atomically publish to managed plugin root;
9. record installed-but-disabled state.

Enable/disable/list/uninstall are explicit manager operations. Uninstall touches only the managed plugin directory.

If an enabled plugin is replaced and executable capability fingerprint changes, require disabled/re-enable state rather than silently carrying trust forward.

No npm registry/marketplace/download/update/lifecycle scripts.

## P3 — contribution wiring and command surfaces

Target: `0.6.3`.

Extend SkillRegistry to accept enabled plugin skill roots with stable namespaced IDs such as `plugin:<plugin-id>:<skill>`. Plugin skills remain lazy and bounded.

Translate plugin process hooks into HookRegistry registrations with namespaced IDs. Plugin manifests cannot create in-process hooks.

For process-backed plugin tools:
- register namespaced canonical tools;
- always retain George-owned conservative process/external effect regardless of manifest hints;
- execute through a bounded attached process protocol;
- JSON object tool arguments enter via stdin;
- stdout must be one bounded normalized JSON result;
- stderr remains bounded diagnostic/process evidence and not model payload by default;
- cancellation/timeout/cleanup use the existing process executor behavior;
- no shell interpolation by default.

Add an application-owned command registry. Initial plugin commands should map to explicit plugin skill/workflow activation, not arbitrary executable text.

Add TUI surfaces such as:
- `/plugins`;
- `/plugin install <path>`;
- `/plugin enable <id>`;
- `/plugin disable <id>`;
- `/plugin uninstall <id>`;
- `/commands`;
- `/command <plugin:command> <message>`.

Exact presentation may vary, but business logic stays outside OpenTUI.

## P4 — Parallel Search adapter

Target: `0.6.4`.

Implement a built-in adapter/tool with native `fetch`.

Use a test-injectable base URL/path. Product defaults should be centralized and current at implementation time; planning verified the Search API as the intended synchronous endpoint.

Credential lookup uses the P1 resolver and defaults to the `PARALLEL_API_KEY` reference.

Tool input should be intentionally bounded, for example:
- required objective;
- optional bounded search query list;
- small max result count within George limits.

Adapter-level bounds:
- timeout/cancellation;
- total response bytes;
- per-result excerpt bytes;
- result count;
- URL/title lengths;
- no redirects or response behavior that leaks credentials to unrelated origins.

Normalize results into bounded source records. Result/page text is untrusted data, never instructions.

Effect: external/network read. No internal hidden retries beyond shared Phase-5 replay-safe policy.

No Extract/Task/Chat API, crawler, browser fallback, SearXNG, or utility model.

## P5 — GitHub REST adapter

Target: `0.6.5`.

Use native `fetch`, a single centralized explicit GitHub REST API version header, and a test-injectable API root.

Credential reference defaults to `GITHUB_TOKEN` or a George-specific equivalent chosen consistently; never persist/copy the token.

Implement the smallest coding-agent useful set:
- repository file/content read;
- issue read;
- pull-request list/get read;
- one remote mutation, preferably create issue comment.

Bound repository/name/path/body sizes, pagination, result counts, response bytes, redirects, timeouts, and error text.

Reads are external-read effects; comment creation is remote mutation and must require approval. Mutation result ambiguity must remain outcome-unknown/non-replay-safe rather than auto-posting twice.

GitHub remote tools do not replace or change local Git status/diff/user-work preservation.

## P6 — MCP client/adapter

Target: `0.6.6`.

Add focused runtime dependency `@modelcontextprotocol/client` v2. Keep the repository's no-`package-lock.json` invariant; validation installs must use no-lock behavior if dependency installation is needed.

Create user-global MCP configuration under George config/state only. Workspace/repository files cannot register servers.

Support:
- attached stdio servers with explicit executable/argv/cwd/env allowlist;
- Streamable HTTP servers with explicit endpoint and bounded headers/credential references;
- SDK protocol negotiation compatible with the current 2026-07-28 generation and supported legacy servers;
- bounded connect/list/call/close lifecycle.

Discovery:
- hard server/tool count;
- hard tool name/description/schema bytes/depth;
- explicit per-server allowlist;
- deterministic namespaced George tool name;
- collision handling;
- cache/catalog state only as derived bounded data.

Schema translation accepts only the subset George can validate faithfully. Reject/skip unsupported composition, conditionals, external/internal refs, or other features unless explicitly implemented with equivalent validation. Never weaken schema constraints to make a tool importable.

Ignore MCP read-only/destructive/idempotent annotations as authority. Unknown imported tools default to conservative external effect. Optional George-owned user configuration may classify a known tool more specifically, but remote metadata cannot.

Initial scope is tools only. Prompts/resources/tasks/MRTR/listen subscriptions are deferred unless strictly required by the selected SDK path.

Cancellation must close/abort requests; stdio child ownership remains attached. No detached MCP process.

## P7 — Chrome DevTools debugging profile

Target: `0.6.7`.

Reuse P6 MCP. Do not create a second CDP transport/client stack.

Support an explicitly configured installed `chrome-devtools-mcp` server profile. Do not auto-download `@latest` with `npx -y`.

Default to a dedicated/debug profile configuration. Connecting to an existing authenticated browser must be an explicit user choice and the approval warning must explain that the server can access logged-in browser data.

Curate only a debugging-focused subset. Known read/observe operations can map to browser-observation; navigation/click/fill/script execution and similar state changes map to browser-interaction. Unknown/experimental/third-party tools remain excluded unless explicitly user-allowed and conservatively classified.

Keep DOM snapshots, console/network entries, screenshots, traces, and script results bounded. Do not automatically surface cookies, local/session storage, authorization headers, or credential-bearing request data.

Do not enable Chrome DevTools experimental third-party/WebMCP/extension-control features by default.

TUI/application presentation should make browser target/profile and observation-vs-interaction approval clear without becoming browser authority.

## P8 — integrated Phase 6 qualification

Target: `0.6.8`.

Build deterministic fixtures:
- plugin package fixture with skill, process hook, process tool, command;
- malicious/oversized/symlink plugin fixtures;
- local stub Parallel HTTP service;
- local stub GitHub REST service including ambiguous mutation case;
- MCP fixture servers over stdio and local Streamable HTTP, including unsupported schemas and hostile metadata;
- Chrome-profile fixture over MCP with observe/interact/secret-like payload cases.

Integrated workflow must prove enabled capabilities join one canonical ToolRegistry and that tool selection remains bounded.

Exercise:
- every effect class and approval path;
- cancellation/timeouts;
- external interruption/outcome unknown;
- no blind remote replay;
- credential redaction;
- hostile remote text/instructions;
- plugin replacement fingerprint/re-enable behavior;
- plugin failure isolation;
- MCP namespacing/allowlist/schema rejection/count limits;
- adapter disable/unavailable paths;
- TUI plugin/command/external approval presentation;
- Phase-2 through Phase-5 broad regression floor;
- provider-facing tool/context growth characterization.

Conditional live evidence:
- Parallel if an explicit test credential is configured;
- GitHub preferably read-only unless a dedicated disposable mutation target is explicitly configured;
- MCP against one explicitly configured external server if available;
- Chrome against an explicitly configured installed Chrome DevTools MCP server/debug target.

Missing live dependencies are Evidence Gap, not deterministic failure.

Permit at most two substantial evidence-driven correction cycles; every correction adds permanent regression coverage.

Create `docs/tasks/p6/P8-qualification-evidence.md`.

## P9 — Phase 6 closeout

Target: `0.6.9`.

Evidence-only audit of P8 candidate/evidence.

Create/update `docs/phase-6-closeout.md` with Implementation Complete / Stability Qualified state and per-layer Green / Not Green / Evidence Gap truth.

Do not repair implementation, owner-close Phase 6, or move BOOT/roadmap to Phase 7.

## Validation policy

Every implementation prompt:
- focused unit/integration coverage for its new boundary;
- broader affected Phase-2-5 regression coverage;
- `npm run typecheck`;
- `npm test`;
- `npm run test:runner`;
- `git diff --check`;
- explicit no-`package-lock.json`.

Network/browser live checks remain conditional and separately classified.
