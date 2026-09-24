# Phase 8 Implementation Plan

Status: CURRENT IMPLEMENTATION PLAN

Phase: 8 — Context Throughput Optimization  
Execution folder: `p8`  
Baseline: package `0.8.0`, main `e24776c7cf3cefc9d86991e6c268e6bdb88afa65`.

Read with `BOOT.md`, `AGENTS.md`, current product/architecture/workflow/stability/roadmap contracts, the Phase-8 decision record and measurement baseline, and `docs/tasks/p8/prompt-assessment.md`.

## Target architecture

```text
normal George turn
      |
application/context policy
      |
      +-- fixed mode ----------------> explicit concrete profile
      |
      +-- adaptive mode
             |
             +-- ordinary probe
             |      |
             |      +-- sufficient -> select ordinary
             |      `-- promote
             |
             +-- medium probe
             |      |
             |      +-- sufficient -> select medium
             |      `-- promote
             |
             `-- large
                    |
                    +-- assemble
                    `-- Phase-5 pressure/compaction when justified

selected provider-independent context
      |
provider adapter
      |
LM Studio Responses API
      |
optional provider-native continuation/reuse
      |
canonical George session/context remains authority
```

Adaptive trial assemblies are non-canonical. Only the final selected assembly emits normal provider-facing context/evidence.

## P1 — adaptive configuration and selector substrate

Target: `0.8.1`.

Add an explicit context operating mode rather than inferring intent from whether a concrete profile happened to be supplied.

The configuration shape should distinguish:
- adaptive selection over the canonical ordered profile registry;
- fixed selection of one validated concrete profile.

Backward compatibility:
- `DEFAULT_CONTEXT_PROFILE` stays equal/value-compatible with large;
- explicit `contextProfile` callers continue to receive fixed semantics;
- public core/context types remain provider-independent.

Create the smallest provider-independent selector/probe boundary needed by P2. It should accept already-resolved context inputs or an assembly callback and evaluate profiles in the canonical order ordinary -> medium -> large.

Probe rules:
- no provider calls;
- no tool calls;
- no session mutation;
- no hook invocation;
- no canonical `context.source` event emission;
- deterministic identical-input result;
- monotonic promotion only.

A required-source `ContextAssemblyError` from ordinary/medium is promotable rather than terminal.

Optional/routed omission alone is not automatically promotion. Promotion should be triggered when the selected working set cannot be preserved under the smaller profile according to the Phase-8 contract. Keep the decision mechanically testable; do not add model classification.

Define bounded promotion reason categories rather than free-form hidden reasoning.

Do not change the normal TUI/runtime default to adaptive until P2.

Regression focus:
- existing config callers;
- invalid profile validation;
- profile registry;
- profiler;
- context assembly;
- no provider/tool/session side effects from selector tests.

## P2 — per-turn adaptive application integration

Target: `0.8.2`.

Wire adaptive selection into the canonical agent loop.

Normal George configuration becomes adaptive. An explicit context-profile override remains fixed.

Selection timing:
1. load the exact context inputs needed for the turn;
2. perform deterministic non-canonical profile probes;
3. finalize one profile;
4. emit final context source/assembly evidence once;
5. begin provider execution.

The selected profile is immutable for the remainder of that user turn, including all tool continuation rounds.

Promotion behavior:
- required/current user/George/tool material that cannot fit promotes;
- explicitly selected applicable workspace/project guidance, routed task documents, and activated skills must not disappear solely because ordinary/medium was too small;
- genuinely lower-value optional defaults may still omit/defer according to existing rules;
- no downgrade/oscillation after promotion.

Pressure/compaction order:
- do not invoke provider-backed semantic compaction merely to preserve ordinary or medium;
- promote through ordinary/medium first;
- only large may invoke the existing Phase-5 hard/soft-pressure history compaction path;
- preserve checkpoint reuse, canonical history, unresolved-state preservation, cancellation, and failure behavior.

Avoid duplicating source loading side effects where possible. If profile probes require repeated assembly, suppress probe observations and emit observations for the final selected assembly only.

Extend `ContextDiagnostics` with bounded derived fields sufficient to expose:
- adaptive vs fixed;
- selected profile;
- attempted profile IDs;
- bounded promotion reason categories.

Do not surface hidden chain-of-thought or raw source bodies.

Preserve provider request count: adaptive selection itself creates zero model requests.

