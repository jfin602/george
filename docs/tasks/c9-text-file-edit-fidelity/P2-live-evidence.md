# P2 gated text-file edit fidelity live qualification evidence

Status: **NOT GREEN — Gate A failed exact byte-level acceptance; Gates B and C were not run**

Date: 2026-09-25

Correction: `c9-text-file-edit-fidelity` / P2

Pre-task HEAD and exact candidate: `2c2a88da279f5acc25b8c0bc338231a16ffd1113` (`c9-text-file-edit-fidelity/P1: Text-file framing evidence and mutation fidelity guard`)

Package: `0.9.10` (unchanged)

## Runtime provenance

Immediately before live work the runner printed:

    MANUAL CHECK: LM Studio GPU Offload must show 26

Qualification used Node `v26.10.0`, npm `11.19.1`, LM Studio at `http://127.0.0.1:1234`, and exactly `qwen3-coder-30b-a3b-instruct@q4_k_m`.

`GET /api/v1/models` reported the pinned loaded instance with context length `32,768`, eval batch `2,048`, physical batch `512`, parallel `1`, Flash Attention enabled, GPU KV-cache offload enabled, and `8` experts. Main-model GPU Offload `26` is UI-only and was not independently observed. Functional evidence remains usable; controlled latency is an **Evidence Gap**. No runtime, context, convergence, retry, correction, or stage setting changed.

## Deterministic pre-gate

The required pre-gate was Green under Node 26:

- `129/129` passed across P1 framing/read/mutation/recovery, full-file SHA and mutation preconditions, required first-round INSPECT and completion, exception-safe live trace/artifacts, frozen Phase 8 replay, structured task/stack/convergence, run-budget/recovery/session state, Phase 5, and Phase 9 integration coverage.
- The frozen deterministic replay exercised the exact 59-byte rejection, unchanged SHA, corrected 60-byte retry, George-owned V1, and completed TaskState.
- `npm run typecheck`: Green.
- `npm run test:runner`: Green, `90/90` passed.
- `git diff --check`: Green before live work.
- Package remained exactly `0.9.10`; root `package-lock.json` remained absent.

## Gate A — exact frozen structured replay

Exactly one new official attempt ran through `runLiveWorkInstrument()` and the production `StructuredTaskApplicationService`. It used the unchanged `test/fixtures/p9-phase8-structured-edit-validation.task.txt`, SHA-256 `ac85295343d201711b3f177e4ba44a5055fbfe8acf736f23b9c6a47f0ef59c07`. There was no rerun or human coding intervention.

### INSPECT and implementation evidence

The first provider request was INSPECT with `toolChoice: required`, no continuation, and only `read_file`, `list_directory`, `search_text`, `git_status`, and `git_diff`. Qwen requested four ordered calls: target `read_file`, `git_status`, root `list_directory`, and `search_text` for `label` under `src/`; all succeeded.

Target `read_file` returned:

- path: `src/label.js`;
- bytes: `46`;
- SHA-256: `4cd4635c7d8ef07c10bf7a2296d0f4d79cd3e753c1794774656eac5e764d4352`;
- `textFraming`: `{ "lineEnding": "lf", "finalNewline": "lf" }`.

There was no INSPECT continuation. Provider request 2 was a fresh implementation request. Its recorded bounded inspection slice supplied the same target SHA and exact framing object above.

### Mutation rejection and recovery path

The model mutation sequence was:

| Order | Tool | Request | Result and file state |
| ---: | --- | --- | --- |
| 1 | `write_file` | 59-byte full replacement; `expectedSha256` `4cd463...4352`; no `allowTextFramingChange` | Recoverable `validation` rejection: `Text framing change requires explicit acknowledgement: current lineEnding=lf finalNewline=lf; proposed lineEnding=none finalNewline=none.` The file remained 46 bytes with unchanged SHA `4cd463...4352` and final bytes `28 29 3b 0a`. |
| 2 | `read_file` | `src/label.js` | Confirmed the same 46 bytes, SHA, and `{lf, lf}` framing. |
| 3 | `apply_patch` | One exact edit, old text 46 bytes -> new text 60 bytes; retry precondition `4cd463...4352`; no framing opt-in | The frozen benchmark approval policy denied `apply_patch`; the file remained 46 bytes with unchanged SHA. |
| 4 | `write_file` | 59-byte full replacement; retry precondition `4cd463...4352`; `allowTextFramingChange: true` | Succeeded exactly as requested, producing SHA `4d4442213eef8109d7df78a656145a263976e6fde1476e281a6368c036c38861`. |

