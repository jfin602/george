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

### Extension qualification

Skill behavior must be deterministic enough to test independently from model inference.

When Phase 3 introduces the skill registry, deterministic coverage must include:
- discovery precedence across built-in, user-global, and workspace sources;
- stable source identity and explicit collision handling;
- malformed or missing skill metadata/body behavior;
- oversized skill bodies and context-budget exhaustion;
- compact metadata/catalog behavior without loading every discovered skill body;
- full skill body loading only when activated/selected;
- activation state not leaking unexpectedly into unrelated turns;
- workspace/repository skill text being unable to raise process, filesystem, network, secret-access, or approval permissions;
- at least one portable external-skill fixture proving that compatibility does not require a George-specific skill format.

When Phase 4 introduces executable hooks, deterministic/integration coverage must additionally include:
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

### Session/recovery qualification

Verify interrupted runs remain inspectable, retain structured tool/approval/failure evidence, and do not duplicate writes/tool effects silently.

Phase 3 durable-session qualification must additionally prove:
- persisted session data is schema-versioned and stored outside the fixture repository by default;
- a persisted session remains bound to the canonical workspace it was created for;
- completed conversation/tool/context/skill/validation/change evidence can be reconstructed after reopening;
- malformed or unsupported persisted state fails visibly rather than being partially trusted;
- interrupted write, process, approval, or provider-continuation state is surfaced as interrupted and is not automatically replayed on resume;
- resume begins subsequent work as a new turn from durable normalized history;
- secrets, unrestricted environment dumps, and unbounded process output are not introduced into persisted state.

Crash-safe side-effect replay/reconciliation remains a Phase 4 concern; Phase 3 evidence must not imply that capability exists.

### Phase 3 coding-workflow qualification

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

### Live local-model qualification

For release candidates that change the live agent path, exercise the exact supported LM Studio/Qwen configuration and record the model/provider/runtime used.

For Phase 2, attempt one bounded live tool-use cycle that proves tool schemas are accepted, a tool call can be returned to George, and a structured result can continue to a final response.

A model producing plausible text is not sufficient evidence that tool loops, permissions, cancellation, or recovery work.

### Native TUI qualification

When approval or tool lifecycle UI changes, exercise the real supported terminal path where available: tool request presentation, allow/deny interaction, cancellation, continued streaming, draft preservation, resize behavior, and terminal restoration.

A test renderer remains useful deterministic evidence but is not automatically proof of native-terminal behavior.

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

## Performance

Measure where architecture can regress materially: prompt/context size, time-to-first-token, tool-loop latency, process cleanup, memory growth, and session-log growth.

Do not establish hard performance budgets until baseline measurements exist; once adopted, keep them versioned and explicit.

## Closeout truth

Never report a layer as Green unless it was actually exercised. Owner acceptance of a Not Green or Evidence Gap state is a recorded waiver, not retroactive proof.
