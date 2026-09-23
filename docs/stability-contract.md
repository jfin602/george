# George Stability Contract

Status: INITIAL STABILITY CONTRACT

George can execute developer tools, so reliability includes both software correctness and containment of unintended effects.

## States

- **Implementation complete** — intended behavior exists and required focused/broad automated validation ran.
- **Stability qualified** — applicable integrated provider/tool/process/session evidence is Green.

Evidence outcomes are **Green**, **Not Green**, and **Evidence Gap**. Evidence Gap is not a pass.

## Evidence layers

### Focused automated correctness

Unit/integration tests cover parsers, schemas, permission decisions, context assembly, provider normalization, tool dispatch, filesystem boundaries, and failure paths.

### Context/instruction qualification

Context behavior must be deterministic enough to test independently from model inference.

When Phase 3 introduces instruction precedence and budgeting, deterministic coverage must include:
- George-owned invariants surviving conflicting lower-trust guidance;
- explicit current user intent taking precedence over conflicting repository guidance without expanding executable permissions;
- workspace/project guidance refining user-global defaults according to the documented precedence contract;
- personality affecting model-facing style/behavior only, never executable authority;
- stable source ordering and deterministic duplicate handling;
- missing optional personality/global/workspace instruction files;
- oversized instruction sources and budget exhaustion failing or degrading explicitly rather than silently treating a partial critical instruction as complete;
- routed/retrievable project documentation not being unnecessarily repeated in every assembled turn;
- repository or personality text being unable to raise process, filesystem, network, or approval permissions;
- observable instruction/context size suitable for regression comparison.

Raw source byte limits are not by themselves sufficient evidence of useful token budgeting. Qualification should measure the provider-facing assembled context at the layer where its size can be meaningfully compared.

Phase 3 context qualification must also prove that the selected context profile is operating policy rather than a fill target:
- a repository containing many discoverable documents does not cause unrelated material to be injected merely because tokens remain;
- profile identity, provider-input budget, soft-pressure state, reserved headroom, and bounded category contributions are observable;
- the initial Qwen3-Coder-30B-A3B-Instruct / Q4_K_M / LM Studio profile enforces a 24,576 estimated provider-input ceiling against the 32,768 physical target and preserves intended headroom;
- representative ordinary fixtures can remain within the approximately 12k-18k working-set target without weakening correctness;
- crossing soft pressure causes lower-value optional/routed material to be omitted/deferred before critical instructions are lost;
- stable provider-facing ordering remains deterministic and does not change logical precedence.

The preferred working-set and soft-pressure numbers are qualification targets, not guarantees that every valid task must fit beneath them. Tasks requiring more context may use available profile headroom while remaining below the hard provider-input budget.


### Extension qualification

Skill behavior must be deterministic enough to test independently from model inference.

When Phase 3 introduces the skill registry, deterministic coverage must include:
- discovery precedence across built-in, user-global, and workspace sources;
- stable source identity and explicit collision handling;
- malformed or missing skill metadata/body behavior;
- oversized skill bodies and context-budget exhaustion;
- compact application/TUI metadata/catalog behavior without injecting the catalog or loading every discovered skill body into ordinary provider turns;
- full skill body loading only when activated/selected;
- activation state not leaking unexpectedly into unrelated turns;
- workspace/repository skill text being unable to raise process, filesystem, network, secret-access, or approval permissions;
- at least one portable external-skill fixture proving that compatibility does not require a George-specific skill format.

When Phase 5 introduces executable hooks, deterministic/integration coverage must additionally include:
- lifecycle ordering;
- enable/disable behavior;
- timeout and cancellation;
- malformed hook output;
- hook crash/failure isolation;
- duplicate registration/conflict behavior;
- bounded output and sanitized environment behavior;
- interrupted/resumed-session evidence where applicable;
- hook inability to bypass the ToolRegistry, process trust boundary, or approval policy;
- one failing hook not corrupting unrelated extension state or the surrounding agent run.

Plugin packaging and external adapters introduced later inherit the same regression-permanence, permission, secrets, network, and failure-isolation requirements as equivalent built-in capabilities.

### Hardened transcript, work-log, and provider-diagnostic floor

