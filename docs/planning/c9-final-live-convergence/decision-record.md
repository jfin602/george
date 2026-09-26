# Correction 9 Decision Record — Final Live Convergence

Status: **APPROVED DIRECTION — ACTIVE FINAL PHASE 9 CORRECTION**

Date: 2026-09-26

Package boundary: `0.9.10` unchanged.

Starting repository HEAD:
`3d1b801f41354f78584b81b444c6faabbdc6fa44`.

Primary evidence:
- `docs/tasks/c9-final-qualification/report.md`;
- `docs/tasks/c9-final-qualification/failure-ledger.json`;
- `docs/tasks/c9-final-qualification/evidence/**`;
- current Phase 9 qualification/stability/workflow authority.

## Current state

The full final sweep ran all five live workloads once after common validity gates.

Current deterministic/broad state:
- focused qualification/provider/tool/recovery/Workspace Autonomous/Phase 4/5/9 floor Green;
- focused OpenTUI Green;
- `npm run typecheck` Green;
- `npm run test:runner` Green;
- broad `npm test`: 417 passed, 0 failed, 1 non-TTY skip;
- greeting Green;
- three-file Green.

Fresh live blockers:
1. **Gate A** — exact edit, validation, TaskState, hidden acceptance, and intervention/exhaustion requirements passed, but the model requested 12 tools against the historical <=10 convergence ceiling.
2. **B2** — P1 completed and validated; P2 failed when an LM Studio response emitted response-start and tool-call evidence but never completed before the 120000 ms provider timeout.
3. **C2** — INSPECT found the correct files; implementation then consumed the eight-call stage ceiling mostly re-inspecting already-observed state, and the actual `apply_patch` became call 9 and was rejected.

The original B2 P1 stage-limit defect and C2 missing-INSPECT-evidence defect did not recur.

## Decision — alignment/convergence is the final Phase 9 product problem

The remaining evidence points to an alignment/convergence problem more than a raw context-capacity problem.

George already owns canonical TaskState, structured work units, inspection evidence, mutation epochs, validation state, stop conditions, run budgets, duplicate-read guards, provider-visible result projection, and context selection.

The final Phase 9 correction must make the canonical loop use that authoritative state more aggressively to keep the primary model aligned.

This correction does **not** introduce a helper/utility model.

## Decision — deterministic mission card

Before every structured implementation/correction provider round, George must project a small deterministic **mission card** derived only from canonical George state and bounded observed evidence.

This is a real round-to-round application/core seam, not merely richer stage-entry prose. The current structured service renders its task slice once and the canonical agent loop owns later provider continuations; therefore implementation must let structured execution supply/recompute bounded alignment context for **every** implementation/correction provider request, including continuations after tool results. The seam remains provider-independent and must not live in the LM Studio adapter.

The mission card is provider-facing derived context, never authority.

It should contain, when applicable:

### Current objective
- active task/work unit;
- bounded work-unit completion condition.

### Must preserve
- applicable requirements/invariants;
- active permission/stop constraints.

### Observed
- bounded successful inspection evidence relevant to the current unit;
- current file SHA/text-framing metadata where already observed;
- relevant recent tool/validation failure evidence;
- known directory/path facts;
- latest mutation-invalidated evidence state.

### Completed
- immediately relevant completed inspection/work/validation facts;
- never model-asserted completion.

### Do not repeat
- replay-safe observations that remain valid in the current mutation epoch;
- completed inspection that should not be re-proven unless mutation invalidated it.

### Next completion condition
- the exact George-owned condition that advances the current stage;
- George-owned validation that will run after model work, where applicable.

### Stop if
- applicable authored stop conditions;
- hard permission/recovery/budget conditions.

The projection must be bounded, deterministic, and stable for identical canonical state.

It must never:
- mark a requirement/work unit/validation complete by model inference;
- summarize away unresolved failure/recovery evidence;
- raise permissions;
- replace TaskState/session/event authority;
- become a second task parser;
- contain model private reasoning.

## Decision — task drift and redundant work

The harness should optimize what the model is allowed/required to do before another model is added.

For structured work:
- implementation should consume prior INSPECT evidence rather than re-run broad inspection from scratch;
- repeated unchanged reads remain bounded by duplicate/no-progress guards;
- model attempts to invent completion artifacts such as `.george/completion.md` are out of scope unless the task explicitly requests them;
- after a work-unit completion condition is materially satisfied, the provider-facing projection should direct the model to stop proposing unrelated verification or mutations and allow George-owned validation to run;
- mutation invalidates only evidence actually made stale; unaffected evidence should remain reusable.

The current all-or-nothing `stageEvidence = []` behavior after any direct mutation is too coarse for this final alignment contract. Replace it with the smallest ephemeral typed evidence/freshness representation sufficient to preserve unaffected observations while invalidating stale path/resource evidence. At minimum retain bounded identity/source, affected path/resource where applicable, safe projected fact, and a freshness/mutation-epoch relationship.

This freshness cache is derived runtime state, not durable TaskState authority. If a session/restart cannot reconstruct freshness safely from authoritative evidence, George must re-inspect rather than assume an old observation is current.

## Decision — call limits: safety ceiling versus efficiency target

The historical tiny call ceilings were introduced to prove convergence against Phase 8-style looping. They are not permission boundaries.

This correction separates:

1. **hard runaway/safety budget**
   - bounded and enforced;
   - large enough for legitimate structured work;
   - still subordinate to task-wide run budgets, cancellation, permission, duplicate/no-progress, and recovery rules.

