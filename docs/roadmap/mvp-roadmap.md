# George MVP Roadmap

Status: CURRENT ROADMAP — PHASE 4 OWNER-CLOSED; PHASE 5 CURRENT

The roadmap deliberately proves the provider, read-only tool foundation, real interactive terminal surface, and safe autonomous tool execution before broader coding workflow, networking, or a desktop GUI.

## Phase 1 — Local Agent Foundation + TUI

Status: OWNER-CLOSED WITH ACCEPTED NATIVE-TERMINAL / LIVE-MODEL EVIDENCE GAPS

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

Status: OWNER-CLOSED WITH ACCEPTED NATIVE-TERMINAL / LIVE-MODEL EVIDENCE GAPS

Goal: turn the Phase 1 one-turn foundation into a bounded, permission-controlled autonomous tool loop without prematurely building the complete coding workflow.

Decision authority: `docs/planning/p2-safe-tool-loop/decision-record.md`.  
Formal evidence: `docs/phase-2-closeout.md`.  
Owner closeout: `docs/phase-2-owner-closeout.md`.

Scope:
- evolve the provider/core contract so George can advertise typed tool schemas and submit structured tool results/continuations;
- canonical tool registry with stable name, description, input schema, risk/permission class, executor, and normalized result/error shape;
- migrate Phase 1 read-only tools through the canonical registry;
- autonomous model -> tool -> result -> model loop owned by George;
- unknown-tool, JSON-parse, and schema validation before executor invocation;
- sequential tool execution in model order;
- simple configurable hard ceiling on tool rounds/calls;
- structured tool lifecycle and approval events;
- minimum permission policy:
  - read-only workspace tools allowed;
  - workspace writes/patches ask;
  - arbitrary process execution asks;
  - destructive filesystem actions denied/deferred;
  - outside-workspace native filesystem access denied;
  - network-native tools unavailable;
- TUI approval presentation with allow-once/deny behavior and cancellation while waiting;
- bounded workspace-native `write_file` / patch behavior with traversal and symlink-escape protection, bounded input, safe/preconditioned application, and no silent partial patching;
- arbitrary process execution using explicit executable/argument arrays, `shell: false` by default, workspace-bounded `cwd`, closed stdin, bounded output, timeout/cancellation, exit/signal capture, sanitized environment inheritance, and best-effort descendant cleanup;
- truthful process trust boundary: approved arbitrary child processes are not an OS sandbox and may exercise host-user privileges;
- capture/preserve pre-existing Git dirty state; no reset/clean/stash/checkout behavior and no general mutating Git toolset;
- recoverable tool failures/permission denials represented as structured loop results where semantics permit;
- fixture-repository integration tests for read/write/process/permission/tool-loop behavior;
- bounded live LM Studio/Qwen tool-cycle qualification when the supported local setup is available;
- native-terminal approval/tool lifecycle qualification when a genuine usable TTY is available;
- evidence gaps remain evidence gaps rather than being inferred Green.

Success condition:
- a deterministic fixture can drive George through multiple model/tool rounds to a final answer;
- tool calls are schema-validated and permission-gated;
- approved writes/processes run within George's documented controls;
- denial, malformed calls, timeout, cancellation, tool failure, and loop exhaustion terminate or recover predictably;
- pre-existing user changes remain intact;
- no unrestricted environment dump or silent orphaned process is introduced;
- the TUI remains an adapter over reusable application/core behavior.

Non-goals:
- delete/rm-style destructive filesystem tools;
- remembered approval profiles;
- OS/container sandboxing;
- general mutating Git operations;
- comprehensive changed-file tracking/final summaries;
- validation-command orchestration;
- context budgeting/compaction;
- durable session resume/recovery;
- retries/backoff for long autonomous jobs;
- browser/web/network tools;
- MCP/GitHub/Parallel adapters;
- daemon/server mode;
- Tauri;
- multi-agent scheduling.

## Phase 3 — Context + Skills

