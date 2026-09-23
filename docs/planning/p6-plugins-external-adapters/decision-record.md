# Phase 6 Decision Record — Plugins + External Adapters

Status: APPROVED DIRECTION

Baseline target: package `0.6.0`  
Roadmap gate: Phase 6 — Plugins + External Adapters

## Problem

Phase 5 establishes long-run reliability, durable evidence, bounded retry/recovery, diagnostics, and a George-owned lifecycle hook runtime. Phase 6 now needs to package extensions and add useful external/network capabilities without creating a second execution authority, bypassing the ToolRegistry, leaking credentials, exploding provider context, or turning repository/plugin metadata into executable trust.

Phase 6 therefore owns the first George-native plugin package/lifecycle contract plus bounded Parallel Search, Chrome DevTools, GitHub, and MCP adapters.

## Inherited baseline

Phase 6 inherits all earlier trust and evidence laws:

- normalized durable session/event evidence remains authoritative;
- tools execute only through George's canonical typed tool path and permission policy;
- repository/model/skill/hook content cannot raise George's permission ceiling;
- arbitrary approved host processes are not OS-sandboxed;
- retries require established replay safety and ambiguous side effects are never blindly replayed;
- diagnostics and presentation projections remain bounded/redacted derived evidence;
- skills remain lazy/token-conscious declarative context;
- lifecycle hooks remain George-owned, deterministic, bounded, failure-isolated, and non-authoritative;
- OpenTUI remains a presentation adapter and provider-specific behavior remains behind provider boundaries;
- pre-existing user work and Phase 2-5 regression guarantees remain protected.

## Decisions

### George-native plugins are packages, not authority boundaries

A George plugin is a package that may contribute one or more of:

- skills;
- hooks;
- user-facing commands;
- executable tools.

The first plugin format uses a versioned deterministic George-native manifest, with a candidate file name of `george-plugin.json`. The manifest must identify at least a stable plugin ID, plugin version, manifest/API version, and declared contributions.

Unsupported manifest/API versions fail visibly. Manifest parsing is bounded and deterministic. A plugin manifest cannot grant itself filesystem, process, network, credential, approval, or secret-access authority.

Plugin and contribution identities are namespaced. A plugin cannot silently shadow a built-in tool/skill/hook/command or another plugin contribution. Duplicate/conflicting registration fails visibly or follows an explicitly documented deterministic rule.

### Install lifecycle is explicit, local, and non-executing

Phase 6 owns explicit plugin lifecycle operations sufficient for:

- install;
- list;
- enable;
- disable;
- uninstall.

Installation stores managed plugin content under George-owned user config/state rather than the active target repository.

Installation itself does not execute plugin code. Phase 6 does not run npm/package-manager lifecycle scripts, plugin install hooks, uninstall hooks, or arbitrary manifest commands.

Installation does not imply enablement.

Install/uninstall operations must be path-bounded to George's managed plugin area, reject traversal/symlink escapes where applicable, use bounded inputs, and avoid partially published plugin state. Validation should occur before a plugin becomes the active installed version.

An updated plugin that declares materially new executable contributions must not silently gain execution merely because an earlier version was enabled; capability changes must be handled deterministically and visibly.

### Workspace content cannot silently activate executable plugins

Opening or cloning a repository must not cause repository-supplied executable plugin code to run.

Workspace `.george/skills/` remains an appropriate declarative skill source under the Phase 3 contract. Executable plugins, executable hooks, and external adapters require explicit George/user configuration or installation.

Repository instructions may request use of an installed capability, but repository content cannot install, enable, configure credentials for, or elevate that capability by instruction alone.

### Arbitrary third-party JavaScript is not imported into George's process

Phase 6 does not dynamically import arbitrary third-party plugin JavaScript into the George process as a general extension mechanism.

An in-process Node module could directly use filesystem, environment, child-process, or socket APIs and thereby bypass George's ToolRegistry and permission model. In-process executable extension code therefore remains reserved for George-owned/trusted compiled code unless a later phase introduces a stronger isolation contract.

Third-party executable plugin hooks/tools use bounded external-process or adapter protocols. Their host process trust implications must be described truthfully: process execution is not an OS sandbox.

### Contributions reuse existing George subsystems

Plugin skills extend the existing lazy SkillRegistry rather than creating a parallel skill system.

Plugin hooks register through the Phase 5 HookRegistry/lifecycle contract rather than introducing a second callback bus.

