# P3 gated Qwen work-unit convergence evidence

Status: **NOT GREEN — Gate A failed during structured INSPECT; Gates B and C were not run**

Date: 2026-09-25

Correction: `c9-qwen-workunit-convergence` / P3

Exact candidate: `15d8549aac7810bae3e93a0e902809e14754c808` (`c9-qwen-workunit-convergence/P2: Resilient live work-unit trace capture`)

P1 candidate: `317141f` (`c9-qwen-workunit-convergence/P1: Safe mutation precondition visibility`)

Package: `0.9.10` (unchanged)

## Runtime provenance

Immediately before live work the runner printed:

    MANUAL CHECK: LM Studio GPU Offload must show 26

Qualification used Node `v26.10.0`, npm `11.19.1`, LM Studio at `http://127.0.0.1:1234`, and exactly `qwen3-coder-30b-a3b-instruct@q4_k_m`.

`GET /api/v1/models` reported one loaded instance with context length `32,768`, eval batch `2,048`, physical batch `512`, parallel `1`, Flash Attention `true`, GPU KV-cache offload `true`, and `8` experts. Main-model GPU Offload `26` is UI-only and was not independently observed. Functional evidence remains usable; controlled latency remains an **Evidence Gap**. No runtime, context, provider, convergence-limit, retry, or correction setting was changed.

## Deterministic pre-gate

The pre-gate was Green under Node 26:

- `110/110` passed across the P1 read/hash/mutation boundary, dynamic read -> hash -> mutation replay, P2 trace/artifact behavior, frozen Phase 8 structured replay, Phase 9 integration, c9 structured convergence/stack behavior, one-turn limits, recovery, session persistence, coding workflow, agent loop, and Phase 5 qualification.
- `npm run typecheck`: Green.
- `npm run test:runner`: Green, `90/90` passed.
- `git diff --check`: Green before the evidence edit.
- Package remained exactly `0.9.10`; root `package-lock.json` remained absent.

The dynamic frozen replay specifically observed `read_file.sha256` `4cd4635c7d8ef07c10bf7a2296d0f4d79cd3e753c1794774656eac5e764d4352`, used it as the subsequent write precondition, made the exact edit, and passed George-owned V1 deterministically.

## Gate A — frozen Phase 8 structured replay

Exactly one new official live attempt was made. No rerun was performed.

The attempt used the unchanged `test/fixtures/p9-phase8-structured-edit-validation.task.txt` through `runLiveWorkInstrument()` and the production `StructuredTaskApplicationService`. It terminated with:

    GeorgeError: Structured INSPECT preflight produced no read-only evidence.

The exception escaped `runLiveWorkInstrument()` before it returned a `LiveWorkResult`. Consequently `writeLiveWorkArtifacts()` could not write `attempt.json` or `trace.json`. This is a **live trace Evidence Gap** despite the P2 deterministic tests: the repository-owned artifact ordering is qualified when a result exists, but this official thrown-service path produced no durable bounded event envelope.

Read-only recovery of the preserved disposable workspace established:

- target `src/label.js`: `export const label = (value) => value.trim();`
- recovered SHA-256: `4cd4635c7d8ef07c10bf7a2296d0f4d79cd3e753c1794774656eac5e764d4352`
- required content: `export const label = (value) => value.trim().toUpperCase();`
- a direct post-attempt Node test failed with actual `george` versus expected `GEORGE`;
- human coding intervention: `0`.

The direct test and recovered file are supporting failure evidence, not substitutes for George-owned V1 or the missing official trace. Gate A is **Not Green** because the exact edit was absent, structured execution failed before implementation, George-owned V1 did not pass, and no completed/verified TaskState was returned.

### Bounded trace dimensions

