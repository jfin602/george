# Phase 10 Owner Closeout

Status: **OWNER-CLOSED WITH EXPLICIT LIVE GEP-SELECTION NOT-GREEN ACCEPTANCE**

Closed: 2026-09-27  
Phase: 10 — Agent Loop Throughput  
Accepted package state: `0.10.12`  
Latest accepted production implementation commit: `759b07de1594cb6ce4bff6896f72f1dcbf64e502`  
Formal Phase 10 evidence closeout: `docs/phase-10-closeout.md`  
Generation-bottleneck correction closeout: `docs/tasks/c10-generation-bottleneck/closeout.md`  
GEP-compatibility correction closeout: `docs/tasks/c10-gep-compatibility/closeout.md`  
Phase 11 planned baseline transition: `0.11.0`

This record captures the owner's explicit `/closeout phase 10 owner approved` decision on 2026-09-27.

The owner accepts the implemented Phase 10 agent-loop throughput foundation and the current post-closeout correction candidate for roadmap progression.

This is an owner acceptance/waiver decision. It does **not** rewrite the formal Phase 10 closeout, either Correction 10 closeout, the live GEP-selection result, the historical/intermittent P7 result, Phase 9 B2/C2, or any remaining Evidence Gaps into Green.

## Owner waiver

The owner explicitly accepts the following current state for roadmap progression:

> Owner accepts the current live GEP-selection Not Green result for roadmap progression. Deterministic GEP correctness/compatibility/efficiency is Green; the real-model task completed successfully through legacy mutation fallback. Live GEP selection remains unresolved and should be investigated later using the observability infrastructure rather than additional blind Phase 10 correction cycles.

This statement is the authority for progression despite the final correction remaining Not Green / Not Qualified under its own qualification contract.

## Accepted Phase 10 capability state

The owner accepts the current Phase 10 implementation as establishing and carrying forward:

- Human mode versus internal Operation mode;
- George Operation Protocol v1 and bounded internal control output;
- stable provider prefix plus late application-owned round context;
- useful-output-aware provider liveness separated from response acceptance/prefill;
- finite provider stall/retry/rebase behavior;
- sequential multi-tool batching with deterministic provider-result ordering;
- dependency-safe concurrency for eligible replay-safe local reads;
- direct George-owned deterministic task/work/validation transitions where already qualified;
- focused correction frames with George-owned direct revalidation;
- provider-neutral explicit output-policy intent without automatic per-mode truncation;
- TaskState terminalization that blocks an active work unit consistently and persists durably;
- a 300-second default / 600-second maximum finite provider emergency timeout while preserving first-useful-output, active-output inactivity, cancellation, and retry safety;
- George Edit Protocol v1 parser, ephemeral receipt freshness, canonical mutation expansion, SHA/framing/permission/recovery authority, and response-completion-before-side-effect behavior;
- bounded additive GEP read projection with legacy mutation fallback;
- deterministic GEP mutation-transport and whole-exchange efficiency evidence;
- the repaired Phase 5 small fixed-context continuation path;
- Phase 10 telemetry, timing, provider-attempt, batching, concurrency, correction, GEP, budget, and task evidence needed by later observability work.

All inherited Phase 1-9 permission, containment, validation, recovery, task/session, evidence, provider-independence, and historical-evidence contracts remain authoritative unless a later approved phase explicitly changes them.

## Accepted current deterministic evidence

The latest `c10-gep-compatibility` candidate recorded:

- correction-focused deterministic floor: **293/293 Green**;
- applicable broad deterministic suite: **520 passed, 0 failed, 1 native-real-TTY skip**;
- frozen Phase 8 legacy write/framing-rejection/reread/patch recovery: Green;
- current Phase 5 fixed-profile workflow: Green, including both compactions, validation, and durable reopen;
- terminal TaskState / StackState / session persistence regressions: Green;
- generation-aware provider timeout semantics: Green deterministically;
- Mutation Transmission Ratio: approximately **0.00918**;
- Net Edit Transport Ratio: approximately **0.73218**.

The owner accepts these as current deterministic evidence. They do not erase earlier Not Green results.

## Accepted real-model evidence

The single official supported Node 26 + LM Studio/Qwen follow-up workload was functionally successful:

- provider attempts / logical rounds: **8 / 8**;
- retries / rebases: **0 / 0**;
- reported input tokens: **30,023**;
- reported cached input tokens: **16,468**;
- reported output tokens: **1,381**;
- aggregate provider-active time: approximately **276.5 seconds**;
- total elapsed: approximately **278.6 seconds**;
- George-owned validations: **2/2 passed**;
- final TaskState: **completed**;
- reopened TaskState: **completed**;
- human intervention: **0**.