Regression focus:
- one-turn event ordering;
- context diagnostics;
- skill/routed-document turns;
- history compaction;
- tool loops;
- fixed override;
- cancellation;
- diagnostics/session sanitization.

## P3 — adaptive qualification and 24k context ladder

Target: `0.8.3`.

Raise only the benchmark context requested-band safety ceiling from 16,384 to 24,576 (or the narrowest value allowing the approved 24,576 band). This is benchmark tooling and must not alter George runtime context ceilings.

Add deterministic adaptive-profile qualification fixtures covering:
- ordinary -> ordinary;
- ordinary -> medium promotion;
- ordinary -> medium -> large promotion;
- identical inputs produce identical selection/evidence;
- fixed ordinary/medium/large stay fixed and do not promote;
- required source failure promotes rather than becoming final under ordinary/medium;
- explicitly selected project/routed/skill material promotes when needed;
- low-value optional source may still omit/defer without unnecessary promotion;
- no provider calls during profile probes;
- no tools/session mutation/hooks/canonical duplicate source events during probes;
- stable logical precedence/order across selected profiles;
- selected profile stays fixed through multi-round tool continuation;
- ordinary/medium do not invoke provider-backed compactor;
- large retains existing soft/hard compaction and checkpoint behavior;
- diagnostics expose bounded mode/attempt/promotion evidence.

Run focused/broad deterministic validation.

When the accepted local LM Studio/Qwen runtime is available, run the live adaptive context ladder with the accepted runtime control. Record exact provenance and artifact.

Use the exact operator pattern:

```bash
echo "MANUAL CHECK: LM Studio GPU Offload must show 26" && \
curl -fsS http://127.0.0.1:1234/api/v1/models | jq '
.models[]
| select(.key == "qwen3-coder-30b-a3b-instruct@q4_k_m")
| {
    key,
    loaded_instances: [
      .loaded_instances[]
      | {
          id,
          context_length: .config.context_length,
          eval_batch_size: .config.eval_batch_size,
          physical_batch_size: .config.physical_batch_size,
          parallel: .config.parallel,
          flash_attention: .config.flash_attention,
          offload_kv_cache_to_gpu: .config.offload_kv_cache_to_gpu,
          num_experts: .config.num_experts
        }
    ]
  }
' && \
npm run benchmark -- \
  --suite context \
  --context-bands 2048,4096,8192,16384,24576 \
  --repetitions 3 \
  --label p8-adaptive-profile-qualification \
  --compare /home/jfin/dev/george/artifacts/benchmarks/2026-09-24T20-03-38-980Z-90704/results.json
```

If main GPU Offload 26 cannot be independently confirmed, do not claim the live comparison is controlled.

Create `docs/tasks/p8/P3-adaptive-qualification-evidence.md` with deterministic and live evidence separated. Cold/first-shape and warm-state timing remain separate.

P3 is the hard gate before P4/P5.

## P4 — stable prefix and context identity experiment

Target: `0.8.4`.

Start from the accepted P3 adaptive baseline.

Inspect actual assembled/rendered context and LM Studio request construction before changing code. The current context assembler already has deterministic identity/order. Do not manufacture a rewrite if there is no safe repeated-prefix opportunity.

Candidate scope is limited to semantically neutral provider-facing stability:
- stable source identity/order;
- stable serialization of unchanged guidance/tool material;
- avoid volatile formatting/metadata in repeated prefixes where it is not semantically required.

Do not:
- reorder logical precedence;
- merge source trust classes;
- move conversation text into instructions;
- omit current user/task state;
- change selected profile thresholds;
- alter tool schemas or permissions;
- add provider-native continuation/cache authority.

Add deterministic tests showing identical logical context produces byte-stable provider-facing stable portions and that changed sources change only the expected portions where practical.

Benchmark exactly one candidate against the P3 accepted baseline. Keep the candidate only if correctness remains Green and measured latency/context behavior materially improves or the stable-prefix reuse evidence is otherwise concrete and useful.

If no safe/material improvement exists, revert the candidate implementation, retain tests/audit evidence as appropriate, and record the experiment as rejected/no-benefit. Do not stack a second prefix optimization inside P4.

Record the decision in `docs/tasks/p8/P4-prefix-experiment.md`.

## P5 — incremental/provider-native reuse experiment

Target: `0.8.5`.

Start only after P4 has an explicit accepted/rejected result.

