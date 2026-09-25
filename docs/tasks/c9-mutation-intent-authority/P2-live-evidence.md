# c9 mutation-intent authority final live qualification evidence

Status: **NOT GREEN — Gate A Green; Gate B Not Green; Gate C not run**

Date: 2026-09-25

Correction: `c9-mutation-intent-authority` / P2

Pre-task HEAD and exact P1 candidate: `77ac4f1cef9385d6cfdb50b5389982b6787fb351` (`c9-mutation-intent-authority/P1: Mutation intent authority and fair Gate A approval`)

Package: `0.9.10` (unchanged)

No production code changed. Each official workload was attempted at most once. Phase 9 is not owner-closed and Phase 10 is not opened.

## Runtime provenance

Immediately before live work the runner printed:

    MANUAL CHECK: LM Studio GPU Offload must show 26

Qualification used Node `v26.10.0`, npm `11.19.1`, LM Studio at `http://127.0.0.1:1234`, and exactly `qwen3-coder-30b-a3b-instruct@q4_k_m`.

`GET /api/v1/models` reported the pinned loaded instance with context length `32,768`, eval batch `2,048`, physical batch `512`, parallel `1`, Flash Attention enabled, GPU KV-cache offload enabled, and `8` experts. Main-model GPU Offload `26` is UI-only and was not independently observed. Functional evidence remains usable; controlled latency is an **Evidence Gap**. No runtime, context, convergence, retry, correction, or stage setting changed.

## Deterministic pre-gate

The required pre-gate was Green under Node 26:

- `136/136` passed across mutation-intent approval authority, fair qualification approval, benchmark-helper preservation, framing/mutation behavior, the exact frozen failure/recovery replay, mandatory INSPECT/completion, exception-safe live trace, structured task/stack/state/budget/recovery, process/workspace containment, Phase 5, and Phase 9 integration.
- The frozen deterministic replay proved: rejected 59-byte write; unchanged bytes/SHA; reread; approval-allowed safe patch; exact 60-byte result; George-owned V1 Green; completed TaskState; exact acceptance; and separate denial-before-dispatch of model-requested `text_framing_change` intent with unchanged bytes before safe recovery.
- `npm run typecheck`: Green.
- `npm run test:runner`: Green, `90/90` passed.
- `git diff --check`: Green before live work.
- Package remained exactly `0.9.10`; root `package-lock.json` remained absent.

## Gate A — exact frozen structured replay

Exactly one official attempt ran through `runLiveWorkInstrument()` and the production `StructuredTaskApplicationService`, using the repository-owned `createFrozenEditQualificationApproval()` helper. It used unchanged fixture `test/fixtures/p9-phase8-structured-edit-validation.task.txt`, SHA-256 `ac85295343d201711b3f177e4ba44a5055fbfe8acf736f23b9c6a47f0ef59c07`. There was no rerun or human coding intervention.

### INSPECT and implementation evidence

The first provider request was INSPECT with `toolChoice: required`, no continuation, and only `read_file`, `list_directory`, `search_text`, `git_status`, and `git_diff`. Qwen requested four ordered calls:

1. `git_status {}` — succeeded;
2. `list_directory {"path":"."}` — succeeded;
3. `read_file {"path":"src/label.js"}` — succeeded;
4. `search_text {"path":"test/","query":"label"}` — succeeded.

The target read returned `46` bytes, SHA-256 `4cd4635c7d8ef07c10bf7a2296d0f4d79cd3e753c1794774656eac5e764d4352`, and `textFraming: {"lineEnding":"lf","finalNewline":"lf"}`. There was no INSPECT continuation. The fresh implementation slice contained that same target SHA and framing.

### Mutation authority and result

The first and only mutation request was an ordinary same-target `apply_patch` with:

- path `src/label.js`;
- `expectedSha256` `4cd4635c7d8ef07c10bf7a2296d0f4d79cd3e753c1794774656eac5e764d4352`;
- one localized replacement from `45` bytes to `59` bytes, leaving the existing final LF untouched;
- no `allowTextFramingChange` argument and therefore no `mutation.intent`.

The Phase 9 qualification helper returned `allow_once`. Before dispatch the file was still `46` bytes with the inspected SHA and final bytes `28293b0a`. The patch succeeded and produced the exact required `60` bytes, SHA-256 `1216991565e68e28f49d5658371d1a8247b2227e224eb166d84573545faa5039`, final bytes `28293b0a`, and framing `{lf, lf}`.

No fidelity rejection, mutation reread, recovery mutation, or exceptional mutation request occurred in this live attempt because Qwen selected the safe patch immediately. Consequently there were no denied exceptional live calls whose dispatch/file invariants needed observation. The permanent deterministic replay remains the evidence that a requested framing override is projected as `mutation.intent=text_framing_change`, denied before dispatch, leaves bytes/SHA unchanged, and can recover via the safe patch.

