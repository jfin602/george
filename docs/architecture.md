# George Architecture

Status: INITIAL ARCHITECTURE CONTRACT

## Shape

```text
OpenTUI / future Tauri / future network client
                 |
          application service
                 |
             agent core
      +----------+-----------+
      |          |           |
   context     tools      sessions
      |          |           |
 provider     executors    storage
      |
 LM Studio Responses API
      |
 Qwen3-Coder
```

## Agent core

Owns the turn loop: assemble input, request/stream a provider response, collect assistant output, validate tool calls, route them through policy/approval, dispatch permitted tools, append structured tool results, and continue until completion, cancellation, hard loop-limit exhaustion, or error.

The model proposes actions. George decides whether those actions are known, valid, permitted, and executable.

The core does not know terminal rendering, OpenTUI widgets, Tauri windows, HTTP routes, or LM Studio-specific wire details.

### Phase 2 loop contract

The first autonomous loop follows this lifecycle:

1. assemble normalized conversation/instructions and George's available tool schemas;
2. stream one provider response;
3. collect ordered tool calls;
4. reject unknown tools, malformed JSON, or schema-invalid arguments before execution;
5. evaluate each call against George policy;
6. request approval when required;
7. execute approved calls sequentially in model order;
8. append normalized tool request/result/error events;
9. send the tool results back through the provider boundary;
10. continue until the provider produces a final response or George reaches a terminal condition.

Phase 2 uses a simple configurable hard ceiling on tool rounds/calls to prevent infinite loops. Rich budgets, retries, compaction, and long-run recovery remain later-phase concerns.

Tool execution is sequential in the Phase 2 baseline. That historical contract remains true for Phase 2 evidence; Phase 10 is the explicit point where George may introduce dependency-safe concurrency.

Phase 10 concurrency must be application/core-owned rather than a TUI or provider-adapter trick. Independent read-only operations may execute concurrently only when their dependency/ordering semantics are explicit. Side-effecting or ambiguous operations remain sequential by default. Concurrent calls retain distinct call/work identities, normal policy/approval/cancellation/output bounds, and deterministic normalized result ordering before provider continuation. A performance optimization may not weaken ToolRegistry validation, permission policy, retry/recovery rules, transcript truth, or evidence completeness.

### Provider-round assistant commit semantics

Assistant text is buffered per provider response round until George knows whether that completed round contains tool calls. A round with one or more tool calls is provisional: its text is not appended to the canonical assistant transcript, is not used as the workflow's final assistant response, is not persisted as completed assistant history, and is not reintroduced into later provider-facing completed conversation. George executes the tool calls, submits normalized results through the existing continuation path, and starts the next provider round.

Only a completed provider round with no tool calls may commit assistant text as the single final assistant response for that turn. Provider failure or cancellation before such completion leaves buffered text non-canonical. This buffering is a transcript-integrity rule, not a retry-safety signal: a provider attempt that has emitted response-start/text/tool evidence may still be non-replay-safe even when its provisional text was never committed.

OpenTUI may progressively reveal an already-committed final response at a fast bounded cadence so the final answer still feels streamed. Reveal/animation state is presentation-only and must not alter canonical transcript, durable session content, provider-facing history, cancellation truth, or completion evidence.

## Structured task execution

Phase 9 introduces a provider-independent structured-task layer between accepted user/task intent and ordinary model/tool orchestration.

The execution shape is:

~~~text
George Task Prompt v1
        |
        v
 deterministic parser/validator
        |
        v
 application-owned TaskState
 requirements / work units / validation / stops / corrections
        |
        +-------> bounded model task slice -> provider
        |
        +-------> canonical tools / approvals / recovery
        |
        +-------> presentation projections
~~~

TaskState is operational/evidence state, not hidden model reasoning. It records explicit authored requirements plus George-observed execution/validation outcomes. A model proposal cannot directly mark requirements or validation Green.

Task prompt content remains below George/user permission policy and cannot register tools, expand capabilities, bypass context precedence, or grant itself execution authority.

Durable task state is bound to canonical workspace/session identity and inherits Phase 4/5 interruption/recovery truth. Ambiguous side effects are never replayed merely because a work unit remains incomplete.

### Canonical TaskState is not provider context

The complete parsed task, requirement ledger, work-unit graph, validation history, correction history, blockers, and durable evidence remain canonical George state.

Provider-facing task context is a derived bounded projection for the current work unit. By default it includes only the current objective, applicable requirements/invariants, active validation/stop conditions, relevant repository/context evidence, and bounded unresolved/correction evidence.

Completed unrelated work units, stale validation history, and unrelated requirements remain durable but are not resent merely because they are still part of TaskState.

This separation is required by the Phase 8 smallest-sufficient-working-set law. Phase 9 must not invent a new agentic context threshold: the inherited ordinary/medium/large values remain provisional, and task-slice usefulness is measured against the retained `agentic-context` benchmark rather than assumed from nominal capacity.

### Phase 9 post-implementation boundaries

The implemented structured-task architecture now includes a canonical production stack layer:

~~~text
Task Prompt v1 definitions
        |
        v
 validateTaskStack()
        |
        v
 application-owned StackState
 ordered tasks / current task / completed history / terminal outcome
        |
        v
 StructuredTaskStackApplicationService
        |
        v
 StructuredTaskApplicationService
        |
        v
 bounded provider stage -> tools -> George-owned validation
~~~

`StackState` and per-task `TaskState` are separate authorities. A stack validates before first execution, advances only after the current task is truthfully completed, preserves per-task evidence, fails/stops before later tasks when the current task is non-completed, and resumes through existing recovery rules rather than replaying completed/ambiguous work.

Structured execution also has these qualified boundaries:
- one task-wide run budget spans inspection, implementation, validation discovery/execution, and correction subruns;
- bounded successful inspection evidence may be projected into the dependent implementation stage without making raw file bodies canonical TaskState;
- literal validation executes directly through George's process/policy/evidence boundary without a provider round that makes no model decision;
- `read_file` exposes the full current-file SHA-256, which is the explicit provider-visible precondition used for safe existing-file `write_file` / `apply_patch`;
- provider requests support normalized tool choice, with adapter-specific wire translation isolated below the provider interface;
- structured INSPECT requires one first-round tool call from its already capability-reduced read-only tool set; after the first successful inspection tool round, George completes the bounded preflight and advances directly to implementation without an inspection continuation.

