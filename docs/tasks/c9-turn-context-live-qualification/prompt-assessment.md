# c9-turn-context-live-qualification Prompt Assessment

Status: READY FOR QUALIFICATION-ONLY FOLLOW-UP

Correction: `c9-turn-context-live-qualification`  
Roadmap phase: 9  
Required unchanged package version: `0.9.10`

## Trigger

`c9-turn-context-convergence` is deterministically Green at its production boundaries but closed overall with a live Evidence Gap.

Exact production candidate:
`25d51a93d229e9b8cc76f56eb4b7b9afae1a5723`.

Qualified production behavior:
- canonical/internal mutation evidence is separated from bounded provider continuation;
- provider usage grounds continuation accounting;
- adaptive ordinary -> medium -> large safety-envelope promotion is qualified;
- fixed-profile and >large fail-closed behavior are qualified;
- ordinary TUI turns use the base agent rather than global coding-workflow guidance;
- deterministic affected floor is Green;
- controlled broad regression delta against `d7804684801fa8418050c34d9ef097ca1adf80b6` is Green.

The prior P4 live run stopped before any official provider request because LM Studio listed the pinned model but had no loaded instance.

Therefore:
- greeting: Not Run;
- three-file smoke: Not Run;
- fresh Gate A: Not Run;
- B2: Not Run;
- C2: Not Run.

No production defect was observed after the deterministic correction.

## Scope

This correction exists only to complete missing live qualification against the unchanged production candidate.

It may add:
- bounded qualification evidence;
- runtime provenance;
- attempt/trace JSON;
- final closeout documentation.

It may not change:
- `src/**`;
- `test/**`;
- `scripts/**`;
- package/dependencies;
- profile values;
- runtime settings;
- three-file fixture;
- Gate A fixture/helper;
- v1/v2 live instruments;
- hidden acceptance;
- qualification semantics.

## Candidate identity

Before live work, prove the current repository differs from `25d51a...` only in allowed planning/prompt/evidence/closeout documentation.

If production-sensitive identity has changed, stop rather than qualifying a different candidate under inherited evidence.

## Inherited evidence

Reuse:
- P4 controlled broad comparison;
- Green broad regression delta;
- deterministic turn-context qualification.

Do not rerun the two-tree broad comparison simply because documentation moved HEAD.

Do rerun:
- fresh affected sanity floor;
- typecheck;
- runner;
- one current broad characterization;
- diff/version/root-lockfile checks.

Current broad failures must remain within the already-controlled retained OpenTUI/native identity/signature set.

## Runtime gate

The pinned model must be genuinely loaded:

`qwen3-coder-30b-a3b-instruct@q4_k_m`

Required REST-visible control comparison:
- context 32,768;
- eval batch 2,048;
- physical batch 512;
- parallel 1;
- Flash Attention enabled;
- GPU KV-cache offload enabled;
- experts 8.

Print:
`MANUAL CHECK: LM Studio GPU Offload must show 26`.

UI-only GPU Offload 26 may remain Evidence Gap without blocking functional qualification when the REST-visible runtime is healthy. It only prevents a controlled latency/performance claim.

Do not load, unload, or retune the model inside the runner.

## Official sequence

Spend exactly once, in order:

1. greeting;
2. three-file inspection;
3. Gate A;
4. Gate B2;
5. Gate C2.

Stop on first Not Green result.

No failed attempt may be rerun merely to obtain a pass.

## Recommended stack

### P1 — live qualification

`Sol Medium`.

Evidence-only. Verify identity/preflight/runtime, then spend the gated sequence and persist bounded sanitized evidence.

### P2 — closeout

`Sol Medium`.

Evidence-only. Audit P1 and determine Phase 9 owner-closeout readiness.

## Prompt count

Two prompts including closeout.

Both:
- Browser required: no.
- Version remains `0.9.10`.
- No root `package-lock.json`.
- No production/test/fixture/instrument repair.
- No Phase 9 owner closeout inside the stack.
- Phase 10 remains unopened.
