# P3 gated mandatory-inspection live qualification evidence

Status: **NOT GREEN — Gate A exhausted the structured INSPECT stage; Gates B and C were not run**

Date: 2026-09-25

Correction: `c9-inspection-execution` / P3

Exact candidate: `a5bad591d41ef765023a9da943459d2b39b2e46e` (`c9-inspection-execution/P2: Exception-safe live attempt retention`)

P1 candidate: `df32b36` (`c9-inspection-execution/P1: Required structured inspection execution`)

Package: `0.9.10` (unchanged)

## Runtime provenance

Immediately before live work the runner printed:

    MANUAL CHECK: LM Studio GPU Offload must show 26

Qualification used Node `v26.10.0`, npm `11.19.1`, LM Studio at `http://127.0.0.1:1234`, and exactly `qwen3-coder-30b-a3b-instruct@q4_k_m`.

`GET /api/v1/models` reported the pinned loaded instance with context length `32,768`, eval batch `2,048`, physical batch `512`, parallel `1`, Flash Attention `true`, GPU KV-cache offload `true`, and `8` experts. Main-model GPU Offload `26` is UI-only and was not independently observed. Functional evidence remains usable; controlled latency is an **Evidence Gap**. No runtime, context, provider, convergence-limit, retry, correction, or stage-limit setting was changed.

## Deterministic pre-gate

The deterministic pre-gate was Green under Node 26:

- `134/134` passed across provider tool-choice mapping, one-turn initial/continuation behavior, mandatory structured INSPECT, exception-safe live trace/artifacts, read/hash/mutation preconditions, dynamic frozen replay, structured task/stack state, run budgets, recovery, session persistence, coding workflow, Phase 5 qualification, and Phase 9 integration.
- The dynamic frozen replay made the exact edit from a preceding observed `read_file.sha256` and passed George-owned V1.
- `npm run typecheck`: Green.
- `npm run test:runner`: Green, `90/90` passed.
- `git diff --check`: Green before live work.
- Package remained exactly `0.9.10`; root `package-lock.json` remained absent.

## Gate A — exact frozen structured replay

Exactly one official attempt ran through `runLiveWorkInstrument()` and the production `StructuredTaskApplicationService` using the unchanged `test/fixtures/p9-phase8-structured-edit-validation.task.txt`. No rerun or human coding intervention occurred.

The first INSPECT provider request exposed only `read_file`, `list_directory`, `search_text`, `git_status`, and `git_diff`, with provider-neutral `toolChoice: required`. Qwen's first selected call was:

    call_3098421703160139 read_file {"path":"src/label.js"}

The initial round requested three read-only calls. Its continuation correctly returned to default/automatic tool choice (`toolChoice` absent) and requested three more calls. The bounded artifact records six model-requested provider tool calls, five George `tool.requested` events, four executed successes, one stage-limit failure, and one final provider call omitted from tool execution after termination.

### Inspection calls and results

| Order | Call | Requested arguments | Result |
| ---: | --- | --- | --- |
| 1 | `read_file` / `call_3098421703160139` | `src/label.js` | Succeeded. Full-file SHA-256 `4cd4635c7d8ef07c10bf7a2296d0f4d79cd3e753c1794774656eac5e764d4352`. |
| 2 | `git_status` / `call_3098421703160140` | `{}` | Succeeded. |
| 3 | `search_text` / `call_3098421703160141` | query `label`, path `test/` | Succeeded. |
| 4 | `read_file` / `call_3098421703160142` | `test/label.test.js` | Succeeded. Full-file SHA-256 `d3ae6eedae53948583d6a95b76e1792a4b2671c8a1bffbce0766ed7f20b6b834`. |
| 5 | `list_directory` / `call_3098421703160143` | `src` | Failed before execution: `Structured stage tool call limit of 4 exhausted.` |
| 6 | `list_directory` / `call_3098421703160144` | Bounded event omitted its arguments | Model-requested in the same terminal provider response; no George tool request or result was produced after termination. |

Mandatory first-round tool choice therefore produced observed read-only evidence. Gate A nevertheless terminated in INSPECT because Qwen exceeded the unchanged four-call structured-stage ceiling. The exception-safe qualification boundary returned and persisted the failed result. The normalized terminal error was `validation: Structured INSPECT preflight produced no read-only evidence.`; this message coexists with the retained successful read-only events, while the terminal TaskState truth is `budget_exhausted` with an explicit stage-exhaustion record.

Implementation was not reached. No mutation was requested, so mutation path, `expectedSha256`, and mutation result are not applicable. The recovered target remained:

    export const label = (value) => value.trim();

The exact required edit was absent. George-owned V1 did not run. Final TaskState was `budget_exhausted`: R1/R2 pending, W1 active, V1 pending with zero attempts, zero corrections, one blocker, and no covered requirement verified. Hidden acceptance was `not_run`. Human coding interventions were `0`.

### Raw dimensions