The current live evidence qualifies the INSPECT transition and text-framing detector/guard, and leaves mutation-intent authority as the active Phase 9 boundary. `write_file` is an exact full-replacement primitive and must write the caller-supplied text without silent newline normalization. `apply_patch` preserves untouched current-file bytes and is the preferred localized-edit primitive. Existing UTF-8 text framing metadata may be exposed through read evidence so the model can preserve final-newline state and line-ending convention. The low-level mutation executor may accept an explicit framing-change acknowledgement from a trusted caller, but a model-originated acknowledgement is only requested intent. The application layer must convert that exceptional intent into a bounded ApprovalRequest before dispatch, including in Workspace Autonomous mode; ordinary autonomous mutations remain auto-runnable. Approval presentation receives target/effect plus a bounded mutation-intent warning, never raw mutation bodies.

### Recoverable mutation prerequisites and directory creation

The structured coding path must distinguish a failed tool request from a failed provider turn. Once a model-originated local tool call is schema-valid and its outcome is known to have produced no side effect, ordinary workspace validation/precondition/path failures are returned as bounded terminal `tool.failed` evidence so provider continuation can reason over the failure. Pre-dispatch helpers such as approval/recovery/path preparation must not leak ordinary recoverable local errors outside the per-call tool boundary.

This rule does not weaken stronger stop semantics. Cancellation, configuration errors, permission/policy denial, task/stage/run-budget exhaustion, ambiguous local side effects, and outcome-unknown external effects keep their existing fail-closed/recovery behavior.

Existing-file mutation authority remains explicit: `read_file.sha256` is still the provider-visible current-content precondition for `write_file` and `apply_patch`. George never invents or silently refreshes that hash.

Greenfield work also needs an explicit native directory capability. `create_directory` is a George-owned `workspace_mutation` tool that operates only on bounded relative paths inside the canonical workspace, rejects traversal/absolute/symlink escapes, may create the requested missing directory chain, is idempotent when the requested directory already exists, and fails on file/unsafe collisions. It never deletes, replaces, renames, or moves entries. `write_file` continues to require an already-valid parent and does not silently create directories.

Standard mode uses the normal mutation approval boundary for `create_directory`; Workspace Autonomous may auto-run it only under the existing qualified workspace ceiling. Directory creation is observable in application events/progress and participates in interruption reconciliation from canonical filesystem evidence rather than blind replay.

## Progress and status events

George's normalized application event stream is the presentation-independent source for visible work state.

The event model distinguishes:
- authoritative lifecycle/evidence events such as provider, tool, approval, validation, session, and completion state;
- high-frequency activity state suitable for a single live indicator;
- lower-frequency progress milestones intended to help the user understand meaningful phases of ongoing work;
- persistent human-readable work items that project concrete operations into chronological execution history.

Phase 4 progress/work state is harness-generated from George-owned workflow and authoritative lifecycle events. It is not model reasoning and is not a request for chain-of-thought. Routine status reporting must not require a model tool call or additional inference round.

Progress events use bounded categories/messages and may coalesce repeated low-value operations. Work-item projection uses stable turn/tool/operation identity so one concrete operation can move through requested/running/waiting/succeeded/failed/denied/cancelled/interrupted state without generating redundant transcript rows for each underlying lifecycle event.

The observable execution/work projection covers meaningful context-source discovery/loading, file reads/listing/search, Git inspection, writes/patches, approvals, process execution, validation, recovery, and completion. Safe renderings may include bounded paths, queries, counts, byte sizes, literal process executable/argv, workspace-relative cwd, exit/signal state, durations, truncation markers, and concise errors. They must not automatically copy raw file contents, write/patch bodies, arbitrary tool-result JSON, unrestricted stdout/stderr, unrestricted environment state, secrets, or provider payloads.

Through Phase 8 this projection may be interleaved with conversation. Phase 9 moves routine structured-task work presentation to a dedicated Task view while preserving the same authoritative event/work identities. Removing routine work rows from Transcript presentation must not delete or weaken execution evidence.

Schema-invalid or otherwise failed tool requests may additionally retain a bounded allowlisted argument summary so developers can distinguish cases such as omitted fields, empty strings, wrong field names, or wrong primitive types. That diagnostic projection must redact write/patch bodies and must never become a generic raw-JSON dump. For the model-facing `list_directory` root case specifically, omitted `path`, empty-string `path`, and `path: "."` normalize to the active workspace root before the existing canonical workspace/traversal/symlink checks; this normalization does not broaden filesystem authority or imply similar coercion for unrelated tools.

Consecutive work items may be grouped under one visual `Work` header to reduce vertical noise. Grouping is presentation-only: each operation keeps its stable ID, chronological position, details, and explicit textual status such as `(running)`, `(succeeded)`, `(failed)`, `(denied)`, `(cancelled)`, or `(interrupted)`. Semantic color may reinforce status but must not replace the text label. Safe secondary details may be compacted inline when readable.

Authoritative lifecycle/evidence events remain separately available and progress/work text must not be used as the only proof that an operation succeeded or failed. The work log is a projection, not a second execution authority.

Progress/work state is excluded from canonical assistant transcript and provider-facing conversation/context assembly. Rendering an operation in the conversation view must not consume future model context merely because the user saw it.

OpenTUI, future Tauri clients, and future daemon/network clients consume the same normalized progress/work semantics. Presentation adapters decide layout only.

If progress/work history is persisted, resume reconstructs prior entries as historical evidence only. The active status for a reopened session starts from the resumed runtime state; stale prior-run activity is never shown as currently executing.

## TUI adapter

The initial user interface uses `@opentui/core` directly from TypeScript, without React.

The TUI consumes application/agent/task events and emits user commands/approval decisions. It must not implement provider protocol, tool policy, context assembly, task parsing authority, task state transitions, or agent-loop decisions.

Through Phase 8 the supported presentation includes the historical chronological conversation/work view. Phase 9 deliberately evolves it into two first-class pages over the same application state:

