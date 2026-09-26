# Phase 9 Decision Record — Structured Task Execution + Workspace Autonomy

Status: APPROVED DIRECTION — CURRENT PHASE AFTER PHASE 8 OWNER CLOSEOUT

Phase 9 is the current George implementation phase after the owner's accepted Phase 8 closeout. It intentionally precedes Agent Loop Throughput so later throughput work optimizes the execution model George actually intends to use.

## Problem

George's current task prompts are strong human-readable implementation contracts, but they ask the execution model to reconstruct too much orchestration from prose: requirements, ordering, validation, stop conditions, correction behavior, and completion truth.

Phase 9 moves deterministic orchestration into George while leaving code understanding, implementation choices, debugging, and bounded reasoning with the coding model.

The current TUI also interleaves detailed work history with conversation, consuming transcript space. Repeated per-call approvals likewise limit useful autonomy for long structured tasks.

## Phase 8 evidence carried into Phase 9

Phase 8 is owner-closed with explicit agentic-context Not Green / Evidence Gap acceptance.

The inherited evidence must remain visible:
- the deterministic Phase 8 context machinery and P7 continuation-pressure safety are accepted regression boundaries;
- the `agentic-context` suite v3/schema 3 is the real coding-agent measurement instrument;
- no empirically healthy all-family agentic working-set envelope was established;
- the current ordinary/medium/large values are provisional inherited operating policy, not proven optimal envelopes;
- the bounded live inspection and multi-round cases passed, while the edit-plus-validation case remained Not Green because the model expanded into unrequested/repeated tools and produced the wrong edit;
- Phase 8 did not establish that context size caused that edit/validation failure.

Phase 9 must treat that failed edit-plus-validation workload as a required longitudinal regression instrument. Structured execution is not assumed to fix it; the Phase 9 evidence must demonstrate whether George-owned task/workflow/validation orchestration materially improves the same class of work.

## Decisions

### George Task Prompt v1

Phase 9 introduces a versioned constrained-natural-language task format. It remains comfortable for humans and planning models such as ChatGPT Sol or Astra to author, but is deterministic enough for George to parse without semantic guessing.

Canonical marker:

    GEORGE TASK FORMAT: 1

A prompt carrying that marker must validate against the supported grammar. Invalid structured prompts fail closed with precise bounded diagnostics; George must not silently reinterpret them as ordinary chat. A prompt without the marker remains an ordinary conversational request.

Detailed grammar authority: docs/planning/p9-structured-task-execution/task-format-v1.md.

### Structured task authority

George parses a valid task into application/core-owned state including, as applicable:
- task identity and kind;
- goal;
- requirements;
- invariants;
- ordered work units and dependencies;
- required validation;
- stop/block conditions;
- deliverables;
- non-goals;
- declared execution expectations;
- current work-unit and verification state.

Identifiers such as R1, I1, W1, V1, S1, and D1 are stable machine identities. Their bodies remain natural language.

The TUI, provider, and future clients consume projections of this task state. They do not become task authority.

### Responsibility split

George owns prompt parsing/validation, requirement and validation ledgers, work-unit/dependency state, stop conditions, correction-cycle bounds, completion truth, durable task state, and permission ceilings.

The coding model owns understanding relevant code, selecting implementation details inside the current bounded work unit, producing edits/tool proposals, interpreting failures, and debugging.

George must not replace model intelligence with rigid pseudo-code. Work units describe outcomes, dependencies, requirements, and validation.

### Canonical TaskState versus provider task slices

The complete parsed Task Prompt v1 plus all durable requirement/work-unit/validation/correction state is canonical George state.

Canonical TaskState is **not** automatically provider context.

George sends the primary model the smallest sufficient task slice for the current work unit rather than repeatedly sending the entire rich planning memo or full accumulated task ledger.

A provider slice may include:
- the current work-unit objective;
- only the requirements/invariants applicable to that work unit;
- the next required validation and active stop conditions;
- relevant inspected/routed repository context;
- bounded unresolved/correction evidence needed to proceed;
- only the recent task history required for correctness.

