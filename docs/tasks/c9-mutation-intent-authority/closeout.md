# c9 mutation-intent authority correction closeout

Status: **IMPLEMENTATION COMPLETE; MUTATION INTENT AUTHORITY, FAIR GATE A APPROVAL, AND GATE A QUALIFIED; GATE B NOT GREEN; OVERALL CORRECTION NOT QUALIFIED**

Date: 2026-09-25

Package: `0.9.10` (unchanged)

Pre-task HEAD and exact P2 candidate inspected: `8daca74e67feb58ace2b57e36ec4fa34b711183d`

P1 implementation candidate: `77ac4f1cef9385d6cfdb50b5389982b6787fb351`

Live evidence: [`P2-live-evidence.md`](P2-live-evidence.md)

This is an evidence-only closeout. It does not repair implementation, rerun live workloads, rewrite historical failures, owner-close Phase 9, open Phase 10, or change the package version.

## Decision

| Decision | Result | Basis |
| --- | --- | --- |
| Implementation Complete | **Yes** | Exact current source contains the planned application-owned exceptional-intent approval seam, bounded approval representation, denial/allow-once behavior, persistence/TUI handling, separate frozen-edit qualification helper, and permanent regressions. Required deterministic validation is Green. |
| Mutation Intent Authority Qualified | **Yes** | Deterministic application tests prove model framing acknowledgement is intent rather than authority, Standard and Workspace Autonomous approval behavior, denial before dispatch with unchanged bytes/SHA, allow-once execution, outside-workspace preservation, bounded body-free approval data, and the unchanged trusted direct-executor boundary. |
| Fair Gate A Approval Qualified | **Yes** | The separate helper deterministically allows ordinary `write_file` and `apply_patch` only on the exact target, denies unrelated/outside/framing-intent mutations, and allows only the exact validation process. Historical benchmark semantics remain unchanged. Gate A exercised the helper with an exact-target patch and exact validation. |
| Gate A Qwen Work-Unit Convergence Qualified | **Yes** | One official attempt produced the exact 60-byte result, passed George-owned V1 and hidden acceptance, completed verified TaskState, used 5 model-requested calls and 3 rounds, required no intervention, and had no exhaustion. |
| Gate B Greenfield Qualified / Not Run | **No — Not Green** | Gate B ran once after Gate A Green. P1 exhausted the duplicate/no-progress stage after repeated `git_status`; no mutation or validation occurred, StackState did not complete, and hidden acceptance was not run. Strict ordering and fail-stop remained truthful. |
| Gate C Existing-App Qualified / Not Run | **Not Run** | Gate B was Not Green, so Gate C was correctly not spent. |
| Overall c9-mutation-intent-authority Qualified | **No** | A/B/C are mandatory. Gate B is Not Green and Gate C was not reached. |
| Phase 9 Ready For Owner Closeout | **No** | Phase 9 requires Gates A, B, and C all Green with no new blocking regression. Only Gate A is Green. |

## Mutation intent authority audit

`ApprovalRequest` now has one optional bounded mutation projection: the stable `text_framing_change` intent and George-owned warning. After ToolRegistry validation, the application loop recognizes `allowTextFramingChange: true` only for `write_file` and `apply_patch` and constructs that projection before any dispatch decision. It does not copy content, edits, patch bodies, or generic argument JSON into approval state.

Standard mode retains its ordinary mutation approval and adds the exceptional intent. Workspace Autonomous still auto-runs ordinary qualified workspace mutations, but returns an approval request for framing-change intent. A denial emits normal `approval.denied` and `tool.failed code=denied` evidence before `tool.started`; the executor does not run, no successful recovery intent is recorded, and target bytes/SHA remain unchanged. An `allow_once` decision permits only that exact call and does not create a remembered grant.

Outside-workspace `reject` still denies without prompting. Outside-workspace `ask` produces one exact-resource request carrying the same bounded intent without changing the canonical workspace or broadening path authority. Repository/model framing text cannot suppress this application-owned decision.

The low-level mutation executor remains unchanged: direct trusted callers may explicitly acknowledge a framing change, and the executor still publishes the caller's exact bytes. The correction adds authority at the model-originated application boundary rather than conflating executor capability with model permission.

Permanent coverage proves Standard ordinary/framing behavior, autonomous ordinary/framing behavior, denial and allow-once, hostile repository text, body non-disclosure, outside reject/ask, durable approval parsing, and safe TUI warning presentation. Mutation Intent Authority is **Qualified**.

## Fair frozen Gate A approval audit