- Transcript — primarily user messages and committed George responses, with only bounded exceptional inline diagnostics/approval interaction where needed;
- Task — structured goal, current work unit, requirement state, workflow/dependencies, validation, blockers, recent execution work, and effective permission envelope.

A persistent compact header remains visible on both pages and exposes current task/work unit/progress/state plus bounded model/context/access information. The composer remains available in both views so the user can intervene while watching task execution.

The Phase 9 TUI should additionally provide:
- owned screen regions and in-place redraw;
- progressively revealed final assistant text while preserving provider-round commit truth;
- one fast-changing activity indicator that renders provider generation as `Thinking...`;
- keyboard navigation between Transcript and Task, with pointer/click support where OpenTUI provides it reliably;
- stable scroll/selection behavior per view;
- visible normalized approval requests;
- allow-once/deny interaction;
- terminal resize handling;
- Ctrl+C/task cancellation while provider work, approvals, or tools are active;
- clean terminal restoration on normal exit and handled failure.

Task/work visibility is a projection only. Rendering TaskState or work history must not inject it into provider context merely because it is visible.

The supported Node host is Node.js 26.4.0 or later within the Node 26 major line. George remains ESM. Native OpenTUI launch paths must invoke Node with `--experimental-ffi`; package scripts/entrypoints should encode that requirement so normal users do not need to remember it manually.

## Workspace Autonomous execution

Phase 9 adds an optional application-owned Workspace Autonomous profile over the existing ToolRegistry/effect/approval architecture.

The effective policy independently represents:
- workspace-local filesystem authority;
- outside-workspace filesystem policy (`reject` or `ask`);
- network authority;
- remote mutation authority;
- browser interaction authority;
- credential/environment exposure.

Inside one canonical workspace, qualified native reads/writes and sandboxed ordinary development processes may execute without per-call approval. Existing validation, replay-safety, run-budget, cancellation, recovery, Git-user-work preservation, and environment/credential protections remain mandatory.

Outside `reject` denies the requested outside resource without presenting approval. Outside `ask` emits one bounded approval request for the specific resource/action. An allow-once decision cannot become a broad remembered host grant.

Outside approval is a separate capability path. It does not modify the canonical workspace root, weaken `resolveWorkspacePath` / mutation containment, or cause outside paths to be treated as normal workspace-native paths.

The task format may declare the permissions a task expects, but the effective policy is the intersection with configured user authority; task/repository/model/plugin/remote text can never raise the ceiling.

### Workspace process containment

The existing host-process executor remains explicitly non-sandboxed and approval-required under its historical contract.

Workspace Autonomous process execution requires a distinct OS-enforced containment path and a separately identifiable execution/policy path. Auto-approval must not be added to the existing host `run_process` path merely because its cwd is workspace-contained.

The selected autonomous implementation must actually prevent disallowed host filesystem access rather than relying on `cwd`. If containment cannot be initialized, George must fail closed or fall back to the normal approval-required host-process path. It must never label or auto-run cwd-only execution as sandboxed.

The concrete Linux containment technology is an implementation-planning decision. Broader general-purpose host/container sandboxing remains outside Phase 9.

## Provider layer

Defines a model-provider interface around capabilities George needs rather than mirroring one vendor SDK everywhere.

Initial adapter: LM Studio using OpenAI-compatible `/v1/responses`, SSE streaming, and Qwen3-Coder model identifiers.

Provider responsibilities include:
- protocol translation;
- capability reporting;
- normalized streamed text and tool-call events;
- translation of George's normalized tool definitions and normalized tool-choice intent into provider request schemas;
- translation of normalized tool results/continuations back into provider protocol;
- cancellation and timeout behavior;
- provider error normalization.
- bounded safe provider diagnostics that preserve available wire/event type, provider error code, bounded message, incomplete/failure reason, and HTTP status while excluding raw provider payloads, prompts, tool results, secrets, and unrestricted wire content.

Provider-native state such as response identifiers may be retained for efficient continuation, but George's normalized session/tool event history remains authoritative and sufficient to diagnose a run.

### Performance optimization boundaries

George treats local-model performance as a measured systems concern rather than a provider-specific shortcut. The formal benchmark harness is developer tooling over the real application/provider/tool path and is the comparison authority for the Phase 7-12 optimization campaign.

Runtime tuning such as LM Studio GPU offload, Flash Attention, KV-cache placement, eval batch size, model residency, warm-up, or speculative decoding belongs at the provider/runtime boundary. George core must not acquire LM Studio-specific policy simply to gain speed.

Context throughput optimization may use adaptive profiles, stable prefixes, provider-native continuation/cache state, or incremental submission where supported, but George-owned instruction precedence, source provenance, context budgets, and canonical normalized history remain authoritative. Provider cache state is disposable optimization state, never the only copy of safety- or recovery-relevant context.

Agent-loop throughput optimization may reduce serialized waits and logical provider rounds only when deterministic orchestration can safely replace an intermediate model decision. It must preserve provider-round assistant commit semantics, permission boundaries, recoverability, and structured evidence.

The optimization workflow is deliberately incremental: one bounded performance change, benchmark, accept/revise/revert, then establish the next baseline. Multiple unmeasured performance changes should not be stacked into one qualification step.

## Context layer

Owns George-owned model instructions, user-global instructions and personality, repository instruction discovery, selected file/context material, conversation history, tool schemas/results, token/context budgeting, and later summarization/compaction.

George must distinguish **always-on instructions** from **retrievable project knowledge**. A file being discovered does not imply that its full contents belong in every provider request.

Target instruction sources include:
- compact George-owned model instructions for identity and reasoning constraints that cannot be represented purely in executable policy;
- optional user-global instructions and a small user-owned personality file from George's user configuration directory (for example `~/.config/george/` on Linux);
- optional workspace-native `.george/instructions.md`;
- compatible repository guidance such as `AGENTS.md`;
- `BOOT.md`-style routing documents that can identify the narrowest additional project material needed for the current task;
- the explicit current user task and selected task context.

Personality controls communication style and engineering temperament. It does not grant capabilities or alter filesystem, process, network, approval, or other permission policy.

