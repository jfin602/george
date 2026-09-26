# Correction 9 Decision Record — Turn Context Convergence

Status: **APPROVED DIRECTION — ACTIVE PHASE 9 CORRECTION**

Date: 2026-09-26

Package boundary: `0.9.10` unchanged.

Correction baseline: `d7804684801fa8418050c34d9ef097ca1adf80b6`.

Authority and preserved evidence:
- `docs/tasks/c9-qualification-preflight-scope/closeout.md` — policy/preflight qualified, fresh Gate A Green, Gate B2 Not Green, Gate C2 not run;
- `docs/tasks/c9-qualification-preflight-scope/evidence/gate-b2/attempt.json` and `trace.json` — official B2 continuation failure;
- `docs/tasks/c8-agentic-context/closeout.md` — inherited Phase 8 agentic-context Not Green / Evidence Gap truth;
- Phase 3/5/8 context, recovery, trust, and frozen-turn safety contracts unless explicitly refined below.

## Problem

The latest official `greenfield-express-v2` Gate B2 reached the corrected production mutation path but failed before P1 completion because provider continuation state exceeded the frozen ordinary profile.

The implementation-stage context assembly was only 1,319 estimated tokens under the ordinary 8,192-token provider-input ceiling. Qwen then requested four ordered tools: one existing-file write that failed normally, `create_directory("src")`, and two successful small `write_file` calls. Before the next provider round, George estimated continuation context at 28,306 tokens and terminated the stage as `budget_exhausted`.

Source inspection establishes a concrete amplification path: successful `write_file` and `apply_patch` results currently include the full pre-mutation `GitWorkingTreeSnapshot`. The snapshot is useful canonical George evidence, but the agent loop forwards the entire tool result as the next provider `function_call_output`. Internal diagnostic/recovery evidence is therefore being repeated into model context even when the model only needs the mutation receipt.

A separate ordinary interactive transcript exposed a second continuation defect. George allowed requests whose local continuation estimate fit the frozen ordinary profile, then LM Studio reported actual provider input of 8,231, 8,574, and 8,509 tokens — above the 8,192 ordinary ceiling. Provider-reported usage is stronger evidence than the local approximation but currently arrives only after the request and causes terminal failure rather than bounded adaptive convergence.

The same transcript also showed a simple `hi` expanding into repository inspection. Production TUI startup currently creates a `CodingWorkflowApplicationService` and then extracts its agent for `StructuredTaskApplicationService`. That permanently injects `CODING_WORKFLOW_GUIDANCE` into the base agent used by ordinary TUI turns, even when the user did not request a coding completion.

These are production convergence defects. They are not evidence that the current 8,192 / 16,384 / 24,576 profile constants are wrong.

## Decision — canonical tool evidence and provider-visible results are distinct

George must introduce an explicit provider-result projection boundary.

Canonical application/session/recovery evidence may retain the complete bounded tool result required for audit, reconciliation, Git/user-work preservation, or later George-owned logic.

The result sent back to the model is a separate deterministic projection containing only information needed for subsequent reasoning.

For built-in workspace mutations:
- successful `write_file` / `apply_patch` provider results include bounded mutation receipt fields such as tool name, path, byte count, and resulting SHA-256;
- successful `create_directory` provider results include the requested path and bounded creation outcome;
- ordinary known failures expose only their bounded error code/message;
- the internal pre-mutation Git snapshot remains canonical George evidence and is **not** included in provider continuation unless a future explicit provider-facing contract independently requires a bounded projection of it.

The projection boundary must not:
- alter canonical tool execution truth;
- weaken recovery or Git dirty-state evidence;
- remove information required for safe mutation convergence;
- grant permissions or change tool effects;
- expose file bodies or unrelated workspace state merely because George retained them internally.

Provider projections must remain deterministic and bounded. Existing plugin/adapter tools keep their current bounded provider result semantics unless they carry internal-only metadata that requires an explicit projection.

## Decision — continuation accounting uses provider evidence when available

Initial context assembly and source budgeting remain provider-independent and unchanged.

After a provider response reports usage, George must use that actual usage as the strongest available anchor for the next continuation safety decision. The next-request estimate must conservatively account for:
- the provider-reported input already consumed by the response chain;
- provider-reported output that becomes part of continuation state;
- the newly projected tool results;
- deterministic serialization/protocol overhead or another explicitly conservative provider-independent margin.