The framing guard therefore behaved correctly: it rejected the unacknowledged framing change before publication and preserved the still-valid SHA. Qwen subsequently used the explicit opt-in for a change the frozen task did not require. George correctly treated that flag as acknowledgement rather than silently repairing the content.

Final target truth:

- observed: 59 bytes, `export const label = (value) => value.trim().toUpperCase();`;
- observed SHA-256: `4d4442213eef8109d7df78a656145a263976e6fde1476e281a6368c036c38861`;
- observed framing: `{ "lineEnding": "none", "finalNewline": "none" }`;
- exact hex: `6578706f727420636f6e7374206c6162656c203d202876616c756529203d3e2076616c75652e7472696d28292e746f55707065724361736528293b`;
- required: 60 bytes ending in `0a`, SHA-256 `1216991565e68e28f49d5658371d1a8247b2227e224eb166d84573545faa5039`.

Exact acceptance and hidden acceptance were therefore **Not Green**.

### Validation, state, and metrics

George-owned V1 ran once as `node --test test/label.test.js` and passed with exit code `0`. Final TaskState was `completed`: R1/R2 `verified`, W1 `addressed`, V1 `passed` in one attempt, no blockers, and no corrections. That state does not override the separate frozen exact-byte acceptance requirement.

| Dimension | Official result |
| --- | --- |
| Model-requested / executed tool calls | `8 / 9`: four INSPECT calls; implementation `write_file`, `read_file`, `apply_patch`, `write_file`; plus one George-owned validation. |
| Logical provider rounds / attempts / retries | `6 / 6 / 0`. |
| Provider input / output tokens | `18,069 / 611`. |
| Context | Ordinary profile `qwen3-coder-30b-a3b-instruct-q4_k_m-lm-studio-32k-ordinary`; INSPECT estimate `1,997`, input budget `8,192`, headroom `6,195`; implementation estimate `2,792`, input budget `8,192`, headroom `5,400`; no promotion. |
| Stage limits | INSPECT completed in one round and four calls at the unchanged `6`-round / `4`-call ceiling. Implementation used five rounds and four model tool calls within its unchanged `10`-round / `8`-call ceiling. |
| Run budget | Limits remained 128 provider attempts, 128 tool executions, 32 retries/compactions/checkpoints, 64 processes, 3,600,000 ms process/wall time, and 1,000,000 context/input/output tokens. Consumed: 6 attempts, 8 model tool executions plus one George-owned process, 0 retries/compactions, 1 process, 73 ms process time, 109,698 ms budget elapsed, 4,789 context tokens, 18,069 input tokens, and 611 output tokens. |
| Exhaustion / pressure | No task, stage, correction, or run-budget exhaustion; no pressure event. The normal recoverable framing rejection was not counted as exhaustion. |
| Duplicate/no-progress | One target reread followed the fidelity rejection. No duplicate-suppression or no-progress event occurred. |
| Corrections | `0`. |
| Timing | `109,718.394 ms` total; workflow timings `90,552 ms` and `97 ms`. Provider-active timing was not separately emitted. |
| Permissions / intervention | Three `allow_once` approvals, one policy denial for `apply_patch`, and zero human coding interventions. |
| Terminal truth | Production task `completed`; hidden acceptance `failed`; Gate A **Not Green**. |

Gate A stayed within the `<=10` model-call and `<=10` round limits, had no exhaustion, passed V1, and completed verified TaskState. It failed the mandatory exact 60-byte content and hidden acceptance criteria, so Qwen Work-Unit Convergence remains **Not Qualified**.

### Longitudinal comparison

| Preserved attempt | Result | Model calls | Provider rounds | Input / output tokens | Elapsed |
| --- | --- | ---: | ---: | ---: | ---: |
| Phase 8 | Not Green | 10 | 7 | 20,765 / 406 | 45.826 s |
| First Phase 9 | Not Green | 25 | 20 | 63,253 / 1,801 | 344.745 s |
| First c9 Gate A | Not Green | Evidence Gap | Evidence Gap | Evidence Gap | Evidence Gap |
| c9 Qwen-workunit P3 | Not Green | Evidence Gap | Evidence Gap | Evidence Gap | Evidence Gap |
| c9 inspection-execution P3 | Not Green | 6 | 2 | 3,946 / 134 | 12.532 s |
| c9 inspection-stage-completion P2 | Not Green | 5 | 3 | 7,567 / 276 | 42.042 s |
| Current text-file-fidelity P2 | **Not Green** | 8 | 6 | 18,069 / 611 | 109.718 s |

