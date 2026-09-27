# Correction 10 P4 — Integrated generation bottleneck qualification

Status: **Not Green**

Date: 2026-09-27

Correction: `c10-generation-bottleneck`

Package: `0.10.12` unchanged

## Disposition

The deterministic correction floor is **Not Green**: 272/275 passed. The single required broad run reproduced the same three failures: 514/518 passed, 3 failed, and 1 native-TTY test skipped. Two failures directly show that P3 receipt-only read projection breaks the promised legacy mutation fallback. The Phase 5 small-profile workflow also exhausted its budget; because it uses Human mode, the P3 Operation protocol is not a supported causal explanation, and qualification did not rerun a baseline or repair production behavior.

P1 terminal TaskState integrity, P2 generation-aware timeout semantics, GEP parser/expansion/SHA/framing/permission/recovery checks, deterministic transmission efficiency, batching, read concurrency, typecheck, and the phase runner passed. Those passes do not override the blocking inherited-floor failures.

The real-model workload was **Not Run**. W2 depends on a Green W1, and qualification cannot repair or rerun production behavior to obtain Green. Correction 10 is not qualified.

## Candidate and common validity

| Item | Observed value |
| --- | --- |
| Pre-task HEAD | `384091366fcd1addabf0a2cff456a6ece77f7875` |
| Candidate tree | `8191d407ad178e7549669ed9d87dc7cd60c5515d` |
| Initial worktree | Clean |
| Package | `0.10.12` |
| Root `package-lock.json` | Absent |
| Node | `v26.10.0` through `fnm exec --using=26.10.0` |
| npm | `11.19.1` |
| Platform | Linux `7.0.0-31-generic`, x86_64 |
| LM Studio | `0.4.25+1`; llama.cpp backend `2.46.0` |
| Provider | `http://127.0.0.1:1234`, `/v1/models` and `/api/v0/models` returned HTTP 200 |
| Model | `qwen3-coder-30b-a3b-instruct@q4_k_m`, loaded, Q4_K_M, tool-use capable, loaded context 32,768 |
| Context | Adaptive; configured large compatibility profile `qwen3-coder-30b-a3b-instruct-q4_k_m-lm-studio-32k` |
| Provider policy | 300,000 ms absolute default; 600,000 ms configurable maximum; 90,000 ms first useful output; 60,000 ms active-output inactivity |
| Execution policy | Standard workspace; outside reject; network/remote/browser/credentials ask |

Common environment validity was available. Live spending nevertheless stopped because the required deterministic affected-system gate was Not Green.

## Exact validation

### V1 — correction focused floor

Command:

```text
fnm exec --using=26.10.0 node --experimental-ffi --test test/unit/tasks/state.test.ts test/unit/tasks/stack-state.test.ts test/unit/tasks/parser.test.ts test/unit/core/session-store.test.ts test/unit/core/foundation.test.ts test/unit/core/run-budget.test.ts test/unit/provider/lm-studio.test.ts test/unit/application/george-edit.test.ts test/unit/application/george-edit-loop.test.ts test/unit/application/provider-stall.test.ts test/unit/application/one-turn.test.ts test/unit/application/recovery.test.ts test/unit/application/structured-task.test.ts test/unit/application/structured-task-stack.test.ts test/unit/application/phase8-structured-replay.test.ts test/unit/application/coding-workflow.test.ts test/unit/application/tool-batching.test.ts test/unit/application/progress.test.ts test/unit/tools/mutation.test.ts test/unit/tools/read-only.test.ts test/unit/qualification/live-work.test.ts test/integration/agent-loop.test.ts test/integration/phase5-qualification.test.ts test/integration/phase9-qualification.test.ts
```

Result: **Not Green — 275 total; 272 passed; 3 failed; 0 skipped.** It covered P1-P3 TaskState/StackState/session, provider timeout/stall/retry/rebase, Operation/GEP, mutation/framing/SHA/recovery/permissions, structured correction/freshness, batching/read concurrency, and inherited Phase 5/9 integration.

Failures:

1. Phase 5 long workflow expected `completed`, observed `budget_exhausted`.
2. Frozen Phase 8 structured replay left `label.js` unchanged instead of adding `.toUpperCase()`.
3. Frozen framing-authority recovery observed no reread SHA.

The P3 seam is causal for F2/F3: `GeorgeEditReceiptRegistry.project()` replaces eligible Operation-mode `read_file` provider evidence with receipt/numbered-lines evidence lacking `sha256` and `text`, while legacy `write_file`/`apply_patch` remain advertised as fallback. The frozen providers consume those legacy fields and cannot continue. F1 is a current inherited-floor failure with cause unestablished by this qualification. No assertion was rewritten; the focused command was not repeated, and the separately mandated broad suite reproduced all three failures.