Phase 5 inherits the post-Phase-4 transcript/presentation hardening as a regression floor. Deterministic coverage must preserve:
- one canonical assistant response only from a completed provider round with no tool calls;
- no canonical/durable/provider-facing resurrection of provisional text from tool-bearing rounds, provider failures, or cancellations;
- a progressively revealed final response whose visual animation cannot corrupt or duplicate the stored response;
- save/reopen of the complete singular final assistant response independent from reveal state;
- bounded safe failed-tool argument summaries that diagnose missing/empty/wrong-field/wrong-type input without exposing write/patch bodies, unrestricted arbitrary JSON, secrets, or raw provider payloads;
- `list_directory` root normalization for omitted `path`, empty-string `path`, and `.` while traversal/outside-workspace/symlink protections remain unchanged;
- bounded LM Studio/provider failure diagnostics carrying safe available event/code/message/reason/status metadata without raw wire payload leakage;
- consecutive work items rendered compactly without merging their authoritative identity/order, with explicit textual status preserved independently from color;
- provider generation presented as `Thinking...` while underlying lifecycle event names remain unchanged;
- work/progress/presentation state remaining outside canonical assistant transcript and provider-facing conversation.

Native OpenTUI qualification should additionally verify progressive final reveal, compact Work grouping under resize/scrollback/restored-session conditions, semantic status coloring with textual fallbacks, and no duplicate/premature final assistant block around tool continuations.

### Provider contract

Use deterministic/mock provider fixtures for ordinary tests and bounded live LM Studio qualification when provider integration changes.

Verify Responses API request shape, tool-schema advertisement, SSE parsing, streamed text, tool-call events, tool-result continuation, cancellation, timeout/error normalization, malformed/incomplete streams, and duplicate/incomplete function-call handling.

### Tool execution

Integrated tests prove:
- read/write workspace boundaries;
- argument/schema validation before executor invocation;
- command argument handling without implicit shell interpolation;
- timeout/cancellation;
- exit-code/stdout/stderr capture and output bounds;
- child-process-tree cleanup;
- sanitized environment inheritance;
- Git dirty-state preservation;
- patch/precondition failure behavior;
- permission denials;
- symlink/traversal rejection;
- no silent partial writes.

An approved arbitrary process is not considered workspace-sandboxed unless a real OS sandbox was actually used and tested.

### Agent-loop qualification

Use small fixture repositories and deterministic scripted model responses to exercise multi-turn tool loops without depending on model nondeterminism.

Phase 2 deterministic coverage must include:
- model -> read tool -> result -> model -> final answer;
- multiple ordered tool rounds;
- multiple calls in model order;
- unknown tool;
- malformed JSON arguments;
- schema-invalid arguments;
- approval allow-once and denial;
- recoverable tool failure returned to the model;
- hard loop-limit exhaustion;
- cancellation while waiting for approval;
- cancellation while a process is active.

Live-model tests supplement this evidence but do not replace deterministic coverage.

### Progress/status qualification

Phase 4 progress/work behavior must be deterministic enough to test independently from model inference.

Coverage must prove:
- progress/work semantics originate outside OpenTUI and can be consumed by a presentation-independent application-event consumer;
- high-frequency activity, lower-frequency progress milestones, and persistent concrete-operation work items remain distinct;
- meaningful context/inspection/editing/validation/recovery/completion milestones appear in deterministic lifecycle order;
- context-source loading plus file read/list/search, Git inspection, mutation, approval, process, and validation operations produce intelligible persistent work items;
- repeated authoritative events for one concrete operation update one stable work item instead of producing duplicate requested/started/completed rows;
- process work items expose the literal executable/argv and relevant workspace-relative cwd, plus bounded exit/signal/duration/truncation outcome metadata where available;
- repetitive low-value tool churn can be coalesced/bounded so visible progress does not flood the user;
- progress/work messages have explicit size bounds;
- progress/work history is never appended to canonical assistant transcript or included in later provider-facing conversation/context solely because it was displayed;
- progress/work projection does not replace authoritative provider/tool/approval/validation/completion evidence;
- failed validation produces truthful failure/recovery state and remains failed in authoritative validation evidence;
- denial, cancellation, interruption, terminal failure, and completion produce appropriate terminal work state without fabricating success;
- visible work rendering does not copy raw file bodies, write contents, patch bodies, arbitrary tool-result JSON, unrestricted process output, unrestricted environment state, provider payloads, or secrets from underlying events;
- reopening/resuming a durable session treats prior work/progress as history and does not show stale prior-run activity as currently active;
- OpenTUI rendering of the execution/work log preserves draft input, assistant streaming, approval interaction, cancellation, resize, scrollback/selection, and clean terminal restoration;
- a sufficiently detailed final coding response summarizes inspection, changes, validation, and unresolved issues/evidence gaps without requiring model-authored narration for routine progress.

