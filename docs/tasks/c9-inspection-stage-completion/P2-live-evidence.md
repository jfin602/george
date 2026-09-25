# P2 gated inspection-stage-completion live qualification evidence

Status: **NOT GREEN — Gate A missed the exact byte-for-byte edit; Gates B and C were not run**

Date: 2026-09-25

Correction: `c9-inspection-stage-completion` / P2

Exact candidate: `171f863275c5b6040f167203eba8d42aa7e7451d` (`c9-inspection-stage-completion/P1: Deterministic structured inspection stage completion`)

Package: `0.9.10` (unchanged)

## Runtime provenance

Immediately before live work the runner printed:

    MANUAL CHECK: LM Studio GPU Offload must show 26

Qualification used Node `v26.10.0`, npm `11.19.1`, LM Studio at `http://127.0.0.1:1234`, and exactly `qwen3-coder-30b-a3b-instruct@q4_k_m`.

`GET /api/v1/models` reported the pinned loaded instance with context length `32,768`, eval batch `2,048`, physical batch `512`, parallel `1`, Flash Attention enabled, GPU KV-cache offload enabled, and `8` experts. Main-model GPU Offload `26` is UI-only and was not independently observed. Functional evidence remains usable; controlled latency is an **Evidence Gap**. No runtime, context, convergence, retry, correction, or stage-limit setting changed.

The harness outcome inherited a stale parent `npm_config_user_agent` string naming Node 24/npm 11.19.0. Direct executable checks immediately before and after the attempt both reported Node `v26.10.0` and npm `11.19.1`; the attempt artifact itself also records Node `v26.10.0`.

## Deterministic pre-gate

The required pre-gate was Green under Node 26:

- `137/137` passed across P1 early successful-tool-round completion, provider tool-choice mapping, structured INSPECT, exception-safe live trace/artifacts, full-file read SHA and mutation preconditions, frozen Phase 8 replay, task/stack state, run budgets, recovery, session persistence, Phase 5, and Phase 9 integration.
- The frozen deterministic replay completed INSPECT in one provider round, propagated the observed full-file SHA into the mutation request, made the exact edit, and passed George-owned V1.
- `npm run typecheck`: Green.
- `npm run test:runner`: Green, `90/90` passed.
- `git diff --check`: Green before live work.
- Package remained exactly `0.9.10`; root `package-lock.json` remained absent.

An earlier duplicate affected-test invocation used the shell's default Node 24 and also passed `137/137`; it was not counted as the qualifying pre-gate and did not contact the live provider.

## Gate A — exact frozen structured replay

Exactly one official attempt ran through `runLiveWorkInstrument()` and the production `StructuredTaskApplicationService` using unchanged fixture `test/fixtures/p9-phase8-structured-edit-validation.task.txt` (SHA-256 `ac85295343d201711b3f177e4ba44a5055fbfe8acf736f23b9c6a47f0ef59c07`). No rerun or human coding intervention occurred.

### INSPECT and no-continuation proof

Provider request 1 was the INSPECT request. It used `toolChoice: required`, exposed only `read_file`, `list_directory`, `search_text`, `git_status`, and `git_diff`, and produced these ordered Qwen calls:

| Order | Call | Requested arguments | Admitted terminal result |
| ---: | --- | --- | --- |
| 1 | `read_file` / `call_3098421703160145` | `src/label.js` | Succeeded; full-file SHA-256 `4cd4635c7d8ef07c10bf7a2296d0f4d79cd3e753c1794774656eac5e764d4352`. |
| 2 | `git_status` / `call_3098421703160146` | `{}` | Succeeded. |
| 3 | `list_directory` / `call_3098421703160147` | `.` | Succeeded. |
| 4 | `search_text` / `call_3098421703160148` | query `label`, path `src/` | Succeeded. |

All four calls in the accepted provider round executed in order. At least one qualifying local read succeeded; all four had `local_read` effect and succeeded.

There was no INSPECT continuation. The complete provider-request sequence was:

1. request 1: stage `inspection`, `toolChoice: required`, `continuation: false`;
2. request 2: stage `implementation`, automatic/default tool choice, `continuation: false`;
3. request 3: stage `implementation`, automatic/default tool choice, `continuation: true`.

