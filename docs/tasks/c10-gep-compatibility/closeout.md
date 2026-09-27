# Correction 10 closeout — GEP compatibility

Status: **NOT GREEN / NOT QUALIFIED**

Date: 2026-09-27

Package: `0.10.12` unchanged

## Scope and exact candidate

This is an evidence-only closeout. It changes no product source, tests, runtime configuration, qualification instrument, or historical evidence. It does not rerun the broad suite or real-model workload, repair the P3 result, owner-close Phase 10, or open Phase 11.

The exact P3 closeout candidate and pre-task HEAD is `4ed01a2d2394623e2a85e6ae4daa1393406eac70`, tree `4ea34c82bdf7e61ad2def01269279978c36d68cd`. P3 added only its qualification report, bounded harness, and evidence artifacts. The production candidate P3 qualified was its clean pre-task parent `759b07de1594cb6ce4bff6896f72f1dcbf64e502`, tree `2e3d4a414e31b1ff2740de6435eb3cb4a49b7e9e`.

| Step | Commit | Tree | Result used here |
| --- | --- | --- | --- |
| P1 bounded dual projection | `8c26b80a0f0539122e85992d414fa49e1ffb728d` | `ca924a66952bcb4bc689c60348a96a32b8d8faac` | Green deterministic |
| P2 Phase 5 causal repair | `759b07de1594cb6ce4bff6896f72f1dcbf64e502` | `2e3d4a414e31b1ff2740de6435eb3cb4a49b7e9e` | Green deterministic |
| P3 integrated qualification | `4ed01a2d2394623e2a85e6ae4daa1393406eac70` | `4ea34c82bdf7e61ad2def01269279978c36d68cd` | Not Green |

The package is exactly `0.10.12`, and root `package-lock.json` is absent.

## P1 audit — bounded legacy + GEP read contract

`GeorgeEditReceiptRegistry.project()` is additive for eligible Operation-mode `read_file` results. It preserves `name`, `path`, `text`, `bytes`, `truncated=false`, `sha256`, and `textFraming`, then adds namespaced `gep.receipt` and `gep.numberedLines`. The exact snapshot, SHA, framing, and mutation epoch remain in one bounded run-local receipt registry; provider metadata is derived and is not a second durable canonical snapshot.

The centralized `MAX_GEP_DUAL_PROJECTION_BYTES` is exactly `16 * 1024`. Eligibility is decided against the complete serialized `{ok:true,value:...}` dual projection. An oversized projection returns the inherited provider result by identity before a receipt ID is consumed or stored. Truncated, invalid, binary/NUL, mixed-framing, or otherwise ineligible reads likewise retain unchanged legacy evidence. No model-visible unusable receipt or partial numbered view is emitted.

The frozen Phase 8 replay again observes SHA/framing and completes legacy write rejection, reread, patch, validation, and TaskState completion. The separate exceptional-framing path again denies model-originated framing authority before dispatch, rereads the unchanged SHA, and completes the safe legacy patch. These compatibility tests were not rewritten to use GEP.

Receipt freshness and canonical mutation authority remain unchanged. GEP preparation rejects unknown/stale receipts, mutation-epoch drift, current-file SHA drift, invalid ranges, overlaps, and ambiguous targets, then expands only completed packets into the existing registered `apply_patch` / `write_file` path. Workspace containment, SHA/framing checks, approval, recovery intent, cancellation, response-completion-before-effect, and Git evidence remain George-owned.

## Deterministic whole-exchange efficiency

The representative existing-file fixture produced byte-identical canonical output:

| Measurement | Value |
| --- | ---: |
| Legacy read provider result | 2,951 bytes |
| Dual GEP read provider result | 5,942 bytes |
| Equivalent legacy mutation arguments | 5,230 bytes |
| GEP packet | 48 bytes |
| Mutation Transmission Ratio | `48 / 5230 = 0.009177820267686425` |
| Net Edit Transport Ratio | `(5942 + 48) / (2951 + 5230) = 0.7321843295440655` |
| Resulting content | Byte-identical |

Both deterministic thresholds are Green: Mutation Transmission Ratio is `<= 0.70`, and Net Edit Transport Ratio is `< 1.0`. These byte metrics do not convert the missing live GEP path into Green and do not establish a speed result.

## P2 audit — Phase 5 causal boundary and repair

The clean detached Node `v26.10.0` historical matrix was Green at `a9c5175`, `73885cf`, and `99e5267`, then first became Not Green at `3840913`, the parent correction's GEP commit. The first bad boundary is therefore `99e5267` Green -> `3840913` Not Green.

