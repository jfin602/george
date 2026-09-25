# c9 text-file edit fidelity correction closeout

Status: **IMPLEMENTATION COMPLETE; TEXT FRAMING EVIDENCE AND MUTATION FIDELITY GUARD QUALIFIED; GATE A AND OVERALL CORRECTION NOT QUALIFIED**

Date: 2026-09-25

Package: `0.9.10` (unchanged)

Pre-task HEAD and exact P2 evidence candidate inspected: `1b206c23b6c97c8d33b7c1d13ddae8912ea521eb`

P1 implementation candidate: `2c2a88da279f5acc25b8c0bc338231a16ffd1113`

Live evidence: [`P2-live-evidence.md`](P2-live-evidence.md)

This is an evidence-only correction closeout. It does not repair implementation, rerun a live workload, rewrite historical failures, change BOOT/roadmap/versioning, owner-close Phase 9, or open Phase 10.

## Decision

| Decision | Result | Basis |
| --- | --- | --- |
| Implementation Complete | **Yes** | Exact current source contains the planned full-file framing scanner, read evidence, mutation guard, structured propagation, provider guidance, explicit acknowledgement, and permanent regressions. The focused and inherited deterministic floors are Green. |
| Text Framing Evidence Qualified | **Yes** | Deterministic tests establish full-file LF/CRLF/mixed/none and final-newline classification, truncated-read independence, invalid UTF-8/NUL omission, same-open-file SHA/framing collection, and structured implementation-stage propagation. |
| Mutation Fidelity Guard Qualified | **Yes** | Deterministic tests establish verbatim full replacement, untouched-byte patching, default preservation, recoverable pre-publication rejection with unchanged bytes/SHA, explicit opt-in, new-file/non-text compatibility, stale-SHA precedence, and provider-visible patch preference. No silent normalization occurs. |
| Gate A Qwen Work-Unit Convergence Qualified | **No** | Gate A stayed within call/round limits, passed George-owned V1, and completed TaskState, but Qwen explicitly acknowledged and repeated the unintended final-newline removal. The final file was 59 bytes instead of the required 60 bytes and hidden acceptance failed. |
| Gate B Greenfield Qualified / Not Run | **Not Run** | Gate A was Not Green, so `greenfield-express-v1` and its production StackState, validations, dependency/network authorization, and hidden acceptance were not spent. |
| Gate C Existing-App Qualified / Not Run | **Not Run** | Gate B was not reached, so `existing-express-feature-v1`, its focused/broad validation, baseline preservation, framing-regression check, TaskState, and hidden acceptance were not spent. |
| Overall c9-text-file-edit-fidelity Qualified | **No** | Overall qualification requires Gate A Green. The qualified deterministic fidelity boundaries do not waive the failed exact-byte and hidden acceptance criteria. |

## Text framing evidence audit

The shared `TextFramingScanner` incrementally validates UTF-8 and classifies bytes without retaining the full body. Its bounded representation is:

- `lineEnding`: `none | lf | crlf | mixed`;
- `finalNewline`: `none | lf | crlf`.

Bare CR and combined LF/CRLF usage classify conservatively as `mixed`. The final two bytes distinguish LF from CRLF termination. Invalid UTF-8 and NUL-containing input return no framing metadata.

`read_file` updates SHA-256 and the framing scanner from each chunk read through one open file handle. It separately retains only the bounded returned prefix, so `text`, `bytes`, and `truncated` retain their prior semantics while SHA and framing describe the complete file. The chunk-boundary regression covers CRLF split at the 64 KiB scan boundary; the truncated-read regressions prove full-file SHA and framing remain correct.

Structured inspection validates the small framing enum before projecting it alongside bounded text, path, bytes, truncation state, and SHA. Raw file bodies do not become durable TaskState.

Deterministic evidence covers LF with/without final LF, CRLF with/without final CRLF, mixed LF/CRLF, bare CR, no-newline text, chunk boundaries, invalid UTF-8, NUL, truncated provider text, unchanged full-file SHA, and implementation-slice propagation. Text Framing Evidence is **Qualified**.

## Mutation fidelity guard audit

The current mutation boundary preserves exact tool semantics:

- `write_file` assigns the caller's content directly and publishes that exact UTF-8 content through the existing atomic replacement path; it never appends, removes, or converts newline bytes;
- `apply_patch` performs ordered exact single-match replacements over the current text, retaining every untouched byte, then publishes the exact result atomically;
- current-content SHA validation occurs before framing comparison, so missing/malformed/stale preconditions retain their prior independent rejection behavior;
- recognized existing text rejects an unacknowledged framing change before publication with a bounded `validation` error containing only current/proposed framing facts;
- full replacement of current `mixed` framing requires acknowledgement even when the coarse category matches, while an exact patch over mixed content proceeds when its resulting framing is unchanged;
- `allowTextFramingChange: true` permits the caller's exact requested bytes and is not a formatter;
- new-file writes and existing non-text full replacements preserve their prior behavior.