Completed work units, old validation history, unrelated requirements, and historical correction evidence remain durable in George without being repeated in every provider request merely because they remain canonical state.

A later correction may reintroduce the specific prior failure evidence needed to repair the current work, but a passing rerun does not erase the earlier durable failure record.

Task slicing remains subject to Phase 3/8 trust, precedence, routing, budgeting, whole-source integrity, and continuation-safety rules.

Phase 9 must not invent a new context-size threshold. The current inherited profile values remain provisional; structured task slicing is measured against the Phase 8 agentic-context instrumentation rather than justified by a guessed 4k/6k/8k envelope.

### Validation and bounded self-correction

Validation entries are first-class gates. A required validation remains unverified until George observes the actual result; model text cannot mark it Green.

Failed validation may enter a bounded correction state. George supplies relevant failure evidence/task context to the model, permits repair through the normal tool/permission boundary, and reruns affected validation. Correction cycles remain bounded, observable, cancellable, and subject to existing recovery semantics.

### Durable task stacks

Multiple structured prompts may form a versioned task stack. George validates stack identity, task numbering/order, dependency references, and applicable version/closeout rules before execution.

Durable state must retain enough evidence to reconstruct the active stack/task/work unit, requirement state, completed/outstanding validation, correction state, and interruption/outcome-unknown evidence. Resume must not blindly replay ambiguous side effects.

### Post-implementation structured-execution clarifications

Phase 9 correction evidence makes several originally directional decisions concrete without changing George Task Prompt v1.

**Task-stack authority.** Canonical `StackState` is distinct from per-task `TaskState`. George validates the complete structured stack before provider/tool work, executes tasks in strict ordinal order through the production structured-task service, preserves completed/failing TaskState history, stops the stack at the first non-completed task, and resumes without blindly replaying completed or ambiguous work.

**Stage evidence and budgets.** Structured inspection may project bounded sanitized successful local-read evidence into the immediately dependent implementation stage without making raw file bodies durable TaskState. Validation failures retain bounded safe diagnostics for correction. One task-wide `RunBudget` is shared across structured subruns; literal validation is George-owned and does not require a provider round merely to launch an already-resolved command.

**Safe mutation preconditions.** `read_file` exposes the full current-file SHA-256 even when returned text is bounded/truncated. That observed hash is the provider-visible current-content precondition for modifying an existing file with `write_file` or `apply_patch`. Mutation execution still rejects missing/stale preconditions; the harness does not silently fill them behind the model's back.

**Text-file edit fidelity.** Existing text-file edits should preserve untouched file framing by default, including final-newline state and recognized line-ending convention, unless the task explicitly changes that framing. `write_file` remains an exact full-replacement primitive: George writes the caller-supplied text and must not silently append/remove/normalize newlines. `apply_patch` is the preferred localized-edit primitive because unchanged bytes naturally remain intact. For an existing UTF-8 text file, a full replacement that changes framing must be rejected recoverably unless the mutation explicitly acknowledges the framing change. Read/inspection evidence should expose bounded framing metadata sufficient for the model to preserve it. Intentional framing changes remain possible through an explicit bounded opt-in rather than implicit normalization.

**Mutation intent is not mutation authority.** A model-visible mutation argument may describe an exceptional requested effect, but cannot authorize that effect by itself. In particular, `allowTextFramingChange: true` is a request/acknowledgement of framing-change intent, not a permission grant. Model-originated framing-change requests must be projected into a bounded George-owned approval request before dispatch. Standard workspace mode surfaces that intent inside the normal mutation approval. Workspace Autonomous may auto-run ordinary qualified workspace mutations, but it must still require explicit approval for a requested text-framing change. Approval evidence exposes only bounded intent metadata/warnings, never file bodies. Lower-level trusted executor calls remain separate from model-originated application authority.

**Provider-neutral tool choice.** The provider request boundary supports normalized tool-choice semantics. Structured INSPECT uses a required tool choice on its first provider round while exposing only the read-only INSPECTION_TOOLS; continuation rounds return to normal automatic/default tool choice. Provider-specific wire translation remains in adapters.