Model-authored progress narration is not required for Phase 4 qualification.

### Session/recovery qualification

Verify interrupted runs remain inspectable, retain structured tool/approval/failure evidence, and do not duplicate writes/tool effects silently.

Phase 4 durable-session qualification must additionally prove:
- persisted session data is schema-versioned and stored outside the fixture repository by default;
- a persisted session remains bound to the canonical workspace it was created for;
- completed conversation/tool/context/skill/validation/change evidence can be reconstructed after reopening;
- malformed or unsupported persisted state fails visibly rather than being partially trusted;
- interrupted write, process, approval, or provider-continuation state is surfaced as interrupted and is not automatically replayed on resume;
- resume begins subsequent work as a new turn from durable normalized history;
- secrets, unrestricted environment dumps, and unbounded process output are not introduced into persisted state.

Crash-safe side-effect replay/reconciliation remains a Phase 5 concern; Phase 4 evidence must not imply that capability exists.

### Phase 5 long-run reliability qualification

Phase 5 long-run behavior must be deterministic enough to validate the policy and evidence model independently from live-model quality.

Coverage must additionally prove:
- provider-facing compaction preserves George-owned invariants, explicit current user intent, applicable current project guidance, unresolved failures/validation evidence, pending approvals, interrupted/ambiguous side effects, and current recovery state;
- each compaction checkpoint is schema/version identified and retains provenance for the durable history range it summarizes;
- multiple compaction cycles do not replace or silently mutate canonical normalized history;
- compaction failure and context/budget exhaustion degrade or terminate explicitly rather than presenting truncated critical state as complete;
- run soft-pressure behavior and hard budget exhaustion are deterministic and model/repository/extension content cannot expand configured limits;
- replay-safe retry classification is explicit, retry/backoff is bounded and cancellable, and every attempt/exhaustion outcome is observable;
- writes, patches, approvals, arbitrary processes, and other ambiguous side effects are never transparently retried;
- interrupted recovery can classify proven-complete, proven-incomplete, interrupted, and outcome-unknown operations from durable plus observable evidence without rewriting earlier events;
- recovery leaves ambiguous process side effects explicit rather than claiming universal exactly-once behavior;
- child-process cleanup/cancellation retains structured evidence for success, failure, and uncertainty without implying workspace or OS sandboxing;
- diagnostic logging uses stable session/turn/operation correlation, bounded/redacted fields, and bounded retention;
- diagnostic observability does not automatically expose raw file/write/patch bodies, unrestricted stdout/stderr, unrestricted environment state, secrets, or provider payloads;
- lifecycle hooks obey deterministic ordering and enable/disable state;
- duplicate/conflicting hook registration is handled deterministically and visibly;
- hook timeout, cancellation, malformed output, crash/failure isolation, bounded I/O, and sanitized environment behavior are covered;
- hook execution cannot bypass ToolRegistry validation, process trust boundaries, approval policy, workspace rules, or canonical session/validation evidence;
- one failing hook cannot corrupt unrelated hook state or the surrounding agent run;
- repeated long-run operation is characterized for context growth, compaction cost, memory growth, durable session/log growth, cleanup/recovery cost, and hook overhead;
- OpenTUI remains usable under representative long streaming plus large chronological work-log updates;
- one integrated deterministic long coding workflow crosses context pressure, compacts, continues tool use, validates, persists, and completes truthfully;
- one integrated interrupted workflow reopens and reconciles without blind side-effect replay;
- all applicable Phase 2 permission/process/Git safeguards, Phase 3 context trust/precedence rules, and Phase 4 durable-session/evidence semantics remain intact.

### Phase 4 coding-workflow qualification

