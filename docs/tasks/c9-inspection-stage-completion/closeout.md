# c9 inspection-stage-completion correction closeout

Status: **IMPLEMENTATION COMPLETE; INSPECT STAGE COMPLETION QUALIFIED; GATE A AND OVERALL CORRECTION NOT QUALIFIED**

Date: 2026-09-25

Package: `0.9.10` (unchanged)

Pre-task HEAD and exact P2 candidate inspected: `90d0618261b99529652e9cfc18afcce8822aafde`

P1 implementation candidate: `171f863275c5b6040f167203eba8d42aa7e7451d`

Live evidence: [`P2-live-evidence.md`](P2-live-evidence.md)

This is an evidence-only correction closeout. It does not repair implementation, rerun a live workload, rewrite historical evidence, change BOOT/roadmap/versioning, owner-close Phase 9, or open Phase 10.

## Decision

| Decision | Result | Basis |
| --- | --- | --- |
| Implementation Complete | **Yes** | Exact current source contains the narrow generic successful-tool-round completion mode, enables it only for structured INSPECT, and retains permanent focused regressions. The affected deterministic floor is Green. |
| INSPECT Stage Completion Qualified | **Yes** | Deterministic early-completion regressions are Green. Live Gate A executed four successful first-round local reads, sent no INSPECT continuation, and immediately began implementation without stage exhaustion. |
| Gate A Qwen Work-Unit Convergence Qualified | **No** | Qwen reached mutation and George-owned V1, but omitted the required final newline. The observed 59-byte file failed the exact 60-byte edit and hidden acceptance. Gate A cannot be waived. |
| Gate B Greenfield Qualified / Not Run | **Not Run** | Gate A was Not Green, so the production greenfield stack and its hidden acceptance were not spent. |
| Gate C Existing-App Qualified / Not Run | **Not Run** | Gate B was not reached, so the existing-app workload, focused/broad validation, baseline-preservation check, and hidden acceptance were not spent. |
| Overall c9-inspection-stage-completion Qualified | **No** | Overall correction qualification requires Gate A Green. The exact-edit failure keeps the correction Not Qualified despite the now-qualified INSPECT transition. |

## INSPECT stage-completion implementation audit

The current application-owned seam is `completeAfterSuccessfulToolRound?: boolean` on `OneTurnSubmission`.

| Required behavior | Closeout finding |
| --- | --- |
| Generic application-owned successful-tool-round mode | **Implemented.** After an admitted provider tool round finishes, the loop checks normalized results and may terminate the bounded turn when any result succeeded. The provider adapter and tool executors do not own this decision. |
| Absent/default behavior unchanged | **Green.** The option is optional and false by absence. Ordinary chat, implementation, correction, and other callers preserve normal continuation behavior. Repository-wide caller inspection found only tests plus structured INSPECT enabling the option. |
| Full provider tool round executes before completion | **Green.** The completion check occurs after the ordered call loop. Focused regression evidence proves all admitted calls start and complete in provider order before the turn finishes. |
| Provisional assistant text remains non-canonical | **Green.** Tool-bearing-round text emits no `assistant.response.completed`, does not become the final assistant response, and is absent from canonical transcript history. The workflow completes with an empty final assistant response rather than fabricated text. |
| No provider continuation after a successful bounded round | **Green.** The loop breaks before continuation construction. Deterministic tests observe one provider request; live Gate A's request immediately following INSPECT is a fresh implementation request. |
| Failure/denial-only round cannot falsely complete | **Green.** Early completion requires at least one `result.ok`. The focused regression observes an all-failed/denied round continue to a bounded fallback provider response. |
| Stage limits remain fallback guards | **Green.** Call-limit enforcement occurs before the early-completion check. The overflow regression completes the first admitted call, refuses the over-limit second execution, and ends with a budget failure. Existing round/call/no-progress limits remain unchanged. |
| Structured INSPECT is the only Phase 9 production caller | **Green.** `StructuredTaskApplicationService` alone supplies both `initialToolChoice: 'required'` and `completeAfterSuccessfulToolRound: true`, with the unchanged five-tool read-only surface and inspection limits. |

The implementation boundary is therefore complete and deterministically guarded. No provider-specific completion behavior, new abstraction, stage-limit change, or Task Prompt v1 change was added.

