# George MVP Roadmap

Status: CURRENT ROADMAP — PHASE 8 OWNER-CLOSED; PHASE 9 ACTIVE

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

Status: OWNER-CLOSED WITH NATIVE-TERMINAL EVIDENCE GAP AND LIVE-MODEL NOT-GREEN RESULT

Formal evidence: `docs/phase-5-closeout.md`.  
Owner closeout: `docs/phase-5-owner-closeout.md`.

Goal: support longer autonomous local jobs safely and establish George's lifecycle hook runtime without weakening the existing context, permission, process, session, or evidence boundaries.

Decision authority: `docs/planning/p5-reliability-long-runs/decision-record.md`.

Scope:
- preserve the post-Phase-4 hardened transcript/presentation baseline: tool-bearing provider-round text remains provisional/non-canonical, only a completed tool-free round commits the singular final assistant response, final output is progressively revealed without changing transcript truth, invalid tool requests expose only bounded safe argument diagnostics, root directory listing accepts omitted/empty/`.` path forms without weakening containment, provider failures retain bounded safe diagnostic metadata, and consecutive Work rows render compactly with explicit per-item status plus a `Thinking...` provider activity label;
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

Long-running in Phase 5 means a bounded attached local George run with durable recovery evidence. A persistent detached local service remains deferred until Phase 14, after structured-task execution, the benchmark-driven primary-model optimization campaign, utility-model work, and local-research path.

## Phase 6 — Plugins + External Adapters

Status: OWNER-CLOSED — accepted deterministic qualification with recorded live/native Evidence Gaps

Goal: package extensions and add useful network/browser intelligence without contaminating the core, bypassing canonical execution/evidence paths, leaking credentials, or weakening George's trust boundaries.

Decision authority: `docs/planning/p6-plugins-external-adapters/decision-record.md`.

Scope:
- George-native versioned plugin manifest and deterministic discovery/identity contract;
- explicit managed plugin install/list/enable/disable/uninstall lifecycle under George-owned user config/state;
- no plugin code execution during installation and no repository-driven executable plugin auto-activation;
- plugin-provided skills, hooks, commands, and executable tools integrated through the existing SkillRegistry, HookRegistry, command surface, and ToolRegistry rather than parallel subsystems;
- namespaced contribution identities with visible deterministic collision handling;
- no general arbitrary third-party JavaScript import into the George process; third-party executable contributions remain bounded process/adapter capabilities unless a later isolation contract changes that;
- George-owned effect/risk classification extending beyond the Phase 2 local `read | write | process` representation to external reads, remote mutations, browser observation/interaction, and unknown external effects;
- plugin/external executable tools always passing canonical schema validation, policy/approval, cancellation, normalized evidence, and result handling;
- executor-only credential resolution with secrets excluded from model context, manifests as plaintext values, tool schemas/descriptions, work/progress text, diagnostics, and normalized errors;
- network/remote operations represented as explicit observable capabilities rather than implicit model network access;
- Phase 5 replay-safe retry/recovery rules extended to external effects, with no blind replay of ambiguous remote/browser/MCP mutations;
- bounded provider-facing external tool/schema exposure so enabled adapters do not defeat Phase 3 smallest-sufficient context policy;
- bounded Parallel Search network-read adapter;
- bounded Chrome DevTools coding/browser-debugging adapter with observation distinguished from interaction/mutation and browser secrets protected;
- GitHub remote adapter with reads distinguished from approval-gated remote mutations and local Git remaining separate;
- MCP compatibility adapter for explicitly configured servers, translating namespaced/bounded/allowlisted MCP contributions into George's own capability model rather than creating a second authority;
- independent enable/disable state and failure isolation for plugins and adapters;
- deterministic/integrated qualification plus separately classified live external-service/browser evidence.

