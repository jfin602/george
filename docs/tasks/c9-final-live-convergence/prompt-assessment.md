# c9-final-live-convergence Prompt Assessment

Status: READY FOR FINAL PHASE 9 CORRECTION

Correction: `c9-final-live-convergence`  
Roadmap phase: 9  
Required unchanged package version: `0.9.10`

## Trigger

The final full sweep at repository commit `3d1b801f41354f78584b81b444c6faabbdc6fa44` established a nearly clean Phase 9 baseline:

- broad `npm test`: 417 passed, 0 failed, 1 non-TTY skip;
- greeting: Green;
- three-file: Green;
- Gate A: exact edit, V1, completed/verified TaskState, hidden acceptance, zero intervention/exhaustion all Green, but 12 model-requested calls exceeded the historical <=10 convergence ceiling;
- B2: P1 completed and validated; P2 failed on an LM Studio 120000 ms timeout after response-start/tool-call evidence but before response completion;
- C2: correct INSPECT evidence existed, but implementation spent all 8 allowed stage calls re-inspecting and the first legitimate `apply_patch` became call 9.

Old B2 P1 stage-limit and C2 missing-INSPECT-evidence failures did not recur.

## Diagnosis

The remaining product issue is alignment/convergence rather than raw context capacity.

George already owns:
- TaskState/StackState;
- work-unit requirements/invariants/stops;
- INSPECT evidence;
- read SHA/text-framing;
- duplicate-read tracking;
- mutation epochs;
- validation truth;
- recovery state;
- permission policy;
- provider-visible result projection;
- task/run budgets.

But the structured slice is rendered once at stage entry, while `one-turn.ts` owns later provider continuations. Therefore current authoritative state is not aggressively re-projected before each reasoning continuation.

Current stage evidence is also too coarse: after any direct mutation, `stageEvidence` is cleared wholesale. That safely avoids stale data but throws away unaffected evidence and encourages repeated inspection.

## P1 scope — deterministic alignment

### Per-round mission card

Add a provider-independent continuation alignment seam to the canonical loop.

Structured implementation/correction must recompute a bounded mission card before every provider request, including continuation rounds after tool results.

The mission card derives only from George-owned canonical state plus bounded observed/derived evidence.

It includes as applicable:
- current objective/work unit and completion condition;
- applicable requirements/invariants/stops;
- permission constraints;
- relevant valid observations;
- SHA/text-framing/path facts already observed;
- recent relevant failures;
- completed current-stage facts;
- explicit no-repeat facts;
- next George-owned completion/validation condition.

It never:
- changes TaskState;
- marks completion by model inference;
- grants permissions;
- hides unresolved recovery/failure evidence;
- becomes durable authority;
- includes private reasoning.

### Evidence freshness

Replace all-or-nothing stage-evidence clearing with the smallest typed ephemeral freshness model.

At minimum an evidence item needs:
- stable bounded identity/source;
- resource/path when applicable;
- bounded projected fact;
- freshness relationship to mutations/current epoch.

A mutation invalidates affected evidence only. Unaffected observations remain reusable.

Reopen/restart without safely reconstructible freshness re-inspects rather than trusting stale derived state.

### Convergence limits

Separate:
- hard runaway ceiling;
- duplicate/no-progress limit;
- efficiency target.

Do not use the historical <=10 Gate A target as a functional pass/fail rule in the new sweep.

The earlier prohibition on raising stage limits remains historical; current authority deliberately supersedes only that stage-limit portion because C2 proved the fixed implementation ceiling can block the first legitimate mutation.

Choose the smallest justified hard stage ceilings from current evidence/tests. Do not remove task-wide budgets or strict no-progress guards.

## P2 scope — incomplete provider branch retry

Current provider retry logic refuses retry after any response evidence.

B2 proves a finer replay-safety boundary is needed.

A failed provider branch may be retried only when:
- the response never completed;
- no tool proposed by that branch executed;
- no canonical assistant response committed;
- no ambiguous external/remote side effect occurred.

A safe retry:
- preserves the failed attempt as evidence;
- discards provisional text/tool proposals from that branch;
- executes none of those proposals;
- does not reuse the incomplete response ID;
- starts a fresh provider attempt from the same canonical pre-round state;
- consumes normal retry/run budget;
- stays cancellable.

No timeout inflation merely to obtain a pass.

## P3 scope — final qualification

After P1/P2, run exactly once each in isolated workspaces/sessions:

1. greeting;
2. three-file;
3. Gate A;
4. B2;
5. C2.

No repair between workloads.

Gate A functional qualification no longer fails solely because the historical <=10 efficiency target is missed. Record calls/rounds separately.

B2/C2 must fully complete under their unchanged v2 task/acceptance semantics.

## P4 scope — closeout

Evidence-only.

Phase 9 ready for owner closeout only when:
- correction deterministic floors Green;
- no blocking broad/security/recovery regression;
- greeting Green;
- three-file Green;
- Gate A functional Green;
- B2 Green;
- C2 Green;
- no blocking Evidence Gap.

If ready, next action is separate `/closeout phase 9`.

## Preserved boundaries

Do not:
- introduce helper/utility inference into Phase 9;
- edit frozen v1/v2 tasks/acceptance merely to pass;
- weaken SHA/framing, permissions, recovery, containment, or hidden acceptance;
- rewrite historical failures;
- treat native real-TTY/GPU-Offload gaps as Green;
- owner-close Phase 9 inside this correction.

## Model routing

- P1: Sol High;
- P2: Sol High;
- P3: Sol Medium;
- P4: Sol Medium.

All are runner-supported exact labels.
