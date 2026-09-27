# Correction 10 P3 qualification — GEP compatibility

Status: **NOT GREEN / NOT QUALIFIED**

Date: 2026-09-27

Package: `0.10.12` unchanged

## Candidate and common validity

The exact pre-task candidate was commit `759b07de1594cb6ce4bff6896f72f1dcbf64e502`, tree `2e3d4a414e31b1ff2740de6435eb3cb4a49b7e9e`. The worktree was clean. P3 changed no product source, tests, runtime configuration, acceptance instrument, or historical evidence; the final dirty state contains only this qualification report and bounded P3 evidence.

| Item | Observed value |
| --- | --- |
| Node | `v26.10.0` |
| npm | `11.19.1` |
| Platform | Linux `7.0.0-31-generic`, x86_64 |
| LM Studio | `0.4.25+1` |
| Backend | `llama.cpp-linux-x86_64-vulkan-avx2-2.46.0` |
| Provider | `http://127.0.0.1:1234`; `/v1/models` and `/api/v0/models` HTTP 200 |
| Model | `qwen3-coder-30b-a3b-instruct@q4_k_m`, Q4_K_M, loaded, tool-use capable |
| Model context | loaded context 32,768; maximum advertised 262,144 |
| Context policy | adaptive; configured large compatibility profile `qwen3-coder-30b-a3b-instruct-q4_k_m-lm-studio-32k` |
| Live selected profile | ordinary, provider-input ceiling 8,192; no promotion |
| Provider liveness | 300,000 ms absolute default; 600,000 ms configured maximum; 90,000 ms first useful output; 60,000 ms active-output inactivity |
| Configured execution policy | standard workspace; outside reject; network/remote/browser/credentials ask |
| Effective live task policy | standard workspace; outside reject; network reject; remote mutation ask |

Common validity was Green: Node is within `>=26.4.0 <27`, package is `0.10.12`, the candidate was known and initially clean, LM Studio was reachable, and the supported pinned Qwen model was loaded. Root `package-lock.json` was absent.

## Deterministic and broad gates

### V1 — correction focused floor

The exact command is retained in `evidence/commands.md`.

Result: **Green — 293/293 passed; 0 failed; 0 skipped.**

This union covered bounded additive GEP projection, oversized fallback, receipts/parser/expansion, frozen Phase 8 replay and framing recovery, the repaired Phase 5 fixed-profile seam, TaskState/StackState/session durability, provider timeout/stall/retry/rebase, mutation SHA/framing/permission/recovery, structured task/correction/freshness, batching/read concurrency, and inherited Phase 5/9 integration.

The repaired Phase 5 long workflow completed with both compactions, George-owned validation, and durable reopen. P2's historical causal evidence remains authoritative: `99e5267` was Green and `3840913` was the first bad boundary; redundant Operation-only tool-description prose added 27 estimated Human-mode tokens and pushed the fixed continuation estimate to 2,224 against 2,200. This was a fixed provider-input continuation-envelope failure, not a multidimensional `RunBudget` exhaustion; therefore no `budget.exhausted.dimension` event existed. P2 removed only the redundant prose and did not change any budget or context ceiling.

The parent correction's deterministic provider evidence also remained Green: productive output crossed 120 seconds and completed at 180 seconds, the finite 300-second emergency ceiling remained enforced, values above 600 seconds remained rejected, and first-useful-output, active-inactivity, cancellation, retry/rebase, and provisional-branch discard stayed authoritative.

### V2-V5

| Gate | Result |
| --- | --- |
| `npm run typecheck` | **Green**, exit 0 |
| `npm run test:runner` | **Green — 90/90** |
| `npm test` | **Green for the applicable deterministic suite — 521 total; 520 passed; 0 failed; 1 skipped** |
| `git diff --check` | **Green**, exit 0 |

The sole broad skip was `native OpenTUI launches and restores a real Node 26 terminal` because this qualification process was not a real TTY. Browser/visual/native-TTY work was outside this task, and no affected deterministic test failed. The Phase 10 P7 lifecycle-order assertion passed in both current runs; its earlier historical/intermittent failure remains immutable Not Green evidence.

## Deterministic whole-exchange transport

The representative existing-file fixture produced byte-identical final output.

| Measurement | Bytes / ratio |
| --- | ---: |
| Legacy read provider result | 2,951 bytes |
| Dual GEP read provider result | 5,942 bytes |
| Equivalent legacy mutation arguments | 5,230 bytes |
| GEP packet | 48 bytes |
| Mutation Transmission Ratio | `48 / 5230 = 0.009177820267686425` |
| Net Edit Transport Ratio | `(5942 + 48) / (2951 + 5230) = 0.7321843295440655` |

Both deterministic thresholds are Green: Mutation Transmission Ratio is <= 0.70 and Net Edit Transport Ratio is < 1.0. This proves the representative deterministic exchange, not live generation speed.

## Single real-model workload

The official live workload ran exactly once:

```text
node docs/tasks/c10-gep-compatibility/evidence/live-qualification.ts
```