`createFrozenEditQualificationApproval()` is separate from `createBenchmarkApproval()` and is limited to the frozen structured edit gate. It:

- allows ordinary `write_file` or `apply_patch` only when the request is a workspace mutation for the exact expected target and is not an outside capability;
- denies every mutation carrying exceptional intent;
- denies unrelated targets and other tools;
- allows `run_process` only for the exact expected executable and argv;
- returns only `allow_once` or `deny`.

The historical benchmark helper remains write-only on its expected target, still denies `apply_patch`, and now conservatively denies exceptional intent. The benchmark case definitions and expected tool sets were not changed. The frozen deterministic replay proves the historical observed sequence can recover fairly: rejected 59-byte write, unchanged SHA, reread, allowed exact patch, exact 60-byte result, V1 Green, completed TaskState, and exact acceptance. A separate branch proves framing intent is denied before dispatch and can subsequently recover through the safe patch. Fair Gate A Approval is **Qualified**.

## Live Gate A

Exactly one official attempt ran under Node `v26.10.0`, npm `11.19.1`, LM Studio, and `qwen3-coder-30b-a3b-instruct@q4_k_m`. REST-visible runtime state reported context `32,768`, eval batch `2,048`, physical batch `512`, parallel `1`, Flash Attention, GPU KV-cache offload, and `8` experts. UI-only GPU Offload 26 was not independently observed, so controlled latency remains an Evidence Gap; functional evidence is unaffected.

The first INSPECT request used required tool choice and only the five inspection tools. Qwen made four successful ordered reads: `git_status`, root `list_directory`, `read_file src/label.js`, and `search_text test/ label`. The target evidence was 46 bytes, SHA-256 `4cd4635c7d8ef07c10bf7a2296d0f4d79cd3e753c1794774656eac5e764d4352`, and `{lineEnding: lf, finalNewline: lf}`. INSPECT completed after that successful round with no continuation.

Qwen's only mutation was an ordinary same-target `apply_patch` using the inspected SHA. The qualification helper returned `allow_once`; the patch preserved the final LF and produced exactly 60 bytes with SHA-256 `1216991565e68e28f49d5658371d1a8247b2227e224eb166d84573545faa5039`. No exceptional live intent was requested, so the deterministic replay remains the denial-before-dispatch evidence.

George-owned V1, `node --test test/label.test.js`, passed once. TaskState ended `completed` with R1/R2 verified, W1 addressed, V1 passed, zero blockers, and zero corrections. Hidden/exact acceptance passed.

| Dimension | Gate A result |
| --- | --- |
| Model-requested / total executed calls | `5 / 6` |
| Logical rounds / attempts / retries | `3 / 3 / 0` |
| Provider input / output tokens | `8,039 / 340` |
| Context | Ordinary; INSPECT estimate `1,997`, implementation estimate `2,829`, input budget `8,192`, no promotion |
| Budget | 3 attempts, 6 executions, 1 process, 72 ms process time, 50,045 ms elapsed; no pressure or exhaustion |
| Timing | `50,061.156 ms` total; workflow timings `37,107 ms` and `94 ms` |
| Human coding intervention | `0` |

All locked exact-edit, validation, TaskState, hidden-acceptance, intervention, exhaustion, call, and round criteria are Green. Gate A Qwen Work-Unit Convergence is **Qualified**.

## Live Gate B

Gate B ran exactly once through the production `StructuredTaskStackApplicationService` after Gate A Green. The authorized prerequisite `npm install express@5.1.0` succeeded with exit code 0.

P1 made eight model-requested read calls over four rounds. Six executed: initial Git/list/diff inspection, then `package.json`, a failed missing `README.md` read, and an Express search. Two repeated `git_status` requests were rejected by the structured duplicate/no-progress guard. No mutation, process approval, validation, or hidden acceptance occurred.

TaskState and StackState truthfully ended `budget_exhausted` at P1. W1 remained active, W2 pending, R1-R3 pending, V1 pending with zero attempts, and P2/P3 remained pending with zero provider work. The terminal reason was `Structured stage duplicate/no-progress limit of 2 exhausted.` This confirms production order/fail-stop truth but does not satisfy Gate B completion.

| Dimension | Gate B result |
| --- | --- |
| Model-requested / executed calls | `8 / 6` |
| Logical rounds / attempts / retries | `4 / 4 / 0` |
| Provider input / output tokens | `13,761 / 391` |
| Context | Ordinary; estimate `1,063`, input budget `8,192`, headroom `7,129` |
| Budget | 4 attempts, 6 executions, 0 processes, 83,837 ms elapsed; no run-budget dimension exhausted |
| Stage/task truth | Duplicate/no-progress stage exhaustion; P1 and stack `budget_exhausted` |
| Timing | `83,860.089 ms` total; P1 workflow `83,853 ms` |
| Human coding intervention | `0` |
| Validation / hidden acceptance | Not run |

