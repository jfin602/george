# c9 greenfield instrument alignment final live qualification evidence

Status: **NOT GREEN — inherited Gate A Green; Gate B2 Not Green; Gate C2 not run**

Date: 2026-09-25

Correction: `c9-greenfield-instrument-alignment` / P2

Pre-task HEAD and exact P1 candidate: `b4402d2ad768011f9647753802e60c86baaa8324` (`c9-greenfield-instrument-alignment/P1: Version and align Phase 9 live-work instruments`)

Package: `0.9.10` (unchanged)

No production code or v1/v2 fixture/task semantics changed. Gate A was not rerun. B2 ran exactly once; because it was Not Green, C2 was not run. No workload was repaired or rerun, Phase 9 is not owner-closed, and Phase 10 is not opened.

## Inherited Gate A Green

Gate A remains Green from `c9-mutation-intent-authority` P2. Its qualifying attempt produced the exact required 60-byte edit, passed George-owned V1, completed a verified TaskState, passed hidden acceptance, used 5 model-requested tool calls over 3 logical provider rounds, required zero human coding intervention, and incurred no task, stage, correction, or run-budget exhaustion.

That evidence remains valid because P1 changed only qualification fixtures, metadata, version-specific runner entry points, and their tests. It did not change production structured execution, mutation authority, the Gate A fixture, Gate A acceptance, provider/runtime policy, context/convergence/retry/correction settings, or stage limits.

## Runtime provenance

Immediately before live work the runner printed:

    MANUAL CHECK: LM Studio GPU Offload must show 26

Qualification used Node `v26.10.0`, npm `11.19.1`, LM Studio at `http://127.0.0.1:1234`, and exactly `qwen3-coder-30b-a3b-instruct@q4_k_m`.

`GET /api/v1/models` reported the pinned loaded instance with context length `32,768`, eval batch `2,048`, physical batch `512`, parallel `1`, Flash Attention enabled, GPU KV-cache offload enabled, and `8` experts. Main-model GPU Offload `26` is UI-only and was not independently observed. Functional evidence remains usable; controlled latency is an **Evidence Gap**. No runtime, context, convergence, retry, correction, stage, or run-budget setting changed.

## Deterministic pre-gate

The required pre-gate was Green under Node 26:

- `160/160` affected tests passed, covering v1 byte/digest immutability, v2 metadata/digests/Task Prompt v1 semantics, v2 runner isolation and ordering, Phase 9 integration, Gate A frozen replay, mutation/framing authority, mandatory INSPECT/completion, exception-safe live traces, structured stack/task/state/budget/recovery, provider behavior, process/workspace containment, and Phase 5 inheritance.
- `npm run typecheck`: Green.
- `npm run test:runner`: Green, `90/90` passed.
- `git diff --check`: Green before live work.
- Package remained exactly `0.9.10`; root `package-lock.json` remained absent.

A broader `npm test` characterization was also observed but is not relabeled Green: `379/385` passed, `5` OpenTUI test-renderer tests failed, and `1` native-TTY test was skipped. The exact affected qualification floor above was independently Green; the broader renderer failures are retained evidence rather than omitted.

## Version and digest evidence

| Instrument | Instrument / task format | Task digest | Fixture | Acceptance |
| --- | --- | --- | --- | --- |
| Greenfield B2 | `greenfield-express-v2` / `2` / Task Prompt `1` | `a8497efe8f26862c782bb8fb9a12201993df6175a30a5bf68a5149dc832c7618` | Clean Git baseline commit `f87ad12c03c0206d6b535d7299fd79bd06b9cf3b` | unchanged behavioral version `1`, `greenfield-express-v1.test.mjs` |
| Existing-app C2 | `existing-express-feature-v2` / `2` / Task Prompt `1` | `66f262fd8f73171cdf5fc023d2be3a5032569fee9ebd8041241abcaf1c0eb0e9` | unchanged version `1`, source digest `45856b10bfe4ff3f14e1893da22b9a88b1c3334d3923d2417aee0c09e94a5aba` | unchanged behavioral version `1`, not spent |

The historical v1 instruments and results remain immutable. In particular, `greenfield-express-v1` remains **Not Green**: its inspection-only W1 exhausted the duplicate/no-progress stage after 8 model-requested / 6 executed calls over 4 rounds, with `13,761 / 391` provider input/output tokens, no mutation or validation, a `budget_exhausted` P1/StackState, no hidden acceptance, and zero intervention. This v2 attempt does not rewrite that result.

## Gate B2 — `greenfield-express-v2`