The exact exhausted dimension was the fixed `p5-small` provider-input continuation envelope: estimated continuation context was 2,224 tokens against the unchanged 2,200-token ceiling. It was **not** a multidimensional `RunBudget` exhaustion. `continuationPromotions()` threw `GeorgeError('budget')` directly for the fixed profile, so no `budget.exhausted` event, `budget.exhausted.dimension`, or exhausted-event snapshot existed. `CodingWorkflowApplicationService.execute()` then truthfully mapped that failure to terminal state `budget_exhausted`.

The causal addition was 105 characters of redundant Operation-only GEP fallback prose in the always-visible `write_file` / `apply_patch` descriptions. It added 27 estimated Human-mode tokens. P2 removed only that redundant prose because the complete rule already lives in `GEORGE_OPERATION_PROTOCOL_V1`; it did not increase `DEFAULT_RUN_BUDGET`, the 2,200-token fixture ceiling, any context profile, continuation limit, or compaction ceiling.

The current fixed-profile workflow is Green. P3 and this closeout recheck both prove the scripted provider continuation, two compactions, canonical-history integrity, exclusion of provisional tool text, George-owned validation, and intact `LocalSessionStore` reopen. The permanent test also asserts that neither `budget.exhausted` nor a budget-coded `turn.failed` is emitted.

## Parent correction preservation

The parent correction's terminal TaskState fix remains Green in state, StackState, structured-provider-failure, and session-store coverage. A terminal failure blocks only the active work unit, clears `currentWorkUnit`, preserves completed/pending evidence, and survives durable reopen without admitting impossible terminal/active state.

The generation-aware provider timeout remains Green deterministically: 300,000 ms default absolute emergency ceiling, 600,000 ms configurable maximum, independent 90,000 ms first-useful-output guard, independent 60,000 ms active-output inactivity guard, caller cancellation, finite retry/rebase, and provisional-branch discard. Productive fake-time output completed at 180,000 ms and still terminated at 300,000 ms. The live P3 attempt naturally crossed 120 seconds, but deterministic tests remain the timeout-policy authority.

## P3 deterministic, broad, and live evidence

P3 common validity was Green on Node `v26.10.0`, npm `11.19.1`, LM Studio `0.4.25+1`, backend `llama.cpp-linux-x86_64-vulkan-avx2-2.46.0`, and loaded `qwen3-coder-30b-a3b-instruct@q4_k_m` at context length 32,768.

P3 recorded focused `293/293`, typecheck Green, runner `90/90`, and the applicable broad deterministic suite `520 passed / 0 failed / 1 skipped` out of 521. The sole skip was the native OpenTUI real-TTY test because the qualification process was not a real TTY. The broad suite is Green for applicable deterministic coverage; native real-TTY evidence remains a nonblocking Evidence Gap.

The single official disposable real-model workload completed its frozen C3 functional acceptance: multiple reads, legacy edits to existing files, one new UTF-8 file, both George-owned validations, completed TaskState, durable completed reopen, and zero human intervention. Its exact provider evidence was:

| Measurement | Observed value |
| --- | ---: |
| Provider attempts / logical rounds | 8 / 8 |
| Retries / rebases | 0 / 0 |
| Input tokens | 30,023 |
| Cached input tokens | 16,468 |
| Output tokens | 1,381 |
| First response acceptance | 340 ms |
| First useful output | 11,719 ms |
| Aggregate provider-active time | 276,492 ms |
| Total elapsed | 278,598.148371 ms |
| George-owned validations | 2/2 passed |
| Final / reopened TaskState | completed / completed |

The required live existing-file GEP edit did not occur. The model used only legacy `apply_patch` and `write_file`, so `gepPacketBytes=0`, expanded GEP mutation bytes were zero, and the live Mutation Transmission Ratio and Net Edit Transport Ratio are unavailable (`null`), not zero. The observer's 3,441 dual-projection bytes and 1,980 legacy-equivalent bytes are lower bounds because it deduplicated run-local receipt identifiers across structured turns. The workload was correctly not rerun and the instrument was not rewritten after the attempt.

## Historical evidence preserved

No prior result is relabeled:

- Phase 8 `c8-agentic-context` remains Not Green / Evidence Gap: the edit-plus-validation failure, lack of an all-family healthy agentic envelope and adjacent cliff, and missing runtime/native controls remain historical truth.
- Phase 9 greeting, three-file, and Gate A remain Green in the recorded final sweep. B2 remains Not Green after P2 V1 failed and its correction did not complete. C2 remains Not Green after provider stall/timeout retry exhaustion before mutation/validation. Remaining Phase 9 gaps stay gaps.
- Formal Phase 10 remains Not Green / not ready for Phase 11. Its P10 focused `227/228` lifecycle-order failure, Node 24 broad-suite failure, failed provider-dependent benchmarks, Not Run fast/milestone workloads, missing comparable primary-only delta, helper A/B gap, runtime/provider/GPU/native-TTY gaps, and inherited Phase 8/9 results remain unchanged.
- Phase 10 P7's lifecycle-order failure remains historical/intermittent Not Green evidence. Its later P10 closeout, parent-correction, P3, and current bounded passes establish intermittency only; they do not erase the failing observation.
- The parent `c10-generation-bottleneck` P4 result remains historically Not Green at focused `272/275` and broad `514/518` with three failures and one native-TTY skip. P1/P2 and current passing evidence show those three deterministic defects repaired on the follow-up candidate without relabeling the earlier run.