2. **duplicate/no-progress guard**
   - remains strict;
   - repeated equivalent reads/stale retries must still terminate or redirect quickly.

3. **efficiency/convergence target**
   - tool calls and provider rounds remain measured;
   - exceeding an efficiency target does not by itself make an otherwise correct functional workload Not Green unless the workload actually hits a hard convergence budget or violates an explicit product requirement.

Historical Gate A results that failed the old <=10 criterion remain historical Not Green under that criterion.

The final Phase 9 qualification must report functional correctness and efficiency separately.

Exact revised hard-stage values must be selected from current observed workloads and deterministic tests, not by arbitrary inflation. The implementation must demonstrate that C2 can reach its first legitimate mutation without being blocked solely by redundant pre-edit inspection.

Earlier correction authority that said not to raise structured stage limits remains historically correct for the correction that authored it. The final sweep provides new evidence and this record explicitly **supersedes that restriction for current Phase 9 final qualification**. Raising a hard ceiling is permitted only as part of the documented hard-budget/efficiency separation with permanent tests; it is not permission to delete convergence controls or inflate a number ad hoc until a gate passes.

## Decision — safe provider partial-response timeout convergence

B2 exposed a separate provider-lifecycle defect class.

Observed sequence:
- provider request begins;
- `provider.response.started` is emitted;
- tool-call proposals are streamed;
- no completion event arrives;
- LM Studio times out at 120000 ms;
- no proposed tool from that incomplete round is executed.

The correction must distinguish:
- **provider response evidence observed**;
- **provider side effect/tool execution observed**;
- **canonical assistant commit observed**.

A transport/provider attempt whose response is incomplete but for which George has executed no tool, committed no assistant response, and observed no ambiguous external side effect may be eligible for a bounded fresh provider retry/restart under an explicitly qualified rule.

A safe fresh retry must discard the incomplete provider branch completely: provisional assistant text and streamed tool proposals from that attempt remain diagnostic evidence only, are never executed, and are never promoted into the canonical transcript or next continuation. The failed attempt's response ID must not be reused. The retry starts from the same canonical pre-round application state with a new provider-attempt identity.

Do not:
- blindly replay executed tool calls;
- retry after ambiguous external effects;
- treat partial streamed tool proposals as executed effects;
- merely inflate the timeout to obtain a pass.

Permanent tests must cover timeout before any response, timeout after response-start only, timeout after streamed tool proposals but before response completion, timeout after tool execution/ambiguous effect, cancellation, and retry exhaustion.

## Decision — helper-model sequencing

A helper model could materially help with:
- old-history compaction;
- log/tool-result summarization;
- relevance ranking;
- bounded context extraction;
- diff summarization;
- classification/routing.

But Phase 9 must close on a **single-primary-model architecture** so failure attribution remains clean.

Canonical law:

`George canonical state -> deterministic mission card/alignment projection -> optional evidence preparation -> primary model -> George validation`

A future helper may operate only on the **optional evidence preparation** step.

It may never:
- own TaskState;
- decide that work/validation is complete;
- grant permissions;
- invoke tools independently;
- override stop conditions/invariants;
- replace canonical session/tool evidence.

## Roadmap consequence

The intended sequence becomes:

`Phase 9 final convergence -> Phase 10 agent-loop throughput -> bounded helper A/B experiment -> Phase 11 consolidated primary-only baseline -> Phase 12 broader utility-model roles`.

The post-Phase-10 helper experiment is deliberately narrow and non-authoritative.

Initial preferred experiment:
- one job only, such as recent-history/tool-result compression or relevance selection;
- A/B against the same frozen workloads and primary-only loop;
- measure primary tokens saved, primary rounds avoided, success-rate change, helper latency/cost, and new failure rate.

The experiment does not become production authority merely because its summaries look good.

Promotion requires:

`primary tokens saved + primary rounds avoided + success-rate improvement > helper inference cost + latency + new failure rate`.

Phase 12 remains the phase that owns broader utility-model integration.

## Final correction scope

The correction should include:

1. deterministic mission-card/alignment projection;
2. structured evidence reuse/no-repeat semantics;
3. separation of hard convergence ceilings from efficiency metrics;
4. safe partial-provider-response timeout/retry handling;
5. permanent regression guards for Gate A/C2 alignment and B2 provider lifecycle;
6. one complete final five-workload sweep;
7. evidence-only closeout.

## Preserved boundaries

Do not:
- weaken permissions, recovery, SHA/framing, containment, hidden acceptance, or TaskState authority;
- rewrite historical attempts;
- change v1/v2 task instruments solely to obtain a pass;
- introduce a helper model into Phase 9;
- hide native real-TTY/GPU Offload Evidence Gaps;
- owner-close Phase 9 until the final qualifying chain is Green.


## Inserted correction — provider stall recovery

The first P3 final-sweep attempt after P1/P2 is preserved as interrupted diagnostic evidence.

Repeated incomplete/stalled LM Studio behavior during Gate A demonstrated that replay-safe retry alone can still consume operationally unacceptable wall-clock time. `c9-provider-stall-recovery` is inserted before the final qualifying P3 rerun.

The final convergence architecture remains authoritative. The inserted correction may add provider-stall watchdog/recovery/rebase behavior, but it must not weaken mission-card alignment, evidence reuse, hard convergence ceilings, duplicate/no-progress protection, or P2 replay safety.

After the inserted correction is qualified, rerun P3 from greeting through C2 once against the new candidate. Do not treat the interrupted attempt as the final qualification.