Success condition:
- a deterministic plugin fixture can be installed without executing code, enabled, discovered, contribute a lazy skill/hook/tool through George's existing extension subsystems, disabled, and uninstalled without escaping George-managed state;
- workspace/repository content cannot silently install or activate executable plugin code;
- plugin and MCP tools cannot self-downgrade their effective risk class or bypass ToolRegistry/approval/evidence paths;
- external credentials and browser/session secrets remain outside provider context and bounded/redacted evidence surfaces;
- representative external reads, remote mutations, browser actions, and MCP tools are classified by effect, bounded/cancellable, and observable;
- replay-safe external reads may retry only under Phase 5 rules while ambiguous remote/browser/MCP side effects remain explicit and are not blindly replayed;
- Parallel Search, Chrome DevTools, GitHub, and MCP each have a smallest useful bounded adapter path with explicit disable/unavailable behavior;
- external/plugin tool discovery remains bounded enough that unrelated schemas are not injected merely because provider context has headroom;
- one failing plugin/adapter cannot corrupt unrelated extension state or canonical session evidence;
- all applicable Phase 2 permission/process/Git safeguards, Phase 3 context/skill rules, Phase 4 workflow/session evidence, and Phase 5 reliability/hook semantics remain intact.

Non-goals:
- plugin marketplace/public registry or automatic plugin download/update;
- npm/package-manager lifecycle scripts or arbitrary install/uninstall hooks;
- arbitrary in-process third-party Node modules;
- package-signing/trust marketplace infrastructure;
- OS/container sandboxing;
- automatic semantic skill/tool selection;
- remembered broad approval profiles;
- full post-MVP SearXNG/local utility-model web-research pipeline;
- general unrestricted autonomous browser/personal-session automation;
- unrestricted MCP tool import;
- detached/background plugin or MCP process ownership;
- daemon/server mode, scheduling/background jobs, Tauri, or multi-agent execution.

The exact manifest fields and TypeScript representations should follow this decision record and be finalized through `/prompt-plan` against current source. Phase 6 freezes a safe extension/package/effect contract; it does not make external systems authoritative.

## Benchmark prerequisite — Formal Performance Harness

Status: IMPLEMENTED BEFORE PHASE 7

George has a versioned developer benchmark harness callable through `npm run benchmark`. It is infrastructure for the optimization campaign rather than a numbered product phase.

Current benchmark contract:
- suite/schema version: v1 / schema 1;
- `npm run benchmark -- --suite quick` for representative optimization-gate runs;
- `npm run benchmark -- --suite full` for broader baseline/consolidation qualification;
- optional `--repetitions 1..20`, `--model`, `--base-url`, `--label`, and `--compare <results.json>`;
- results under `artifacts/benchmarks/<run-id>/results.json` plus `report.md`, with optional `comparison.md`;
- deterministic case identities spanning short reasoning, controlled long-context retrieval, code understanding, structured tool use, independent multi-tool inspection, bounded edit workflow, extended agent loop, and noisy-evidence compaction;
- performance and correctness remain separate evidence dimensions.

The benchmark harness is the control instrument for Phases 7-12. It must not itself silently optimize the runtime path it measures.

## Phase 7 — Inference Runtime Optimization

Status: OWNER-CLOSED — accepted steady-state runtime control retained; final restored-runtime verification remains Not Green

Goal: establish the fastest reliable primary-model runtime configuration for the pinned Qwen3-Coder/LM Studio path without changing George's higher-level context or agent-loop architecture.

Scope:
- capture/retain the untouched pre-optimization benchmark baseline;
- systematically characterize LM Studio/runtime variables such as GPU offload, Flash Attention, GPU KV-cache behavior, eval batch size, model residency/persistence, and cold/warm execution;
- change one bounded runtime variable or controlled configuration at a time;
- benchmark every change against the last accepted baseline and explicitly keep, revise, or revert it;
- test startup/model warm-up as a separate experiment after runtime tuning rather than assuming the Phase 5 first-run anomaly has a particular cause;
- keep LM Studio/Qwen-specific tuning behind provider/runtime boundaries rather than leaking it into the provider-independent core.

Success condition:
- every accepted runtime change has before/after benchmark evidence with correctness preserved;
- rejected/no-benefit changes remain recorded rather than disappearing from the evidence trail;
- the resulting configuration is the measured best-known Phase 7 primary runtime baseline on the qualification machine;
- startup warm-up is retained only if it produces a net measured user-visible benefit without unacceptable resource cost.