Status: OWNER-CLOSED WITH ACCEPTED NATIVE-TERMINAL / LIVE-MODEL EVIDENCE GAPS

Goal: give George a deterministic, token-conscious, provider-independent context and declarative-skill substrate without weakening the Phase 2 tool/permission boundary.

Decision authority: `docs/planning/p3-context-skills/decision-record.md`.  
Formal evidence: `docs/phase-3-closeout.md`.  
Owner closeout: `docs/phase-3-owner-closeout.md`.

Scope:
- provider-independent deterministic context assembly rather than raw instruction concatenation;
- compact George-owned model instructions, keeping code-enforced policy out of prompt text where practical;
- optional user-global instructions and small user-owned personality loading;
- George-native workspace instructions via `.george/instructions.md`;
- compatible root `AGENTS.md` / `BOOT.md` discovery, with routing documents used to identify just-in-time project knowledge rather than injecting every referenced document permanently;
- explicit trust/precedence across George invariants, current user intent, workspace/project guidance, user-global defaults, and personality;
- stable source identity/order and deterministic duplicate suppression where possible;
- token-oriented provider-facing context budgets with observable estimated size and actual provider usage when reported;
- provider-independent context profiles so model/quant/runtime-specific operating limits do not leak into the core;
- initial qualification profile for Qwen3-Coder-30B-A3B-Instruct Q4_K_M through LM Studio: 32,768-token physical target, ~12k-18k ordinary working set, ~20k soft pressure, 24,576-token provider-input ceiling, and ~8,192 tokens reserved for generation/tool-loop headroom;
- smallest-sufficient-working-set policy: unused context is valid headroom and discovered material is not injected merely because it fits;
- explicit omit/defer/fail behavior for budget exhaustion instead of silently treating partial critical instructions as complete;
- portable skill registry and discovery with `skills/<name>/SKILL.md` compatibility;
- built-in, user-global, and workspace skill sources with deterministic source identity and visible collision handling;
- compact bounded skill metadata/catalog exposed to application/TUI surfaces without ordinary-turn provider injection, plus no eager full-body loading;
- explicit just-in-time skill activation, scoped to the current user turn across that turn's provider/tool rounds;
- no executable authority granted by declarative skill content;
- deterministic context/skill qualification independent from model nondeterminism;
- correction/regression testing discipline.

Success condition:
- a deterministic repository fixture can be opened and its applicable context sources discovered under the documented trust, precedence, routing, deduplication, and budget contract;
- provider-facing context size/profile/headroom are observable, critical instruction sources are never silently truncated and presented as complete, optional/routed material is explicitly omitted/deferred/rejected when required, and large repositories do not cause eager context filling;
- at least one portable external `SKILL.md` fixture is discovered and explicitly activated just in time for one user turn without leaking into an unrelated later turn;
- repository/personality/skill content cannot expand George's executable permission ceiling;
- provider and TUI code remain adapters over reusable context and skill services.

Non-goals:
- mutating-run changed-file accounting or comprehensive completion summaries;
- validation-command orchestration;
- durable session persistence/resume;
- LLM-based compaction/summarization;
- automatic semantic skill selection;
- executable lifecycle hooks;
- George plugin manifest/package lifecycle;
- browser/web/network tools or Parallel/GitHub/MCP adapters;
- remembered approval profiles or OS/container sandboxing;
- general mutating Git commands;
- crash-safe side-effect replay/reconciliation;
- daemon/server mode, Tauri, or multi-agent scheduling.

## Phase 4 — Coding Workflow + Sessions

Status: OWNER-CLOSED WITH ACCEPTED NATIVE-TERMINAL / LIVE-MODEL EVIDENCE GAPS

Formal evidence: `docs/phase-4-closeout.md`.  
Owner closeout: `docs/phase-4-owner-closeout.md`.

Goal: turn the Phase 3 context-aware safe agent into a durable bounded coding workflow that can modify, validate, report, persist, and safely resume work.

Decision authority: `docs/planning/p4-coding-workflow-sessions/decision-record.md`.