Repository instructions remain untrusted project content. For conflicting model-facing guidance, George-owned invariants remain non-overridable; explicit current user intent outranks repository guidance; workspace-specific guidance may refine user-global defaults; personality remains a stylistic default. None of these layers can raise George's executable permission ceiling.

Phase 3 should replace raw instruction concatenation with a deterministic instruction/context assembly path that:
1. discovers applicable sources;
2. applies trust and precedence rules;
3. normalizes stable source metadata and ordering;
4. removes deterministic duplicates where possible;
5. separates active instructions from routed/retrievable supporting documents;
6. applies explicit context/instruction budgets without silently presenting partial text as complete instructions;
7. records enough context-size/source information for diagnostics;
8. produces provider-independent assembled context.

Phase 3 context budgeting is token-oriented, not merely byte-oriented. When an exact tokenizer for the active provider/model is unavailable, George may use a deterministic documented estimate, but diagnostics must label estimated counts as estimates. Actual provider usage may be recorded separately when the provider reports it. Budget exhaustion must omit/defer lower-priority material explicitly or fail closed for required material; George must not silently cut a critical instruction source and present the fragment as the complete source.

George optimizes for the **smallest sufficient working set** rather than trying to fill the model's available context window. Unused context capacity is valid intentional headroom for generation, tool results, and later provider rounds.

The reusable context layer accepts a provider-independent context profile containing operating limits/targets needed by assembly and diagnostics. The first qualified profile targets `Qwen3-Coder-30B-A3B-Instruct` `Q4_K_M` through LM Studio with a 32,768-token physical target, approximately 12k-18k ordinary working set, approximately 20k soft pressure, 24,576-token provider-input budget, approximately 8,192 tokens reserved headroom, and approximately 2,560 tokens as the normal always-on George + project-instruction target. These are replaceable defaults, not Qwen wire semantics or universal model limits.

Logical trust/precedence and physical/provider serialization order are separate concerns. Where semantically safe, repeated stable material should precede volatile turn material so provider/runtime prefix caching can reuse the longest practical prefix. This must never change instruction authority, message roles, or tool-policy semantics.

Context diagnostics should expose the selected profile plus a bounded contribution breakdown, for example core/project instructions, tools, task, skills, routed knowledge, conversation, and tool results.


Phase 8 extends the context profile concept into an explicit **adaptive-versus-fixed operating mode**. Fixed mode preserves a caller-selected concrete profile without automatic promotion. Adaptive mode starts from the smallest profile and may promote monotonically `ordinary -> medium -> large` for one user turn before the first provider request.

Adaptive selection is owned by the application/context layer. It is not model reasoning, provider routing, or presentation state. Selection must be deterministic from George-owned source/context state and must not call the provider, execute tools, mutate canonical session history, or consume executable authority.

The Phase 8 adaptive profiles for the pinned 32k Qwen/LM Studio target are:
- ordinary: 4,096-6,144 preferred working set, 7,168 soft pressure, 8,192 provider-input ceiling;
- medium: 8,192-12,288 preferred working set, 14,336 soft pressure, 16,384 provider-input ceiling;
- large: 12,000-18,000 preferred working set, 20,000 soft pressure, 24,576 provider-input ceiling.

All three retain the 32,768 physical target, at least 8,192 reserved headroom, and the 2,560 always-on instruction target. The large profile remains value-for-value compatible with the Phase 3 concrete default profile. Reserved headroom is a minimum reserve, not a fill target.

Adaptive promotion exists to preserve the deliberately selected working set, not to maximize context usage. Required George/current-user/tool context, applicable selected project instructions, explicitly routed task documents, or activated skills that cannot safely fit a smaller profile may promote to the next profile. Genuinely lower-value optional context may still omit/defer under the existing Phase 3 whole-source budget rules rather than forcing promotion.

A failed required-source trial under ordinary or medium is a promotion signal, not a final context failure. Discarded profile probes are non-canonical: they must not emit duplicate durable context-source lifecycle evidence or become persisted provider-facing state.

The selected profile is fixed for the remainder of that user turn's provider/tool loop. Later provider rounds do not oscillate profile size. A later user turn may select again from current canonical state.

Ordinary/medium profile pressure promotes before provider-backed semantic history compaction. Phase 5 semantic compaction remains a large-profile pressure mechanism so adaptive profiles do not add primary-model summarization calls merely to remain within a small operating envelope.

Final context diagnostics should expose adaptive/fixed mode, selected profile identity, selected budgets/headroom, final estimated provider-facing size, and bounded promotion evidence. Diagnostics remain derived observability only.

### Phase 8 correction: effective agentic working set

The `c8-agentic-context` correction distinguishes three different notions that must not be conflated:

1. **physical context capacity** — the model/runtime window available to LM Studio;
2. **hard provider/context safety ceilings** — George's bounded limits that prevent uncontrolled growth;
3. **effective agentic working set** — the smaller high-signal context in which the pinned local model remains a competent, reliable coding agent.

The 32,768 physical target remains valid headroom. It is not a prompt-size objective.

Production profile boundaries must be justified by real coding-agent evidence rather than synthetic long-context retrieval alone. A model accepting a prompt does not establish that it can reason, plan tools, preserve instructions, and complete repository work at that size with acceptable latency/reliability.

The correction therefore makes agentic competence the operating criterion:
- preserve George invariants, current user/task intent, required tool context, and authoritative unresolved/recovery state first;
- prefer immediate task/repository evidence over broad background material;
- route/defer lower-value project documentation and optional defaults rather than injecting them merely because a larger profile can fit them;
- preserve whole-source provenance and fail/defer explicitly rather than silently truncating critical text;
- use larger envelopes only when the task genuinely requires them and the envelope has been empirically qualified;
- retain Phase 5 semantic compaction only where its existing authority permits it;
- retain P7's frozen-turn continuation-pressure stop before an unsafe provider request.

The currently implemented ordinary/medium/large values remain historical/current `0.8.8` operating values until the correction benchmark establishes replacement evidence. The correction must not guess new values.

The agentic benchmark becomes the authority for profile/routing decisions and must use real George-shaped requests: normal instructions, realistic project guidance, normal tool schemas, repository reads/searches, multi-round investigation, and edit/validation workflows. Synthetic long-context cases remain useful for raw prefill/runtime characterization but are not profile-boundary authority.