Non-goals:
- adaptive context policy;
- provider-context caching architecture;
- parallel tool execution;
- model-call batching;
- speculative decoding;
- secondary/helper model runtime;
- daemon or desktop work.

Closeout:
- formal closeout: `docs/phase-7-closeout.md`;
- owner closeout: `docs/phase-7-owner-closeout.md`;
- accepted runtime change: `parallel=1`;
- accepted warm quick-suite reference: 12/12, 33.03 s total, approximately 1.83 s average provider round;
- rejected/no-benefit/unstable experiments remain recorded rather than being erased;
- the final restored-runtime verification remains Not Green because one structured-tool case duplicated a read, and owner acceptance does not relabel that evidence Green.

## Phase 8 — Context Throughput Optimization

Status: OWNER-CLOSED WITH EXPLICIT AGENTIC-CONTEXT NOT-GREEN / EVIDENCE-GAP ACCEPTANCE

Original decision authority: `docs/planning/p8-context-throughput-optimization/decision-record.md`.  
Original measurement/evidence authority: `docs/planning/p8-context-throughput-optimization/initial-baseline.md`.  
Formal `0.8.8` evidence closeout: `docs/phase-8-closeout.md`.  
Agentic-context correction authority: `docs/planning/c8-agentic-context/decision-record.md`.  
Agentic-context correction closeout: `docs/tasks/c8-agentic-context/closeout.md`.  
Owner closeout: `docs/phase-8-owner-closeout.md`.

Accepted `0.8.8` foundation:
- explicit adaptive-versus-fixed context mode;
- deterministic ordinary -> medium -> large probing before the first provider request;
- provider/tool/session-neutral discarded probes;
- one frozen selected profile per user turn;
- Phase 3 trust/precedence/source identity and whole-source omit/defer/fail behavior;
- promotion before provider-backed semantic compaction for ordinary/medium;
- Phase 5 large/fixed compaction/recovery preservation;
- bounded selected-profile/promotion diagnostics;
- P7 frozen-turn continuation-pressure fail-closed protection;
- 32,768 physical context retained as the pinned runtime target;
- `agentic-context` suite v3/schema 3 retained as the real coding-agent measurement instrument.

The current implemented profile values remain inherited/provisional operating policy rather than empirically proven optimal agentic envelopes:
- ordinary: preferred 4,096-6,144; soft 7,168; provider-input ceiling 8,192;
- medium: preferred 8,192-12,288; soft 14,336; provider-input ceiling 16,384;
- large: preferred 12,000-18,000; soft 20,000; provider-input ceiling 24,576.

Owner-accepted non-Green/gap state:
- P2's smallest requested agentic band passed 1/3 families;
- P5's bounded repeat passed inspection and multi-round investigation but failed edit plus validation with expanded/unrequested tool behavior and an incorrect edit;
- no all-family healthy agentic envelope was established;
- no adjacent risk/cliff region was established;
- correction-time GPU Offload 26 and Node-26 real-TTY evidence remained incomplete.

These states remain Not Green/Evidence Gap and are not reclassified as context-size failures. Phase 8 does not establish that context size caused the edit/validation failure.

Phase 8 is owner-closed because the deterministic context machinery and safety boundaries are established, the unresolved evidence is explicitly preserved, and Phase 9's structured-execution work directly targets deterministic requirements/workflow/validation orchestration without requiring Phase 8 to invent an unmeasured envelope.

## Phase 9 — Structured Task Execution + Workspace Autonomy

Status: CURRENT PHASE — package `0.9.10`; implementation substantially complete; live Qwen convergence still Not Green

Decision authority: `docs/planning/p9-structured-task-execution/decision-record.md`.  
Task-format authority: `docs/planning/p9-structured-task-execution/task-format-v1.md`.  
Qualification authority: `docs/planning/p9-structured-task-execution/qualification-plan.md`.

