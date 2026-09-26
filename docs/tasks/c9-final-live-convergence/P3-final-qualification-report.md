# c9 final live convergence — P3 final qualification

Date: 2026-09-26. Pre-task HEAD and exact candidate: `7670122869c87942bb01c3976233209581d9cf7a`; source tree: `8d4a2c9f93c50dcea1c248a7d43ad90d6083e251`; package: `0.9.10`. P1 mission-card/alignment candidate is `823cea6`; P2 incomplete-provider recovery candidate is `7342c96`; the inserted provider-stall correction is P1 `88c3253`, P2 `412c993`, qualified closeout `7670122`.

This prompt changed no production code, tests, frozen instruments, acceptance, runtime/context limits, or provider settings. Each live workload ran exactly once in order in a fresh workspace/session, with no repair between workloads and zero human coding intervention. The earlier interrupted P3 artifacts are preserved byte-for-byte under `evidence/historical-interrupted-p3/`; this new sweep restarted at greeting.

## Common hard gates

- Supported runtime: Node `v26.10.0`, npm `11.19.1`, Linux, Bubblewrap `0.9.0`.
- Initial project working tree: clean. `git diff --check`: Green. Root `package-lock.json`: absent. Package remained `0.9.10`.
- Frozen identity: v1/v2 instrument tree `b5b9dfacf2fdd2aa4f79cdd3f3657b1598853dcc`; hidden acceptance tree `8d1a0367e86a23a05ad9188c0f5c8eedccfda757`; three-file fixture tree `a98bac54ef8263bef78cb5fcacd1d2a1a0fe3af5`; Gate A task SHA-256 `ac85295343d201711b3f177e4ba44a5055fbfe8acf736f23b9c6a47f0ef59c07`. No frozen file had a working-tree diff.
- B2 identity: instrument version 2, metadata SHA-256 `f0b6a69445f67eda134a97035058ad9210526a9668a06fca84bb73441777ef9f`, task-stack SHA-256 `a8497efe8f26862c782bb8fb9a12201993df6175a30a5bf68a5149dc832c7618`, acceptance version 1 and SHA-256 `052b109605e2eaec752477374f98a9d9c87f6b4e02bf4232d92dc79ce883c849`.
- C2 identity: instrument version 2, metadata SHA-256 `ab86b304b8c893503fa390726a0e13d33ff2b0afe3b0744e12afca3fe886e5e5`, task-stack SHA-256 `66f262fd8f73171cdf5fc023d2be3a5032569fee9ebd8041241abcaf1c0eb0e9`, fixture-source SHA-256 `45856b10bfe4ff3f14e1893da22b9a88b1c3334d3923d2417aee0c09e94a5aba`, acceptance version 1 and SHA-256 `183c74474b02166e2ec2fce21019eef2e2c1e20faa91b32d847e6f56e4608d21`.
- Affected provider/tool/recovery, permission/security, Workspace Autonomous containment, mission-card/alignment, schema-2 evidence, Phase 4/5/9, and live-work floors: **247 passed, 0 failed, 0 skipped**.
- `npm run typecheck`: Green.
- `npm run test:runner`: **90 passed, 0 failed, 0 skipped**.
- Application runnability, provider/tool contract, schema-2 writer, sandbox containment, partial-provider replay, stall watchdog/rebase, strict duplicate/no-progress, task/stack state, and frozen acceptance identity passed the affected floors.

The required complete `npm test` command ran exactly once: **443 total, 441 passed, 1 failed, 1 skipped**. The failure was the retained intermittent OpenTUI progressive-final-answer reveal timeout; the same identity passed in the focused affected floor. The skip was the expected native OpenTUI real-TTY case in this non-TTY environment. Under the current full-sweep policy these were ledgered and did not invalidate safety, evidence writing, application runnability, or the live matrix.

## Runtime provenance

`GET http://127.0.0.1:1234/api/v1/models` showed a loaded instance for exact model `qwen3-coder-30b-a3b-instruct@q4_k_m`: context `32768`, eval batch `2048`, physical batch `512`, parallel `1`, Flash Attention enabled, GPU KV-cache offload enabled, and `8` experts. No runtime setting was changed.

`MANUAL CHECK: LM Studio GPU Offload must show 26`

GPU Offload 26 was not independently REST-visible, so controlled latency remains an Evidence Gap. Native real-TTY behavior also remains an Evidence Gap. Neither was promoted to Green.

## Complete live matrix