Focused tests prove the original bytes and SHA remain unchanged after the missing-final-newline rejection, same-framing writes succeed, acknowledged newline and CRLF-to-LF changes remain verbatim, mixed-file replacement requires opt-in, LF/CRLF localized patches preserve untouched framing, framing-changing patches reject before publication, stale SHA still rejects, and new-file/non-text compatibility remains intact.

Provider-facing definitions prefer `apply_patch` for localized edits, describe `write_file` as exact replacement, require preservation of `read_file.textFraming` by default, and describe the acknowledgement as intentional rather than transformational. Mutation Fidelity Guard is **Qualified**.

## Live Gate A audit

Exactly one official P2 attempt ran against P1 candidate `2c2a88da279f5acc25b8c0bc338231a16ffd1113` under Node `v26.10.0`, npm `11.19.1`, LM Studio, and exact model `qwen3-coder-30b-a3b-instruct@q4_k_m`. The frozen task SHA-256 was `ac85295343d201711b3f177e4ba44a5055fbfe8acf736f23b9c6a47f0ef59c07`. No rerun or human coding intervention occurred.

### Read and mutation sequence

The one-round required INSPECT completed four ordered local reads. The target read supplied the implementation stage with:

- 46 bytes;
- SHA-256 `4cd4635c7d8ef07c10bf7a2296d0f4d79cd3e753c1794774656eac5e764d4352`;
- `textFraming: { lineEnding: "lf", finalNewline: "lf" }`.

The implementation mutation sequence was:

1. Qwen requested a 59-byte `write_file` with the inspected SHA and no acknowledgement. George rejected it recoverably: `current lineEnding=lf finalNewline=lf; proposed lineEnding=none finalNewline=none`. The file remained 46 bytes with the same SHA and trailing `0a`.
2. Qwen reread the target and observed the unchanged SHA/framing.
3. Qwen requested an exact `apply_patch` from the 46-byte original to the required 60-byte content using the still-valid SHA. The frozen benchmark approval policy denied that tool; the file remained unchanged.
4. Qwen requested the same 59-byte `write_file` with `allowTextFramingChange: true`. George correctly wrote exactly those acknowledged bytes without normalization.

Final target truth:

| Dimension | Required | Observed |
| --- | --- | --- |
| Bytes | `60` | `59` |
| SHA-256 | `1216991565e68e28f49d5658371d1a8247b2227e224eb166d84573545faa5039` | `4d4442213eef8109d7df78a656145a263976e6fde1476e281a6368c036c38861` |
| Framing | `{ lineEnding: "lf", finalNewline: "lf" }` | `{ lineEnding: "none", finalNewline: "none" }` |
| Content | `.toUpperCase();\n` | `.toUpperCase();` |

The guard therefore behaved correctly live, including rejection, unchanged SHA, retry visibility, and exact acknowledged publication. Qwen convergence did not: it used the escape hatch for a framing change the task did not request.

### Validation, state, acceptance, and metrics

George-owned V1 ran once as `node --test test/label.test.js` and passed with exit code `0`. Final TaskState was `completed`: R1/R2 `verified`, W1 `addressed`, V1 `passed`, zero blockers, and zero corrections. Those semantic states do not override the separate exact-byte requirement.

| Dimension | Official result |
| --- | --- |
| Hidden/exact acceptance | **Failed:** 59 observed bytes versus the required 60. |
| Model-requested / executed tool calls | `8 / 9`, including one George-owned validation process. |
| Logical provider rounds / attempts / retries | `6 / 6 / 0`. |
| Provider input / output tokens | `18,069 / 611`. |
| Context | Ordinary profile; INSPECT estimate `1,997`, implementation estimate `2,792`, `8,192` input budget, no promotion. |
| Stage limits | INSPECT `1` round / `4` calls; implementation `5` rounds / `4` model calls; no stage exhaustion. |
| Run budget | `6` attempts, `9` total executions including validation, `1` process, `73 ms` process time, `109,698 ms` budget elapsed, `4,789` context tokens; no pressure or exhaustion. |
| Timing | `109,718.394 ms` total; workflow timings `90,552 ms` and `97 ms`; provider-active timing unavailable. |
| Permissions / intervention | Three `allow_once` approvals, one policy denial for `apply_patch`, zero human coding interventions. |