**Official result: Not Green.** Exactly one attempt ran through `runGreenfieldExpressV2()`, `runLiveWorkInstrument()`, and the production `StructuredTaskStackApplicationService` / `StructuredTaskApplicationService`. No instrument-authoring fallback, title heuristic, manual coding, fixture repair, runtime retune, or rerun occurred.

### Dependency prerequisite

The deliberately authorized exact prerequisite `npm install express@5.1.0` ran once in the clean fixture workspace. It exited `0`, emitted `91` stdout bytes and `0` stderr bytes, and took `2,597.047 ms`. No substitute dependency or command was used.

### StackState progression

1. Stack began P1 with status `in_progress`, current task `1`, `0/3` completed.
2. P1 began W1 with TaskState `in_progress` and zero blockers.
3. P1 ended `failed`, W1 remained `active`, R1/R2/R3 remained pending, V1 remained pending with zero attempts, correction count remained zero, and one blocker was recorded: `Work unit W1 did not complete.`
4. Stack fail-stopped `failed` at P1 with `0/3` completed. P2 and P3 remained pending and received no provider requests or tools.

Strict order and fail-stop behavior were preserved, but the required P1/P2/P3 completion criterion was not met.

### INSPECT and provider requests

P1 made one top-level INSPECT request. It had `toolChoice: required`, no continuation, and exposed only `read_file`, `list_directory`, `search_text`, `git_status`, and `git_diff`. Qwen emitted four calls in the successful inspection round:

1. `git_status {}` — succeeded;
2. `list_directory {"path":""}` — succeeded;
3. `search_text {"query":"package.json"}` — succeeded;
4. `search_text {"query":"src/"}` — succeeded.

The application completed INSPECT after that successful tool round; there was no INSPECT continuation. P2 and P3 were not reached, so they had no INSPECT requests or calls.

The second and final provider request was P1 implementation with automatic/default tool choice, no continuation, and the unchanged coding-tool surface.

### Mutation and approval truth

The implementation response emitted three `write_file` proposals:

1. `package.json`, 230 content bytes;
2. `src/app.js`, 175 content bytes;
3. `src/server.js`, 184 content bytes.

The application registered six tool requests overall: four successful inspection reads, the failed `package.json` write, and an unavailable `src/app.js` write. Five tools reached `tool.started`; four reads completed and the `package.json` write failed. The later `src/app.js` write did not reach a terminal execution state, and the `src/server.js` proposal was not registered after the same-round failure. Thus the provider emitted `7` call proposals, George recorded `6` tool requests, `5` started, and **zero mutations succeeded**.

The failed `package.json` request contained no `expectedSha256`. Because the authorized dependency prerequisite had already created that file, the observed failure is consistent with the production existing-file rule requiring a lowercase SHA-256 current-content precondition. This cause is an inference from the bounded recorded arguments, existing fixture bytes, and production guard; the safe live artifact intentionally omits raw tool-error bodies.

Workspace Autonomous required no approval for these ordinary in-workspace mutations. No exceptional framing intent, outside-workspace request, process approval, network request from the model, or human intervention occurred.

### Validation, acceptance, convergence, and budgets

- Declared P1 V1 (`node --check src/app.js`): not run, zero attempts.
- P2/P3 focused/broad validations: not reached.
- Hidden acceptance: `not_run` because StackState did not complete.
- Duplicate/no-progress events: none.
- Provider attempts / logical rounds / retries: `2 / 2 / 0`.
- Provider input/output tokens: `3,746 / 345`.
- Context assemblies: `2`; both selected the unchanged ordinary profile with no promotion or compaction.
- INSPECT context: estimate `577`, input budget `8,192`, headroom `7,615`.
- Implementation context: estimate `2,311`, input budget `8,192`, headroom `5,881`.
- Structured stage ceilings remained unchanged: inspection `6` rounds / `4` calls / `2` duplicate reads; implementation `10` rounds / `8` calls / `2` duplicate reads. No stage ceiling exhausted.
- Task corrections: `0`; no correction budget was spent or exhausted.
- Run-budget limits remained `128` provider attempts, `128` tool executions, `32` retries, `32` compactions/checkpoints, `64` processes, `3,600,000 ms` process and wall time, and `1,000,000` each for context/input/output tokens.
- Run-budget consumption: `2` provider attempts, `6` tool-execution accounting units, `0` retries/compactions/processes, `0 ms` process runtime, `71,338 ms` elapsed, `2,888` context tokens, `3,746` provider input tokens, and `345` provider output tokens.
- Budget pressure/exhaustion: none; TaskState failed rather than exhausted.
- Timing: `71,371.469 ms` live-work total; `49,154 ms` recorded P1 workflow; dependency prerequisite separately took `2,597.047 ms`.
- Human coding intervention: `0`.