Scope:
- one provider-independent coding workflow owned by the application/core;
- mutating-run workspace/Git baseline capture;
- observed changed-file accounting that preserves and distinguishes pre-existing dirty work;
- conservative attribution when approved arbitrary child processes may have modified files;
- validation-command workflow through the existing canonical process/tool/approval boundary;
- structured validation evidence;
- normalized presentation-independent progress/status/work projection over authoritative application events;
- deterministic harness-generated progress milestones for context, inspection, editing, validation, recovery, and completion;
- separate high-frequency activity state, lower-frequency progress milestones, and persistent concrete-operation work items;
- observable execution transcript covering context-source loading, file read/list/search, Git inspection, mutations, approvals, literal process commands/argv, validation, recovery, and completion;
- stable work-item identity so one operation updates through running and terminal states instead of duplicating requested/started/completed rows;
- bounded safe operation metadata with no automatic raw file/patch bodies, unrestricted process output/environment, provider payloads, or secrets;
- OpenTUI chronological execution/work-log rendering without moving progress semantics into the TUI;
- progress/work presentation excluded from canonical assistant transcript and provider-facing model context;
- structured completion evidence covering observed changes, validation, unresolved failures/warnings, completion state, and final assistant output;
- schema-versioned filesystem session persistence outside the repository by default;
- canonical workspace identity binding;
- reconstruction of completed durable history after reopen;
- interrupted writes/processes/approvals/provider continuations surfaced as interrupted and never silently replayed;
- first end-to-end coding qualification against a disposable fixture repo using the already-qualified Phase 3 context and skill substrate;
- preservation of Phase 2 tool, permission, process, and Git safeguards throughout the workflow.

Success condition:
- a deterministic disposable repository with pre-existing dirty work can be opened using the qualified Phase 3 context/skill system, changed through approved tools, validated through the normal process boundary, and completed with structured evidence;
- the run accurately separates pre-existing dirty work from newly observed changes without overclaiming process attribution;
- normalized session state persists outside the repository and a later turn can reopen completed history;
- interruption/resume tests prove incomplete writes, processes, approvals, and provider continuations are not automatically replayed;
- users can watch George's concrete repository work in a persistent chronological execution transcript, including the files it reads/searches, edits it performs, commands it runs, approvals it awaits, and validation outcomes, without that presentation history polluting canonical assistant transcript/model context or replacing authoritative evidence;
- final coding responses are sufficiently detailed about inspection, changes, validation, and unresolved issues while routine progress remains harness-generated;
- provider/TUI code remains adapters over reusable context, session, tool, progress, and coding-workflow services.

Non-goals:
- LLM-based compaction/summarization;
- automatic semantic skill selection;
- executable lifecycle hooks;
- plugin packaging/install lifecycle;
- browser/web/network tools or external adapters;
- remembered approval profiles or OS/container sandboxing;
- general mutating Git operations;
- crash-safe side-effect replay/reconciliation;
- long-job retries/backoff;
- daemon/server mode, Tauri, or multi-agent scheduling.

## Phase 5 — Reliability + Long Runs

Status: CURRENT IMPLEMENTATION GATE — baseline target package `0.5.0`

Goal: support longer autonomous local jobs safely and establish George's lifecycle hook runtime without weakening the existing context, permission, process, session, or evidence boundaries.

Decision authority: `docs/planning/p5-reliability-long-runs/decision-record.md`.