When provider usage is unavailable, George may fall back to the existing deterministic estimator, but the fallback must remain conservative and observable.

Run-wide token accounting is not a substitute for per-request continuation safety. Provider usage may increase run-budget counters and also inform continuation safety, but those are distinct decisions.

## Decision — freeze source composition, not the adaptive safety envelope

Phase 8 source selection remains finalized before the first provider request.

For an adaptive turn:
- active source identities, instruction precedence, routed documents, activated skills, current task slice, and initial rendered context remain frozen for the turn;
- George must not reassemble the turn merely because continuation grows;
- George may monotonically promote only the **effective provider-input safety envelope**: ordinary -> medium -> large;
- promotion occurs only when the next continuation or reported provider usage cannot safely remain within the current envelope and does fit a larger existing profile;
- promotion never demotes, adds context sources, changes source disposition, invokes the provider, executes a tool, or triggers semantic compaction merely to remain small;
- promotion is recorded as bounded diagnostics with from/to profile IDs, reason category, and the relevant estimated/observed token evidence.

For fixed mode, the selected concrete profile remains fixed exactly as before. Fixed ordinary does not promote to medium.

If continuation cannot fit the existing large 24,576 provider-input ceiling, George still fails closed under the inherited contract.

Provider-reported usage that exceeds the current adaptive envelope but fits a larger existing envelope promotes monotonically instead of retroactively destroying an otherwise valid turn. Usage above the large ceiling remains terminal.

This correction changes the frozen-turn rule only at the safety-envelope layer. It does not reopen Phase 8 source-selection, precedence, compaction, or profile-value policy.

## Decision — ordinary TUI turns use the base agent

Production TUI startup must construct the canonical base `AgentLoopApplicationService` directly and pass that agent into `StructuredTaskApplicationService`.

`CodingWorkflowApplicationService` remains a valid explicit application surface and continues to add `CODING_WORKFLOW_GUIDANCE` for callers that intentionally select a coding-completion workflow.

Ordinary TUI turns:
- do not receive coding-completion guidance merely because George is a coding agent;
- retain the normal tool surface and may still inspect or modify a repository when the user asks;
- are not routed by a brittle semantic classifier that guesses whether free-form text is "chat" or "coding";
- continue through the same permission, context, recovery, session, and provider boundaries.

Structured `GEORGE TASK FORMAT: 1` prompts keep their existing explicit inspection/implementation/correction stage guidance.

## Preserved profile and instrument policy

This correction must not:
- change the 32,768 physical context target;
- change ordinary 8,192, medium 16,384, or large 24,576 provider-input ceilings;
- change the profile preferred-working-set or soft-pressure constants;
- create `greenfield-express-v3` or `existing-express-feature-v3`;
- rewrite v1/v2 fixtures, task stacks, metadata, acceptance, or historical attempts;
- change Task Prompt format 1;
- weaken tool permissions, SHA preconditions, text-framing authority, Workspace Autonomous boundaries, or recovery semantics;
- use semantic/provider-backed compaction as the ordinary/medium promotion mechanism.

The v2 instrument behaved correctly by exposing a production defect. Fix George, not the instrument.

## Qualification and closeout rule

The correction must install permanent executable regression coverage for:
- canonical-versus-provider tool-result projection;
- mutation Git snapshot exclusion from continuation;
- provider-grounded continuation accounting;
- monotonic adaptive envelope promotion;
- fixed-profile non-promotion and >large fail-closed behavior;
- production TUI base-agent wiring versus explicit coding-workflow guidance.

Before official Phase 9 gates, run two bounded live diagnostics:
1. ordinary `hi` smoke: one logical provider round, zero model-requested tools, successful direct assistant response, no context/task/run-budget exhaustion;
2. synthetic three-file inspection smoke in a non-George repository: successful explanation with required evidence retained, no frozen-profile exhaustion, and truthful promotion diagnostics if continuation requires promotion.

The three-file smoke is a reproduction fixture, not a product-level maximum-file rule.

After deterministic qualification and scoped preflight:
- compare the candidate against correction baseline `d7804684801fa8418050c34d9ef097ca1adf80b6` under equivalent broad-suite conditions;
- require the hard affected-system floor Green and broad regression delta Green;
- run one fresh Gate A;
- run one fresh Gate B2 only after Gate A Green;
- run one fresh Gate C2 only after B2 Green.

Historical Gate A/B2 results remain immutable. A later passing B2 does not erase the current 28,306 > 8,192 failure.