| Workload | Observed | Qualification | Result |
| --- | --- | --- | --- |
| Greeting | **Green** | qualifying | One provider attempt/round, `1479/9` input/output tokens, zero tools, 34-byte final answer, ordinary profile, no retry, promotion, intervention, or exhaustion. |
| Three-file | **Green** | qualifying | All frozen required paths were read and a final answer was present. Five attempts/rounds, `28352/761` tokens, seven requested tools, ordinary-to-medium provider-usage promotion, no retry/intervention/exhaustion. One malformed `search_text` request failed recoverably and is retained. |
| Gate A | **Green functional** | qualifying | Exact 60-byte file and SHA, V1 passed, completed/verified TaskState, hidden acceptance passed, zero intervention/exhaustion, permission/recovery/framing/SHA authority preserved. |
| B2 `greenfield-express-v2` | **Not Green** | qualifying | P1 completed and V1 passed. P2 V1 failed; its correction ended after truthful terminal provider-stall recovery. P3 stayed pending, StackState failed, hidden acceptance did not run. |
| C2 `existing-express-feature-v2` | **Not Green** | diagnostic-only | INSPECT observed `src/app.js`; implementation produced no mutation or validation before provider stall/timeout retries exhausted. TaskState failed with W1 active and V1/V2 pending; hidden acceptance did not run. |

The existing full-sweep prerequisite rule was applied: B2 remained qualifying because Gate A was Green; C2 was diagnostic-only because B2 was Not Green. Ordinary functional failure did not suppress the later attempt.

## Gate A functional and efficiency states

The observed mutation was `apply_patch` on `src/label.js`, producing exactly `60` bytes and SHA-256 `1216991565e68e28f49d5658371d1a8247b2227e224eb166d84573545faa5039`. George-owned V1 ran once and passed with exit code `0`. Final TaskState was `completed`: R1/R2 verified, W1 addressed, V1 passed, no corrections or blockers. Hidden/exact acceptance passed.

- Functional state: **Green**.
- Model-requested tool calls: **6** (`git_status`, `list_directory`, two `read_file`, `search_text`, `apply_patch`).
- Total trace calls: **7**, including George-owned `run_process` for V1.
- Logical provider rounds/attempts/retries: **4 / 4 / 0**.
- Historical efficiency target <=10 model calls: **met**.
- Historical efficiency target <=10 logical rounds: **met**.
- Profile: ordinary for both structured stages; no promotion or pressure.
- Total time: `107321.873 ms`; no stage/task/run-budget exhaustion.

Functional and efficiency states are separate; both happened to be Green in this attempt.

## B2 result and provider recovery

The exact authorized prerequisite `npm install express@5.1.0` passed. The isolated baseline commit was `36550d58a5ae8e597629c75c5279e256275510c9`. P1 completed with V1 passed. P2 implemented the API, then its declared V1 failed. The correction attempt did not complete, so P3 and hidden acceptance did not run.

Final StackState was `failed` at P2: P1 completed, P2 failed, P3 pending. Metrics were 27 attempts/rounds, 6 retries, `62953/2623` provider tokens, 28 requested tools, ordinary profile with one continuation-estimate promotion to medium, no human intervention, and no hard stage/task/run-budget exhaustion. Total time was `1254265.303 ms`.

The new stall evidence was explicit and bounded:

- eight `provider.stall.suspected` and eight `provider.stall.detected` events, all active-response inactivity at approximately 60 seconds;
- six replay-safe fresh retries across incomplete branches;
- one low-pressure canonical rebase at estimated `12323` tokens on the medium envelope;
- no pressure compaction (`compaction: not_needed` at rebase and `not_attempted` at terminal);
- the post-rebase attempt stalled again and ended with one `provider.stall.terminal` plus provider-class `turn.failed`, not misleading `budget_exhausted`.

Provisional incomplete proposals were not promoted to canonical success. Framing-change writes were rejected/denied normally, duplicate unchanged `git_status` was rejected by the strict no-progress guard, and no permission or containment ceiling was raised.

## C2 result and provider recovery

The exact authorized `npm install` prerequisite passed. The unchanged fixture commit was `a3969e5f3ef7ef2502ffbaf1315399ce3316267d`. INSPECT recorded `src/app.js`; two malformed `search_text` calls failed recoverably. Implementation then produced no mutation and neither V1 nor V2 ran.

Final TaskState was `failed`: all requirements pending, W1 active, W2 pending, V1/V2 pending, one blocker, zero corrections. Metrics were 9 attempts/rounds, 5 retries, `5703/136` provider tokens, 6 requested tools, ordinary profile, no promotion, no human intervention, and no hard convergence/run-budget exhaustion. Total time was `699246.645 ms`.