The first full coding-workflow fixture must exercise the integrated path rather than proving each feature only in isolation. Deterministic coverage must include:
- a repository with pre-existing dirty work;
- assembled context using the documented precedence and budget rules;
- at least one portable external `SKILL.md` fixture activated just in time;
- one or more approved workspace mutations;
- observed changed-file accounting that keeps pre-existing and newly observed changes distinguishable;
- at least one validation command executed through the canonical process/tool/approval path;
- structured validation and completion evidence;
- durable session persistence followed by a resumed later turn;
- no unexpected skill activation leakage into that unrelated resumed turn;
- an interrupted-side-effect case proving resume does not replay the incomplete operation;
- preservation of the Phase 2 permission, workspace, process, and Git safeguards throughout the flow.

Changed-file evidence must distinguish observation from attribution. When an approved arbitrary process may have changed files, tests and completion reporting must not claim precise causal attribution without supporting evidence.

### Phase 6 plugin and external-adapter qualification

Phase 6 plugin/package and external-adapter behavior must be deterministic enough to validate trust, lifecycle, context, and effect policy independently from live service availability.

Coverage must additionally prove:
- valid, malformed, oversized, unsupported-version, duplicate-ID, and conflicting plugin manifest behavior;
- install/list/enable/disable/uninstall state, managed-root containment, traversal/symlink rejection where applicable, and no silent partial publication;
- plugin installation/uninstallation does not execute arbitrary plugin lifecycle code;
- opening repository/workspace content cannot silently install or enable executable plugins;
- plugin skills preserve Phase 3 lazy loading, bounded context contribution, stable identity, and collision behavior;
- plugin hooks preserve Phase 5 ordering, enable/disable state, bounded I/O, timeout/cancellation, malformed-output handling, and failure isolation;
- plugin executable tools always traverse canonical ToolRegistry schema validation, George-owned effect classification, permission/approval, cancellation, canonical evidence, and normalized result handling;
- plugin manifests, MCP metadata, remote descriptions, repository text, or model output cannot self-downgrade host-process, remote-mutation, browser-interaction, or unknown-external risk;
- network reads, remote mutations, browser observation, browser interaction/navigation, and unknown external effects remain distinguishable in policy/evidence;
- external operations expose only bounded safe service/destination/resource/operation metadata and do not leak unrestricted payloads;
- API keys, tokens, browser cookies/storage/auth headers, and other credentials remain absent from provider-facing context/tool schemas, plugin manifests as plaintext secret values, work/progress text, diagnostics, and normalized errors;
- replay-safe external reads retry only under bounded Phase 5 policy while ambiguous GitHub/browser/MCP/other remote side effects are never blindly replayed;
- hostile search results, GitHub content, DOM text, MCP prompts/resources/descriptions, and other remote content cannot become higher-authority instructions or expand permissions;
- Parallel Search enforces bounded query/results, timeout/cancellation, credential isolation, provenance where available, and explicit disable/unavailable behavior;
- Chrome DevTools connects only through the approved/configured target boundary, distinguishes observation from mutation, bounds returned browser data, and protects browser/session secrets;
- GitHub remote reads/mutations remain distinct, local Git behavior is not replaced, and mutations retain approval/non-replay-safe semantics when outcome is ambiguous;
- MCP server configuration is explicit, imported contributions are namespaced/bounded/filterable, unknown effects default conservatively, and one failing server cannot corrupt unrelated extension/session state;
- stdio/plugin child processes remain attached/bounded and do not silently become detached background service ownership;
- disabled/unavailable adapters contribute no hidden usable tool path and do not silently fall back to an unconfigured provider;
- provider-facing plugin/external tool counts and schema sizes remain bounded and smallest-sufficient rather than injecting every discovered capability;
- one integrated deterministic workflow exercises representative plugin skill/hook/tool contributions and external adapter actions while preserving all applicable Phase 2-5 safeguards.

Live Parallel/GitHub/MCP/browser qualification supplements deterministic evidence and must be recorded separately by exact adapter/configuration. Missing credentials, inaccessible services, or unavailable native browser targets are Evidence Gaps, not inferred Green.

### Live local-model qualification

For release candidates that change the live agent path, exercise the exact supported LM Studio/Qwen configuration and record the model/provider/runtime used.

