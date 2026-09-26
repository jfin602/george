# Correction 9 Decision Record — Turn Context Live Qualification

Status: **APPROVED DIRECTION — ACTIVE PHASE 9 QUALIFICATION-ONLY CORRECTION**

Date: 2026-09-26

Package boundary: `0.9.10` unchanged.

Current repository starting point: `d8c27d13e6c1c86d53aa4d0f2f42acc7d18d5939`.

Exact production candidate under qualification:
`25d51a93d229e9b8cc76f56eb4b7b9afae1a5723`.

Historical correction authority:
- `docs/tasks/c9-turn-context-convergence/closeout.md`;
- `docs/tasks/c9-turn-context-convergence/P4-live-evidence.md`;
- `docs/tasks/c9-turn-context-convergence/evidence/**`;
- current Phase 9 qualification authority.

## Problem

`c9-turn-context-convergence` completed its production correction and deterministic qualification successfully.

Its closeout establishes Green:
- provider-result projection;
- provider-grounded continuation accounting;
- adaptive ordinary -> medium -> large safety-envelope promotion;
- fixed-profile / >large fail-closed behavior;
- ordinary TUI base-agent wiring;
- hard affected-system preflight;
- controlled broad regression delta.

The correction remained overall Evidence Gap only because P4 reached the first live-runtime boundary while LM Studio had no loaded model instance. The pinned model was listed by `GET /api/v1/models`, but `loaded_instances` was empty. Therefore no correction-era greeting smoke, three-file inspection smoke, Gate A, Gate B2, or Gate C2 attempt began.

This is an environment/provenance gap, not a newly observed production defect.

## Decision — qualify the exact existing production candidate

This correction performs no production redesign.

The software candidate remains exactly:
`25d51a93d229e9b8cc76f56eb4b7b9afae1a5723`.

Commits after that candidate through the current starting point contain qualification evidence/closeout documentation only. The new correction itself may add planning, prompt, evidence, and closeout documentation, but it must not modify production-sensitive files before or during live qualification.

Before spending a live attempt, verify no change since the exact production candidate has touched:
- `src/**`;
- `test/**`;
- `scripts/**`;
- `package.json`;
- dependency lock/shrinkwrap identity;
- runtime/configuration files relevant to qualification;
- v1/v2 live-work instruments or hidden acceptance.

If production-sensitive identity has changed, prior deterministic/broad qualification cannot simply be inherited. Stop and re-plan rather than silently qualifying a different candidate.

## Decision — reuse qualified deterministic and controlled-delta evidence

Do not repeat the full two-tree controlled broad experiment merely because documentation commits moved HEAD.

P4 already compared:
- baseline `d7804684801fa8418050c34d9ef097ca1adf80b6`;
- exact production candidate `25d51a93d229e9b8cc76f56eb4b7b9afae1a5723`;

under equivalent supported Node/npm, exact `npm test`, dependency identity, Git metadata, and non-TTY conditions.

That controlled broad regression delta is Green and remains applicable while the exact production candidate is unchanged.

Before live work, rerun a fresh current sanity floor:
- turn-context affected deterministic tests;
- Phase 9 integration / v1-v2 immutability;
- typecheck;
- runner;
- diff/version/root-lockfile hygiene;
- one current broad `npm test` characterization.

Compare current broad failures/skips against the already-controlled retained identity/signature set. Any new or materially worsened affected failure blocks live work. Retained OpenTUI/native failures remain Not Green aggregate evidence and do not invalidate the inherited Green delta by themselves.

## Decision — runtime gate

Before any official provider request, LM Studio must expose a non-empty loaded instance for:

`qwen3-coder-30b-a3b-instruct@q4_k_m`

Capture the REST-visible loaded controls and compare them with the established Phase 9 runtime control:
- context length 32,768;
- eval batch 2,048;
- physical batch 512;
- parallel 1;
- Flash Attention enabled;
- GPU KV-cache offload enabled;
- 8 experts.

Do not retune runtime settings inside qualification.

If the pinned model is not loaded, required REST-visible controls are unavailable, or a material control differs unexpectedly, classify the runtime boundary as Evidence Gap / Not Green as appropriate and stop before the first official live attempt.

Print:

`MANUAL CHECK: LM Studio GPU Offload must show 26`