### V2 — TypeScript

Command: `fnm exec --using=26.10.0 npm run typecheck`

Result: **Green**, exit 0.

### V3 — phase runner

Command: `fnm exec --using=26.10.0 npm run test:runner`

Result: **Green — 90/90 passed.**

### V4 — broad suite

Command: `fnm exec --using=26.10.0 npm test`

Result: **Not Green — 518 total; 514 passed; 3 failed; 1 skipped.** The three focused failures reproduced exactly. `native OpenTUI launches and restores a real Node 26 terminal` was skipped because the qualification process was not a real TTY. The broad suite was not repeated.

### V5 — diff hygiene

Command: `git diff --check`

Result: **Green**, exit 0. Package remained `0.10.12`; root `package-lock.json` remained absent.

## Correction-specific evidence

### Terminal TaskState and persistence

P1 regressions passed: terminalization atomically blocked only the current active work unit; stack-child provider failure blocked active work and reopened durably; strict session validation continued rejecting impossible active-work state. No correction-local run ended with an invalid terminal active work unit, and intentional failure cases remained persistable.

### Provider liveness

P2 fake-time/scripted-provider regressions passed. Productive output crossed 120,000 ms and completed at 180,000 ms; the 300,000 ms finite emergency ceiling remained enforced; configured timeouts above 600,000 ms were rejected. First-useful-output, 60,000 ms active-inactivity, caller cancellation, finite retry/rebase, and incomplete-branch non-execution checks passed.

The live workload did not run, so there is no live >120,000 ms observation. P2 deterministic evidence is the only >120s evidence, as required when no live round exists.

### GEP/1 transmission and mutation semantics

The representative existing-file fixture uses two eligible files and three non-overlapping line-range edits:

| Metric | Value |
| --- | ---: |
| GEP packet | 69 bytes |
| Expanded canonical mutation arguments | 356 bytes |
| Mutation Transmission Ratio | `0.19382022471910113` |
| Required maximum | `0.70` |
| Final mutation bytes | Byte-identical to expected output |

The fixture's parser, stale/unknown/overlap/out-of-range rejection, original-snapshot range semantics, LF/CRLF preservation, current SHA verification, normal mutation executor, approvals, recovery intents, cancellation, and durable bounded GEP metrics passed. The ratio probe command and machine-readable result are retained under `evidence/`.

This deterministic GEP result is Green, but GEP/legacy coexistence is Not Green because F2/F3 remove the evidence required by the advertised legacy fallback.

## Real-model workload

**Not Run; zero provider attempts and zero provider rounds.** No disposable fixture was created and no owner Express, B2, C2, helper inference, context retuning, GPU tuning, browser, or visual workload was touched.

Consequently prompt/input tokens, cached input tokens, output tokens, response acceptance, first useful output, provider-active/total elapsed, longest attempt, live 120s crossing, live GEP bytes/ratio, validation, final TaskState, session reopen, and human intervention are **Evidence Gaps**, not zero measurements. Provider attempts/rounds are zero because execution did not start.

## Preserved historical evidence

The Phase 10 P7 lifecycle-order assertion passed in both current runs. Its earlier historical/intermittent failure remains Not Green evidence and is not erased or relabeled by these passes. Phase 8/9/10 historical evidence and frozen B2/C2 were unchanged.

## Acceptance matrix

| Gate | State |
| --- | --- |
| Node 26 / package / candidate / provider common validity | Green |
| Terminal TaskState / StackState / durable reopen | Green deterministic |
| 300s default / 600s maximum / >120s productive generation | Green deterministic |
| First-output / inactivity / cancellation / retry-rebase safety | Green deterministic |
| GEP parser, expansion, SHA, framing, permission, recovery | Green deterministic |
| Deterministic transmission ratio <= 0.70 and byte identity | Green: `0.19382022471910113` |
| Legacy mutation compatibility | **Not Green** |
| Inherited Phase 5 reliability floor | **Not Green** |
| Inherited Phase 9 / frozen Phase 8 structured integration | **Not Green** |
| Broad suite | **Not Green** |
| Real LM Studio/Qwen integrated workload | Evidence Gap / Not Run |
| Invalid active-work-unit terminal result | None observed |
| Overall `c10-generation-bottleneck` | **Not Green / not qualified** |

Supporting machine-readable results and the bounded failure ledger are under `docs/tasks/c10-generation-bottleneck/evidence/`.