Human-readable Markdown remains an authoring format, not a requirement that every byte be permanently injected. LLM-based summarization is not required for Phase 3 instruction assembly; any later compaction/summarization must preserve critical instructions and remain independently testable.

Phase 5 implements compaction as provider-facing derived context over the authoritative normalized session/event history. Versioned compaction checkpoints retain durable-history provenance and do not delete or become the sole copy of the history they summarize. Critical George/user/project instructions, unresolved validation/failure state, pending approvals, interrupted/ambiguous side effects, and current recovery state must remain available whenever safety or correctness requires them.

Compaction/summarization is exposed behind a provider-independent boundary. Deterministic structural reduction is preferred where inference is unnecessary so a later secondary utility model can assume semantic compaction duties without changing session or context architecture.

Phase 12 may attach a secondary local utility model to that boundary only after the Phase 11 optimized primary-model baseline is frozen. Utility inference is subordinate derived-context work: it has no independent permission authority, cannot register or execute tools by instruction, cannot raise instruction precedence, and cannot replace canonical session/evidence state. Utility-model failure or disablement must have an explicit bounded fallback path.

The current Phase 1 behavior that loads bounded raw root `BOOT.md` and `AGENTS.md` content directly into a turn is a bootstrap implementation, not the intended mature context architecture.

Context policy must be testable independently from inference.

Phase 2 only adds the minimum tool-schema/result material required for the safe loop. It must not be expanded to implement the Phase 3 instruction compiler, project-knowledge routing, or general context budgeting.

## Skills and extension model

George treats extensibility as a layered capability rather than a reason to weaken the core trust model.

The extension concepts are distinct:
- **skills** contribute declarative model-facing instructions and workflows;
- **hooks** react to defined George lifecycle events;
- **commands** provide explicit user-facing activation surfaces;
- **tools** provide executable capabilities through George's canonical tool registry;
- **plugins** package one or more of those contributions.

A plugin is a package/container, not an authority boundary. Installing or discovering a plugin does not itself grant filesystem, process, network, secret, or approval authority.

### Skill registry

Phase 3 owns the first skill substrate.

Target skill sources are:
- built-in George skills;
- optional user-global skills, for example under `~/.config/george/skills/` on Linux;
- optional workspace-native skills under `.george/skills/`;
- later plugin-provided skills.

George should support the portable directory shape `skills/<name>/SKILL.md`. Compatible skill metadata should understand at least a stable name and description, with optional argument/help metadata where present. Unknown noncritical metadata should be ignored safely rather than making an otherwise portable skill unusable.

Skill discovery must be token-conscious. George may index compact metadata for application/TUI discovery, but Phase 3 does not inject the ordinary skill catalog or every installed `SKILL.md` body into normal provider requests. Full skill bodies are loaded just in time when explicitly activated; model-facing catalog selection may be introduced later with automatic semantic skill routing.

Phase 3 requires deterministic explicit activation and stable skill identity. An activated skill body is scoped to the current user turn and remains available across that turn's provider/tool rounds; it does not become sticky context for unrelated later turns unless the user explicitly activates it again or a later approved configuration mechanism says otherwise. Automatic semantic skill selection may be added later after the deterministic path is qualified.

Internally, plugin-provided skills should support namespaced identities such as `plugin:skill`. An unqualified skill name may resolve only when unambiguous; collisions must fail visibly rather than silently choosing one source.

Skill content is model-facing guidance only. It cannot raise George's executable permission ceiling, register an executor by instruction, or bypass tool validation/approval. Workspace/repository skill content remains untrusted relative to George-owned policy.

### Hook bus

George defines its own normalized lifecycle hook model rather than adopting another host's lifecycle as the core contract.

Phase 5 freezes the first justified George-owned hook event names/payload boundaries around session, turn/user-input, context assembly, provider request/response, tool before/after, and turn completion lifecycle.

Hook registration uses stable identities and deterministic ordering. Enable/disable state is explicit. Duplicate/conflicting registration fails or resolves through a documented deterministic rule rather than silently selecting one contributor.

Executable hooks are bounded long-run operations:
- bounded normalized input payloads;
- bounded normalized output;
- timeout and cancellation;
- sanitized environment handling;
- structured success/error lifecycle evidence;
- failure isolation so one hook cannot corrupt unrelated extension state or the surrounding agent run;
- interrupted/recovered-session evidence where relevant.

Hooks are non-authoritative. A hook cannot grant itself capabilities, manufacture/reuse an approval, suppress George policy, replace canonical tool/session/validation evidence, or mutate tool execution through an undocumented side channel.

Process-backed hooks retain George's process trust boundary. Hook behavior that is semantically a George tool action must execute through the canonical ToolRegistry and normal permission/approval path.

Phase 5 owns the hook bus/runtime semantics only. Phase 6 owns plugin manifests, package/install lifecycle, compatibility adapters, and plugin-provided contribution discovery.

### Compatibility adapters

Portable `SKILL.md` support is the preferred first compatibility surface.

Host-specific plugin manifests and hook formats may later be translated through compatibility adapters into George's extension model. George should not clone Codex, Claude, Ponytail, or another host's plugin API as its internal contract. Compatibility layers map foreign concepts into George skills, hooks, commands, and tools while preserving George's trust and permission rules.

## Tool registry

Every executable tool is registered through one stable typed contract containing:
- stable tool name;
- description;
- JSON-compatible input schema;
- risk/permission class;
- executor;
- normalized result/error shape.

The model never invokes an executor directly. George validates the tool name, parses model arguments, validates them against the registered schema, evaluates permission policy, and only then dispatches the executor.

Phase 1 read-only file/list/search/Git behavior should migrate into this registry rather than remaining a separate competing tool architecture.

Initial executor families: filesystem, search, process, Git read-only, and patch/write.

## Permission gate

Permission policy lives outside the TUI and outside provider adapters.

Minimum Phase 2 classes/defaults:
- read-only workspace tools: allow;
- workspace write/patch: ask;
- arbitrary process execution: ask;
- destructive filesystem actions: deny/defer;
- network-native tools: unavailable;
- outside-workspace native filesystem access: deny.