Plugin tools register through the canonical ToolRegistry. The model never invokes plugin executors directly.

Plugin commands are explicit user-facing activation surfaces only. A command may select/activate a workflow or request normal George operations, but it cannot become an unvalidated hidden shell/process/network escape hatch.

### External permissions are effect-based, not adapter-based

The Phase 2 `read | write | process` tool permission representation is insufficient for Phase 6 external capabilities.

Phase 6 introduces a normalized effect/risk model capable of distinguishing at least:

- local read-only effects;
- local workspace mutation;
- arbitrary host process execution;
- unauthenticated or authenticated external/network reads;
- external/remote mutation;
- browser observation;
- browser interaction/navigation/state mutation;
- unknown or insufficiently classified external effects.

The exact TypeScript representation is an implementation-planning concern, but policy is based on the operation's effect rather than the adapter name.

A Parallel call is not implicitly trusted because it is Parallel. A GitHub call is not implicitly safe because it is GitHub. An MCP server cannot self-declare arbitrary executable behavior into a lower-risk class merely through its own metadata.

Unknown external/MCP executable effects default conservatively.

### Plugin tools cannot self-downgrade permissions

Every executable plugin contribution must enter through normal ToolRegistry schema validation, effect classification, permission evaluation, approval when required, cancellation, evidence emission, and result normalization.

Generic third-party executable plugin code cannot label itself harmless/read-only and thereby bypass the host-process trust boundary. George owns the effective risk classification.

### Credentials are executor-only data

External adapter credentials, API keys, tokens, browser authentication state, and similar secrets are resolved at the adapter/executor boundary.

Secrets must not be automatically copied into:

- model/provider context;
- tool schemas or tool descriptions;
- plugin manifests as plaintext secret values;
- canonical assistant transcript;
- user-facing work/progress text;
- durable normalized session evidence beyond non-secret credential identity/configuration state;
- diagnostics or unrestricted errors.

Configuration/manifests may reference a credential/config identity. George may expose bounded status such as whether a credential is configured, but not the secret itself.

### Network access is explicit and observable

Enabling an adapter makes capabilities available; it does not silently waive George's permission policy.

External operations produce bounded observable metadata appropriate to the capability, such as service, destination/origin, repository/resource, operation type, credential use state, remote-mutation state, duration, truncation, and normalized error status where safe.

Fetched remote content is untrusted data. Page text, search results, GitHub content, MCP descriptions/resources/prompts, browser DOM text, or other remote content cannot become higher-authority George instructions merely because an adapter retrieved it.

### Phase 5 retry/recovery law extends to external effects

External reads may be automatically retryable only when George classifies the specific operation as replay-safe and the retry remains bounded/cancellable.

GitHub mutations, browser interactions, unknown MCP actions, and other externally visible side effects are not transparently retried after an ambiguous outcome.

When George cannot prove whether an external side effect occurred, the operation remains interrupted/outcome-unknown until reconciled or a later explicit decision proposes a new action.

No Phase 6 adapter may introduce hidden retry semantics that contradict the Phase 5 evidence/replay model.

### External tool exposure remains token-conscious

Discovering many external/plugin tools does not imply advertising all schemas to the model on every turn.

Phase 6 must preserve the Phase 3 smallest-sufficient-working-set rule:

- disabled plugins/adapters contribute no provider-facing tools;
- unavailable capabilities are not advertised as usable;
- external/MCP contribution counts and schema sizes are bounded;
- MCP imports support explicit allowlisting/filtering;
- tool registries may expose capability-reducing subsets to a turn;
- George does not fill spare context with unrelated tool schemas merely because tokens remain.

Automatic semantic tool/skill selection is not required by Phase 6.

### Parallel Search adapter

Parallel Search is a bounded network-read capability.

Phase 6 should support the minimum useful search path with:

- bounded query/input;
- bounded result count and response size;
- timeout/cancellation;
- normalized source/provenance fields where available;
- credential isolation;
- structured safe errors;
- explicit adapter enable/disable behavior.

Parallel Search does not expand into the post-MVP self-hosted research architecture. SearXNG, general page-fetch orchestration, utility-model digestion, crawling, and premium/local research routing remain later work.

### Chrome DevTools adapter

The initial Chrome DevTools capability is a coding/browser-debugging adapter, not a general unrestricted autonomous browsing product.

