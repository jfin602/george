# Phase 8 Decision Record — Context Throughput Optimization

Status: APPROVED DIRECTION

Baseline: package `0.8.0`  
Current roadmap gate: Phase 8 — Context Throughput Optimization

## Problem

Phase 7 established a measured primary-model runtime control for the pinned Qwen3-Coder / LM Studio path. Phase 8 now owns provider-facing context throughput: reducing repeated prompt/prefill cost without weakening George's Phase 3 trust/precedence rules, Phase 5 recovery/compaction evidence, provider independence, or canonical session authority.

Phase 3 intentionally treated unused context as headroom rather than a fill target and introduced one conservative 32k operating profile. Phase 8 uses measured context-ladder evidence to split that operating policy into ordinary, medium, and large profiles, while preserving the original large profile as the backward-compatible fixed profile.

Phase 8 also prepares later stable-prefix, incremental-context, and provider-native reuse experiments. Those remain separate benchmark-gated changes after adaptive profile selection is qualified.

## Measured starting control

Qualification machine/runtime control:

- model: `qwen3-coder-30b-a3b-instruct@q4_k_m`;
- LM Studio physical context: 32,768;
- eval batch size: 2,048;
- physical batch size: 512;
- parallel/max concurrent predictions: 1;
- Flash Attention: on;
- GPU KV-cache offload: on;
- experts: 8;
- speculative draft: off;
- main-model GPU Offload UI value: 26.

GPU Offload 26 sustained 123 provider rounds at approximately 1.82 s average provider-round latency. The stress run remained behaviorally Not Green because three duplicated-tool-call events occurred; that evidence is retained separately and is not treated as a context-profile result.

Accepted context-ladder baseline at GPU Offload 26:

| Requested band | Actual provider input | Warm provider/model observation |
| ---: | ---: | ---: |
| 2,048 | 1,466 | ~1.15 s |
| 4,096 | 2,746 | ~1.06 s |
| 8,192 | 5,306 | ~1.46 s |
| 16,384 | 10,428 | ~2.24 s |

First-pass context-shape cost was much higher than warm steady-state cost. Phase 8 must preserve that distinction in later comparisons.

## Decisions

### Three operating profiles

Phase 8 defines three bounded profiles for the pinned 32k qualification target:

| Profile | Preferred working set | Soft pressure | Provider-input ceiling | Reserved headroom | Always-on target |
| --- | ---: | ---: | ---: | ---: | ---: |
| ordinary | 4,096–6,144 | 7,168 | 8,192 | 8,192 | 2,560 |
| medium | 8,192–12,288 | 14,336 | 16,384 | 8,192 | 2,560 |
| large | 12,000–18,000 | 20,000 | 24,576 | 8,192 | 2,560 |

All three retain a 32,768 physical context target.

The reserved-headroom value is a **minimum reserved amount**, not a target that George should fill up to. Unused context remains valid headroom.

The large profile preserves the Phase 3 Qwen/LM Studio profile value-for-value and remains the backward-compatible fixed profile.

### Adaptive versus fixed mode is explicit

George's context configuration must distinguish:

- **adaptive mode** — George selects ordinary, medium, or large per user turn;
- **fixed mode** — an explicit profile override remains fixed for that turn/run and disables automatic profile promotion.

The existing `DEFAULT_CONTEXT_PROFILE` remains the large profile for compatibility with code/tests/callers that explicitly consume a concrete profile value.

Normal George operation may switch to adaptive mode only after the adaptive-selection implementation is qualified. Until then, the existing large fixed behavior remains the runtime default.

### Selection is per user turn

Adaptive profile selection is finalized before the first provider request of a user turn.

Once selected, the profile remains fixed for all model/tool/provider rounds belonging to that user turn. George must not oscillate ordinary -> medium -> ordinary or otherwise resize the operating profile mid-turn.

A later user turn may select a different profile from current canonical state.

### Selection starts small and promotes monotonically

Adaptive selection probes profiles in this order:

`ordinary -> medium -> large`

Selection/promotion is application/context policy, not a provider decision and not model-generated routing.

George promotes when the smaller profile cannot safely preserve the selected working set or when required/current-task material would otherwise fail the profile's budget.

Promotion is appropriate when, for example:

- required George/current-user/tool context cannot fit safely;
- selected applicable project instructions would otherwise be lost;
- explicitly routed documents selected for the task would otherwise be deferred solely because the profile is too small;
- explicitly activated skill content needed for the turn would otherwise be omitted solely because the profile is too small;
- required/current task material reaches meaningful pressure such that the next bounded profile is the safer operating envelope.

Promotion is **not** required merely because unused capacity exists in a larger profile.

Lower-value optional defaults may still be omitted/deferred according to the existing Phase 3 whole-source precedence/budget rules instead of automatically forcing promotion.

### Required context must never fail because George guessed too small

An adaptive probe that fails a required source under ordinary or medium is a signal to try the next larger profile, not a final user-visible context failure.

Only the selected final profile may produce canonical context-assembly evidence for that turn.

If required context still cannot fit under large after applicable Phase 5 compaction/degradation behavior, George must fail/defer explicitly under the existing context contract. It must not silently truncate a critical source.

### Profile probes are local and side-effect free

Adaptive selection may perform deterministic trial assemblies, but a discarded probe:

- does not call the model/provider;
- does not execute tools;
- does not mutate session state;
- does not consume executable permission;
- does not create misleading duplicate canonical context-source lifecycle events;
- does not persist derived state as if it were the selected context.

The final selected assembly remains the authoritative provider-facing context for the turn.

### Promote before semantic compaction

Ordinary and medium profiles are operating envelopes, not reasons to spend extra primary-model calls.

If a turn exceeds ordinary or medium because completed history/selected context is too large, George promotes to the next profile **before** invoking semantic/provider-backed history compaction.