Gate A satisfies V1, completed/verified TaskState, zero intervention, no exhaustion, `8 <= 10` model calls, and `6 <= 10` provider rounds. It fails the mandatory exact final bytes and hidden acceptance. Gate A Qwen Work-Unit Convergence is **Not Qualified**.

## Larger live gates

Gate B was correctly **not run by gate** after Gate A failed. Gate C was correctly **not run by gate** because Gate B was not reached. No stack, validation, intervention, hidden-acceptance, or framing-regression result is inferred for either workload.

## Inherited qualified boundaries and retained gaps

| Boundary | Closeout truth |
| --- | --- |
| Production task-stack execution | **Qualified, deterministic, inherited.** Full-stack validation/order/fail-stop, durable task history, reopen/no-replay resume, runner delegation, and hidden-acceptance isolation remain Green. |
| Structured evidence/convergence/budget/direct validation | **Green, deterministic, inherited.** Bounded stage handoff, task-wide budgets, direct literal validation, stage ceilings, and duplicate/no-progress guards remain Green. |
| SHA mutation preconditions | **Qualified, inherited and exercised live.** Full-file read SHA reached implementation; rejection preserved it; each later mutation used that same current SHA. |
| Mandatory INSPECT execution | **Qualified, inherited and exercised live.** The first request required a tool and exposed only the five inspection tools. |
| Successful-tool-round INSPECT completion | **Qualified, inherited and exercised live.** All four calls completed, there was no INSPECT continuation, and implementation began immediately. |
| Exception-safe live trace | **Qualified, inherited and exercised.** Attempt/trace/outcome artifacts were retained and their documented SHA-256 values were rechecked during this closeout. |
| Bubblewrap containment | **Green, inherited.** No containment or permission code changed. One broad concurrent Node-24 characterization failed, then the exact Bubblewrap case passed in isolation; the initial failure remains recorded as intermittency. |
| Context/runtime policy | **Unchanged.** Existing profiles remain provisional inherited policy. REST-visible runtime controls were observed in P2; UI-only GPU Offload 26 remained unconfirmed, so controlled latency remains an Evidence Gap. |
| Native OpenTUI | **Evidence Gap, unchanged.** No supported Node-26 real-TTY qualification was added. Current closeout broad characterization ran under Node `v24.21.0`, where OpenTUI native FFI is unavailable. |
| Historical Phase 8/Phase 9/c9 failures | **Unchanged.** This closeout qualifies only deterministic framing/mutation boundaries and does not rewrite earlier Not Green or Evidence Gap results. |

## Closeout validation and hygiene

The following evidence was observed from the exact P2 candidate before and during this documentation-only closeout:

| Check | Result |
| --- | --- |
| P2 deterministic pre-gate under Node 26 | **Green: 129/129 passed**, including P1 framing/mutation/recovery, frozen deterministic replay, mandatory INSPECT/completion, live trace, structured task/stack/convergence, Phase 5, and Phase 9 integration. |
| Expanded current affected floor | **Green: 147/147 passed** under Node `v24.21.0`, including focused P1 regressions, frozen replay, Phase 9 integration, and inherited c9 state/budget/recovery/provider floors. |
| Frozen deterministic replay | **Green:** first 59-byte write rejected without mutation, corrected 60-byte retry used the still-valid SHA, exact fixture bytes resulted, V1 passed, and TaskState completed. |
| Phase 9 integration | **Green: 3/3**, included in the affected floor. |
| `npm run typecheck` | **Green.** |
| `npm run test:runner` | **Green: 90/90 passed.** |
| `npm test` on the closeout host | **Not runnable:** Node `v24.21.0` rejects the required `--experimental-ffi` option. |
| Flagless broad characterization | **Not Green: 346/377 passed, 30 failed, 1 skipped.** Twenty-eight failures were OpenTUI/native-FFI-dependent, including the Phase 4 renderer path. The GitHub timeout case separately failed because the server observed zero posts. The Bubblewrap case failed in the broad concurrent run and then passed in isolation; the broad run remains Not Green. |
| Package version | **Green: exactly `0.9.10`.** |
| Root `package-lock.json` | **Green: absent.** |
| Live artifact hashes | **Green:** runtime, outcome, attempt, trace, recovered target, and recovered test hashes match `P2-live-evidence.md`. |

The implementation result is this single uncommitted closeout document on unchanged HEAD `1b206c23b6c97c8d33b7c1d13ddae8912ea521eb`. Owner acceptance and Phase 9 owner closeout remain separate actions; Phase 10 is not opened.