It used the frozen dependency-free Phase 10 `existing-core-edit-v1` fixture copied into a disposable `/tmp` workspace. It did not use the owner's Express workspace, B2, C2, helper inference, context retuning, GPU/runtime tuning, browser work, or visual work. The temporary workspace was removed after bounded evidence and durable reopen were captured.

### Functional and durable result

The generic C3 harness completed and its hidden acceptance passed. Three distinct files were read (`README.md`, `src/labels.js`, and `test/labels.test.js`), plus repeated reads and local search/list operations. The workload mutated existing files, created the UTF-8 text file `test/release-label.test.js`, ran both literal George-owned validations successfully, completed TaskState, and reopened the same completed session from `LocalSessionStore`. Human intervention was zero.

The generic artifact therefore records `qualifying: true` for its frozen C3 functional acceptance. That value does **not** override this correction's additional GEP acceptance. The P3 runner's final correction-specific assertion exited 1 because the model used only legacy `apply_patch` and `write_file`; no GEP packet was emitted. The official P3 live result is consequently **Not Green** and was not rerun.

### Provider, token, and timing evidence

| Measurement | Observed value |
| --- | ---: |
| Provider attempts / logical rounds | 8 / 8 |
| Retries / rebases | 0 / 0 |
| Input tokens | 30,023 |
| Cached input tokens | 16,468 |
| Output tokens | 1,381 |
| First recorded response acceptance | 340 ms |
| First recorded useful output | 11,719 ms |
| Aggregate provider-active time | 276,492 ms |
| Total elapsed | 278,598.148371 ms |
| George-owned validations | 2/2 passed |
| Final TaskState / durable reopen | completed / completed |
| Human intervention | 0 |

The individual attempt timings are retained in `evidence/live/trace.json`. The attempt crossed 120 seconds naturally; no delay was manufactured. Input/cache cost and output/generation cost remain distinct: the provider reported all three token dimensions, but the aggregate provider-active measurement does not allocate elapsed time between input/cache processing and output generation. No speed conclusion is drawn from byte ratios.

### Live GEP and whole-exchange result

| Measurement | Observed value |
| --- | ---: |
| Dual-projection read bytes retained by observer | 3,441-byte lower bound |
| Legacy-equivalent read bytes retained by observer | 1,980-byte lower bound |
| GEP packet bytes | 0 |
| Equivalent legacy mutation bytes from GEP expansion | 0 |
| Live Mutation Transmission Ratio | **Unavailable / Evidence Gap** |
| Live Net Edit Transport Ratio | **Unavailable / Evidence Gap** |

The two read-byte values are lower bounds, not complete actual whole-exchange totals. The qualification observer deduplicated receipt identifiers across structured turns, while receipt IDs are run-local and may restart. That observer defect was discovered only after the one official attempt; the exercised instrument was not rewritten and the workload was not rerun. Because no GEP packet existed in any case, neither required live ratio has a valid denominator. They are `null`, not zero.

## Acceptance matrix

| Gate | State |
| --- | --- |
| Node/package/candidate/provider common validity | Green |
| Bounded additive GEP projection and oversized fallback | Green deterministic |
| Legacy read/write/patch compatibility | Green deterministic |
| Frozen Phase 8 replay and framing recovery | Green deterministic |
| Phase 5 first bad boundary and exhausted producer identified | Green inherited P2 evidence |
| Phase 5 fixed-profile workflow | Green |
| TaskState/StackState/session durability | Green deterministic and live |
| Generation-aware timeout/retry/rebase safety | Green deterministic; live attempt crossed 120s without retry/rebase |
| Mutation Transmission Ratio <= 0.70 | Green deterministic: `0.009177820267686425` |
| Net Edit Transport Ratio < 1.0 | Green deterministic: `0.7321843295440655` |
| Byte-identical deterministic output | Green |
| Typecheck / runner / applicable broad suite / diff hygiene | Green |
| Live functional edit, new UTF-8 file, validation, TaskState, reopen | Green |
| Live existing-file GEP edit | **Not Green — absent** |
| Live whole-exchange GEP ratios | **Evidence Gap — unavailable** |
| Live complete dual/legacy read byte totals | **Evidence Gap — observer lower bounds only** |
| Phase 10 P7 historical/intermittent evidence | Preserved; not relabeled |
| Overall `c10-gep-compatibility` | **Not Green / not qualified** |

## Verdict

The corrected candidate restores deterministic legacy/GEP coexistence, the Phase 5 fixed-profile workflow, and the broad affected-system floor. The single supported Node 26 + LM Studio/Qwen workload also completed its functional task, validations, TaskState, and durable reopen.

Qualification nevertheless remains **Not Green** because the required live existing-file GEP edit did not occur, so actual live GEP whole-exchange ratios were not obtained. Functional success and model-authored completion do not override that missing transport evidence. No product repair, live rerun, retuning, B2/C2 run, or historical evidence rewrite was performed. Phase 10 closeout is not ready to be reassessed from this P3 result.