**INSPECT completion boundary.** Mandatory first tool use and application-owned completion after the first successful inspection tool round are now qualified. At that correction stage, the live replay advanced directly into implementation without inspection continuation or stage exhaustion and moved the next boundary to byte-exact text-file edit fidelity. Later corrections qualified that boundary; current authority is the mutation-precondition convergence section below.

**Instrument stage semantics.** Qualification/task authors must express preflight repository observation through top-level `INSPECT`, not by relying on a WORKFLOW title such as `Inspect ...` to create special completion behavior. WORKFLOW units represent actual task progression under the normal implementation stage. Likewise, a work unit named `Validate` or `Report` does not own George-run validation that occurs later in the state machine. Validation-dependent reporting belongs in George-owned validation/evidence/closeout projections after the validation results exist. George must never infer execution semantics from work-unit titles or natural-language labels.

**Versioned qualification instruments.** Once a live-work instrument version has been exercised officially, structural task-stack corrections create a new instrument version rather than rewriting the old fixture. Historical v1 inputs/results remain immutable longitudinal evidence. A newer instrument may reuse the same product behavior acceptance suite when the required software behavior is unchanged; its metadata must record the new task-stack version/digest separately.

### Mutation-precondition convergence and explicit directory creation

The aligned `greenfield-express-v2` attempt exposed a production convergence boundary after INSPECT semantics were corrected. Dependency setup created `package.json`; Qwen then requested an overwrite without `expectedSha256`, which George correctly rejected. A later same-round request targeted `src/app.js` while `src/` did not exist. Current mutation-path preparation requires the parent directory to exist and can fail before ordinary terminal tool evidence is produced. The structured coding tool surface also lacks an explicit directory-creation capability.

Phase 9 therefore locks these additional rules:

- **Existing-file SHA authority is unchanged.** George must never invent, inject, or silently refresh `expectedSha256` for model-originated writes/patches. The model obtains the current precondition from `read_file.sha256` and retries explicitly.
- **Recoverable local prerequisite failures stay inside the tool loop.** A model-originated tool request that is schema-valid but encounters an ordinary local validation/precondition/path prerequisite failure must produce bounded per-call `tool.failed` evidence when the outcome is known to be no side effect. It must not abort the whole provider turn merely because pre-dispatch preparation failed.
- Cancellation, configuration faults, task/stage/run-budget exhaustion, policy-denied operations, ambiguous side effects, and outcome-unknown external effects keep their existing stronger stop/recovery semantics and are not downgraded into ordinary retryable failures.
- **Directory creation is explicit.** George gains a native `create_directory` workspace mutation tool rather than silently teaching `write_file` to manufacture parent directories. It accepts only bounded relative workspace paths, rejects traversal/absolute/symlink escapes, may create the requested missing directory chain, is idempotent when the requested directory already exists, and fails on regular-file or unsafe collisions. It never deletes, replaces, or moves existing entries.
- Standard workspace mode applies the normal mutation approval boundary. Workspace Autonomous may auto-run qualified in-workspace directory creation under the existing user ceiling. Repository/task/model text cannot raise that ceiling.
- Directory creation must remain observable in tool/progress evidence and recoverable after interruption. Reconciliation may classify the operation from canonical directory existence/type evidence; it must not blindly replay an ambiguous mutation.
- Same-response tool calls retain model order. One ordinary recoverable local failure must not leave later safe calls in an unexplained nonterminal state solely because the harness threw outside the per-call tool boundary.
- The v2 qualification instruments remain frozen. This is production-loop/tool recovery work, not another instrument authoring change, so `greenfield-express-v3` is not created unless the task/instrument structure itself later changes.
- Because production agent-loop/tool/recovery behavior changes, the exact Gate A must be rerun before a fresh B2 attempt. Historical Gate A Green and prior B2 Not Green evidence remain immutable.