| Dimension | Official result |
| --- | --- |
| Ordered model-requested tool calls / call IDs | **Evidence Gap** — no attempt envelope was persisted before the exception. |
| Observed target `read_file.sha256` delivered to implementation | **Not Green** — INSPECT produced no accepted read-only evidence and implementation was not reached. |
| Requested mutation path / `expectedSha256` | No mutation was reached; exact requested arguments are an **Evidence Gap** because the event trace was not persisted. |
| Mutation terminal result | Not attempted before the INSPECT terminal error; recovered target remained unchanged. |
| Duplicate / no-progress events | **Evidence Gap**. |
| Provider attempts / logical rounds / retries | **Evidence Gap**. |
| Provider input / output tokens | **Evidence Gap**. |
| Selected / attempted context profiles and estimated input | **Evidence Gap**. |
| Task / stage / run budgets and pressure/exhaustion | **Evidence Gap**. The observed terminal exception was validation-class, not recorded budget exhaustion. |
| Validation / correction history | George-owned V1 did not run; correction history was not persisted. |
| Workflow / elapsed timing | **Evidence Gap** — no repository-owned timing result was returned. |
| Final TaskState | No returned/persisted final projection; completion and covered-requirement verification are **Not Green**. |
| Hidden acceptance | `not_run`; the service threw before the runner's completed-task acceptance gate. |
| Human coding intervention | `0`, explicitly supplied by the harness. |

### Longitudinal comparison

| Attempt | Result | Calls | Rounds | Input / output tokens | Elapsed |
| --- | --- | ---: | ---: | ---: | ---: |
| Preserved Phase 8 | Not Green | 10 | 7 | 20,765 / 406 | 45.826 s |
| First Phase 9 | Not Green | 25 | 20 | 63,253 / 1,801 | 344.745 s |
| First c9 Gate A | Not Green | Evidence Gap | Evidence Gap | Evidence Gap | Evidence Gap |
| Current P3 Gate A | **Not Green** | Evidence Gap | Evidence Gap | Evidence Gap | Evidence Gap |

No numerical improvement or delta is claimed for the current attempt.

## Gate B — greenfield production stack

**Not run by gate.** Gate A was not Green. `greenfield-express-v1`, dependency/network authorization, production StackState, and hidden acceptance were not spent.

## Gate C — existing app

**Not run by gate.** Gate B was not reached. `existing-express-feature-v1` and its hidden acceptance were not spent.

## Evidence matrix

| Evidence | State | Basis |
| --- | --- | --- |
| P1/P2/c9 deterministic pre-gate | **Green** | 110/110 affected tests, typecheck, runner 90/90, diff/version/lockfile hygiene. |
| REST-visible pinned runtime | **Green** | Exact loaded model and required REST-visible controls observed. |
| Controlled latency | **Evidence Gap** | GPU Offload 26 remains UI-only and unconfirmed. |
| Gate A structured INSPECT | **Not Green** | Terminal validation error: no read-only inspection evidence. |
| Gate A safe hash handoff | **Not Green** | Implementation was not reached. |
| Gate A exact edit / George-owned V1 / completed TaskState | **Not Green** | Recovered target unchanged; direct supporting test failed; no completed state returned. |
| Gate A calls/rounds/tokens/context/budgets/corrections/timing | **Evidence Gap** | Service exception escaped before repository-owned attempt/trace artifacts were written. |
| Gate B greenfield / hidden acceptance | **Not run by gate** | Gate A stopped qualification. |
| Gate C existing app / hidden acceptance | **Not run by gate** | Gate B was not reached. |

## Artifacts

- One-attempt harness: `artifacts/c9-qwen-p3-20260925/gate-a.ts`
- Isolated harness configuration root: `artifacts/c9-qwen-p3-20260925/config/`
- Recovered unchanged target: `artifacts/c9-qwen-p3-20260925/gate-a-recovered-workspace/label.js`
- Recovered fixture test: `artifacts/c9-qwen-p3-20260925/gate-a-recovered-workspace/label.test.js`
- Expected but absent because the service threw before artifact writing: `artifacts/c9-qwen-p3-20260925/gate-a/attempt.json` and `trace.json`

No production code was changed. No official workload was rerun. Phase 9 is not owner-closed and Phase 10 is not opened.