The only approval requests and decisions were:

| Tool | Mutation intent | Decision | Result |
| --- | --- | --- | --- |
| `apply_patch` on exact target | none | `allow_once` | exact 60-byte mutation succeeded |
| `node --test test/label.test.js` | none | `allow_once` | George-owned V1 passed |

No unrelated mutation or process was requested. The historical benchmark approval helper was not used as Gate A authority.

### Validation, state, acceptance, and metrics

George-owned V1 ran once as `node --test test/label.test.js` and passed with exit code `0`. Final TaskState was `completed`: R1/R2 `verified`, W1 `addressed`, V1 `passed` in one attempt, zero blockers, zero corrections, and terminal outcome `completed`. Hidden/exact acceptance passed.

| Dimension | Official result |
| --- | --- |
| Model-requested / total executed tool calls | `5 / 6`: four INSPECT calls, one model mutation, and one George-owned validation process. |
| Logical provider rounds / attempts / retries | `3 / 3 / 0`. |
| Provider input / output tokens | `8,039 / 340`. |
| Context | Ordinary profile; INSPECT estimate `1,997`, input budget `8,192`, headroom `6,195`; implementation estimate `2,829`, input budget `8,192`, headroom `5,363`; no promotion. |
| Stage behavior | INSPECT completed in one round/four calls; implementation used two rounds/one call; no stage exhaustion. |
| Run budget | Limits remained 128 provider attempts, 128 tool executions, 32 retries/compactions/checkpoints, 64 processes, 3,600,000 ms process/wall time, and 1,000,000 context/input/output tokens. Consumed: 3 attempts, 6 tool executions, 0 retries/compactions, 1 process, 72 ms process time, 50,045 ms elapsed, 4,826 context tokens, 8,039 input tokens, and 340 output tokens. |
| Duplicate/no-progress / pressure / exhaustion | None observed; no pressure, task, stage, correction, or run-budget exhaustion. |
| Timing | `50,061.156 ms` total; workflow timings `37,107 ms` and `94 ms`. Provider-active timing was not separately emitted. |
| Human coding intervention | `0`. |

Gate A is **Green**: exact content, V1, completed/verified state, hidden acceptance, zero intervention, no exhaustion, `5 <= 10` model calls, and `3 <= 10` provider rounds all passed.

## Gate B — `greenfield-express-v1`

After Gate A Green, exactly one official Gate B attempt ran through `runGreenfieldExpressV1()` and the production `StructuredTaskStackApplicationService`.

The user-authorized prerequisite ran exactly as `npm install express@5.1.0` with network access: exit code `0`, `91` stdout bytes, `0` stderr bytes, and `8,031.676 ms` elapsed. No substitute dependency or runtime was used.

The production stack began P1 and correctly fail-stopped there. Qwen made eight read-only requests over four provider rounds:

1. `git_status`, root `list_directory`, `git_diff`;
2. `read_file package.json`, failed `read_file README.md`, `search_text` for `express`;
3. `git_status` rejected by the structured duplicate/no-progress guard;
4. another `git_status` rejected by the same guard.

No file mutation or validation occurred. P1 ended `budget_exhausted` with W1 active, W2 pending, R1/R2/R3 pending, V1 pending with zero attempts, one blocker, and no corrections. The terminal message was `Structured stage duplicate/no-progress limit of 2 exhausted.` StackState ended `budget_exhausted` at current task P1; P2 and P3 remained pending and received zero provider work. Hidden acceptance was not run.

| Dimension | Official result |
| --- | --- |
| Model-requested / executed tool calls | `8 / 6`; the final two duplicate/no-progress requests did not execute. |
| Logical provider rounds / attempts / retries | `4 / 4 / 0`. |
| Provider input / output tokens | `13,761 / 391`. |
| Context | Ordinary profile selected from the unchanged ordinary/medium/large ladder; estimate `1,063`, input budget `8,192`, headroom `7,129`. |
| Run budget | Consumed 4 attempts, 6 executions, 0 retries/compactions, 0 processes, 83,837 ms elapsed, 1,063 context tokens, 13,761 input tokens, and 391 output tokens. No run-budget pressure or dimension exhaustion occurred. |
| Stage/task exhaustion | Structured duplicate/no-progress stage exhaustion terminated P1 and truthfully propagated `budget_exhausted` to TaskState and StackState. |
| Approval/mutation authority | No approval or mutation request occurred; no new authority or framing regression was observed. |
| Timing | `83,860.089 ms` total; P1 workflow `83,853 ms`. |
| Human coding intervention | `0`. |