The Phase 2 approval scope is per-call allow-once or deny. Remembered approvals, policy profiles, and broader trust grants may be added later.

Repository instructions and model text are untrusted relative to this policy and cannot expand permission.

## Workspace-native writes and patches

George-native filesystem mutation must preserve the workspace trust boundary:
- accept only relative workspace paths;
- reject traversal and symlink escapes;
- safely resolve/revalidate parents for new paths;
- use bounded input;
- prefer atomic replacement where practical;
- fail closed on patch/precondition mismatch;
- avoid silent partial application;
- preserve inspectable failure evidence.

General destructive delete tools are not required for Phase 2.

## Process execution

The process executor uses process APIs and explicit argument arrays. `shell: false` is the default.

The Phase 2 process contract provides:
- explicit executable and argument vector;
- workspace-bounded `cwd`;
- closed/noninteractive stdin by default;
- bounded stdout/stderr capture;
- explicit exit code/signal;
- bounded timeout;
- cancellation;
- best-effort termination of the spawned process tree;
- no intentionally detached/background execution;
- a sanitized inherited environment rather than unrestricted `process.env`.

If real shell semantics are required, the model must propose an explicit shell executable as the approved process rather than George silently interpolating a shell string.

An approved arbitrary child process is **not** contained by the workspace boundary. Without a separate OS sandbox, it may exercise permissions available to George's host user. George must present this capability accordingly and must not claim `cwd` is a security sandbox.

## Git safeguards

At the start of a mutating run, George should capture machine-readable Git working-tree state when the workspace is a Git repository.

Phase 2 must preserve pre-existing changes:
- do not reset, clean, checkout, stash, or otherwise discard user work;
- do not add general mutating Git operations;
- visibly flag approval for writes targeting already-dirty paths when detectable;
- use write/patch preconditions to avoid blind stale replacement;
- prove failed/cancelled operations preserve the user's original dirty state.

Comprehensive changed-file tracking and final summaries remain Phase 4.

## Coding workflow evidence

Phase 4 promotes coding-task bookkeeping into structured harness evidence rather than leaving it only in assistant prose.

At the beginning of a mutating coding run, George captures an observable workspace/Git baseline when available. George-native write/patch tools record their own direct effects. At completion, George reconciles the observed repository state against the baseline so the final result can distinguish pre-existing dirty state from newly observed changes.

Arbitrary approved child processes may modify files beyond what George can attribute precisely. George may report that such files changed during the run, but must not claim a process definitely caused a specific change unless the evidence supports that attribution.

Validation commands do not receive a privileged executor. They use the canonical process/tool/approval path, including existing argv, cwd, environment, timeout, cancellation, and approval rules. George records validation intent, command identity, terminal result, exit/signal state, and bounded output evidence separately from ordinary narrative completion text.

The application layer should produce a structured completion result that can be rendered by OpenTUI or future clients. It includes observed changed files, validation results, unresolved failures/warnings, and the final assistant response. Presentation adapters may format this evidence, but must not become its source of truth.

## Session/event store

Phase 4 introduces durable local session state using filesystem-backed storage outside the active repository. On Linux, the preferred default follows the user state directory convention (for example `$XDG_STATE_HOME/george`, falling back to `~/.local/state/george`). Equivalent platform-appropriate user state locations may be used elsewhere. Repository-local session files are not the default.

Persisted session data is schema-versioned and binds the session to its canonical workspace identity. Append-friendly normalized events remain the durable evidence source where practical; derived transcript/summary views may be reconstructed from that evidence rather than becoming an independent authority.

Persist enough to reconstruct completed user/assistant turns, normalized provider events needed for diagnosis, tool requests/results, approval decisions, context/source diagnostics, activated-skill identity, observed change summaries, validation evidence, interruption state, and completion state. Do not persist secrets, unrestricted environment dumps, or unbounded process output.

Phase 4 resume means **continue from durable completed history**, not replay an interrupted side effect. If a prior turn ended while a write, process, approval request, or provider continuation was in flight, the resumed session exposes that turn as interrupted and starts subsequent work from a new turn. George must not silently re-run the incomplete write/process, synthesize an approval, or depend on a provider-native continuation identifier as the only recoverable state.

Exact crash-safe replay/reconciliation of partially completed long-running work belongs to Phase 5. Phase 4 only needs deterministic durable history, interruption visibility, and safe non-replay resume semantics.

## Long-run reliability and recovery

Phase 5 extends the Phase 4 durable session/coding workflow without creating a second execution authority.

### Canonical versus derived state

Normalized durable session/event history remains authoritative. Compaction checkpoints, progress/work projections, diagnostic logs, hook results, recovery projections, and provider-native continuation state are derived representations.

Derived state may accelerate or explain work but must not silently rewrite completed history, manufacture success, or become the only evidence required to diagnose a failed run.

### Run budgets

The application layer owns a multidimensional run-budget contract beyond the Phase 2 hard tool-loop guard.

Where measurable, budgets may cover provider requests, tool calls, retry attempts, compaction attempts, process executions/cumulative process runtime, wall-clock run time, provider/context usage, and durable diagnostic growth.

Soft pressure may cause documented compaction/degradation. Hard exhaustion is an explicit terminal state. Model, repository, skill, hook, or plugin content cannot expand the active run budget by instruction alone.

### Replay-safe retry

Retry/backoff policy classifies operations by replay safety.

Read-only/idempotent internal work and provider transport attempts whose outcome is known safe may receive bounded cancellable retry. Side-effecting writes, patches, approvals, arbitrary processes, and other operations with ambiguous outcome are not transparently repeated.

A known failed tool operation may still be returned to the model so a subsequent model decision can propose a new normal operation through George's ordinary schema/policy/approval boundary.

Retry attempt, cause, delay, exhaustion, and terminal outcome are normalized authoritative events.

### Interruption reconciliation

Phase 4 safely reopens durable completed history without replaying interrupted work. Phase 5 adds evidence-based reconciliation for interrupted/ambiguous operations.

The normalized recovery model supports at least these semantics:
- confirmed complete;
- confirmed incomplete/not applied;
- interrupted;
- outcome unknown.