The current LM Studio adapter already uses Responses `previous_response_id` for intra-turn tool continuation. Investigate one bounded reduction of repeated provider-facing material on continuation rounds.

Primary hypothesis to test:
- unchanged instructions and/or tool definitions may not need to be retransmitted on a valid provider-native continuation if LM Studio's Responses behavior preserves them.

Do not assume this is true.

Implementation must:
- remain behind provider/application interfaces;
- retain George's full normalized canonical context/session/tool evidence;
- keep a complete rebuild/fallback path when continuation is unavailable/rejected;
- preserve retry/recovery truth;
- never make provider response IDs the only history;
- remain intra-turn unless a separately justified contract is documented and qualified;
- not change permission/tool semantics.

Add adapter tests that capture exact request bodies for initial vs continuation calls and fallback/error cases.

Use controlled live evidence where available to compare provider-reported input tokens, first-output latency, provider active time, and correctness on tool-bearing workflows. Use an existing benchmark case or the smallest focused benchmark extension needed; do not combine with Phase-9 parallelism/model-call changes.

Keep/revert the candidate based on evidence and record `docs/tasks/p8/P5-reuse-experiment.md`.

If LM Studio behavior cannot be proved safely or no material benefit appears, retain the existing continuation behavior and record rejection. A rejected experiment is a valid Phase-8 outcome.

## P6 — integrated Phase 8 qualification

Target: `0.8.6`.

Qualify the exact accepted candidate after P1-P5 without introducing a new optimization variable.

Create deterministic/integrated evidence covering:
- adaptive/fixed configuration;
- ordinary/medium/large selection and promotion;
- per-turn profile immutability;
- precedence/provenance/source dispositions;
- routed docs/skills;
- no probe side effects;
- no extra provider call from selection;
- Phase-5 large-profile compaction/recovery/checkpoints;
- provider continuation/reuse accepted state and fallback;
- stable prefix accepted/rejected state;
- benchmark context suite including 24,576;
- quick-suite regression;
- broader full-suite evidence where practical;
- inherited tool/permission/session/Git safeguards;
- known unrelated TUI streaming failures preserved as pre-existing Not Green if still reproducing.

For live performance evidence, verify the accepted LM Studio runtime before comparing. Never relabel an uncontrolled run as controlled.

Permit at most two substantial evidence-driven correction cycles. Every confirmed Phase-8 regression gets a permanent lowest-layer detector.

Create `docs/tasks/p8/P6-qualification-evidence.md` tied to the exact candidate and classify each layer Green / Not Green / Evidence Gap.

Do not owner-close Phase 8 or advance Phase 9.

## P7 — Phase 8 closeout

Target: `0.8.7`.

Evidence-only audit.

Read P6 evidence, the Phase-8 decision record, accepted/rejected P3-P5 experiment records, and exact candidate source/tests.

Create/update `docs/phase-8-closeout.md` with:
- Implementation Complete state;
- Stability Qualified state;
- accepted runtime/context policy;
- adaptive profile evidence;
- stable-prefix experiment decision;
- provider-reuse experiment decision;
- benchmark artifacts;
- known Not Green/Evidence Gaps;
- explicit statement that provider cache/continuation remains optimization only;
- inherited Phase-3/5 contracts preserved or gaps identified.

Do not repair implementation, add new experiments, owner-close Phase 8, or move BOOT/roadmap to Phase 9.

## Validation policy

Every implementation prompt:
- focused tests for the changed boundary;
- affected context/application/provider regression coverage;
- `npm run typecheck`;
- `npm test`;
- `npm run test:runner`;
- `git diff --check`;
- explicit no-`package-lock.json`.

Known pre-existing TUI failures must be reported truthfully. A broad run containing them is Not Green even when Phase-8 focused coverage is Green.

Performance acceptance always separates:
- deterministic correctness;
- runtime/provenance control;
- cold/first-shape cost;
- warm-state cost;
- provider-reported input/output tokens;
- provider call count;
- full workflow latency.

## Versioning

- P1 -> `0.8.1`
- P2 -> `0.8.2`
- P3 -> `0.8.3`
- P4 -> `0.8.4`
- P5 -> `0.8.5`
- P6 -> `0.8.6`
- P7 -> `0.8.7`

P1-P6 use Terra High. P7 uses Terra Medium.

All prompts use `Browser required: no.`