## Decision table

| Decision | State | Evidence / consequence |
| --- | --- | --- |
| GEP Legacy Read Contract Preserved | **Green** | Additive projection retains text, SHA, framing, byte count, truncation state, name, and path |
| Bounded Dual Projection Qualified | **Green** | Complete serialized projection is bounded to 16 KiB |
| Oversized Dual Projection Safe Fallback | **Green** | Unchanged legacy result; no consumed/stored/model-visible receipt |
| Frozen Phase 8 Replay Green | **Green** | Legacy SHA/framing write rejection, reread, patch, validation, and TaskState pass |
| Framing Denial/Reread/Patch Recovery Green | **Green** | Exceptional intent denied before dispatch; unchanged SHA reread; safe patch passes |
| Mutation Transmission Ratio | **Green** | `0.009177820267686425`; required `<= 0.70` |
| Net Edit Transport Ratio | **Green** | `0.7321843295440655`; required `< 1.0` |
| GEP Receipt Freshness Preserved | **Green** | Run-local epoch, reread/current SHA, restart, unknown/stale receipt checks pass |
| Canonical SHA/Framing Mutation Authority Preserved | **Green** | Completed GEP expands through canonical registered mutation tools and inherited approval/recovery checks |
| Phase 5 First Bad Boundary Identified | **Green** | `99e5267` Green -> `3840913` Not Green |
| Phase 5 Exhausted Dimension Identified | **Green** | Fixed-profile provider-input continuation envelope, 2,224 > 2,200; no `RunBudget` dimension event existed |
| Phase 5 Fixed-Profile Workflow Green | **Green** | Current workflow completes, compacts twice, validates, and reopens intact |
| Terminal TaskState Fix Preserved | **Green** | State/stack/structured/session regressions pass |
| Generation-Aware Timeout Fix Preserved | **Green, deterministic** | 300s default, 600s maximum, first-output/inactivity/cancellation/retry safety pass |
| Broad Suite | **Green for applicable deterministic suite** | P3: 520 passed, 0 failed, 1 native-TTY skip out of 521; not rerun in closeout |
| Node 26 + Real LM Studio/Qwen Live Qualification | **Not Green** | Functional workload passed, but required existing-file GEP edit was absent |
| Phase 10 P7 Historical/Intermittent Evidence Preserved | **Not Green, historical/intermittent** | Current pass does not erase the earlier lifecycle-order failure |
| Remaining Blocking Failure Count | **Not Green — 1** | Required live existing-file GEP edit absent in the sole official attempt |
| Nonblocking Evidence Gaps | **Evidence Gap** | Live GEP ratios unavailable; complete live read-byte totals unavailable; native real-TTY untested |
| Overall `c10-gep-compatibility` Qualified | **Not Green / No** | Required live GEP acceptance failed and its transport measurements are unavailable |
| Phase 10 Closeout Ready To Reassess | **Not Green / No** | The combined parent + follow-up candidate is not yet a qualified replacement candidate |

## Bounded closeout recheck

No broad suite, benchmark, B2/C2, or real-model workload was rerun.

| Check | Closeout result |
| --- | --- |
| Correction-focused P1/P2/current affected deterministic floor | **Green — 293/293** |
| `npm run typecheck` | **Green** |
| `npm run test:runner` | **Green — 90/90** |
| `git diff --check` | **Green** |
| Package / root lockfile | **Green — `0.10.12`; root `package-lock.json` absent** |

The bounded focused run again passed the Phase 10 P7 lifecycle-order assertion. Under the historical-evidence and intermittent-test rules, that does not erase its earlier Not Green observation.

## Verdict and roadmap boundary

`c10-gep-compatibility` is **Not Green and not Qualified**. Deterministic compatibility, safety, Phase 5 reliability, and efficiency are Green, and the real-model task was functionally successful, but performance or functional fallback success cannot substitute for the required live GEP edit. The absent live GEP path and unavailable live whole-exchange measurements remain explicit.

Consequently, `c10-generation-bottleneck` plus `c10-gep-compatibility` do **not yet** provide a qualified candidate ready for formal Phase 10 closeout/readiness reassessment. A later authorized correction may address that live GEP acceptance boundary, but this closeout performs no repair. It does not owner-close Phase 10, declare Phase 10 Green, authorize Phase 11 planning, or open Phase 11.
