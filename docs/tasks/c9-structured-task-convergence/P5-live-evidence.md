# P5 gated production-stack live convergence evidence

Status: **NOT GREEN — Gate A failed the exact-edit requirement; Gates B and C were not run**

Date: 2026-09-25

Correction: `c9-structured-task-convergence` / P5

Exact P4 candidate: `a5bdd41387b2ad3c0e7a388955c6f5c44725ecb6` (`c9-structured-task-convergence/P4: Production structured task-stack execution`)

Package: `0.9.10` (unchanged)

P1/P2/P3 candidates: `5b96f3dec59928ed98dfa4dd5c54df393a1a3eb8`, `6d97811f48fa273985589f1c396b777bd7fb14e7`, and `2051184b2a493e086b77c280c9610ffd4e16aa2f`

## Runtime provenance

Immediately before live work the runner printed:

    MANUAL CHECK: LM Studio GPU Offload must show 26

The qualification used Node `v26.10.0`, npm `11.19.1`, LM Studio at `http://127.0.0.1:1234`, and the exact loaded model `qwen3-coder-30b-a3b-instruct@q4_k_m`.

`GET /api/v1/models` reported context length `32,768`, eval batch `2,048`, physical batch `512`, parallel `1`, Flash Attention `true`, GPU KV-cache offload `true`, and `8` experts. Main-model GPU Offload `26` is UI-only and was not independently observed. Functional evidence is usable; controlled latency remains an **Evidence Gap**. No runtime, context, convergence limit, retry, or correction setting was changed.

## Deterministic pre-gate

The affected correction floor was Green under Node 26:

- `68/68` passed across task parser/state/stack state, structured task, production stack execution/fail-stop/resume, frozen Phase 8 replay, one-turn limits, recovery, session store, live-work qualification runner, Phase 5 qualification, and Phase 9 integrated qualification.
- `npm run typecheck`: Green.
- `npm run test:runner`: Green, `90/90` passed.
- `git diff --check`: Green before the evidence edit.
- Package remained `0.9.10`; root `package-lock.json` remained absent.

The deterministic production-stack evidence proves:

- the complete stack is validated before P1 provider work;
- task order is P1 then P2 then P3;
- P1/P2 failure leaves later tasks pending and produces no later-task provider calls;
- completed TaskState validation history is retained in StackState;
- reopen after completed P1 resumes at P2 without re-executing P1;
- an interrupted process requires Phase 5 reconciliation and produces zero provider calls;
- hidden acceptance is not run unless production stack state is `completed`.

This satisfies the requested bounded stack-resume qualification without manufacturing a live ambiguous side effect.

## Gate A — frozen Phase 8 structured replay

Exactly one official live attempt was made. No rerun was performed.

The production structured service returned, after which the qualification evidence postprocessor failed while reading a `context.assembled` event field. It failed before serializing the in-memory TaskState, event timeline, budget snapshots, and provider metrics. The failure was:

    TypeError: Cannot read properties of undefined (reading 'id')

Read-only recovery of the attempt's preserved disposable workspace established:

- observed `src/label.js`: `export const label = (value) => value.trim();`
- observed SHA-256: `4cd4635c7d8ef07c10bf7a2296d0f4d79cd3e753c1794774656eac5e764d4352`
- required edit: `export const label = (value) => value.trim().toUpperCase();`
- post-attempt direct Node test: failed with actual `george` versus expected `GEORGE`.
- human coding intervention: `0`.

Therefore Gate A is **Not Green** on its first mandatory condition: the exact required edit was not made. The direct post-attempt test confirms the fixture remains functionally failing, but it is not represented as George-owned V1 evidence from the official attempt.

The postprocessor failure leaves these official-attempt dimensions as **Evidence Gaps**: exact tool sequence, duplicate/no-progress events, provider attempts/rounds/retries, selected context profile, input/output tokens, exact elapsed and stage timings, inspection handoff, validation diagnostics/corrections, task-wide/stage budget snapshots, George-owned V1 outcome, and final TaskState. Because the functional gate already failed, missing metrics do not weaken the Not Green decision and do not authorize a retry.

Historical comparisons remain unchanged:

| Attempt | Result | Tool calls | Provider rounds | Input tokens | Elapsed |
| --- | --- | ---: | ---: | ---: | ---: |
| Preserved Phase 8 | Not Green | 10 | 7 | 20,765 | 45.826 s |
| First Phase 9 | Not Green | 25 | 20 | 63,253 | 344.745 s |
| Correction P5 Gate A | **Not Green** | Evidence Gap | Evidence Gap | Evidence Gap | Evidence Gap |

No numerical delta is claimed where the official attempt's raw metric was not retained.

## Gate B — greenfield production stack

**Not run by gate.** Gate A was not Green, so `greenfield-express-v1`, dependency installation, its production StackState, and hidden acceptance were not spent. The deterministic P4 tests remain the authority for production ordering, fail-stop, history preservation, resume, and hidden-acceptance gating.

## Gate C — existing app

**Not run by gate.** Gate B was not reached, so `existing-express-feature-v1` and its hidden acceptance were not spent.

## Evidence matrix

| Evidence | State | Basis |
| --- | --- | --- |
| P1-P4 affected deterministic floor | **Green** | 68/68 affected tests, typecheck, runner 90/90 |
| Production stack validation/order/history/fail-stop | **Green (deterministic)** | stack service/state and live-work runner tests |
| Production stack durable resume | **Green (deterministic)** | completed P1 retained; reopen starts P2; ambiguous interruption blocks before provider work |
| Gate A exact edit | **Not Green** | preserved workspace remained unchanged |
| Gate A functional label test | **Not Green** | direct post-attempt test failed; not substituted for missing George-owned V1 evidence |
| Gate A TaskState, George-owned V1, calls/rounds/tokens/timings/budgets | **Evidence Gap** | postprocessor failed before serialization; no rerun permitted |
| Gate B greenfield / hidden acceptance | **Not run by gate** | Gate A stopped qualification |
| Gate C existing app / hidden acceptance | **Not run by gate** | Gate B was not reached |
| Controlled latency | **Evidence Gap** | GPU Offload 26 unconfirmed |

## Artifacts

- Ignored bounded qualification directory: `artifacts/c9-live-qualification-20260925T154120Z/`
- One-attempt runner source: `gate-a.ts`
- Recovered unchanged fixture files: `gate-a-recovered-workspace/label.js` and `gate-a-recovered-workspace/label.test.js`

No production implementation was changed. Phase 9 is not owner-closed and Phase 10 is not opened.
