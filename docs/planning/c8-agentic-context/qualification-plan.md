# Phase 8 Agentic Context Correction — Qualification Plan

Status: APPROVED QUALIFICATION PLAN

Correction: `c8-agentic-context`  
Baseline: package `0.8.8`

## Purpose

Determine the smallest provider-facing working-set envelope in which the pinned local Qwen coding model remains a useful coding agent.

This plan replaces synthetic long-context capacity as the primary authority for profile-boundary decisions.

The existing context ladder remains a runtime/prefill characterization instrument.

## Qualification principles

1. Measure real George-shaped requests.
2. Preserve deterministic task correctness as the first gate.
3. Ascend working-set size gradually.
4. Stop once a repeatable capability/latency cliff is established.
5. Do not hide failed runs by rerunning until Green.
6. Separate runtime/provider failure from context-policy failure.
7. Change one bounded context-policy variable at a time.
8. Preserve Phase 3 trust/precedence, Phase 5 recovery, and Phase 8/P7 safety contracts.

## Runtime control

Use the accepted pinned model:

`qwen3-coder-30b-a3b-instruct@q4_k_m`

Expected REST-visible LM Studio control:
- physical context: 32,768;
- eval batch: 2,048;
- physical batch: 512;
- parallel: 1;
- Flash Attention: enabled;
- GPU KV cache offload: enabled;
- experts: 8;
- speculative decoding: off unless a separate accepted experiment says otherwise.

Main-model GPU Offload 26 is a manual/UI-only control and must be recorded as confirmed or unconfirmed.

A run is not a controlled performance comparison when material runtime provenance is missing.

## Agentic benchmark shape

The benchmark must exercise the real application/provider/tool boundaries with realistic context composition.

At minimum include the following task families.

### A. Repository inspection

A deterministic fixture requires George to:
- follow applicable project guidance;
- inspect one or more files;
- return a deterministic fact/token;
- avoid mutation.

Measure instruction following and read-tool correctness.

### B. Multi-round investigation

A deterministic repository trail requires several sequential reads/searches where each result identifies the next evidence source.

Measure:
- multi-round tool planning;
- continuation correctness;
- duplicate/unrequested tools;
- retained task/project context.

### C. Edit plus validation

A bounded fixture requires George to:
- inspect the defect;
- make one deterministic workspace edit;
- run a bounded validation command;
- return the expected completion token.

Use normal approval/policy semantics or a benchmark-owned qualified approval fixture consistent with existing benchmark rules.

Measure complete coding-agent behavior, not only retrieval.

### D. Project-guidance pressure

Use distinct realistic project guidance and task-specific repository evidence so working-set size can be increased without relying on giant repeated filler text.

No single source should exceed normal George source bounds.

Avoid exact duplicate material that the assembler would correctly deduplicate.

## Working-set bands

Initial exploratory targets:

```text
~2k
~4k
~6k
~8k
~10k
~12k
```

These are approximate provider-facing assembled working-set targets.

They are not production profile values.

Calibrate fixture content through normal George context inputs and record the actual estimated/provider-reported size observed.

## Sweep procedure

For each task family:

1. start at the smallest practical band;
2. run one controlled execution;
3. record correctness, tools, latency, calls, retries, tokens, selected context evidence;
4. ascend one band only if the previous band produced usable evidence;
5. stop that family when a material/repeatable agentic cliff appears.

A cliff may include:
- repeated provider timeout;
- first-useful-output latency becoming operationally unreasonable;
- task failure caused by context/instruction/tool degradation;
- duplicate/unrequested tool behavior materially increasing;
- tool-plan collapse;
- failure to preserve required project/task facts.

Do not classify one provider/runtime crash as an agentic-context threshold.

## Confirmation procedure

After the exploratory sweep identifies a candidate healthy envelope:

- rerun the candidate healthy band with bounded repeat evidence;
- rerun the next materially worse band with bounded repeat evidence where runtime health permits;
- compare at least one inspection, one multi-round, and one edit/validation workflow.

Do not run large repetition batches.

Two controlled repetitions per confirmation point are normally enough unless evidence is contradictory.

## Required metrics

Per run record:
- candidate SHA/version;
- Node/npm/platform;
- model ID;
- LM Studio REST-visible runtime settings;
- GPU Offload 26 confirmed/unconfirmed;
- task family;
- requested/calibrated context band;
- George estimated context tokens;
- provider-reported input/output tokens where available;
- context mode/profile;
- attempted profile IDs;
- promotion reasons;
- omission/defer evidence;
- compaction count;
- provider attempts/rounds;
- tool calls and unique tools;
- expected vs observed tool count;
- duplicate/unrequested tool behavior;
- response-start latency;
- first useful output latency;
- provider active time;
- total workflow latency;
- retries/timeouts;
- deterministic task pass/fail;
- terminal state.

## Acceptance standard

A candidate agentic envelope is accepted only when:
- deterministic task correctness remains Green;
- expected tool behavior remains Green;
- required/current/project/task evidence is retained;
- latency is operationally reasonable relative to the smaller accepted bands;
- retries/timeouts do not materially worsen;
- provider-call count does not increase solely because of context policy;
- no permission/recovery/session authority is weakened.

A smaller context is not automatically better.

A larger context is not accepted merely because the provider technically accepts it.

## Routing/profile-policy correction gate

Only after measurement identifies a healthy agentic envelope may implementation revise:
- ordinary/medium/large preferred ranges;
- soft-pressure thresholds;
- provider-input operating ceilings;
- promotion rules;
- deterministic routing/defer priorities.

The 32,768 physical context target remains unchanged unless separately measured.

Policy correction should prefer:
1. required George/current-user/tool/recovery context;
2. immediate task/repository evidence;
3. explicitly needed routed/skill/project material;
4. bounded useful recent history;
5. lower-value optional defaults last.

No silent partial critical source.

No helper-model summarization in this correction.

No model-generated relevance classifier.

## Live George qualification

The final policy must be exercised through the real supported George application path on Node 26 with real LM Studio/Qwen.

At minimum prove:
- small ordinary coding work remains fast/useful;
- a moderate task receives only the context it actually needs;
- larger selected material is routed/deferred/promoted according to the corrected policy;
- multi-round reads retain required context;
- P7 frozen-turn pressure still stops explicitly before unsafe continuation;
- a later turn can independently reselect an envelope;
- edit/validation workflow completes correctly;
- native TUI startup/activity/context/work/Ready/exit behavior remains usable.

Persisted George events are authority for exact profile/context claims.

## Synthetic ladder role after correction

The existing `--suite context` long-context ladder remains useful for:
- raw prefill/runtime characterization;
- provider input scaling;
- cold/first-shape versus warm behavior;
- runtime regression detection.

It must be labeled **synthetic long-context characterization**.

It cannot alone qualify production agentic working-set boundaries.

## Green / Not Green / Evidence Gap

### Green

The requested layer was directly exercised under a controlled runtime and met its deterministic and agentic acceptance conditions.

### Not Green

The requested layer was directly exercised and failed a correctness, tool-behavior, latency, timeout, context-retention, permission, or recovery condition.

### Evidence Gap

The requested conclusion could not be established because required runtime/provider/TTY/control evidence was unavailable or invalid.

Provider/runtime failure must not be silently converted into a context-policy failure.

## Correction closeout

Closeout evidence must identify:
- accepted agentic benchmark version;
- measured healthy envelope;
- measured cliff/upper-risk region;
- final production profile/routing policy;
- preserved historical Phase 8 evidence;
- real George qualification;
- remaining Not Green/Evidence Gaps.

Phase 9 remains blocked until this correction is owner-accepted/closed.