Current evidence after Phase 9 corrections:
- production task-stack validation/order/fail-stop/durable resume is qualified deterministically;
- Workspace Autonomous Bubblewrap containment remains Green;
- full-file read SHA -> safe existing-file mutation precondition is qualified;
- structured INSPECT now requires a read-only tool on its first provider round;
- structured INSPECT now completes after the first successful tool round and live Gate A reaches implementation without an inspection continuation;
- official live-attempt evidence survives production-service exceptions;
- full-file text-framing evidence and recoverable framing-preservation guards are qualified;
- mutation-intent authority and fair frozen-edit approval are qualified;
- the mandatory frozen edit-plus-validation Gate A is now Green on the corrected architecture;
- `greenfield-express-v1` remains historically Not Green because its task stack duplicates application-owned preflight inspection inside ordinary workflow units; `c9-greenfield-instrument-alignment` preserves that history and deterministically qualifies the independently versioned v2 instrument semantics/runner;
- the official `greenfield-express-v2` B2 attempt is Not Green after P1 implementation exposed a production mutation-precondition convergence gap: an existing-file write lacked `expectedSha256`, then a nested new-file write encountered a missing parent before normal terminal tool evidence, and no native directory-creation tool exists in the structured coding surface;
- active correction `c9-mutation-precondition-convergence` preserves SHA authority, adds explicit native `create_directory`, and requires ordinary no-side-effect local prerequisite failures to remain recoverable tool results rather than aborting the provider turn;
- native Node-26 real-TTY/OpenTUI behavior remains an Evidence Gap;
- Phase 9 is not owner-closed and Phase 10 remains unopened.

Goal: make George execute rich software-development task stacks reliably with the local coding model by moving deterministic requirements/workflow/validation/permission orchestration into the harness rather than asking the model to infer it from frontier-model-style prose.

Scope:
- versioned George Task Prompt v1 constrained-natural-language grammar;
- deterministic fail-closed parser/validator;
- application/core-owned task/stack requirements, invariants, work units/dependencies, validation, stop conditions, deliverables, non-goals, and execution expectations;
- bounded current-work-unit task slices for the primary model under inherited Phase 3/8 context laws;
- requirement/validation state based on authoritative George evidence rather than model claims;
- bounded self-correction/revalidation loops with truthful failure history and existing recovery semantics;
- durable task-stack state across session persistence/interruption;
- OpenTUI Transcript and Task pages, persistent current-task/progress header, and composer on both;
- routine detailed work presentation moves to Task without losing authoritative work/session evidence;
- optional Workspace Autonomous execution inside one canonical workspace;
- outside-workspace filesystem policy exactly `reject | ask`;
- auto-run ordinary development processes only through an actually OS-enforced, qualified workspace containment path;
- preserve existing approval-required non-sandboxed host-process behavior as a separate path/fallback;
- keep network, remote mutation, browser interaction, credentials, and environment authority separate from workspace filesystem autonomy;
- preserve `greenfield-express-v1` and `existing-express-feature-v1` as immutable historical live-work instruments; version structural authoring corrections as `greenfield-express-v2` / `existing-express-feature-v2` rather than rewriting v1;
- preserve the Phase 8 `agentic-context` benchmark and failed edit/validation result as longitudinal evidence rather than erasing it.

Success condition:
- structured prompts parse deterministically and invalid marked prompts fail closed before provider/tool execution;
- task state/dependencies/validation/stop/correction semantics are durable and presentation-independent;
- Qwen can complete representative structured task stacks with truthful validation/completion evidence;
- Transcript/Task UI separation is usable without losing cancellation/approval/scrollback/draft behavior;
- workspace-autonomous processes are demonstrably contained from disallowed host filesystem resources or the mode fails closed;
- outside reject/ask behave exactly as configured and prompts cannot elevate policy;
- both frozen v1 live-work baselines and the first v2 B2 Not Green attempt remain recorded with raw outcome/performance/intervention dimensions, and the corrected production path completes fresh Gate A -> B2 -> C2 qualification without rewriting those historical failures;
- inherited Phase 2-8 contracts remain Green or their accepted Not Green/Evidence Gap states remain explicitly classified.

Non-goals:
- dependency-safe parallel tool execution or model-call batching;
- speculative decoding;
- utility/helper model;
- local web-research replacement;
- daemon/desktop implementation;
- unrestricted host administration or broad full-machine autonomy;
- multi-agent scheduling.

## Phase 10 — Agent Loop Throughput