Scope:
- provider-independent long-run orchestration owned by the application/core;
- normalized durable session/event history remains authoritative while compaction summaries, logs, recovery projections, hook results, and provider continuation state remain derived evidence;
- versioned provider-facing compaction checkpoints with durable-history provenance rather than destructive replacement of canonical history;
- preservation through compaction of critical instructions, current user intent, unresolved failures, validation evidence, pending approvals, interrupted/ambiguous side effects, and current recovery state;
- provider-independent compaction/summarizer boundary with deterministic structural reduction preferred where model inference is unnecessary;
- multidimensional run budgets beyond the Phase 2 hard loop guard, including provider/tool/retry/compaction/process/time/context limits where measurable;
- explicit soft-pressure degradation/compaction behavior and truthful hard budget-exhaustion terminal state;
- bounded cancellable retry/backoff only for operations George can classify as replay-safe;
- no transparent retry of writes, patches, approvals, arbitrary processes, or other side effects after ambiguous execution;
- interruption/recovery ledger and evidence-based reconciliation that can distinguish confirmed complete, confirmed incomplete, interrupted, and outcome-unknown states without blind replay;
- no claim of universal exactly-once side effects;
- child-process ownership/cleanup hardening and inspectable cleanup uncertainty without changing the non-sandbox trust contract;
- structured diagnostic observability with stable session/turn/operation correlation, bounded/redacted fields, and bounded retention;
- performance baselines for context growth, compaction, TTFT, tool latency, cleanup, recovery/reopen, hook overhead, memory/session-log growth, and TUI responsiveness under long streaming/work-log load;
- extended pinned Qwen3-Coder/LM Studio qualification through context pressure, compaction, continued tool use, validation, and bounded interruption/recovery;
- normalized George lifecycle hook bus with George-owned event names/payloads;
- deterministic hook ordering, enable/disable state, and duplicate/conflict behavior;
- hook timeout/cancellation, bounded input/output, sanitized environment, structured result/error evidence, and failure isolation;
- hooks remain non-authoritative and cannot manufacture approval, suppress policy, mutate execution through hidden authority, replace canonical evidence, or bypass the ToolRegistry/process boundary;
- Phase 5 proves hook runtime semantics only; plugin manifests/install lifecycle and plugin contribution discovery remain Phase 6.

Success condition:
- a deterministic long coding workflow crosses context pressure, produces a versioned compaction checkpoint, continues useful tool work, validates, persists, and completes truthfully while canonical history remains intact;
- repeated compaction never silently drops safety-critical/current state and compaction failure degrades or terminates explicitly;
- run budgets and replay-safe retry behavior are deterministic, bounded, observable, and cancellable;
- an interrupted workflow can reopen and reconcile provable side effects while leaving ambiguous outcomes explicit and never blindly replaying them;
- process cleanup and recovery uncertainty remain inspectable without implying OS sandboxing or unsupported causal certainty;
- long-run diagnostic state remains bounded/redacted and correlated to authoritative events;
- lifecycle hooks execute deterministically under timeout/cancellation/failure isolation and cannot expand George's permission ceiling or replace canonical evidence;
- long-run memory, session/log growth, recovery cost, and TUI responsiveness are characterized before hard performance thresholds are frozen;
- provider/TUI code remain adapters over reusable long-run, context, session, recovery, hook, tool, and observability services.

Non-goals:
- automatic semantic skill selection;
- dedicated secondary utility-model runtime;
- browser/web/network tools or Parallel/GitHub/Chrome DevTools/MCP adapters;
- frozen plugin manifest, plugin installation/packaging, or foreign plugin compatibility adapters;
- remembered broad approval profiles;
- general mutating Git operations;
- OS/container sandboxing;
- daemon/server mode or detached background-job ownership;
- scheduling;
- Tauri desktop UI;
- multi-agent scheduling/execution.

Long-running in Phase 5 means a bounded attached local George run with durable recovery evidence. Phase 7 remains the boundary for a long-lived local service.

## Phase 6 — Plugins + External Adapters

Goal: package extensions and add network/browser intelligence without contaminating the core or weakening George's trust boundaries.

Scope:
- George-native plugin discovery and manifest contract;
- plugin install/enable/disable lifecycle;
- plugin-provided skills, hooks, commands, and tool contributions;
- compatibility adapters for portable or host-specific extension formats where semantics can be translated safely;
- plugin-provided executable tools registered through the canonical ToolRegistry and normal permission policy;
- Parallel Search, Chrome DevTools, GitHub, and MCP adapters;
- explicit trust/permission boundaries for every executable or network-capable adapter;
- independently disableable extension/adaptor capabilities.