The model used legacy `apply_patch` / `write_file` rather than emitting an existing-file GEP packet.

Therefore:
- live GEP selection remains **Not Green**;
- live GEP Mutation Transmission Ratio is unavailable;
- live GEP Net Edit Transport Ratio is unavailable;
- no claim is made that GEP improved live wall time or live token usage.

The functional success through the qualified legacy fallback is accepted for roadmap progression; the missing live GEP-selection evidence remains a real unresolved result.

## Preserved Not Green evidence

The owner explicitly preserves the following as Not Green:

### Live GEP selection

The required live existing-file GEP edit did not occur in the sole official attempt.

This remains the final blocking result in `c10-gep-compatibility`.

No rerun is authorized by this owner closeout merely to obtain a pass.

### Phase 10 P7 lifecycle-order evidence

The earlier Phase 10 read-concurrency qualification recorded one lifecycle completion-order assertion failure.

Later bounded/follow-up runs passed that assertion and establish intermittency only.

The historical failure remains Not Green evidence.

### Formal Phase 10 qualification history

The original formal Phase 10 closeout remains Not Green, including:
- unsupported Node/provider conditions during the original primary-only qualification;
- missing comparable P1-to-final live/benchmark delta;
- failed/unavailable provider-dependent benchmark evidence;
- fast and milestone live workloads not run in that formal closeout;
- helper A/B remaining an Evidence Gap.

Later Correction 10 evidence improves the current candidate but does not rewrite the original closeout.

### Earlier roadmap history

Phase 8 agentic-context Not Green / Evidence Gaps and Phase 9 B2/C2 Not Green outcomes remain immutable historical evidence.

## Preserved Evidence Gaps

The owner also accepts for roadmap progression:

- live GEP transport ratios remain unavailable because Qwen chose the legacy fallback;
- complete live GEP provider-read byte totals are unavailable;
- native real-TTY evidence remained skipped in the non-TTY qualification environment;
- the Phase 10 helper A/B candidate remained unavailable;
- historical runtime/provider/GPU/native-terminal gaps remain as recorded in their original evidence.

None is relabeled Green by this closeout.

## Why roadmap progression is accepted

Phase 10 has reached diminishing returns from blind terminal-era correction cycles.

The remaining live GEP failure is primarily a **selection and diagnosability problem**: the real model completed the task correctly but selected a qualified legacy mutation path instead of the optimized GEP path.

Understanding that choice requires richer evidence about:
- the exact normalized provider-facing request;
- context/source/tool-schema contributions;
- GEP eligibility and fallback state;
- provider rounds and tool selection;
- task/work/validation correlation;
- token/cache/timing relationships.

The approved roadmap now intentionally builds that capability through:

- Phase 12 — Local Daemon + Observability Foundation;
- Phase 13 — Native Desktop + Agent Observatory.

Continuing additional blind Phase 10 selection corrections before that infrastructure is not required for roadmap progression.

This closeout accepts the unresolved result so George can progress toward the tooling needed to diagnose it properly.

## Authority carried forward

Phase 11 and later phases must preserve:

- all accepted Phase 10 safety and correctness boundaries;
- the current deterministic GEP correctness/compatibility/efficiency evidence;
- the live legacy-fallback functional success;
- the explicit live GEP-selection Not Green result;
- Phase 10 P7 historical/intermittent evidence;
- response-completion-before-side-effect;
- canonical TaskState/StackState and George-owned validation/completion truth;
- provider-independent permission/recovery authority;
- historical benchmark/live-work evidence semantics.

Live GEP selection is a carried observability target, not a hidden prerequisite that may be silently marked fixed.

Any future claim that GEP is selected reliably or improves live performance requires fresh evidence after an approved implementation change.

## Phase 11 gate

The next roadmap phase is:

**Phase 11 — Final Acceleration + Primary-Model Performance Qualification**

The planned Phase 11 baseline transition is `0.11.0`.

The repository remains at package `0.10.12` until an explicit Phase 11 baseline transition.

Phase 11 should hand a frozen primary-model baseline into the already approved observability-first roadmap:
- Phase 12 — Local Daemon + Observability Foundation;
- Phase 13 — Native Desktop + Agent Observatory.

This owner closeout does not itself create the Phase 11 baseline, close Phase 11, or claim the unresolved GEP-selection result is Green.