Recovery evidence recorded three active-response stalls at approximately 60 seconds with fresh retries, followed by three absolute `120000 ms` LM Studio timeouts, then one `provider.retry.exhausted` and provider-class `turn.failed`. There was no canonical rebase or pressure compaction in this branch. This is Not Green independently, and diagnostic-only in the chain because B2 had already failed.

## Failure ledger and preserved history

`failure-ledger.json` records seven bounded entries: B2 validation failure, B2 terminal provider stall after low-pressure rebase, C2 provider timeout/retry exhaustion, the current broad progressive-reveal intermittent failure, the retained historical sandbox/process intermittent gap, the non-TTY native OpenTUI gap, and the UI-only GPU Offload 26 gap.

The earlier interrupted P3 attempt was not rewritten. Its six original JSON files were copied byte-for-byte under `evidence/historical-interrupted-p3/` with their original hashes. All earlier Phase 8/9 attempts remain unchanged.

## Evidence SHA-256

| JSON | SHA-256 |
| --- | --- |
| `evidence/runtime.json` | `eb5760eab35cb31a78af83fa878b8758e3cf3090d0fef01f0d7c785157f9e91c` |
| `evidence/greeting/attempt.json` | `1b0d85cfc5b3bdb45bd0b07915bb93be93df73db8547648976a65471050a590e` |
| `evidence/greeting/trace.json` | `710bff4baa639adede34137dea46d8336d0603e81d902b3bb0990204d76d51ee` |
| `evidence/three-file/attempt.json` | `ba4debf8144b47a9fbbbc087d0009504eacb8bd7d1241ff648a2c08d3e8d8983` |
| `evidence/three-file/trace.json` | `4e2ad9b9a9f3424feb06ff270df208b44bb5d6cb59c48ca442dc476d267532ec` |
| `evidence/gate-a/attempt.json` | `35e7eb88a28620faa700c815385f46abcb16120a27829992f74db70cc2c0bbb8` |
| `evidence/gate-a/trace.json` | `0c24584b755a396cdfdeb3514170fea6a5c3a800e7153888ecf519511e22cfa7` |
| `evidence/b2/attempt.json` | `12e7a271d955331b4ce3cf3b393086de62c81325110461d8dc6a86a177a8c5c4` |
| `evidence/b2/trace.json` | `4694d3c6954e9103a66370b9e7f9ea0a7d0c3baa7ac0f63060441cd08d694e5b` |
| `evidence/c2/attempt.json` | `9fe5fe2b676bb6491b14164c55b9c6a8e7b5d9f0094dfd42bb71e15be92d6295` |
| `evidence/c2/trace.json` | `43c9ddc4e2a7131b568ffe18f56491cf0cfb69246668c1ad07ff4c1da8cd19c4` |
| `failure-ledger.json` | `618257794a1dcf45257d89ddf1c0e291f4372bc6ff92c8e45ce5a283580d5425` |
| `evidence/historical-interrupted-p3/greeting/attempt.json` | `dc5055f24b27c7c07355887d4e3bf5da91924dd83e17e285f85c26bf516e6d72` |
| `evidence/historical-interrupted-p3/greeting/trace.json` | `b317c3998c913e91c10a30a796669c219a2b02dca05bde9dd87124aa6b3513bd` |
| `evidence/historical-interrupted-p3/three-file/attempt.json` | `1d840f2c6b44fb1b11aaa7fc1bfa4b25ad5319c976e8221787c8a3ca5797fdcf` |
| `evidence/historical-interrupted-p3/three-file/trace.json` | `38468fb91c0e3990fd288f6f355918eec2b7d581baa1ab58db27bf255b1db538` |
| `evidence/historical-interrupted-p3/gate-a/attempt.json` | `fe3e4223afefbe4e56e2f71530e9845d515dfc86f8fa8cae69ffe63ce30c61f2` |
| `evidence/historical-interrupted-p3/gate-a/trace.json` | `2730f7e8fe80badba0da9671ab66b044c285d77d23f4d771b46c35835c79ed7f` |

The schema-2 artifacts contain bounded operational evidence only. No raw provider stream, assistant prose log/private reasoning, write/patch body, unrestricted process output, environment/secret dump, workspace copy, or dependency tree is tracked.

## P3 readiness

**Full qualifying chain currently Green: No.** Greeting, three-file, and Gate A are Green, including both Gate A efficiency targets. B2 is qualifying Not Green and C2 is diagnostic-only Not Green. The provider-stall correction produced truthful bounded stall/retry/rebase evidence and provider-class termination, but the five-workload chain did not converge.

P3 does not owner-close Phase 9. The final owner-closeout/readiness decision remains with P4.