The exact George plugin manifest schema is intentionally deferred until this phase; Phase 3 proves the skill substrate and Phase 5 proves hook lifecycle semantics before packaging freezes those interfaces.

## Phase 7 — Local Daemon

Goal: separate the long-lived George service from presentation clients.

Scope:
- localhost-only server;
- authenticated local client protocol;
- session/run APIs;
- event streaming;
- process ownership;
- single-user concurrency policy.

No LAN/Internet exposure by default.

## Phase 8 — Native Desktop

Goal: provide a polished native application without rewriting the agent.

Direction:
- Tauri shell;
- reuse daemon/application-service interfaces;
- preserve the same event/command semantics proven by the OpenTUI adapter;
- session/task UI;
- permission prompts;
- tool/event inspection;
- model/provider controls.

## Post-MVP — Local Web Research + Utility Model

Goal: give George a primarily self-hosted web-research path that uses local compute for search-result digestion and context compaction while keeping paid research providers optional.

This work intentionally follows the MVP. It should build on the Phase 5 compaction/reliability substrate and the Phase 6 network/browser adapter boundaries rather than introducing a parallel research architecture.

Direction:
- add a provider-independent web-research orchestration layer over George's canonical tool and permission boundaries;
- use a locally hosted SearXNG instance as the preferred first search-discovery backend, with search providers remaining replaceable;
- keep search discovery separate from page retrieval, extraction, semantic compaction, and final reasoning;
- provide bounded `web_search` and `web_fetch`-style capabilities rather than implicit unrestricted model network access;
- retrieve ordinary pages through bounded HTTP first, then perform deterministic DOM/article cleanup before model inference;
- use browser rendering only as a fallback for pages whose useful content cannot be obtained through the normal fetch/extraction path;
- introduce an optional secondary local utility-model role, separate from George's primary reasoning/coding model, for narrow tasks such as relevance extraction, page compaction, result reranking, long-log compaction, diff summarization, and similar low-cost context preparation;
- keep utility-model output as derived, bounded context rather than executable authority: the utility model cannot invoke tools, grant permissions, or override George/user/project instructions;
- preserve source identity, URLs, titles, dates when available, and enough provenance for the primary model to distinguish source evidence from generated summaries;
- treat all fetched web content as untrusted data and prevent page text or prompt-injection content from becoming higher-authority George instructions;
- cap search-result counts, fetched bytes, rendered-page resources, per-source context contribution, utility-model output, timeouts, retries, and total research budget;
- allow iterative search/refinement when local discovery is insufficient;
- retain Parallel Search or similar services as optional, independently disableable escalation providers for difficult research rather than making a paid API the default web brain;
- keep search, fetch, browser, extraction, utility inference, and premium-research providers independently replaceable and observable.

Candidate flow:

```text
primary model / George
        |
        +--> search discovery
        |      +--> local SearXNG (preferred default)
        |      +--> optional external search providers
        |
        +--> bounded page fetch
        |      +--> HTTP fetch
        |      +--> deterministic article/DOM extraction
        |      +--> browser fallback when required
        |
        +--> local utility model
        |      +--> relevance extraction
        |      +--> semantic compaction
        |      +--> reranking / evidence shaping
        |
        +--> compact source-attributed evidence
               |
               +--> primary reasoning/coding model

Optional escalation: Parallel Search or another premium research adapter.
```

Qualification direction:
- common technical/documentation research can complete without a paid research API when public search/fetch sources are sufficient;
- the primary model receives materially less irrelevant page content than raw-fetch ingestion while important facts, numbers, dates, caveats, and source provenance survive compaction;
- hostile page text cannot register tools, expand permissions, or override instruction precedence;
- JS-heavy/browser-fallback behavior is bounded and does not become the default fetch path;
- disabling SearXNG, the utility model, browser rendering, or a premium provider produces explicit degradation/fallback behavior rather than hidden coupling;
- local-vs-premium research quality, latency, context usage, and external API cost can be measured before choosing defaults.