Goal: reduce serialized orchestration latency and unnecessary primary-model invocations on top of the Phase 9 structured execution model while preserving George-owned dependency ordering, permissions, transcript/task truth, recovery semantics, and deterministic evidence.

Scope:
- dependency-safe concurrency for independent operations, beginning with read-only workspace/tool activity;
- preserve model/task ordering whenever calls are dependent;
- side-effecting or ambiguous operations remain sequential unless explicitly qualified otherwise;
- concurrent operations retain stable identities, cancellation, bounded output, failure isolation, and deterministic normalized result ordering;
- benchmark tool parallelism before model-call changes;
- separately reduce redundant model turns where the model does not need intermediate reasoning;
- preserve provider-round assistant commit and Phase 9 task-state authority;
- track logical provider rounds separately from retries;
- include frozen Phase 9 live-work instruments.

Success condition:
- independent-tool cases improve end-to-end performance without correctness/permission/evidence/task regressions;
- model-call reduction lowers rounds/wall time without hiding useful reasoning/approval/recovery checkpoints or increasing failures;
- live-work fixtures remain functionally equivalent or improve;
- each optimization is independently accepted/reverted.

Non-goals: concurrent ambiguous mutations, multi-agent scheduling, helper-model delegation, daemon/background ownership.

## Phase 11 — Final Acceleration + Primary-Model Performance Qualification

Goal: characterize remaining provider acceleration, then freeze a consolidated optimized single-primary-model baseline over the Phase 9 structured execution model and Phase 10 loop optimizations.

Scope:
- evaluate speculative decoding only if a compatible path is practical;
- retain it only when end-to-end benefit justifies memory/runtime complexity;
- run full benchmark plus frozen live-work qualification;
- consolidate original baseline, structured-execution baseline, accepted/rejected changes, cumulative deltas, correctness, call counts, token usage, retries, resources, and live-work outcomes.

Success condition:
- reproducible optimized primary-model baseline;
- no performance acceptance hides correctness failures;
- consolidated report shows cumulative gain/remaining bottlenecks;
- structured-task live-work results remain comparable to Phase 9.

Non-goals: helper model, local web research, daemon/desktop.

## Phase 12 — Local Utility Model

Goal: add a secondary local model only after the single-primary-model path is optimized, for narrow low-cost context preparation with demonstrated net benefit.

Scope:
- provider-independent utility role;
- evaluate candidates against Phase 11 optimized baseline;
- context/log compaction, diff summarization, relevance extraction, result/file ranking, bounded classification/routing, structured extraction;
- utility output remains derived context/evidence, never authoritative task/session truth;
- utility model cannot grant permissions, invoke tools independently, expand capabilities, or override instruction precedence;
- measure helper overhead, quality, primary-model savings, and frozen live-work results.

Success condition:
- at least one bounded helper use case has net benefit versus Phase 11 primary-only baseline;
- failure/disablement degrades explicitly;
- provider/model implementations remain replaceable;
- task/permission/evidence authority remains George-owned.

Non-goals: unrestricted helper autonomy, helper-owned permissions/tools, web search itself, daemon scheduling.

## Phase 13 — Local Web Research

Goal: make ordinary technical/documentation research primarily self-hosted/local where practical, with Parallel or another premium provider as optional escalation.

Scope:
- provider-independent research orchestration through George tool/network/permission boundaries;
- local/self-hosted discovery, SearXNG preferred initially but replaceable;
- separate discovery, bounded fetch, deterministic extraction, semantic compaction, final primary-model reasoning;
- use Phase 12 utility role for relevance extraction/compaction/reranking where useful;
- preserve source identity/provenance;
- fetched content remains untrusted;
- bound results/bytes/rendering/context/utility/timeouts/retries/research budget;
- compare local/premium paths and frozen live-work effects.

Success condition:
- representative research can complete without paid API when public sources suffice;
- premium escalation independently disableable;
- hostile page text cannot register tools, raise permissions, alter task authority, or override precedence;
- disabled components degrade explicitly.

Non-goals: private web crawl/index, unrestricted model sockets, utility-model authority, required paid provider.

## Phase 14 — Local Daemon

Goal: separate the long-lived George service from presentation clients after the core agent path is measured and optimized.

