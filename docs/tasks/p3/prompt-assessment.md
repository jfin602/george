# Phase 3 Prompt Assessment — Coding Workflow

Status: IMPLEMENTATION DECOMPOSITION  
Baseline: package `0.3.0` at `831d371d21c4527a7f70beddc6afb6e704e2add3`

## Objective

Phase 3 must turn the owner-closed Phase-2 safe tool loop into a useful bounded coding workflow while preserving the existing provider, tool, permission, process, Git, TUI, and evidence boundaries.

The approved authority is `docs/planning/p3-coding-workflow/decision-record.md`.

The shortest safe path is not one broad rewrite. The current source has a good Phase-2 loop and tool surface, but Phase-3 responsibilities are still absent and should be introduced as independent, testable layers before they are wired together.

## Current source findings

### Application loop

`src/application/one-turn.ts` is now the canonical bounded model -> tool -> result -> model loop.

It currently owns:
- provider request construction;
- raw repository instruction loading;
- transcript formatting;
- tool validation/dispatch;
- approval requests;
- loop ceilings;
- normalized event emission.

It should remain the canonical loop, but Phase 3 should extract context/session/coding-evidence responsibilities behind reusable core/application services rather than expanding this file into a monolith.

### Context bootstrap

`src/core/workspace.ts` currently discovers only root `BOOT.md` and `AGENTS.md`, reads them under a shared raw byte ceiling, and may return truncated text.

`src/application/one-turn.ts` immediately concatenates those bodies behind George-owned instructions.

This is explicitly a bootstrap behavior and is the first Phase-3 replacement target.

There is currently no:
- source trust/precedence model;
- user-global instruction source;
- personality source;
- `.george/instructions.md`;
- routed project-document catalog;
- provider-facing token estimate;
- explicit omit/defer behavior;
- context diagnostics event.

### Configuration

`src/core/config.ts` currently resolves only:
- workspace;
- loopback provider base URL;
- optional model ID.

Phase 3 needs platform-aware config/state roots and optional instruction/personality inputs without making those files mandatory.

The existing loopback-provider restriction and provider-independent core boundary must remain unchanged.

### Skills

No skill registry exists.

The first implementation should remain declarative:
- discover metadata cheaply;
- support portable `SKILL.md`;
- load full bodies only on explicit activation;
- keep activation scoped to one user turn;
- never register executors or widen permission policy from skill text.

A generalized plugin/command framework is not needed in Phase 3.

### Sessions

`src/core/session.ts` is in-memory only and derives transcript entries from normalized events.

This is a good basis for durable reconstruction, but persistence needs a separate store contract.

Durable storage must not blindly serialize the entire in-memory event object graph. Read results, write contents, process arguments/output, repository text, and model-visible material may contain sensitive project data. Persistence should store only the durable evidence needed for reconstruction/diagnosis, with explicit bounded/sanitized records.

### Tool/process reuse

Phase 2 already provides the correct execution boundary.

`src/tools/process.ts` has:
- literal executable/argv;
- `shell: false`;
- workspace-bounded cwd;
- sanitized inherited environment;
- bounded stdout/stderr;
- timeout/cancellation;
- descendant cleanup;
- truthful non-sandbox semantics.

Validation must delegate to this implementation and use the same `process` permission class/approval path.

A small `run_validation` tool identity is justified so validation evidence can be classified structurally without guessing from command names. It must share the process implementation rather than fork it.

### Git/change evidence

`captureGitWorkingTreeSnapshot` already provides read-only machine-readable dirty-state evidence.

Phase 3 can build changed-file accounting from:
- a run/turn-start snapshot;
- direct George-native write/patch results;
- a final snapshot;
- explicit uncertainty for arbitrary child-process changes.

Do not add mutating Git.

Do not claim causal attribution where only before/after observation exists.

### TUI

`src/tui/app.ts` remains a presentation-only adapter and currently:
- constructs a fresh in-memory session itself;
- renders transcript/activity/approvals;
- owns no agent/tool policy.

Phase 3 should preserve that boundary.

The minimal new TUI surfaces are:
- accept an already-created/new/resumed session;
- display the session ID;
- `/skills` for compact discovered metadata;
- `/skill <name> <task>` for one-turn explicit activation;
- visible context-size/source diagnostics;
- visible structured completion/change/validation summary.

A generalized command registry is deferred.

### Provider

`ProviderRequest` already cleanly carries normalized `instructions`, `input`, tools, and continuation data.

Phase 3 should keep the provider interface provider-independent. Context assembly may continue producing these normalized strings while separately retaining structured source/size diagnostics.

LM Studio-specific protocol changes should be unnecessary unless actual request behavior requires a narrow adjustment.

## Preserved behavior

Every Phase-3 prompt must preserve:

- Node >=26.4.0 <27, TypeScript, ESM;
- OpenTUI direct use with `--experimental-ffi`;
- provider-independent core/application contracts;
- LM Studio/Qwen details behind the provider adapter;
- canonical ToolRegistry validation-before-execution;
- per-call allow-once/deny for writes/processes;
- no network-native tools;
- no outside-workspace native filesystem access;
- no destructive delete tool;
- write/patch atomicity and preconditions;
- process literal argv, sanitized environment, bounded output, timeout/cancellation and cleanup;
- truthful non-sandbox process warning;
- pre-existing Git work preservation;
- no reset/clean/stash/checkout or general mutating Git;
- deterministic tests as primary qualification evidence;
- native/live evidence classified separately;
- exact phase runner and no-`package-lock.json` contract.

## Decomposition

### P1 — Context foundation