## Live Gate A audit

Exactly one official frozen attempt ran against P1 candidate `171f863275c5b6040f167203eba8d42aa7e7451d` using the unchanged task fixture (SHA-256 `ac85295343d201711b3f177e4ba44a5055fbfe8acf736f23b9c6a47f0ef59c07`). Artifact hashes and the recovered file bytes were independently rechecked during this closeout and match P2 evidence.

### INSPECT and application-owned completion

The first provider request was stage `inspection`, used `toolChoice: required`, exposed only `read_file`, `list_directory`, `search_text`, `git_status`, and `git_diff`, and returned this ordered round:

| Order | Tool | Result |
| ---: | --- | --- |
| 1 | `read_file` on `src/label.js` | Succeeded; SHA-256 `4cd4635c7d8ef07c10bf7a2296d0f4d79cd3e753c1794774656eac5e764d4352`. |
| 2 | `git_status` | Succeeded. |
| 3 | `list_directory` on `.` | Succeeded. |
| 4 | `search_text` for `label` under `src/` | Succeeded. |

All four admitted calls completed as successful `local_read` executions. The inspection turn then emitted normal completion without a provider continuation. The next provider request was stage `implementation`, had default tool choice, and had no continuation. This establishes live application-owned completion after one successful full INSPECT round.

### Implementation, mutation, and exact-edit truth

Implementation began at provider request 2 with bounded inspection evidence. Qwen requested:

```text
write_file src/label.js
expectedSha256: 4cd4635c7d8ef07c10bf7a2296d0f4d79cd3e753c1794774656eac5e764d4352
contentBytes: 59
```

The mutation precondition exactly matched the SHA obtained from the first-round target read. George admitted the write and returned resulting SHA-256 `4d4442213eef8109d7df78a656145a263976e6fde1476e281a6368c036c38861`.

The semantic edit was present, but the byte-exact edit was not:

```text
required: export const label = (value) => value.trim().toUpperCase();\n
observed: export const label = (value) => value.trim().toUpperCase();
```

The recovered file is 59 bytes and has no trailing newline; the frozen requirement is 60 bytes. Hidden acceptance therefore failed.

### Validation, state, metrics, and stop truth

George-owned V1 ran once as `node --test test/label.test.js` and passed with exit code `0`. Final TaskState was `completed`: R1/R2 `verified`, W1 `addressed`, V1 `passed` with one attempt, no blockers, and no corrections. This state does not override the separate frozen exact-edit criterion.

| Dimension | Observed result |
| --- | --- |
| Model-requested tool calls | `5`: four INSPECT calls and one implementation `write_file`. |
| Executed tool calls | `6`: the five model calls plus one George-owned validation; all succeeded. |
| Provider rounds / attempts / retries | `3 / 3 / 0`. |
| Provider input / output tokens | `7,567 / 276`. |
| Context | Ordinary profile; INSPECT estimated `1,981` tokens with `8,192` input budget and `6,211` headroom; implementation estimated `2,610` with `5,582` headroom; no promotion. |
| Stage limits | INSPECT completed after one round and four calls at, but without exhausting, the unchanged `6`-round / `4`-call ceiling. Implementation used two rounds and one model tool call within `10` rounds / `8` calls. |
| Run budget | 3 attempts, 6 executions, 0 retries/compactions, 1 process, 82 ms process time, 42,028 ms wall time, 4,591 context tokens, 7,567 input tokens, and 276 output tokens; no pressure or exhaustion. |
| Duplicate/no-progress | None. |
| Corrections | `0`. |
| Timing | `42,041.639502 ms` total; completed workflow timings `32,422 ms` and `103 ms`; provider-active timing was not separately emitted. |
| Human coding intervention | `0`; two normal `allow_once` approvals covered the write and validation process. |
| Terminal/acceptance truth | Production task `completed`; hidden acceptance `failed`; Gate A **Not Green** solely because the exact byte sequence was absent. |

Gate A met the INSPECT transition, SHA provenance, V1, TaskState, intervention, exhaustion, call-count, and round-count criteria. It failed the mandatory exact-edit criterion, so Qwen Work-Unit Convergence is **Not Qualified**.

## Larger live gates