Gate B is **Not Green** because declared validation did not run, StackState did not complete, hidden acceptance did not run, and stage/task exhaustion occurred. Strict task order and fail-stop behavior were preserved.

## Gate C — `existing-express-feature-v1`

**Not run by gate.** Gate B was Not Green, so the existing-app fixture, focused/broad validation, baseline-preservation check, TaskState, hidden acceptance, and mutation/framing checks were not spent.

## Evidence matrix

| Evidence | State | Basis |
| --- | --- | --- |
| P1 and inherited deterministic pre-gate | **Green** | 136/136 affected tests, typecheck, runner 90/90, version/lockfile/diff hygiene under Node 26. |
| Mutation-intent authority | **Green (deterministic); no exceptional live request** | Permanent denial-before-dispatch/unchanged-file recovery regression passed; Gate A made only an ordinary patch request. |
| Fair Gate A approval | **Green** | Same-target ordinary patch and exact V1 were allowed through the repository-owned qualification helper. |
| REST-visible pinned runtime | **Green** | Exact loaded model and all required REST-visible controls observed. |
| Controlled latency | **Evidence Gap** | GPU Offload 26 remains UI-only and unconfirmed. |
| Gate A exact edit / V1 / state / hidden acceptance | **Green** | Exact 60 bytes and SHA, V1 passed, completed verified TaskState, hidden acceptance passed. |
| Gate A calls / rounds / intervention / exhaustion | **Green** | 5 model calls, 3 rounds, zero intervention, no exhaustion. |
| Gate B dependency authorization | **Green** | Exact authorized `npm install express@5.1.0` succeeded. |
| Gate B strict ordering/fail-stop | **Green** | P1 alone ran; P2/P3 remained pending after P1 exhaustion. |
| Gate B validations / StackState / hidden acceptance | **Not Green** | P1 exhausted duplicate/no-progress before mutation or V1; stack did not complete; acceptance did not run. |
| Gate C existing app | **Not run by gate** | Gate B stopped qualification. |
| Overall final Phase 9 live qualification | **Not Green** | All A/B/C gates are mandatory; Gate B failed and Gate C was not reached. |

## Artifacts

- Gate A harness: `artifacts/c9-mutation-intent-authority-p2-20260925/gate-a.ts` (SHA-256 `828c44f14166af26cc9df52fb35ac68d2e286025a26f48e32279823b09264265`)
- Runtime capture: `artifacts/c9-mutation-intent-authority-p2-20260925/runtime.json` (SHA-256 `3e5bf2473bd8766e6b9d3c59e7ae33e6afc721f8e48699edbabab2a030e13f05`)
- Gate A outcome: `artifacts/c9-mutation-intent-authority-p2-20260925/gate-a-outcome.json` (SHA-256 `463495b052ec0f96a77489f3d85bba390ecf17e90bd69a2c2e503f82ecd893d5`)
- Gate A attempt envelope: `artifacts/c9-mutation-intent-authority-p2-20260925/gate-a/attempt.json` (SHA-256 `fb0545731565b24a2fff468d16e09c336f1bf7d856be996cfad71695d2b48be7`)
- Gate A trace: `artifacts/c9-mutation-intent-authority-p2-20260925/gate-a/trace.json` (SHA-256 `6795169fde871108ddec0335f1cc2b11ea1dc5096d651404bdcaf04c436ffcb6`)
- Gate A recovered target: `artifacts/c9-mutation-intent-authority-p2-20260925/gate-a-workspace/label.js` (60 bytes; SHA-256 `1216991565e68e28f49d5658371d1a8247b2227e224eb166d84573545faa5039`)
- Gate B harness: `artifacts/c9-mutation-intent-authority-p2-20260925/gate-b.ts` (SHA-256 `7e96f8431987cb4c7b8cbbde6e281eef81da005bff3a4a1f893d4f8c302f33cc`)
- Gate B outcome: `artifacts/c9-mutation-intent-authority-p2-20260925/gate-b-outcome.json` (SHA-256 `43ec38b474dd60be34eff6b226d96497f625b4cbee1b9a64b35eb0bd5adedd83`)
- Gate B attempt envelope: `artifacts/c9-mutation-intent-authority-p2-20260925/gate-b/attempt.json` (SHA-256 `fe4b2ed391eea12c7467e639fd0daf182e9faa475bd426727de70ac3a41be3dc`)
- Gate B trace: `artifacts/c9-mutation-intent-authority-p2-20260925/gate-b/trace.json` (SHA-256 `defa626e8a1b697e349d124f5b824fb96659f8c0f2462c21403784ba9fd20c6b`)

The implementation result is this single uncommitted evidence document on unchanged HEAD `77ac4f1cef9385d6cfdb50b5389982b6787fb351`. The phase runner owns staging and commit creation.