Recovery considers durable operation intent/start/completion evidence plus bounded observable current state. A workspace-native write may be reconciled complete when the intended result is provably present, or incomplete when evidence proves it did not apply. Ambiguous results remain unknown/interrupted and require a new explicit decision.

Approved arbitrary child processes are treated conservatively because George generally cannot establish all process side effects. Phase 5 does not claim universal exactly-once execution.

Recovery emits new evidence rather than rewriting prior events.

### Process ownership and cleanup

George strengthens process-tree ownership, timeout/cancellation cleanup, and post-interruption diagnosis within the existing process executor boundary.

Where the host platform permits, George may retain bounded operation/process identity needed to detect or terminate descendants it owns after interruption. Cleanup attempts, failures, and uncertainty remain inspectable evidence.

This does not create an OS sandbox. Approved arbitrary child processes still run with host-user privileges unless a future explicit sandbox changes that trust boundary.

### Diagnostic observability

Structured diagnostic observability consumes authoritative application lifecycle events and uses stable session/turn/operation correlation identities.

Diagnostic records are bounded and redacted by default. They must not automatically persist raw file bodies, patch/write bodies, unrestricted stdout/stderr, unrestricted environment state, secrets, or complete provider payloads.

Retention/rotation is bounded so long attached runs do not create unbounded diagnostic storage.

The Phase 4 user-visible work log remains a presentation projection; diagnostic logs do not replace it or the authoritative lifecycle evidence.

### Long-run process lifetime

Phase 5 long runs remain attached to the local George process with durable recovery evidence. Detached/background service ownership, scheduling, and persistent server lifecycle remain later daemon concerns.

## Interfaces

OpenTUI is the first presentation adapter. A later daemon may expose the application service over localhost. A Tauri UI or trusted remote client can then use that transport without moving agent logic into UI code.

## Trust boundaries

Treat user intent, George policy/config, repository content/instructions, discovered skill/plugin content, model output, tool arguments, executable hooks, local environment/secrets, child processes, and external network content as separate trust domains.

Repository files, skills, plugin metadata, hooks, and model output cannot grant themselves additional permissions.

Network access is a tool/capability decision, not implicit model authority.

## Concurrency

MVP: one active agent run per session/workspace. Phase 2 tool calls execute sequentially. Do not add queues, parallel tool dispatch, or multi-agent scheduling until a concrete requirement exists.

## Configuration

Layer configuration as safe built-in defaults, user-level George config, workspace config where allowed, then explicit CLI/TUI launch overrides. Secrets come from environment/OS-backed mechanisms and are never committed.

User-level configuration may select a personality and global instruction source. Workspace configuration may provide `.george/instructions.md` alongside compatible repository instruction/routing files. Configuration discovery and model-facing instruction precedence must remain presentation- and provider-independent.

Workspace/repository configuration is untrusted relative to George's permission ceiling and cannot silently grant itself broader process, filesystem, or network access. User personality and instruction files likewise cannot bypass executable policy; capability changes require George configuration/policy mechanisms designed for that purpose.

## Technology

- Node.js >=26.4.0 <27;
- TypeScript;
- ESM;
- `@opentui/core` for the initial TUI;
- `--experimental-ffi` on native OpenTUI Node launch paths;
- no React requirement in the initial TUI;
- Node test runner initially;
- minimal production dependencies;
- no required browser runtime;
- no database in MVP;
- no web framework in MVP.

## Future project graph boundary

Post-MVP, George may maintain a presentation-independent software graph for the target repository being worked on.

Detailed design authority: `docs/planning/living-project-map/decision-record.md`.

The intended boundary is:

```text
target repository
       |
       v
deterministic code/config index
       |
       v
ProjectGraph
   +---+------------------+
   |                      |
semantic architecture   task/runtime evidence
   |                      |
   +----------+-----------+
              |
              v
projection service
              |
        +-----+------+
        |            |
        v            v
graph views      view/layout state
        |            |
        +-----+------+
              |
              v
presentation/export adapters
OpenTUI / Tauri / browser / network client / JSON Canvas
```

The graph service belongs below presentation adapters and must not be owned by OpenTUI, Tauri, a browser renderer, or an export format. Presentation clients choose layout and interaction; they do not become the authority for project structure.

### Evidence layers

The ProjectGraph preserves evidence classes rather than flattening all relationships into equal-confidence edges:

1. **Deterministic structural evidence** — files, modules, imports/exports, symbols, packages, schemas, routes, tests, and other relationships George can recover directly from repository contents.
2. **Semantic project model** — higher-level components and responsibilities such as renderer, simulation, API, authentication, persistence, or tool system. These may be derived from code, project documentation, explicit metadata, or bounded model assistance, but remain distinguishable from deterministic facts.
3. **Task/runtime evidence** — expected impact plus what George inspected, changed, validated, or actually observed during execution. Expected, observed, and validated state remain separate.

Runtime evidence augments static structure but does not rewrite deterministic source relationships.

### Graph truth versus view state

ProjectGraph and visual/canvas state are separate persistent contracts.

ProjectGraph owns evidence and relationships. View state owns node positions, pins, groups, expansion, viewport, zoom, filters, local-graph settings, and similar developer presentation choices.

Changing view state cannot alter ProjectGraph evidence. User-created visual groups are not automatically semantic architecture.

Stable graph identity/reconciliation should preserve compatible view state across ordinary edits, moves, and renames without attaching stale state to unrelated entities.

### Incremental indexing

Incremental graph updates should consume authoritative repository/change/session evidence so coding runs can show added, modified, removed, affected, and validated components.

A clean deterministic rebuild is the correctness oracle. Incremental deterministic updates must converge to the same structural graph as a clean rebuild for the same repository state.

Stale or incompatible derived state rebuilds or fails visibly rather than remaining silently trusted.

### Projections and scale

The software graph supports multiple projections over one underlying model, including architecture, modules/dependencies, data flow, control/runtime flow where evidence exists, API/network boundaries, persistence/database structure, tests/validation, current task, and local graph.

The default experience favors conceptual architecture plus drill-down. Large repositories are handled through projection, aggregation, semantic zoom, local neighborhoods, filtering, and lazy expansion rather than rendering every file/symbol at once.

### Semantic assistance

Deterministic indexing must work without model inference.