Build the provider-independent context source/discovery/budget layer without replacing the live loop yet.

This prompt owns:
- source types and trust/priority metadata;
- platform-aware user config discovery;
- optional user-global instructions/personality;
- workspace `.george/instructions.md`;
- root `BOOT.md` / `AGENTS.md`;
- bounded routed-project-document catalog and explicit selected-route loading;
- deterministic duplicate handling;
- token-oriented estimation and budget decisions;
- no-silent-critical-truncation behavior;
- independent tests.

### P2 — Loop context integration

Replace raw instruction concatenation in the canonical application loop.

This prompt owns:
- assembled provider request context;
- current-user intent and transcript integration;
- selected routed context;
- context diagnostics events;
- estimated provider-facing size;
- provider-reported actual usage preservation;
- regression coverage that all Phase-2 tool/approval behavior is unchanged.

### P3 — Skills

Add portable skill discovery and explicit activation after the context layer is stable.

This prompt owns:
- built-in/user/workspace sources;
- bounded frontmatter metadata discovery;
- stable qualified identity;
- visible collisions;
- lazy body loading;
- turn-scoped activation;
- application API for catalog/activation;
- context integration;
- no authority expansion.

### P4 — Durable sessions

Make normalized history durable before Phase-3 completion evidence depends on it.

This prompt owns:
- schema-versioned filesystem store;
- platform-aware user state root;
- canonical workspace binding;
- safe event persistence;
- reconstruction;
- interrupted-turn detection;
- non-replay resume;
- malformed/partial-state behavior;
- no raw environment/tool-content dumps.

### P5 — Coding evidence + validation + completion

Build structured coding-run evidence on the stable session/event substrate.

This prompt owns:
- start/final Git snapshots when available;
- direct George mutation tracking;
- observed/pre-existing/new/uncertain change classification;
- `run_validation` delegating to the exact process implementation;
- normal process approval semantics;
- structured validation attempts;
- structured completion result/event;
- non-Git degradation;
- no attribution overclaim.

### P6 — TUI/CLI integration

Make the new Phase-3 capabilities usable without moving policy into OpenTUI.

This prompt owns:
- new/resumed session injection;
- CLI `--resume <session-id>`;
- session ID/status display;
- `/skills`;
- `/skill <name> <task>`;
- context diagnostics rendering;
- completion/change/validation rendering;
- preservation of draft, approval, resize, Ctrl+C, scrollback, and terminal cleanup.

### P7 — Integrated qualification

Exercise the exact candidate through one disposable-repository workflow and all focused deterministic layers.

This is the bounded hardening prompt.

### P8 — Closeout

Evidence-only Phase-3 closeout. No feature repair or Phase-4 transition.

## Prompt count rationale

Eight prompts is appropriate.

Combining P1/P2 would mix context policy design with live-loop migration, making regressions harder to localize.

Combining skills with context foundation would make collision/lazy-loading failures harder to separate from instruction precedence/budget failures.

Combining persistence with coding evidence would create too many failure modes around interruption and final-state reporting.

TUI integration should happen only after the underlying application APIs are deterministic.

Qualification and closeout remain separate because evidence collection is allowed bounded repairs while closeout must be evidence-only.

## Risk register

### Context precedence mistakes

Risk: lower-trust repository/personality/skill text accidentally behaves as authority.

Mitigation: source metadata + deterministic tests + keep executable policy entirely outside context assembly.

### Silent truncation

Risk: a partial critical instruction is treated as complete.

Mitigation: whole-source admission for required critical sources; explicit omitted/deferred diagnostics for optional material.

### Token estimate false precision

Risk: a heuristic estimate is presented as exact model token usage.

Mitigation: label estimates as estimated; keep provider-reported actual usage separate.

### Skill eager loading

Risk: installed skills consume context every turn.

Mitigation: metadata-only discovery; full body read only during explicit activation.

### Resume duplicate side effects

Risk: reopening a session replays an incomplete write/process/approval/provider continuation.

Mitigation: persist lifecycle evidence before side effects; detect incomplete turns; append/record interrupted state; new turn only.

### Durable secret leakage

Risk: serializing generic in-memory events stores repository contents, raw tool arguments, environment-derived output, or other sensitive payloads.

Mitigation: explicit durable-record schema and sanitizer; persist identity/status/evidence, not arbitrary raw provider/tool bodies. Do not claim semantic secret detection.

### Validation privilege bypass

Risk: validation gains a second execution path without process approval/cleanup restrictions.

Mitigation: `run_validation` is only a distinct tool identity; it delegates to the exact process executor and keeps permission class `process`.

### Change attribution overclaim

Risk: arbitrary processes modify files and George labels them as direct George writes.

Mitigation: separate direct native mutation paths from before/after observed state and mark process attribution unknown.

### TUI architecture drift

Risk: slash-command parsing begins owning core skill/session rules.

Mitigation: TUI only parses presentation commands and calls application/core APIs; registry, resolution, session, context, and permission decisions stay outside OpenTUI.

## Evidence strategy

Each implementation prompt adds focused deterministic tests at the lowest reliable layer.

P7 must run:
- phase-runner tests;
- context tests;
- skill tests;
- session persistence/resume tests;
- provider tests;
- tool/process/mutation tests;
- coding-workflow integration;
- TUI test-renderer tests;
- architecture-boundary tests;
- typecheck;
- broad `npm run check`;
- `git diff --check`;
- no-`package-lock.json` check.

Live LM Studio/Qwen and genuine native-terminal evidence are supplementary and remain Green / Not Green / Evidence Gap independently.