Thus the request immediately after the successful INSPECT tool round started implementation rather than continuing INSPECT. The implementation request received bounded inspection evidence, including the target path/content projection and full-file SHA. Qwen then reused that exact observed SHA as the mutation precondition without another target read.

### Implementation and mutation provenance

Implementation began at provider request 2. Qwen requested:

    write_file {
      "path": "src/label.js",
      "expectedSha256": "4cd4635c7d8ef07c10bf7a2296d0f4d79cd3e753c1794774656eac5e764d4352",
      "contentBytes": 59
    }

The request's `expectedSha256` exactly matched the SHA observed from INSPECT `read_file`. George admitted and completed the mutation successfully, returning SHA-256 `4d4442213eef8109d7df78a656145a263976e6fde1476e281a6368c036c38861` for the 59-byte file.

The required frozen benchmark content is 60 bytes and ends in a newline:

    export const label = (value) => value.trim().toUpperCase();\n

The observed 59-byte file omitted that final newline:

    export const label = (value) => value.trim().toUpperCase();

The semantic JavaScript change was present, but the exact required byte sequence was not. The harness exact-edit check and hidden acceptance therefore failed.

### Validation and final state

George-owned V1 ran once through `node --test test/label.test.js` and passed with exit code `0`. TaskState ended `completed`: R1 and R2 were `verified`, W1 was `addressed`, V1 was `passed` with one attempt, terminal outcome was `completed`, blocker count was zero, and correction history was empty.

This state is necessary but not sufficient for Gate A. Gate A is **Not Green** because the separately required exact edit was absent. The repository-owned result was non-qualifying with `hiddenAcceptance: failed` even though its production task status was `completed`.

### Raw dimensions

| Dimension | Official result |
| --- | --- |
| Model-requested tool calls | `5`: four INSPECT reads and one implementation `write_file`. |
| Executed tool calls | `6`: all five model-requested calls plus one George-owned `run_process` validation; all succeeded. |
| Logical provider rounds / attempts / retries | `3 / 3 / 0`. |
| Provider input / output tokens | `7,567 / 276`. |
| Context | Ordinary profile `qwen3-coder-30b-a3b-instruct-q4_k_m-lm-studio-32k-ordinary`; INSPECT estimated `1,981`, budget `8,192`, headroom `6,211`; implementation estimated `2,610`, budget `8,192`, headroom `5,582`; no promotion. The implementation continuation reused the frozen assembly. |
| Run budget | Limits: 128 provider attempts, 128 tool executions, 32 retries, 32 compactions/checkpoints, 64 processes, 3,600,000 ms process/wall time, and 1,000,000 context/input/output tokens. Consumed: 3 attempts, 6 tool executions, 0 retries/compactions, 1 process, 82 ms process time, 42,028 ms wall time, 4,591 context tokens, 7,567 input tokens, and 276 output tokens. No pressure or exhaustion event. |
| Stage/task budget | INSPECT used one round and four calls at its unchanged `6`-round / `4`-call ceiling, then completed successfully. Implementation used two rounds and one tool call within its unchanged `10`-round / `8`-call ceiling. No stage, correction, task, or run-budget exhaustion occurred. |
| Duplicate/no-progress evidence | No duplicate call and no no-progress event. Each model-requested call was unique. |
| Correction history | Empty; correction count `0`. |
| Timing | `42,041.639502 ms` total; run-budget elapsed `42,028 ms`; completed workflow timings `32,422 ms` and `103 ms`. Provider-active timing was not separately emitted. |
| Approvals / human coding intervention | Two normal `allow_once` approvals (`write_file`, George-owned validation); human coding interventions `0`. |

The call and round limits, inspection transition, mutation-precondition provenance, V1, completed TaskState, zero intervention, and no-exhaustion criteria were Green. The exact-edit criterion was Not Green, so the gate cannot pass.

### Longitudinal comparison