Semantic architecture inference is optional derived computation. When available, a bounded utility-model role is preferred for routine classification/clustering/summarization if qualification proves it useful. Routine repository edits must not trigger hidden primary-model calls merely to redraw the map.

Provider/model-specific implementation remains behind existing provider/runtime boundaries.

### Storage

Derived index/graph/semantic/view state is stored in George's own state area keyed to canonical workspace identity by default and schema-versioned.

George must not silently add `.george/project-map.json` or equivalent generated metadata to user repositories merely to support this feature. Explicit project-owned/committed architecture metadata may be added later only through a separate opt-in contract.

### Interoperability

JSON Canvas is an export adapter, not the ProjectGraph representation.

Initial support is export-only. George may project graph/layout information into a standards-compliant `.canvas` snapshot, but visual edits in third-party canvas applications are not automatically imported as structural or semantic project truth.

Writing an export inside the target repository remains an explicit user-selected write through normal George policy.

No current MVP/Phase 7 behavior depends on this future boundary.

## Phase 6 plugin and external-adapter architecture

Phase 6 extends the existing extension model without creating a parallel execution system.

A George plugin is a managed package/container for contributions:

```text
plugin package
   |
   +--> skills   -> existing lazy SkillRegistry
   +--> hooks    -> existing HookRegistry
   +--> commands -> explicit user activation surface
   +--> tools    -> canonical ToolRegistry
```

The candidate native manifest is `george-plugin.json`, versioned independently from plugin package version. Manifest parsing, discovery, contribution identity, and collision behavior are bounded and deterministic. Unsupported manifest/API versions fail visibly.

Executable plugin installation is explicit and managed under George-owned user config/state. Opening a workspace must not auto-install or auto-enable repository-supplied executable code. Installation validates/publishes package state but does not execute plugin lifecycle scripts.

George does not use arbitrary dynamic third-party JavaScript import as the default plugin runtime. In-process executable extension code is reserved for George-owned/trusted compiled code. Third-party executable contributions use bounded process or adapter boundaries and therefore retain the existing truth that approved host processes are not an OS sandbox.

Plugin skills and hooks reuse the already-qualified Phase 3/5 registries. Plugin commands are activation surfaces, not hidden executors. Plugin tools always enter the canonical ToolRegistry and cannot invoke executors directly.

### External effect and permission model

Phase 6 must evolve the current local `read | write | process` permission representation so policy can describe external effects without granting adapters blanket authority.

The normalized policy must be able to distinguish at least local reads, workspace mutation, arbitrary host process execution, external/network reads, remote mutation, browser observation, browser interaction/navigation/state mutation, and unknown external effects.

Effect classification is George-owned. Plugin manifests, MCP annotations, remote descriptions, repository instructions, or model text cannot self-downgrade effective risk.

The execution shape remains:

```text
plugin / external adapter contribution
             |
       contribution validation
             |
         ToolRegistry
             |
    schema/effect validation
             |
      permission/approval
             |
          executor
             |
 canonical events + normalized result
```

### Credential boundary

External credentials, API keys, tokens, and browser authentication state are executor-only data.

Provider-facing schemas/context, plugin manifests as stored plaintext secret values, canonical assistant history, work/progress projections, diagnostics, and normalized errors must not automatically contain those secrets.

Configuration may reference a credential/config identity. Presentation may expose bounded non-secret status such as whether a credential is configured.

### External retry and recovery

Phase 5 replay rules apply unchanged to external effects.

Replay-safe external reads may be retried only when explicitly classified safe and within bounded cancellable retry policy. Remote mutations, browser interactions, unknown MCP actions, and other ambiguous side effects are not transparently retried after uncertain execution.

Outcome uncertainty remains explicit durable evidence; later work proposes a new action through normal policy rather than silently replaying the old one.

### Token-conscious external capability exposure

Extension discovery and provider-facing tool advertisement are separate concerns.

Disabled/unavailable plugins and adapters contribute no usable provider-facing tools. MCP/plugin tool counts and schema sizes are bounded, explicit filtering/allowlisting is supported where needed, and ToolRegistry capability-reducing views may expose only the subset justified for the current turn.

George does not inject every discovered external tool schema simply because context headroom exists.

### External adapter boundaries

**Parallel Search** is initially a bounded network-read/search adapter with bounded query/result size, cancellation/timeouts, provenance where available, credential isolation, and explicit enable/disable behavior. The post-MVP SearXNG/utility-model research architecture remains separate.

**Chrome DevTools** is initially a coding/browser-debugging adapter. It connects only to explicitly configured/approved debugging targets and focuses on bounded page/DOM, console/runtime, network inspection, and the minimum interaction/navigation required for debugging. Browser observation is distinct from browser mutation/interaction. Cookies, storage, authorization headers, and browser credentials are not automatically exposed to provider context or logs.

**GitHub** is a remote service adapter and does not replace local Git tools. Remote reads and remote mutations are separately classified. Mutations remain approval-gated and are not blindly replayed after ambiguous execution unless a specific operation has a proven idempotency/reconciliation rule.

**MCP** is a compatibility adapter into George's capability model, not a second authority. Only explicitly configured servers are used. MCP tools/prompts/resources/descriptions/annotations are untrusted input, contributions are namespaced and bounded, import supports filtering/allowlisting, and unknown executable tool effects default conservatively. Stdio server processes remain attached/bounded; detached service ownership remains Phase 7.

### Plugin and adapter state

Managed plugin installation/enabled state lives in George-owned user config/state rather than silently inside the target repository.

Plugins and adapters are independently disableable. Disabled/unavailable capabilities degrade explicitly and do not silently fall back to hidden network providers or execution paths.

One failing/malformed plugin or adapter must not corrupt unrelated extension state, canonical session evidence, or the surrounding run.


## Future boundaries

Designed, not implemented initially: daemon/server transport, Tauri desktop UI, multiple inference providers, project software-graph/index services, broader general-purpose OS/container sandboxing beyond the planned Phase 9 workspace-process boundary, remembered broad permission profiles, authenticated remote clients, and multi-agent execution. Chrome DevTools, Parallel Search, GitHub, and MCP are now Phase 6 capability/adapter directions rather than future architecture.
