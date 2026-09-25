# c9 inspection execution correction closeout

Status: **IMPLEMENTATION COMPLETE; MANDATORY INSPECT EXECUTION AND EXCEPTION-SAFE LIVE TRACE QUALIFIED; QWEN CONVERGENCE AND OVERALL CORRECTION NOT QUALIFIED**

Date: 2026-09-25

Package: `0.9.10` (unchanged)

Pre-task HEAD and exact P3 candidate inspected: `0a15766f7ea76b56c9aa838fc49ad625c4b8fb00`

P1 mandatory-inspection candidate: `df32b36d9a02c2209b6a9f52d85f646095415ee6`

P2 exception-safe-trace candidate: `a5bad591d41ef765023a9da943459d2b39b2e46e`

Live evidence: [`P3-live-evidence.md`](P3-live-evidence.md)

This is an evidence-only correction closeout. It does not repair implementation, rerun a live workload, change limits or runtime/context settings, rewrite historical failures, owner-close Phase 9, or open Phase 10.

## Decision

| Decision | Result | Basis |
| --- | --- | --- |
| Implementation Complete | **Yes** | P1 and P2 implement the two approved correction boundaries with permanent focused regressions. Exact current source, deterministic validation, and the one official P3 attempt agree. |
| Mandatory INSPECT Execution Qualified | **Yes** | Provider-neutral and LM Studio adapter coverage is Green. Gate A's first request used `required`, exposed only the five inspection tools, and Qwen selected `read_file`; the stage could not finish text-only. Continuation omitted the override. |
| Exception-Safe Live Trace Qualified | **Yes** | The thrown-service regression is Green, and Gate A's thrown production failure returned a bounded failed result with persisted attempt/trace artifacts, safe state, normalized error, and available metrics. |
| Qwen Work-Unit Convergence Qualified | **No** | Gate A exhausted the unchanged INSPECT four-execution ceiling. Implementation, mutation, and V1 were not reached; the target stayed unchanged and TaskState ended `budget_exhausted`. |
| Overall c9-inspection-execution Qualified | **No** | Overall qualification requires all three boundaries Green. Mandatory INSPECT and trace retention are Green, but mandatory Gate A convergence is Not Green and is not waived. |

## Mandatory INSPECT execution audit

The prior live failure was text-only INSPECT: ordinary automatic choice let Qwen return without any accepted read-only tool evidence, after which the structured service failed visibly. P1 makes that deterministic requirement executable rather than relying on prompt prose.

Exact current source establishes:

- `ProviderRequest.toolChoice` is provider-neutral and limited to `auto | required | none`; absence preserves the prior request shape.
- the LM Studio adapter maps an explicit value to OpenAI-compatible `tool_choice`, omits the field when absent, and rejects `required` without an exposed tool before POST;
- `AgentLoopApplicationService` applies `initialToolChoice` only while no continuation exists, retains it across replay-safe retries of the initial request, and omits it from continuation requests and their retries;
- structured INSPECT alone supplies `initialToolChoice: 'required'` and retains exactly `read_file`, `list_directory`, `search_text`, `git_status`, and `git_diff` as its capability-reducing tool surface;
- observed completed local-read tool evidence remains the only way to satisfy inspection; a scripted text-only response fails visibly;
- ordinary requests with no override, implementation, correction, and ordinary chat retain the prior automatic/default behavior and tool surfaces;
- an adapter/backend rejection remains a normalized provider failure rather than being silently treated as inspection evidence.

Focused provider, one-turn, structured-task, and frozen-replay tests cover every mapping, empty required surface, initial retry, continuation retry, restricted tool list, text-only failure, and unchanged later-stage behavior. Gate A then supplied the required live proof: its initial request used `toolChoice: required`; Qwen's first call was `read_file {"path":"src/label.js"}`; that call succeeded with full-file SHA-256 `4cd4635c7d8ef07c10bf7a2296d0f4d79cd3e753c1794774656eac5e764d4352`. The continuation had no tool-choice override.

Mandatory INSPECT Execution is **Qualified**.

## Exception-safe live trace audit

The prior Qwen-workunit attempt lost its official event envelope because `runLiveWorkInstrument()` awaited the production service before constructing a result. P2 confines exception conversion to the qualification observer; normal production task execution still throws normally.

Exact current source and deterministic tests establish:

- operational events are retained before the optional observer runs;
- an optional observer failure is isolated in `observerError` and cannot discard production evidence or manufacture production failure/success;
- a thrown single-task or stack service error is normalized to bounded code/message data and returned as a non-qualifying result;
- available TaskState and StackState are independently projected through their safe bounded projections; an invalid partial projection is omitted rather than exposed;
- hidden acceptance remains `not_run` after a production exception;
- provider/tool/context/budget/timing evidence observed before the throw remains derivable;
- `attempt.json` and `trace.json` are atomically written before optional report rendering, so report failure cannot erase raw artifacts.

The permanent thrown-INSPECT regression retains pre-throw events, TaskState, provider rounds/tokens/context/budgets, a bounded terminal error, no raw provider secret, and both artifacts. The official Gate A throw exercised the same boundary end to end. Its artifacts exist and match the recorded hashes:

- `attempt.json`: `0b6b3f6cb7a8072b335390cbc377d5b2b9993edcc5dd712841f30ca553bf5d1f`;
- `trace.json`: `2010cbc007f0186807e1bfb56614849537ec9fb449fdf201baff999c6a3968db`.

The failed envelope retains `terminalStatus: budget_exhausted`, `hiddenAcceptance: not_run`, zero human interventions, the safe TaskState, 140 bounded event records, and all available metrics. The normalized terminal message says INSPECT produced no evidence even though successful local-read events are retained; the authoritative TaskState and stage-exhaustion evidence correctly identify the terminal cause. This diagnostic inconsistency does not erase or upgrade the failed result.