Non-goals for the initial post-MVP implementation:
- crawling or indexing a private copy of the public web;
- giving either the primary or utility model unrestricted sockets/network access;
- allowing the utility model to execute tools or make permission decisions;
- replacing deterministic HTML/DOM cleanup with an LLM when normal parsing is sufficient;
- requiring Parallel or another paid provider for ordinary web research.

## Post-MVP — Living Project Map / Software Graph

Goal: let George maintain a continuously updated, human-readable model of the target software project so developers can see what the system is, how a coding task affects it, and how the architecture changes as work is implemented and validated.

This capability describes the repository George is working on, not George's own internal architecture. It intentionally follows the MVP and should build on the existing workspace identity, changed-file evidence, session/event stream, reliability, daemon, and presentation boundaries rather than expanding Phase 4.

Direction:
- build a deterministic repository index for statically recoverable structure such as files, modules, packages, imports/exports, symbols, routes, schemas, and similar relationships appropriate to the target language/framework;
- maintain a presentation-independent software graph above that index;
- layer a higher-level semantic architecture model over deterministic evidence without treating model interpretation as structural truth;
- preserve explicit evidence classes for deterministic structure, semantic interpretation, and task/runtime observations;
- update the graph incrementally as code/configuration changes, with rebuild/validation paths that detect stale derived state;
- project coding-task impact onto the graph so expected, currently modified, removed, added, affected, and validated components can be distinguished;
- distinguish expected blast radius from the actual observed change/validation footprint;
- favor conceptual architecture plus drill-down over an unreadable all-files dependency graph;
- support multiple projections over the same graph, including architecture, module/dependency structure, data flow, control/runtime flow where evidence exists, API/network boundaries, database/persistence, tests/validation, and current-task impact;
- allow runtime/session evidence to augment the project model without converting one observed execution into an unsupported static claim;
- keep graph construction and state independent from OpenTUI, Tauri, browser, and future network-client presentation choices;
- store derived index/graph state in George's own workspace-scoped state keyed to canonical workspace identity by default;
- do not silently write `.george/project-map.json` or equivalent generated metadata into target repositories;
- permit an explicit future project-owned/committed architecture description only as a separate opt-in workflow.

Candidate evidence model:

```text
target repository
       |
       v
deterministic structural evidence
files / imports / symbols / routes / schemas
       |
       v
semantic project model
components / responsibilities / architecture
       |
       v
task + runtime evidence
inspected / changed / validated / observed
       |
       v
project-map projections
architecture / data flow / dependencies / current task
```

Candidate task-delta semantics:

```text
baseline -> expected impact -> current edits -> validated state
```

Qualification direction:
- deterministic graph construction is stable for the same repository state;
- incremental updates converge to the same structural graph as a clean rebuild;
- moves, renames, deletes, and relationship changes do not leave stale edges;
- deterministic relationships are never fabricated to make a diagram look complete;
- semantic/model-derived relationships are visibly distinguishable from deterministic evidence;
- task-delta views accurately reflect observed repository and validation evidence without overstating process causality;
- stale/incompatible cached graph state fails visibly or rebuilds safely;
- derived state remains workspace-bound and does not mutate the target repository by default;
- large-repository indexing, update latency, memory usage, and projection size are characterized before defaults are frozen.

Non-goals for the initial implementation:
- generating a fresh Mermaid diagram from the model on every turn and treating it as authoritative;
- visualizing George's own architecture instead of the active target project;
- rendering every file/symbol at once as the default experience;
- requiring a browser UI for the graph core;
- making the software graph part of Phase 4 completion criteria;
- silently committing generated project-map metadata into user repositories.

## Later

Only after the local product is reliable: trusted LAN clients, phone/secondary-device control, multiple workspaces/runs, remote inference providers, richer MCP ecosystem, scheduling/background jobs, and multi-agent experiments.