B2 is **Not Green** because P1 failed, P2/P3 did not run, declared validations did not run, final StackState was failed rather than completed, and hidden acceptance did not run. The absence of budget exhaustion does not convert this functional failure into Green.

## Gate C2 — `existing-express-feature-v2`

**Not run by gate.** B2 was Not Green, so C2's frozen fixture commit, dependency prerequisite, INSPECT, mutations/approvals, focused and broad validation, baseline preservation, final TaskState, hidden acceptance, calls/rounds/tokens/context/budgets/timing, and intervention dimensions were not spent and are not inferred.

## Evidence matrix

| Evidence | State | Basis |
| --- | --- | --- |
| Inherited Gate A exact edit / V1 / TaskState / hidden acceptance | **Green** | Exact 60 bytes, V1 passed, completed/verified TaskState, hidden acceptance passed. |
| Inherited Gate A calls / rounds / intervention / exhaustion | **Green** | 5 model-requested calls, 3 rounds, zero intervention, no exhaustion. |
| Gate A inheritance validity | **Green** | P1 changed qualification instruments/runners/tests only; production execution and Gate A inputs/acceptance/policy/limits were unchanged. |
| v1 history immutability | **Green** | Frozen byte/digest tests passed; historical v1 Not Green remains preserved. |
| v2 metadata, digests, semantics, and runner isolation | **Green** | Included in the `160/160` affected deterministic gate. |
| REST-visible pinned runtime | **Green** | Exact loaded model and all required REST-visible controls observed. |
| Controlled latency | **Evidence Gap** | GPU Offload 26 remains UI-only and unconfirmed. |
| Required deterministic pre-gate | **Green** | Affected `160/160`, typecheck, runner `90/90`, version/lockfile/diff hygiene. |
| Broader `npm test` characterization | **Not Green** | 5 OpenTUI renderer failures; 379 passed and 1 native-TTY test skipped. |
| B2 dependency authorization | **Green** | Exact authorized `npm install express@5.1.0` succeeded. |
| B2 INSPECT alignment | **Green** | Required-tool P1 preflight completed after one successful four-call read-only round. |
| B2 strict order/fail-stop | **Green** | P1 alone ran; P2/P3 remained pending after P1 failure. |
| B2 mutations / validations / StackState / hidden acceptance | **Not Green** | No mutation succeeded, no validation ran, StackState failed at P1, acceptance did not run. |
| B2 intervention / budget exhaustion | **Green** | Zero intervention; no task, stage, correction, or run-budget exhaustion. |
| Gate C2 existing app | **Not run by gate** | B2 stopped qualification. |
| Overall final Phase 9 larger-work qualification | **Not Green** | Gate A is Green, but mandatory B2 failed and C2 was not reached. |

## Artifacts

- Runtime capture: `artifacts/c9-greenfield-instrument-alignment-p2-20260925/runtime.json` (SHA-256 `3e5bf2473bd8766e6b9d3c59e7ae33e6afc721f8e48699edbabab2a030e13f05`)
- B2 harness: `artifacts/c9-greenfield-instrument-alignment-p2-20260925/gate-b2.ts` (SHA-256 `0487c055efca2bdd061119fac6bc6df183424d21f8bb769c9ccf02a9bc636487`)
- B2 outcome: `artifacts/c9-greenfield-instrument-alignment-p2-20260925/gate-b2-outcome.json` (SHA-256 `cbd9691567db3ff7a521fbc4e85665b33903bff8da16c1b45ee20843947d43d2`)
- B2 attempt envelope: `artifacts/c9-greenfield-instrument-alignment-p2-20260925/gate-b2/attempt.json` (SHA-256 `a153c26a8144f69fa81c3cb9a516e52ad92ab2820453a20ec64e12fde613e020`)
- B2 trace: `artifacts/c9-greenfield-instrument-alignment-p2-20260925/gate-b2/trace.json` (SHA-256 `800fd4e063fb9b18d71b23bd425f5f5328bb6a9aed475add10e6feaeefd22d29`)
- Preserved dependency-created `package.json`: `artifacts/c9-greenfield-instrument-alignment-p2-20260925/gate-b2-workspace/package.json` (SHA-256 `f3dee37c3a5a1214c8b6bb2099697560d7c8d8be6e21cbb0d60920d7083cdb6c`)
- Preserved dependency lockfile: `artifacts/c9-greenfield-instrument-alignment-p2-20260925/gate-b2-workspace/package-lock.json` (SHA-256 `2677357fd6f39cf1ff2bf77e111d71a519570be294657c2d5423882fc27641ef`)

The implementation result is this single uncommitted evidence document on unchanged HEAD `b4402d2ad768011f9647753802e60c86baaa8324`. The phase runner owns staging and commit creation.