Exception-Safe Live Trace is **Qualified**.

## Live qualification

Exactly one official Gate A attempt ran on P2 candidate `a5bad591d41ef765023a9da943459d2b39b2e46e` with Node `v26.10.0`, npm `11.19.1`, LM Studio, and exact model `qwen3-coder-30b-a3b-instruct@q4_k_m`. REST reported context `32,768`, eval batch `2,048`, physical batch `512`, parallel `1`, Flash Attention enabled, GPU KV-cache offload enabled, and `8` experts. UI-only GPU Offload 26 remained unconfirmed, so controlled latency remains an Evidence Gap. No runtime, context, convergence, retry, correction, or stage-limit setting changed.

Qwen requested three read-only tools in the required initial round and three more in the automatic continuation. Four calls completed successfully: target `read_file`, `git_status`, `search_text`, and test `read_file`. A fifth George request, `list_directory src`, failed before execution when the unchanged four-execution stage ceiling was exhausted; the sixth provider-requested call was not admitted after termination.

| Gate A dimension | Observed result |
| --- | --- |
| Mandatory inspection evidence | **Green:** four completed local reads; first Qwen tool was target `read_file`. |
| Implementation/mutation | **Not reached:** no mutation request or precondition; recovered target remained `export const label = (value) => value.trim();`. |
| George-owned V1 | **Not reached:** pending with zero attempts. |
| TaskState | **Not Green:** `budget_exhausted`; R1/R2 pending, W1 active, V1 pending, zero corrections, one blocker, no verified requirement. |
| Human intervention | **Green:** `0`. |
| Model-requested tool calls | **Green against numeric bound:** `6` (`5` George requests; `4` executed successfully), within `<=10`. |
| Provider rounds / attempts / retries | **Green against numeric bound:** `2 / 2 / 0`, within `<=10` rounds. |
| Provider tokens | `3,946` input / `134` output. |
| Context | Ordinary profile; `1,981` estimated tokens; `8,192` provider-input budget; `6,211` headroom; no promotion. |
| Run budget | No run-budget pressure/exhaustion; 2 attempts, 4 tool executions, 12,524 ms wall time. |
| Stage/task budget | **Not Green:** INSPECT four-execution ceiling exhausted; task terminal outcome `budget_exhausted`. |
| Timing | `12,531.550488 ms` total; no completed workflow timing. |

Gate A is **Not Green** because the exact edit, V1 pass, completed/verified TaskState, and no-exhaustion requirements failed. Gate B `greenfield-express-v1` was correctly **not run by gate**. Gate C `existing-express-feature-v1` was correctly **not run by gate** because Gate B was not reached. No live result is inferred for either.

Qwen Work-Unit Convergence is **Not Qualified**.

## Inherited qualified boundaries

| Boundary | Closeout truth |
| --- | --- |
| Mutation SHA/precondition contract | **Qualified, inherited.** Full-file `read_file.sha256`, inspection handoff, dynamic read-to-mutation replay, and stale-precondition rejection remain Green; Gate A did not reach mutation. |
| Production task-stack execution | **Qualified, deterministic, inherited.** Full-stack validation, ordering, fail-stop, durable state/history, reopen/no-replay resume, runner delegation, and hidden-acceptance isolation remain Green. |
| c9 convergence controls | **Green, deterministic.** Bounded inspection handoff, validation diagnostics, task-wide budgets, direct validation, stage ceilings, exact duplicate/no-progress guard, and ordinary-loop non-regression passed the affected floor. Gate A's unchanged ceiling firing is truthful enforcement, not evidence of bypass. |
| Bubblewrap containment | **Green, inherited.** No containment code or policy changed and no new containment regression was observed. |
| Native OpenTUI | **Evidence Gap, unchanged.** No supported Node-26 real-TTY evidence was added. |
| Context/runtime settings | **Unchanged.** Existing profiles remain provisional inherited policy; no tuning occurred. GPU Offload 26 remains unconfirmed for controlled latency. |
| Historical Phase 8/Phase 9/c9 failures | **Unchanged.** No earlier Not Green or Evidence Gap result is rewritten by these two qualified repair boundaries. |

## Closeout validation and hygiene

Observed against exact P3 candidate `0a15766f7ea76b56c9aa838fc49ad625c4b8fb00` before this documentation change:

| Check | Result |
| --- | --- |
| Focused P1/P2, frozen replay, mutation, c9 convergence/stack, task/state/session/recovery/workflow/agent-loop, Phase 5, and Phase 9 affected floor | **Green: 134/134 passed.** |
| Phase 9 integration | **Green: 3/3**, included in the affected floor. |
| `npm run typecheck` | **Green.** |
| `npm run test:runner` | **Green: 90/90 passed.** |
| `npm test` on the available closeout host | **Not runnable:** Node `v24.21.0` rejects required `--experimental-ffi`. |
| Flagless broad characterization | **Not Green: 342/371 passed, 28 failed, 1 skipped.** The 28 failures are the inherited OpenTUI native-FFI-dependent renderer/integrated cases on Node 24; they do not establish native TUI behavior. |
| Package version | **Green: exactly `0.9.10`.** |
| Root `package-lock.json` | **Green: absent.** |
| `git diff --check` | **Green.** |

The implementation result is this single uncommitted closeout document on unchanged HEAD `0a15766f7ea76b56c9aa838fc49ad625c4b8fb00`. Owner acceptance and Phase 9 owner closeout remain separate; Phase 10 is not opened.