| Attempt | Result | Model calls | Provider rounds | Input / output tokens | Elapsed |
| --- | --- | ---: | ---: | ---: | ---: |
| Preserved Phase 8 | Not Green | 10 | 7 | 20,765 / 406 | 45.826 s |
| First Phase 9 | Not Green | 25 | 20 | 63,253 / 1,801 | 344.745 s |
| First c9 Gate A | Not Green | Evidence Gap | Evidence Gap | Evidence Gap | Evidence Gap |
| c9 Qwen-workunit P3 | Not Green | Evidence Gap | Evidence Gap | Evidence Gap | Evidence Gap |
| c9 inspection-execution P3 | Not Green | 6 model-requested | 2 | 3,946 / 134 | 12.532 s |
| Current stage-completion P2 | **Not Green** | 5 | 3 | 7,567 / 276 | 42.042 s |

The current result proves the corrected no-continuation INSPECT transition and reaches mutation/validation/completed TaskState, unlike the preserved later Phase 9/c9 failures. It does not rewrite any prior Not Green result and is itself Not Green because byte-exact acceptance failed.

## Gate B — greenfield production stack

**Not run by gate.** Gate A was Not Green. `greenfield-express-v1`, dependency installation/network authorization, production StackState, and hidden acceptance were not spent.

## Gate C — existing app

**Not run by gate.** Gate B was not reached. `existing-express-feature-v1`, its dependency prerequisite, focused/broad validation, baseline preservation, and hidden acceptance were not spent.

## Evidence matrix

| Evidence | State | Basis |
| --- | --- | --- |
| P1/inherited deterministic pre-gate | **Green** | 137/137 affected tests under Node 26, typecheck, runner 90/90, diff/version/lockfile hygiene. |
| REST-visible pinned runtime | **Green** | Exact loaded model and all required REST-visible controls observed. |
| Controlled latency | **Evidence Gap** | GPU Offload 26 remains UI-only and unconfirmed. |
| INSPECT qualifying evidence | **Green** | Four ordered successful local-read executions in the required first round. |
| INSPECT no-continuation transition | **Green** | Provider request 2 was a fresh implementation request; no second INSPECT request occurred. |
| Mutation-precondition provenance | **Green** | INSPECT read SHA exactly matched `write_file.expectedSha256`; mutation succeeded. |
| George-owned V1 and TaskState | **Green** | V1 passed once; completed TaskState had R1/R2 verified and W1 addressed. |
| Exact required edit / hidden acceptance | **Not Green** | Final newline was omitted: 59 observed bytes versus the required 60-byte frozen content. |
| Calls, rounds, intervention, and exhaustion | **Green** | 5 model calls, 3 rounds, zero retries/interventions/corrections, and no exhaustion. |
| Gate A overall | **Not Green** | Every locked criterion is mandatory; exact edit failed. |
| Gate B greenfield / hidden acceptance | **Not run by gate** | Gate A stopped qualification. |
| Gate C existing app / hidden acceptance | **Not run by gate** | Gate B was not reached. |

## Artifacts

- Official harness: `artifacts/c9-inspection-stage-completion-p2-20260925/gate-a.ts`
- Runtime capture: `artifacts/c9-inspection-stage-completion-p2-20260925/runtime.json` (SHA-256 `3e5bf2473bd8766e6b9d3c59e7ae33e6afc721f8e48699edbabab2a030e13f05`)
- Outcome: `artifacts/c9-inspection-stage-completion-p2-20260925/gate-a-outcome.json` (SHA-256 `04353e12484130f9f33ba690195b02e0431511de79371a4639ba1ba96c2a7a2e`)
- Attempt envelope: `artifacts/c9-inspection-stage-completion-p2-20260925/gate-a/attempt.json` (SHA-256 `1f5dec7615be059be8f43dd57efe1019ff4203b404249f20c3a7ea8bbc0d5802`)
- Trace: `artifacts/c9-inspection-stage-completion-p2-20260925/gate-a/trace.json` (SHA-256 `3db7cef7c10ca9aa4443c4089c227180cd5bcbb1bd9e99d85b9c566bdb0f4cc7`)
- Recovered target: `artifacts/c9-inspection-stage-completion-p2-20260925/gate-a-workspace/label.js`
- Recovered fixture test: `artifacts/c9-inspection-stage-completion-p2-20260925/gate-a-workspace/label.test.js`

No production code changed. No official workload was rerun. Phase 9 is not owner-closed and Phase 10 is not opened.