The current attempt newly proves the framing evidence and rejection path live, but it does not rewrite any earlier result and does not establish exact-edit convergence.

## Larger live gates

Gate B `greenfield-express-v1` was **not run by gate** because Gate A was Not Green. Its dependency/network authorization, production StackState, declared validations, and hidden acceptance were not spent.

Gate C `existing-express-feature-v1` was **not run by gate** because Gate B was not reached. Its focused/broad validation, baseline preservation, TaskState, framing-churn check, and hidden acceptance were not spent.

## Evidence matrix

| Evidence | State | Basis |
| --- | --- | --- |
| P1 and inherited deterministic pre-gate | **Green** | 129/129 affected tests, typecheck, runner 90/90, version/lockfile/diff hygiene under Node 26. |
| REST-visible pinned runtime | **Green** | Exact loaded model and required REST-visible controls observed. |
| Controlled latency | **Evidence Gap** | GPU Offload 26 remains UI-only and unconfirmed. |
| INSPECT framing/SHA evidence and one-round completion | **Green** | Full-file SHA plus `{lf, lf}` framing reached implementation after one successful INSPECT round with no inspection continuation. |
| Default mutation fidelity rejection | **Green** | The first 59-byte write was rejected recoverably and left bytes/SHA unchanged. |
| Explicit acknowledgement semantics | **Green** | George later wrote exactly the acknowledged 59-byte replacement without silent normalization. |
| George-owned V1 and TaskState | **Green** | V1 passed once; completed TaskState had R1/R2 verified and W1 addressed. |
| Calls, rounds, intervention, and exhaustion | **Green** | 8 model calls, 6 rounds, zero retries/interventions/corrections, and no exhaustion. |
| Exact required edit / hidden acceptance | **Not Green** | Qwen used the opt-in to omit the final newline: 59 observed bytes versus 60 required. |
| Gate A overall | **Not Green** | Every locked criterion is mandatory; exact content and hidden acceptance failed. |
| Gate B greenfield | **Not run by gate** | Gate A stopped qualification. |
| Gate C existing app | **Not run by gate** | Gate B was not reached. |

## Artifacts

- Official harness: `artifacts/c9-text-file-edit-fidelity-p2-20260925/gate-a.ts` (SHA-256 `edd99fd54dfa6080936bd8b8c11fa54e96603c50eb4190468660c421d9f07963`)
- Runtime capture: `artifacts/c9-text-file-edit-fidelity-p2-20260925/runtime.json` (SHA-256 `3e5bf2473bd8766e6b9d3c59e7ae33e6afc721f8e48699edbabab2a030e13f05`)
- Outcome: `artifacts/c9-text-file-edit-fidelity-p2-20260925/gate-a-outcome.json` (SHA-256 `aaecef104b0349a2ce0b99ec149749f10a95342897b341529a2a70250ab97349`)
- Attempt envelope: `artifacts/c9-text-file-edit-fidelity-p2-20260925/gate-a/attempt.json` (SHA-256 `e9fc7b17de3e7ebc162ea4c9e27f79cb3864079984026c05bfbe399547054536`)
- Trace: `artifacts/c9-text-file-edit-fidelity-p2-20260925/gate-a/trace.json` (SHA-256 `564dcc368ab0c479a985112ab1864f4940a771ff5222a00149ea90a81e94e2a3`)
- Recovered target: `artifacts/c9-text-file-edit-fidelity-p2-20260925/gate-a-workspace/label.js` (59 bytes; SHA-256 `4d4442213eef8109d7df78a656145a263976e6fde1476e281a6368c036c38861`)
- Recovered fixture test: `artifacts/c9-text-file-edit-fidelity-p2-20260925/gate-a-workspace/label.test.js` (SHA-256 `d3ae6eedae53948583d6a95b76e1792a4b2671c8a1bffbce0766ed7f20b6b834`)

No production code changed. No official workload was rerun. Phase 9 is not owner-closed and Phase 10 is not opened.