Phase 5 semantic history compaction remains a large-profile pressure mechanism.

This prevents adaptive profiles from becoming slower by invoking the primary model to summarize history merely to remain inside an artificially small profile.

Deterministic omission/defer behavior for genuinely lower-value optional sources remains permitted before promotion where consistent with Phase 3 precedence and current selected working-set semantics.

### Large profile retains Phase 5 pressure behavior

At large:

- whole-source omission/defer remains explicit;
- older completed history may compact when Phase 5 pressure rules justify it;
- compacted history remains derived provider-facing state, never canonical session authority;
- unresolved failures/side effects/recovery state cannot be silently summarized away;
- compaction failure degrades visibly;
- hard provider-input exhaustion remains an explicit terminal/defer condition.

Phase 8 does not rewrite Phase 5 recovery or compaction authority.

### Diagnostics must expose profile selection

Final context diagnostics must make adaptive behavior observable without exposing hidden reasoning.

At minimum record:

- mode: adaptive or fixed;
- selected profile ID;
- selected profile budgets/headroom;
- final estimated provider-facing tokens;
- bounded promotion evidence, such as attempted profile IDs and a machine-readable promotion reason category;
- normal source disposition/evidence already required by the context contract.

Diagnostics are derived observability and cannot affect provider/tool execution.

### Context composition tooling is measurement, not authority

The Phase 8 context profiler uses the real provider-independent context assembler to expose source composition and budget outcomes.

The candidate tooling defines ordinary, medium, and large profiles and deterministic ordinary/medium/large scenarios. It does not enable adaptive runtime selection by itself.

The profiler must never become a second implementation of precedence/budgeting rules.

### Phase 3 historical defaults remain historical truth

The Phase 3 decision record remains unchanged.

Its original 12k-18k preferred working-set target describes the first single Qwen/LM Studio profile that Phase 3 qualified. Phase 8 supersedes that **operating default** with measured adaptive profiles; it does not retroactively rewrite Phase 3 evidence.

Trust, precedence, whole-source budgeting, just-in-time routing, and smallest-sufficient-working-set laws remain inherited.

## Qualification contract

Adaptive-profile implementation is not accepted solely because smaller ceilings produce fewer tokens.

Deterministic qualification must prove:

1. ordinary fixture/scenario selects ordinary;
2. medium fixture/scenario promotes/selects medium;
3. large fixture/scenario promotes/selects large;
4. profile selection is deterministic for identical source state;
5. selection only promotes monotonically ordinary -> medium -> large;
6. profile selection is finalized before the first provider request and does not oscillate within the turn;
7. explicit fixed-profile override disables adaptive promotion;
8. `DEFAULT_CONTEXT_PROFILE` remains value-for-value compatible with the Phase 3 large profile;
9. George invariants/current user intent/required tool context are never lost because an undersized profile was tried first;
10. applicable selected project instructions, explicitly routed task documents, and explicitly activated skills promote rather than being accidentally discarded solely because ordinary/medium was undersized;
11. genuinely lower-value optional context may still omit/defer under the documented precedence/budget rules;
12. discarded probes make no provider call, tool call, session mutation, or misleading canonical context-source evidence;
13. stable source order/precedence remains identical across profiles;
14. ordinary/medium promotion happens before provider-backed semantic compaction;
15. existing large-profile Phase 5 soft/hard pressure, compaction, recovery, and evidence behavior remains unchanged;
16. profile/mode/promotion evidence is observable and bounded;
17. existing quick/full/context benchmark behavior remains intact;
18. known unrelated TUI test failures remain separately classified under the stability contract rather than being hidden.

### Live/performance gate

Extend the context-ladder qualification range so it can exercise all three operating regions, including a requested band around 24,576.

The qualification command target is:

```bash
npm run benchmark -- \
  --suite context \
  --context-bands 2048,4096,8192,16384,24576 \
  --repetitions 3 \
  --label p8-adaptive-profile-qualification
```

The context suite may need its current requested-band safety limit raised to permit the 24,576 qualification band. That change is benchmark tooling only and must not change normal George context limits.

Compare against the accepted Phase 8 context-ladder baseline. Record cold/first-shape cost separately from warm-state context/prefill cost.

Acceptance requires:

- deterministic context/profile qualification Green;
- no precedence, routing, recovery, or instruction-following regression;
- no increase in provider calls caused merely by ordinary/medium profile selection;
- representative ordinary work using the smallest sufficient profile;
- larger work promoting instead of silently losing selected context;
- measured latency/token improvement or clearly reduced context exposure on representative workloads.

## Subsequent Phase 8 experiments

Only after adaptive profiles are qualified, proceed one bounded experiment at a time:

1. stable source identity/order and stable provider-facing prefix improvements;
2. incremental/changed-context submission where semantically safe;
3. provider-native continuation/cache reuse where supported.

Provider-native state remains an optimization only. George's canonical normalized session/context history remains authoritative.

## Non-goals

Phase 8 does not include:

- helper-model semantic compaction;
- Phase 9 parallel tool execution;
- Phase 9 model-call batching/reduction;
- speculative decoding;
- daemon or desktop implementation;
- making LM Studio continuation/cache state canonical;
- changing tool permission authority;
- rewriting Phase 3/Phase 5 historical evidence.

## Closeout condition

Phase 8 may close when:

- adaptive profile selection is qualified and benchmarked;
- accepted context changes materially reduce provider-facing context/prefill cost or context exposure without correctness/evidence regressions;
- any stable-prefix/incremental/cache experiments attempted in the phase have explicit keep/revert decisions;
- the final accepted context policy is recorded with a reproducible benchmark baseline;
- all Not Green and Evidence Gap results remain explicitly recorded.