Scope:
- localhost-only server;
- authenticated local client protocol;
- session/run/task APIs;
- event streaming;
- process ownership;
- single-user concurrency policy.

No LAN/Internet exposure by default.

## Phase 15 — Native Desktop

Goal: provide a polished native application without rewriting the agent.

Direction:
- Tauri shell;
- reuse daemon/application-service/task interfaces;
- preserve OpenTUI event/command/task semantics;
- session/task UI;
- permission prompts;
- tool/event inspection;
- model/provider controls.

## Post-MVP — Living Project Map / Software Graph

Goal: let George maintain a continuously updated, human-readable model of the target software project so developers can understand the system, navigate relevant relationships, follow the current coding task, and see how architecture changes as work is implemented and validated.

Status: designed, not yet assigned a numbered implementation phase.

Decision authority: `docs/planning/living-project-map/decision-record.md`.  
Graph contract: `docs/planning/living-project-map/graph-contract.md`.  
Interaction model: `docs/planning/living-project-map/interaction-model.md`.  
Qualification direction: `docs/planning/living-project-map/qualification-plan.md`.

This capability describes the repository George is working on, not George's own internal architecture. It should build on canonical workspace identity, durable session/change/validation evidence, the utility-model boundary, daemon/service interfaces, and future desktop presentation rather than expanding earlier closed phases.

Direction:
- deterministic repository indexing for files/modules/packages/imports/exports/symbols/routes/schemas/tests and other statically recoverable structure;
- one presentation-independent ProjectGraph with explicit deterministic, semantic, and task/runtime evidence classes;
- separate persistent view/layout state so canvas organization never becomes graph truth;
- incremental updates that converge to the same deterministic result as a clean rebuild;
- architecture-first default projection with semantic zoom toward subsystem/module/file/symbol detail;
- Local Graph traversal around a selected/current entity with depth, direction, and relationship filters;
- task overlays that keep expected impact, inspected/changed state, runtime observations, and validation evidence distinct;
- optional Follow George behavior that surfaces current work without continuously stealing manual viewport control;
- persistent user positioning/pinning/groups with reconciliation across compatible graph refreshes;
- multiple projections over the same graph: architecture, dependencies, data flow, runtime/control flow, API/network, persistence, tests/validation, current task, and local graph;
- bounded conceptual projections, aggregation, filtering, and lazy expansion for large repositories rather than rendering every graph node;
- semantic/model augmentation as optional derived evidence; no primary-model call required on ordinary deterministic refresh/edit paths;
- workspace-scoped schema-versioned derived state outside the target repository by default;
- lightweight OpenTUI/text projections independent from a rich GUI;
- rich Tauri canvas when desktop presentation is available;
- JSON Canvas 1.0 export as an interoperability adapter, initially export-only and never the canonical George graph format.

Candidate task-delta semantics:

```text
baseline -> expected impact -> current edits / observed impact -> validated state
```

Candidate implementation slices:
1. graph foundation and deterministic TypeScript/JavaScript indexing;
2. incremental/task-aware graph plus Local Graph traversal;
3. interactive visual map and persistent layout;
4. semantic architecture augmentation;
5. JSON Canvas and other justified interoperability adapters.

Qualification must prove deterministic stability, incremental/clean convergence, rename/move/delete correctness, evidence-class separation, task-overlay truth, layout reconciliation, bounded projections, repository non-mutation, model-optional structural operation, performance characteristics, and valid JSON Canvas export/interoperability.

Non-goals for the initial implementation:
- fresh LLM-generated diagrams treated as authoritative structure;
- rendering every file/symbol at once by default;
- primary-model inference after every edit;
- silently storing graph metadata in the target repository;
- view/canvas layout becoming architecture truth;
- Obsidian as a runtime dependency;
- JSON Canvas as George's internal graph schema;
- automatic import of third-party canvas edges as code relationships;
- full historical graph replay;
- requiring Tauri/browser UI for graph-core use.

## Later

Only after the local product is reliable: trusted LAN clients, phone/secondary-device control, multiple workspaces/runs, remote inference providers, richer MCP ecosystem, scheduling/background jobs, and multi-agent experiments.
