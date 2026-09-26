# c9 qualification preflight scope P2 live evidence

Status: **SCOPED PREFLIGHT GREEN; GATE A GREEN; GATE B2 NOT GREEN; GATE C2 NOT RUN**

Date: 2026-09-25

Package: `0.9.10` (unchanged)

Pre-task HEAD: `00072656b2ca892cc266db9c634f9718ec61b63b`

Production behavior under qualification remains mutation-precondition candidate `04405570b92680e6297b48391a7d0bdf0aa8ed5e`; the later P1 commit added only the pure preflight classifier, tests, and bounded evidence.

This P2 changed no production code, qualification policy, live instrument, hidden acceptance, runtime/context/convergence/retry/correction/stage/run-budget setting, or package version. It spent one fresh Gate A and, after Gate A Green, one fresh Gate B2. B2 was Not Green, so C2 remains unspent.

## Scoped preflight

All hard current-candidate checks ran under Node `v26.10.0` and npm `11.19.1` and were Green:

| Check | Result |
| --- | --- |
| Qualification-preflight classifier | **Green: 6/6 passed** |
| Expanded mutation-precondition and inherited c9 affected floor | **Green: 176/176 passed** |
| Exact missing-SHA/missing-parent/create-directory/permission/recovery/same-response regressions | **Green**, included in the affected floor |
| Frozen Gate A deterministic replay and fair approval helper | **Green**, included in the affected floor |
| Phase 9 integration and v1/v2 immutability | **Green: 5/5 passed** |
| `npm run typecheck` | **Green** |
| `npm run test:runner` | **Green: 90/90 passed** |
| Package / root lockfile / initial diff hygiene | **Green:** `0.9.10`, no root `package-lock.json`, `git diff --check` passed |

The current exact `npm test` characterization remained aggregate **Not Green: 390 passed, 4 failed, 1 skipped, 395 total**. The four failures were retained OpenTUI renderer identities with the same bounded signatures as the P1 pre-change baseline. The retained native real-TTY case was skipped in the non-TTY environment. The fifth historical renderer failure passed in this run.

The current clean-tree run used the same Node/npm, exact command, non-TTY condition, dependency identity, and effective Git metadata behavior as the P1 controlled comparison. Materialization path was normalized before calling `classifyQualificationPreflight()`. The classifier returned:

- aggregate broad: **Not Green**;
- broad regression delta: **Green**;
- new identities: none;
- worsened identities: none;
- live eligibility: **Green**.

The Green delta does not relabel the broad suite or native-TTY evidence Green.

## Runtime provenance

Before live work the qualification printed:

`MANUAL CHECK: LM Studio GPU Offload must show 26`

LM Studio at `http://127.0.0.1:1234` reported the exact loaded model `qwen3-coder-30b-a3b-instruct@q4_k_m` with context length `32,768`, eval batch `2,048`, physical batch `512`, parallel `1`, Flash Attention enabled, GPU KV-cache offload enabled, and `8` experts. GPU Offload 26 remained UI-only and was not independently observed, so controlled latency remains an **Evidence Gap**. Functional qualification proceeded without retuning.

## Gate A — Green

One official fresh attempt ran against the unchanged frozen task, fixture, fair qualification approval, George-owned V1, hidden acceptance, and production structured task service.

- Frozen task SHA-256: `ac85295343d201711b3f177e4ba44a5055fbfe8acf736f23b9c6a47f0ef59c07`.
- INSPECT used required first-round tool choice and completed four calls: `read_file`, `git_status`, `list_directory`, and `search_text`.
- The initial target was 46 bytes, SHA-256 `4cd4635c7d8ef07c10bf7a2296d0f4d79cd3e753c1794774656eac5e764d4352`, framing `{lf, lf}`.
- A same-target 59-byte `write_file` was approved, started, and failed the text-framing guard without changing the file.
- Qwen reread the unchanged file, then requested an ordinary same-target `apply_patch` with the current SHA. It was approved and succeeded.
- The final file was exactly 60 bytes, SHA-256 `1216991565e68e28f49d5658371d1a8247b2227e224eb166d84573545faa5039`, framing `{lf, lf}`.
- Subsequent `git_status`, `git_diff`, and `read_file` calls succeeded.
- George-owned V1 `node --test test/label.test.js` was approved and passed once with exit code 0.
- Final TaskState was `completed`: R1/R2 verified, W1 addressed, V1 passed, zero blockers, zero corrections.
- Hidden acceptance passed. Human coding intervention was zero.

Gate A used exactly **10 model-requested tool calls** and 11 total calls including the George-owned validation process. It used 8 logical provider rounds/attempts, 0 retries, 26,996 input tokens, and 757 output tokens. Two ordinary-profile context assemblies estimated 1,997 and 2,837 tokens with 6,195 and 5,355 tokens of headroom. Total time was 193,201.329 ms. There was no task, stage, correction, or run-budget exhaustion.

Gate A is **Green** under every locked criterion.

## Gate B2 — Not Green

After Gate A Green, one official `greenfield-express-v2` attempt ran with unchanged instrument version 2, Task Prompt format 1, task-stack SHA-256 `a8497efe8f26862c782bb8fb9a12201993df6175a30a5bf68a5149dc832c7618`, and behavioral acceptance version 1.