Gate B `greenfield-express-v1` was **not run by gate** because Gate A failed exact acceptance. There is no new live StackState, declared-validation, dependency/network-authorization, intervention, exhaustion, or hidden-acceptance result for Gate B.

Gate C `existing-express-feature-v1` was **not run by gate** because Gate B was not reached. There is no new focused/broad validation, baseline-preservation, TaskState, intervention, exhaustion, or hidden-acceptance result for Gate C.

These stop reasons are correct enforcement of the locked gate order, not Evidence Gaps caused by a lost attempt.

## Inherited qualified boundaries and retained gaps

| Boundary | Closeout truth |
| --- | --- |
| Production task-stack execution | **Qualified, deterministic, inherited.** Stack validation/order/fail-stop, durable per-task history, reopen/no-replay resume, runner delegation, and acceptance isolation remain Green. No Gate B live claim is inferred. |
| Bounded evidence handoff, task-wide budget, direct validation, convergence guards | **Green, deterministic, inherited.** P2 live evidence also demonstrates bounded inspection handoff, direct George-owned V1, shared budget accounting, and no duplicate/no-progress event. |
| Read SHA / mutation precondition | **Qualified, inherited and exercised live.** The first-round full-file SHA exactly became `write_file.expectedSha256`; the mutation succeeded. |
| Mandatory first-round INSPECT execution | **Qualified, inherited and exercised live.** The initial choice was `required`, and Qwen selected read-only tools. |
| Exception-safe live trace/artifact retention | **Qualified, inherited and exercised.** Attempt, trace, runtime, and outcome artifacts exist and their recorded hashes match. |
| Bubblewrap containment | **Green, inherited.** No containment or permission code changed and no contrary evidence was observed. Gate A used the separately labeled approval-required host validation path; it does not create a new sandbox claim. |
| Context/runtime policy | **Unchanged.** The ordinary/medium/large profiles remain provisional inherited policy. No runtime, context, retry, correction, convergence, or stage limit was retuned. UI-only GPU Offload 26 remained unconfirmed, so controlled latency remains an Evidence Gap. |
| Native TUI | **Evidence Gap, unchanged.** This correction added no supported real-TTY qualification. Test-renderer evidence is not native OpenTUI proof. |
| Historical Phase 8/Phase 9/c9 failures | **Unchanged.** This closeout qualifies only the corrected INSPECT completion boundary; it does not rewrite any earlier Not Green or Evidence Gap result. |

Current BOOT, architecture, roadmap, and Phase 9 qualification status text still describes the pre-P2 INSPECT ceiling failure. Per task boundary, those owner-facing contracts were not edited here. This later correction closeout records the narrower current truth: INSPECT completion is qualified, while Gate A remains Not Green for the missing final newline.

## Closeout validation and hygiene

Observed against exact P2 candidate `90d0618261b99529652e9cfc18afcce8822aafde` before and during this documentation-only closeout:

| Check | Result |
| --- | --- |
| Focused P1 completion, provider choice, structured INSPECT, trace/artifacts, mutation, frozen replay, c9 stack/convergence, task/state/session/recovery, Phase 5, and Phase 9 affected floor | **Green: 137/137 passed under Node `v26.10.0`.** |
| Frozen deterministic Phase 8 replay | **Green within the affected floor:** one INSPECT round, dynamic read SHA -> mutation precondition, exact edit, and George-owned V1 pass. |
| Phase 9 integration | **Green: 3/3 within the affected floor.** |
| `npm run typecheck` | **Green under Node `v26.10.0`.** |
| `npm run test:runner` | **Green: 90/90 passed under Node `v26.10.0`.** |
| Broad `npm test` characterization | **Not Green: 369/374 passed, 4 failed, 1 skipped under Node `v26.10.0`.** All four failures are OpenTUI test-renderer cases (`test/unit/tui/app.test.ts`); no native real-TTY claim follows. Repetition produced the same four failures, so the run is not relabeled Green. |
| Package version | **Green: exactly `0.9.10`.** |
| Root `package-lock.json` | **Green: absent.** |
| `git diff --check` | **Green after creating this closeout.** |

The implementation result is this single uncommitted closeout document on unchanged HEAD `90d0618261b99529652e9cfc18afcce8822aafde`. Owner acceptance and Phase 9 owner closeout remain separate actions; Phase 10 is not opened.