The UI-only GPU Offload 26 field is **not** a functional qualification gate. Existing Phase 9 authority explicitly allows functional structured-task evidence to proceed when the pinned REST-visible runtime is healthy even if that UI-only value remains unconfirmed. In that case:
- record GPU Offload 26 / controlled latency as Evidence Gap;
- do not claim a controlled performance comparison;
- functional qualification may proceed.

No warm-up or unofficial provider request may be used to manufacture provenance after the official sequence has conceptually begun.

## Decision — one fresh live sequence

After candidate identity, fresh sanity preflight, broad identity check, and runtime provenance are sufficient:

1. ordinary greeting smoke — exactly one official attempt;
2. synthetic three-file inspection smoke — exactly one attempt only after greeting Green;
3. fresh Gate A — exactly one attempt only after both smokes Green;
4. fresh Gate B2 — exactly one attempt only after Gate A Green;
5. Gate C2 — exactly one attempt only after B2 Green.

Stop on the first Not Green result. Do not repair or rerun inside this correction merely to obtain a pass.

## Decision — reuse frozen qualification machinery

Reuse unchanged:
- `runOrdinaryTurnQualification()`;
- `acceptGreetingSmoke()`;
- `acceptThreeFileSmoke()`;
- `THREE_FILE_INSPECTION_SMOKE`;
- the frozen three-file fixture and hashes;
- the frozen Gate A task/fixture/approval/validation/hidden acceptance;
- `greenfield-express-v2`;
- `existing-express-feature-v2`;
- existing sanitized attempt/trace writers.

Do not create:
- new smoke semantics;
- a new three-file fixture;
- `greenfield-express-v3`;
- `existing-express-feature-v3`.

The three-file smoke remains a bounded reproduction fixture, not a product-level maximum-file rule.

## Live acceptance

### Greeting

Green requires:
- one logical provider round;
- zero model-requested tools;
- committed direct assistant response;
- no coding-workflow guidance;
- no exhaustion;
- zero human intervention.

### Three-file inspection

Green requires:
- unchanged fixture hashes;
- required read paths observed;
- completed final response;
- no exhaustion;
- zero intervention;
- monotonic envelope-promotion evidence if promotion occurs;
- no source-composition violation.

### Gate A

Existing criteria remain unchanged:
- exact 60-byte edit;
- V1 Green;
- completed/verified TaskState;
- hidden acceptance Green;
- zero intervention;
- no exhaustion;
- <=10 model-requested tool calls;
- <=10 logical provider rounds.

### Gate B2

Use unchanged `greenfield-express-v2`.

Green requires P1/P2/P3 completion, declared validation Green, completed StackState, hidden acceptance Green, zero intervention, and no exhaustion.

Retain bounded evidence relevant to the prior continuation failure:
- provider-visible projected tool results remain bounded;
- internal mutation Git evidence does not enter provider continuation;
- selected profile and any envelope promotions;
- provider-reported token usage;
- absence of frozen-profile exhaustion.

B2 does not need to promote if the corrected bounded continuation remains safely within ordinary.

### Gate C2

Use unchanged `existing-express-feature-v2` with existing baseline-preservation, validation, TaskState, hidden-acceptance, intervention, and exhaustion criteria.

## Evidence and historical truth

Create new evidence under:

`docs/tasks/c9-turn-context-live-qualification/`

Do not modify the historical P4 runtime Evidence Gap or turn-context closeout.

The prior Not Run states remain historically correct. New attempts are new official attempts after the missing runtime prerequisite became available; they are not retroactive edits to P4.

No raw provider streams, full assistant prose logs, file/write/patch bodies, unbounded Git snapshots/logs, dependency trees, workspace copies, secrets, or environment dumps may be committed.

## Closeout

Phase 9 is ready for separate owner closeout only if:
- exact production candidate identity is preserved;
- fresh sanity preflight is Green;
- no new broad regression is observed;
- loaded REST-visible runtime provenance is sufficient;
- greeting is Green;
- three-file inspection is Green;
- fresh Gate A is Green;
- B2 is Green;
- C2 is Green;
- no new blocker appears.

If all are Green, next action is `/closeout phase 9`.

This correction does not owner-close Phase 9 or open Phase 10.