The deliberate dependency prerequisite was authorized and succeeded exactly as `npm install express@5.1.0` with exit code 0 in 2,423.861 ms. The clean Git baseline commit was `c6b33df46bfee8534cdb3296189a49eff8e25651`.

Observed execution:

1. P1 INSPECT used required first-round tool choice. `git_status`, `list_directory`, and `read_file("package.json")` succeeded; `search_text` returned a normal failed terminal result.
2. The read exposed package SHA-256 `f3dee37c3a5a1214c8b6bb2099697560d7c8d8be6e21cbb0d60920d7083cdb6c`.
3. The implementation round supplied that exact `expectedSha256` to `write_file("package.json")`; the call started and failed normally.
4. `create_directory("src")` succeeded.
5. `write_file("src/app.js")` and `write_file("src/server.js")` both succeeded, producing bounded mutation evidence. No missing-parent escape occurred.
6. Before the work unit could complete, the frozen ordinary profile refused continuation because estimated continuation context `28,306` exceeded its `8,192` provider-input budget.

P1 TaskState and the final StackState became `budget_exhausted`; P1 remained active/incomplete, P2/P3 remained pending, no George-owned validation ran, and hidden acceptance was not run. No approval was requested because the qualified in-workspace mutations ran under Workspace Autonomous policy. Human intervention was zero.

B2 used 8 model-requested/total tool calls, 2 logical provider rounds/attempts, 0 retries, 2,502 input tokens, and 568 output tokens. Two ordinary-profile context assemblies estimated 577 and 1,319 tokens with 7,615 and 6,873 tokens of initial headroom. Total time was 87,265.261 ms. Task/stage exhaustion is explicit; run-budget exhaustion did not occur.

Gate B2 is **Not Green** because P1/P2/P3 did not complete, validation and hidden acceptance did not run, StackState did not complete, and stage/task exhaustion occurred. This official attempt was not repaired or rerun.

## Gate C2 — Not Run by gate

C2 was not run because B2 was Not Green. The unchanged `existing-express-feature-v2` fixture, prerequisite, focused/broad validation, baseline-preservation check, TaskState, and hidden acceptance remain unspent.

## Historical evidence preserved

- The earlier Gate A Green remains historical Green.
- Historical v1 Not Green attempts remain unchanged.
- The first official B2 Not Green remains unchanged.
- The mutation-precondition P2 preflight-stopped result remains unchanged.

No historical evidence, instrument, task, fixture, metadata, or acceptance artifact was rewritten.

## Committed bounded evidence

The attempt/trace files were produced through `writeLiveWorkArtifacts()`. The Gate A patch argument body was additionally omitted from the tracked trace while retaining its path, precondition SHA, edit count, lifecycle, mutation result, and exact final SHA; no file/patch body, raw provider stream, secret/environment dump, workspace, dependency tree, or unbounded log is tracked.

| JSON | SHA-256 |
| --- | --- |
| `evidence/broad-baseline.json` | `58f0e5de02612131dec345bded9b16e3e8b8ab31238f86e1ea599aab53a0b58c` |
| `evidence/broad-candidate.json` | `59231ea54df532ed225ef654e26ab726cf6bd3c426d4005f53c4325e9b389562` |
| `evidence/broad-delta.json` | `a674cc702e4ecb7dd3e456cf4aae3daeefdc0cd89c70e87e3f4ac97750dda3be` |
| `evidence/current-broad.json` | `7d09b86505663d08a063a7aa935f49defdcd4c29b76d7d16d2a2fc1ddbd0ac9d` |
| `evidence/current-delta.json` | `18a5dd0bef8352adc5c9c4cda8adb9f814cf10e2389cd0df0658ff3a3644329e` |
| `evidence/runtime.json` | `668e9a2841705cc63544113688e173e3b1a0d9ae043f4541623d0a86be8c0c8b` |
| `evidence/gate-a/attempt.json` | `4b4d6575e3ec4cdaae3dceefa9f940b61142768cf7549e03af68943282d09c2c` |
| `evidence/gate-a/trace.json` | `d398eb4a285d91b7f6086ff654e64ee5c084d2233b444ae5c91ad531ffdf7f51` |
| `evidence/gate-b2/attempt.json` | `92c847c0597089b99b2b5216ac7694a56d750adac8b719900966e617c5f05eda` |
| `evidence/gate-b2/trace.json` | `8d83d810089b63b0dec9b89f2062a60943f22e522de0a6990d737605b68cd40b` |

## Evidence matrix

| Evidence | State |
| --- | --- |
| Qualification policy guard | **Green** |
| Hard current-candidate preflight | **Green** |
| Aggregate current broad suite | **Not Green: retained** |
| Broad regression delta | **Green** |
| Live eligibility | **Green** |
| REST-visible pinned runtime | **Green** |
| GPU Offload 26 / controlled latency | **Evidence Gap** |
| Fresh Gate A | **Green** |
| Gate B2 | **Not Green** |
| Gate C2 | **Not Run by gate** |
| Overall correction qualification | **Not Green** |
| Phase 9 ready for owner closeout | **No** |

Phase 9 remains open. This evidence does not owner-close Phase 9 or open Phase 10.