It should connect only to an explicitly configured/approved debugging target and expose bounded capabilities useful for development, such as page/DOM inspection, console/runtime errors, network inspection, and the minimum interaction/navigation required to reproduce and diagnose application behavior.

Browser observation and browser mutation/interaction must remain distinguishable in policy/evidence.

Cookies, storage, authorization headers, credentials, and other browser secrets must not be automatically exposed to model context or logs.

Phase 6 does not require broad web-research browsing, arbitrary personal-session automation, or a general browser agent.

### GitHub adapter

The GitHub adapter provides remote repository/service capabilities without replacing George's existing local Git tools.

Remote reads and remote mutations are separately classified.

Mutations such as creating/updating issues, comments, pull-request state, releases, or other remote resources remain approval-gated according to George policy and are non-replay-safe after ambiguous execution unless the specific operation has an independently proven idempotency/reconciliation rule.

Credentials remain executor-only and GitHub content remains untrusted external data.

### MCP adapter

George supports explicitly configured MCP servers through a compatibility adapter into George's own capability model.

MCP is not a second execution authority.

MCP-provided tools, prompts, resources, descriptions, annotations, and capability metadata are untrusted input. They cannot bypass George schema validation, effect classification, permission/approval policy, context limits, credential boundaries, or canonical evidence.

MCP contributions are namespaced and bounded. Tool import must support explicit allowlisting/filtering and hard contribution/schema limits.

Unknown executable MCP tools default conservatively rather than trusting a server's claim that they are read-only.

For stdio servers, process ownership remains attached and bounded under George's process lifecycle. Phase 6 does not introduce detached/background service ownership. Long-lived George service ownership remains Phase 7.

### Adapter disablement and failure isolation

Plugins and external adapters are independently disableable.

Disabled or unavailable capabilities must fail/degrade explicitly rather than silently falling back to another network provider or hidden executable path.

One malformed/failing plugin, MCP server, or external adapter must not corrupt unrelated extension state, the canonical session, or the surrounding agent run.

## Phase boundary

Phase 6 does not include:

- a plugin marketplace or public registry;
- automatic plugin download/update;
- npm/package-manager lifecycle execution;
- arbitrary in-process third-party Node modules;
- cryptographic package-signing/trust infrastructure;
- OS/container sandboxing;
- automatic semantic skill or tool selection;
- remembered broad approvals;
- the post-MVP SearXNG + local utility-model research pipeline;
- a general autonomous browser agent or unrestricted personal-browser automation;
- unrestricted MCP tool import;
- detached/background plugin or MCP process ownership;
- daemon/server mode;
- scheduling/background jobs;
- Tauri desktop UI;
- multi-agent scheduling/execution.

## Qualification direction

Deterministic/integrated Phase 6 coverage must prove at minimum:

- valid, malformed, oversized, unsupported-version, duplicate-ID, and conflicting plugin manifests;
- install/list/enable/disable/uninstall semantics and managed-root containment;
- installation performs no plugin code execution;
- workspace content cannot auto-install/enable executable plugins;
- plugin skills preserve lazy loading, context budgeting, identity, and collision rules;
- plugin hooks preserve Phase 5 ordering, bounded I/O, timeout/cancellation, and failure isolation;
- plugin tools always traverse ToolRegistry validation and George-owned effect/permission policy;
- executable plugin/MCP metadata cannot self-downgrade host-process or unknown external risk;
- external reads/mutations/browser actions are classified and surfaced distinctly;
- credentials and browser/session secrets remain absent from model context, schemas, logs, work text, and normalized errors;
- network timeout, cancellation, response bounds, and normalized errors;
- remote mutation approval and ambiguous-result no-blind-retry behavior;
- hostile remote/browser/MCP content cannot raise instruction authority or permissions;
- MCP namespacing, filtering/allowlisting, contribution limits, schema limits, and failure isolation;
- disabled/unavailable adapters produce explicit behavior rather than hidden fallback;
- provider-facing external tool schemas remain bounded and smallest-sufficient;
- one integrated deterministic workflow uses at least one plugin contribution and representative external adapters without weakening Phase 2-5 safeguards;
- live external-service/browser evidence is recorded separately from deterministic fixture evidence and never inferred Green when unavailable.

Phase 6 implementation planning should preserve the smallest safe boundary for each adapter rather than treating the roadmap list as a requirement to build every possible operation each service exposes.