For Phase 5, when the supported local setup is available, exercise the pinned Qwen3-Coder/LM Studio profile through a representative longer coding run that crosses context pressure, performs at least one compaction, continues useful tool work afterward, validates, and reaches truthful completion. Separately characterize one bounded interruption/reopen/reconciliation path. Record compaction count/provenance, context diagnostics before/after pressure, retry/recovery events where exercised, validation outcome, and any Evidence Gaps. Deterministic fixtures remain the correctness authority.

For Phase 3, when the supported local setup is available, record the exact Qwen model/quant/runtime profile and compare George's estimated provider-facing size with provider-reported usage where available. Include at least one representative ordinary-context tool cycle and, when feasible without manufacturing product behavior, one bounded higher-context/pressure characterization. Live behavior characterizes the profile; deterministic fixtures remain the correctness authority.

For Phase 2, attempt one bounded live tool-use cycle that proves tool schemas are accepted, a tool call can be returned to George, and a structured result can continue to a final response.

A model producing plausible text is not sufficient evidence that tool loops, permissions, cancellation, or recovery work.

### Native TUI qualification

When approval or tool lifecycle UI changes, exercise the real supported terminal path where available: tool request presentation, allow/deny interaction, cancellation, continued streaming, draft preservation, resize behavior, and terminal restoration.

A test renderer remains useful deterministic evidence but is not automatically proof of native-terminal behavior.

For Phase 5, native-terminal qualification should additionally characterize responsiveness during representative long streaming plus accumulated execution/work-log history, including cancellation and terminal restoration under that load.

## Regression permanence

Every confirmed regression must leave a permanent detector at the lowest reliable reproduction layer or justified combination of layers.

A correction that only removes the immediate symptom is not implementation-complete.

## Flaky-test rule

An unexpected test failure makes that validation run Not Green. A later passing rerun establishes intermittency; it does not erase the failure.

## Security/trust qualification

Changes touching tool execution, filesystem scope, network access, secrets, or permissions must include adversarial/negative cases.

At minimum, test that repository/model-provided text cannot silently:
- expand workspace-native filesystem scope;
- bypass permission policy;
- expose unrestricted environment secrets;
- turn a read-only tool into a write;
- invoke unknown executors;
- bypass schema validation;
- leave uncontrolled background/descendant processes.

Process qualification must distinguish policy controls from sandbox guarantees. A bounded `cwd` is not evidence that an arbitrary child process cannot access resources elsewhere on the host.

## Git/user-work preservation

Any phase that mutates files must prove pre-existing user work survives success, failure, denial, timeout, and cancellation paths relevant to the change.

Tests should use fixture repositories with known dirty files and verify George never resets, cleans, stashes, checks out, or overwrites them without an explicit tool/write action and applicable approval.

## Future project-graph qualification

When the post-MVP living project map/software graph is implemented, qualification must prove the graph is useful evidence rather than decorative generated prose.

At minimum, deterministic and integrated coverage should include:
- identical repository states producing stable deterministic structural graphs;
- incremental updates converging to the same structural result as a clean rebuild;
- file/symbol add, delete, move, and rename handling without stale relationships;
- statically recoverable imports, exports, routes, schemas, or equivalent relationships not being invented or silently dropped;
- semantic/model-derived architecture relationships remaining distinguishable from deterministic source evidence;
- expected task impact remaining distinguishable from observed changed/validated impact;
- runtime observations being labeled as observed runtime evidence rather than generalized into unsupported static claims;
- stale or incompatible cached graph state being detected and rebuilt or failed visibly rather than silently trusted;
- derived graph state remaining workspace-bound and not mutating the target repository unless an explicit project-owned workflow authorizes it;
- presentation adapters producing views from the same graph contract without becoming graph authority;
- large-repository indexing/update cost, memory growth, and visualization payload size being measured before hard limits are adopted.

## Performance

Measure where architecture can regress materially: prompt/context size and growth, compaction cost, time-to-first-token, tool-loop latency, process cleanup, interruption/recovery/reopen cost, hook overhead, memory growth, session-log/diagnostic-log growth, OpenTUI responsiveness under long streaming/work-log load, and, when implemented, project-graph indexing/update cost.

Do not establish hard performance budgets until baseline measurements exist; once adopted, keep them versioned and explicit.

## Closeout truth

Never report a layer as Green unless it was actually exercised. Owner acceptance of a Not Green or Evidence Gap state is a recorded waiver, not retroactive proof.