| Dimension | Official result |
| --- | --- |
| Model-requested tool calls | `6` (`5` became George tool requests; `4` executed successfully) |
| Logical provider rounds / attempts / retries | `2 / 2 / 0` |
| Provider input / output tokens | `3,946 / 134` |
| Context | ordinary profile `qwen3-coder-30b-a3b-instruct-q4_k_m-lm-studio-32k-ordinary`; estimated `1,981`; provider-input budget `8,192`; remaining headroom `6,211`; no promotion |
| Run budget | Limits: 128 provider attempts, 128 tool executions, 32 retries, 32 compactions/checkpoints, 64 processes, 3,600,000 ms process/wall time, 1,000,000 context/input/output tokens. Consumed: 2 attempts, 4 tool executions, 0 retries/compactions/processes, 12,524 ms wall time, 1,981 context tokens, 3,946 input tokens, 134 output tokens. No run-budget pressure or run-budget exhaustion event. |
| Stage/task budget | INSPECT stage exhausted at the four-execution ceiling; TaskState terminal outcome `budget_exhausted`. |
| Duplicate/no-progress evidence | No explicit duplicate-call or no-progress event was emitted. The second response requested two `list_directory` calls after four earlier successful inspection executions; termination prevented both from executing. |
| Correction history | Empty; correction count `0`. |
| Timing | `12,531.550488 ms` total; no completed workflow timing because INSPECT did not complete. |
| Human coding intervention | `0` |

Gate A is **Not Green**. Although inspection evidence and the `<=10` call/round bounds were observed, the exact edit, George-owned V1, completed/verified TaskState, and no-stage-exhaustion criteria failed.

### Longitudinal comparison

| Attempt | Result | Calls | Rounds | Input / output tokens | Elapsed |
| --- | --- | ---: | ---: | ---: | ---: |
| Preserved Phase 8 | Not Green | 10 | 7 | 20,765 / 406 | 45.826 s |
| First Phase 9 | Not Green | 25 | 20 | 63,253 / 1,801 | 344.745 s |
| First c9 Gate A | Not Green | Evidence Gap | Evidence Gap | Evidence Gap | Evidence Gap |
| c9 Qwen-workunit P3 | Not Green | Evidence Gap | Evidence Gap | Evidence Gap | Evidence Gap |
| Current inspection-execution P3 | **Not Green** | 6 model-requested | 2 | 3,946 / 134 | 12.532 s |

The current attempt closes the earlier trace gaps but does not convert any prior result to Green and does not establish functional convergence.

## Gate B — greenfield production stack

**Not run by gate.** Gate A was Not Green, so `greenfield-express-v1`, dependency installation/network authorization, production StackState, and hidden acceptance were not spent.

## Gate C — existing app

**Not run by gate.** Gate B was not reached, so `existing-express-feature-v1` and hidden acceptance were not spent.

## Evidence matrix

| Evidence | State | Basis |
| --- | --- | --- |
| P1/P2/inherited deterministic pre-gate | **Green** | 134/134 affected/inherited tests, typecheck, runner 90/90, diff/version/lockfile hygiene. |
| REST-visible pinned runtime | **Green** | Exact loaded model and required REST-visible controls observed. |
| Controlled latency | **Evidence Gap** | GPU Offload 26 remains UI-only and unconfirmed. |
| Mandatory initial INSPECT tool choice | **Green** | Initial provider request used `required`; continuation omitted the override; first Qwen call was `read_file`. |
| Exception-safe live trace/artifacts | **Green for this attempt** | Production failure returned a bounded result and both repository-owned artifacts persisted. |
| Gate A observed read-only evidence | **Green** | Four read-only calls completed, including both target/test reads and their SHA-256 values. |
| Gate A no exhaustion | **Not Green** | Structured INSPECT exhausted its four-execution stage ceiling and TaskState ended `budget_exhausted`. |
| Gate A exact edit / V1 / completed TaskState | **Not Green** | Implementation was not reached; target unchanged; V1 pending with zero attempts; requirements pending. |
| Gate A calls and rounds | **Green** | 6 model-requested tool calls and 2 logical provider rounds, both within `<=10`. |
| Gate B greenfield / hidden acceptance | **Not run by gate** | Gate A stopped qualification. |
| Gate C existing app / hidden acceptance | **Not run by gate** | Gate B was not reached. |

## Artifacts

- Official harness: `artifacts/c9-inspection-p3-20260925/gate-a.ts`
- Runtime capture: `artifacts/c9-inspection-p3-20260925/runtime.json`
- Outcome: `artifacts/c9-inspection-p3-20260925/gate-a-outcome.json`
- Attempt envelope: `artifacts/c9-inspection-p3-20260925/gate-a/attempt.json` (SHA-256 `0b6b3f6cb7a8072b335390cbc377d5b2b9993edcc5dd712841f30ca553bf5d1f`)
- Trace: `artifacts/c9-inspection-p3-20260925/gate-a/trace.json` (SHA-256 `2010cbc007f0186807e1bfb56614849537ec9fb449fdf201baff999c6a3968db`)
- Recovered unchanged target: `artifacts/c9-inspection-p3-20260925/gate-a-workspace/label.js`
- Recovered fixture test: `artifacts/c9-inspection-p3-20260925/gate-a-workspace/label.test.js`

No production code was changed. No official workload was rerun. Phase 9 is not owner-closed and Phase 10 is not opened.