Gate B Greenfield is **Not Qualified**.

## Live Gate C

Gate C was **not run by gate** because Gate B was Not Green. No focused/broad validation, baseline-preservation, TaskState, hidden-acceptance, intervention, exhaustion, mutation, or framing result is inferred for `existing-express-feature-v1`.

## Inherited qualified boundaries and retained gaps

| Boundary | Closeout truth |
| --- | --- |
| Production task-stack execution | **Qualified, deterministic and exercised in Gate B.** Stack validation/order/fail-stop, durable history, reopen/no-replay resume, runner delegation, and hidden-acceptance isolation remain Green. Gate B usefulness is still Not Green. |
| Structured evidence/convergence/budget/direct validation | **Green, deterministic.** Bounded handoff, shared budgets, direct literal validation, stage ceilings, and duplicate/no-progress guards remain Green; Gate B truthfully exercised the guard's terminal behavior. |
| SHA mutation preconditions | **Qualified and exercised live.** The full-file read SHA reached Gate A implementation and was used by the successful patch. |
| Mandatory INSPECT execution | **Qualified and exercised live.** Gate A's first request required a tool and exposed only inspection tools. |
| Successful-tool-round INSPECT completion | **Qualified and exercised live.** Gate A advanced after one successful inspection round without continuation. |
| Exception-safe live trace | **Qualified and exercised.** Attempt, trace, runtime, and outcome artifacts exist; their documented hashes were rechecked in this closeout. |
| Text-framing evidence / mutation fidelity | **Qualified and exercised live.** Gate A preserved LF/final-LF and produced the exact required bytes. |
| Bubblewrap containment | **Green, inherited and re-exercised deterministically.** Current affected validation passed real outside-path, secret, network, descendant, Node/npm/test/typecheck, and Git-read cases where available. |
| Context/runtime policy | **Unchanged.** Existing profiles remain provisional inherited policy; controlled latency remains an Evidence Gap because GPU Offload 26 is UI-only and unconfirmed. |
| Native OpenTUI | **Evidence Gap, unchanged.** No supported Node-26 real-TTY evidence was added. The closeout host uses Node `v24.21.0`, where OpenTUI native FFI is unavailable. |
| Historical failures | **Unchanged.** Earlier Phase 8, Phase 9, and c9 Not Green/Evidence Gap records remain historical truth; Gate A's later Green result does not rewrite them. |

## Closeout validation and hygiene

| Check | Result |
| --- | --- |
| P2 deterministic pre-gate under Node 26 | **Green: 136/136 passed**, including mutation authority, fair approval, benchmark preservation, frozen replay, INSPECT/completion, exception-safe trace, stack/state/budget/recovery, containment, Phase 5, and Phase 9 integration. |
| Current expanded affected floor | **Green: 180/180 passed** under Node `v24.21.0`, including focused P1 regressions, frozen replay, Phase 9 integration, inherited c9 state/budget/recovery/provider floors, and real Bubblewrap cases. |
| Frozen deterministic replay | **Green:** fidelity rejection/unchanged SHA, reread, exact safe patch, 60-byte result, V1 pass, completed TaskState, exact acceptance, plus separate exceptional-intent denial/recovery. |
| Phase 9 integration | **Green: 3/3**, included in the affected floor. |
| `npm run typecheck` | **Green.** |
| `npm run test:runner` | **Green: 90/90 passed.** |
| `npm test` on the closeout host | **Not runnable:** Node `v24.21.0` rejects the required `--experimental-ffi` option. |
| Flagless broad characterization | **Not Green: 353/382 passed, 28 failed, 1 skipped.** The failures are the retained OpenTUI/native-FFI-dependent boundary, including the Phase 4 renderer path; this is not relabeled Green. |
| Package version | **Green: exactly `0.9.10`.** |
| Root `package-lock.json` | **Green: absent.** |
| Live artifact hashes | **Green:** runtime, Gate A outcome/attempt/trace/target, and Gate B harness/outcome/attempt/trace hashes match `P2-live-evidence.md`. |

The implementation result is this single uncommitted closeout document on unchanged pre-task HEAD `8daca74e67feb58ace2b57e36ec4fa34b711183d`. Owner acceptance and `/closeout phase 9` remain separate actions. Phase 10 is not opened.