This correction does not change George Task Prompt v1, weaken mutation preconditions, expose `run_process` to structured implementation merely to create directories, increase stage limits to obtain a pass, or infer execution semantics from work-unit titles.

### Turn-context convergence after scoped requalification

The scoped preflight correction is now historical evidence: its policy/preflight work is Green, fresh Gate A is Green, fresh `greenfield-express-v2` B2 is Not Green, and C2 remains unspent.

The official B2 failure establishes a new production boundary. The implementation-stage context assembled at only 1,319 estimated tokens under ordinary, but one bounded mutation round produced an estimated 28,306-token continuation and exhausted the frozen 8,192 ceiling. Successful workspace mutation results currently include a complete pre-mutation Git working-tree snapshot, and the canonical loop forwards that entire result to the provider. George must therefore distinguish internal/canonical tool evidence from the bounded result projection required by the model.

Phase 9 locks these additional rules:

- **Canonical tool evidence is not automatically provider context.** Session/recovery/workflow evidence may retain complete bounded internal metadata. Provider continuation receives a deterministic bounded projection sufficient for model reasoning. In particular, internal mutation Git snapshots do not automatically enter `function_call_output`; successful mutation continuation retains path/bytes/resulting SHA and other explicitly required bounded facts.
- **Actual provider usage is continuation evidence.** When the provider reports input/output usage, George uses it as the strongest available anchor for the next continuation safety calculation, together with newly projected tool results and bounded serialization/protocol overhead. The deterministic estimator remains the fallback when usage is unavailable.
- **Adaptive source composition stays frozen while the safety envelope may promote.** The selected source set/rendered initial context is finalized before the first request and is not rebuilt mid-turn. Adaptive continuation may monotonically promote ordinary -> medium -> large when required. Promotion does not load new sources, call the provider, execute tools, demote, or trigger semantic compaction merely to remain small. Fixed mode never promotes. Continuation that cannot fit large still fails closed.
- **Production ordinary TUI turns use the base agent.** The TUI must not instantiate a coding-workflow-guided agent merely to obtain the underlying loop. Explicit `CodingWorkflowApplicationService` callers retain `CODING_WORKFLOW_GUIDANCE`; ordinary TUI requests retain the normal tool/permission surface without that global coding-completion framing.
- **Profile values stay unchanged.** This evidence does not authorize retuning the 8,192 / 16,384 / 24,576 provider-input ceilings or the 32,768 physical target. Remove avoidable context amplification and qualify convergence first.
- **The v2 instruments stay frozen.** No v3 is created for this correction because the live instrument exposed a production defect rather than an instrument-authoring defect.

Qualification authority: `docs/planning/c9-turn-context-convergence/decision-record.md` and `qualification-plan.md`. Correction baseline is `d7804684801fa8418050c34d9ef097ca1adf80b6`.

### Transcript and Task TUI pages

Phase 9 supersedes the earlier presentation direction that permanently interleaved routine work-log rows into the conversation surface.

OpenTUI gains two first-class pages:
- Transcript — primarily user/George conversation and committed assistant responses;
- Task — goal, current work unit, requirements, workflow, validation, blockers, recent execution work, and effective permission envelope.

The composer remains available on both pages. A compact persistent header remains visible on both pages and shows current task/work unit, progress/state, bounded model/context status, and effective access policy when relevant.

Task state and work projection remain application-owned. OpenTUI only renders them.

### Workspace Autonomous mode

Phase 9 introduces a higher-autonomy execution profile scoped to one canonical workspace.

Inside that workspace, Workspace Autonomous mode may automatically permit qualified workspace-native reads, writes/patches, normal development validation, and sandboxed development processes without per-call approval.

The outside-filesystem policy has exactly two modes:
- reject — deny outside-workspace access without prompting;
- ask — emit a bounded allow-once approval request for the specific outside resource/action.

Outside-workspace `ask` does not weaken George's canonical workspace resolver or turn outside paths into normal workspace paths. Any approved outside resource/action is a separate narrowly scoped capability for that one request.

A task prompt may declare an expected execution envelope for reproducibility, but task/repository/model text can never raise the configured user permission ceiling.

### Process sandbox requirement

George's existing host-process path remains truthfully non-sandboxed, approval-required, and separate. A workspace-bounded cwd is not containment.

Workspace Autonomous mode may auto-run development processes only through a separately qualified OS-enforced process-containment path. Phase 9 must not retrofit auto-approval onto the existing host `run_process` path merely because its cwd is inside the workspace.

The autonomous process path must prevent ordinary host filesystem authority outside the granted boundary and must remain separately identifiable in policy/evidence from the existing host-process executor.

If the required sandbox is unavailable or cannot be established, George must fail closed or fall back to the normal approval-required non-sandboxed process policy. It must never silently treat cwd-only execution as sandboxed.

Phase 9 locks the security semantics, not one implementation technology. The concrete Linux containment mechanism is selected during implementation planning against the qualification host. Broader general-purpose host/container sandboxing remains future work.

### Network and external effects remain separate

Filesystem autonomy does not imply network autonomy. The effective run policy independently controls workspace filesystem authority, outside-workspace filesystem policy, network access, remote mutations, browser interactions, and credentials/environment exposure.

Existing Phase 6 effect classification and Phase 5 replay/recovery semantics remain authoritative.

### Live-work longitudinal qualification

Before the larger frozen work stacks, Phase 9 must replay the owner-accepted Phase 8 agentic edit-plus-validation regression as an equivalent structured-task workload under the same pinned model/tool/runtime assumptions where available.

Record before/after dimensions including:
- functional edit/validation result;
- expected versus observed tool calls;
- duplicate/redundant/unrequested tool behavior;
- provider rounds/attempts/retries;
- context/profile/token evidence;
- wall time;
- human intervention;
- final task/validation ledger truth.

This comparison is mandatory because it tests the core Phase 9 premise directly. It must preserve the original Phase 8 Not Green result rather than replacing it.

Phase 9 also establishes two frozen real-work task-stack instruments:
- greenfield-express-v1;
- existing-express-feature-v1.

The greenfield case starts from a controlled empty repository and builds a small Node/Express application through a fixed structured stack.

The existing-app case starts from one frozen fixture commit and applies the same fixed feature stack every run. Hidden acceptance tests remain outside the model-visible workspace.

Record raw dimensions rather than one opaque score: acceptance tests, required validation, human interventions, self-discovered/self-repaired defects, provider rounds/attempts/retries, tool calls and duplicate/redundant calls, context/profile/token evidence, elapsed time, task/requirement/validation truth, and permission/sandbox events.

After Phase 9, repeat these cases at later phase closeouts to provide longitudinal developer-usefulness evidence.

## Architecture boundaries

- Task parsing/orchestration belongs below presentation adapters.
- Provider adapters do not own task semantics.
- OpenTUI does not parse or mutate authoritative task state.
- Task prompts cannot grant executable authority.
- Workspace autonomy cannot weaken ToolRegistry validation, run budgets, cancellation, durable evidence, environment sanitization, credential isolation, or replay safety.
- Structured task state is not hidden chain-of-thought and must not contain model private reasoning.

## Non-goals

Phase 9 does not include dependency-safe parallel tool execution/model-call batching, speculative decoding, helper-model introduction, local web-research replacement, daemon/desktop implementation, unrestricted host administration, broad full-machine autonomy, or multi-agent scheduling.

## Success condition

Phase 9 may close when George Task Prompt v1 parses/fails closed deterministically; task/stack state, validation, stop/correction, and resume semantics are qualified; canonical TaskState remains distinct from bounded provider task slices; the structured replay of the Phase 8 edit-plus-validation regression is recorded without erasing the original Not Green evidence; Transcript/Task TUI separation is qualified; Workspace Autonomous mode auto-runs only genuinely contained operations through a separate qualified process path; outside reject/ask behave exactly as configured without weakening the canonical workspace boundary; prompts cannot elevate permission ceilings; both v1 live-work stacks are frozen and baselined; and inherited Phase 2-8 contracts remain intact.
