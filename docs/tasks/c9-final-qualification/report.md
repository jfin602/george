# Phase 9 final qualification sweep

Date: 2026-09-26. Exact HEAD: `e6f19645d6ed65e670bacff2f22924990c53b37b`. Package: `0.9.10`. Node: `v26.10.0`; npm: `11.19.1`. This run made no production, test, fixture, instrument, acceptance, profile, runtime, or qualification-policy repair. The pre-existing uncommitted abort-scope correction in `src/qualification/sweep.ts` and its unit tests was left intact.

## Identity and preflight

- Root `package-lock.json`: absent. Frozen v1/v2 instrument tree: Git object `b5b9dfacf2fdd2aa4f79cdd3f3657b1598853dcc`; hidden acceptance tree: `8d1a0367e86a23a05ad9188c0f5c8eedccfda757`; three-file fixture tree: `a98bac54ef8263bef78cb5fcacd1d2a1a0fe3af5`. All have no working-tree diff. Frozen Gate A task SHA-256: `ac85295343d201711b3f177e4ba44a5055fbfe8acf736f23b9c6a47f0ef59c07`.
- P3 B2/C2 stage-guidance repairs and P4 OpenTUI fixture/lifecycle repairs are present. The abort-scope classifier and permanent tests are present. Current classifier source SHA-256: `5d78eca1312dd1995164ee724788f94085e5f0d2492634f867a80a08a115e28f`; its test SHA-256: `b5874da6b8df222720b4f11e11c907c63c69cef8f772d2d5ccdc4b0fe6b34424`.
- Focused qualification, provider/tool, recovery, Workspace Autonomous containment, and Phase 4/5/9 integration: **124 passed, 0 failed**. Focused OpenTUI: **35 passed, 0 failed**, including progressive final-answer reveal. Application composition and schema-2 evidence writing passed in these floors. `npm run typecheck` passed. `npm run test:runner`: **90 passed, 0 failed**. `git diff --check` passed.
- The executable `classifySweepAbortScope()` returned `liveSweepEligible: true`, `abortState: Green`, `abortReasons: []`. Every hard-abort class was observed Green: supported runtime, pinned model, REST controls, application runnability, typecheck, instrument identity, evidence writer, permission/security/recovery, Workspace Autonomous containment, provider/tool contract, and qualification harness. Its record-and-continue observations were native real-TTY, GPU Offload 26, and historical sandbox intermittency, each an Evidence Gap. No current functional test failure was promoted to a hard abort.

The exact single `npm test` run under Node 26 reported **418 total: 417 passed, 0 failed, 1 skipped**, duration `8512.281468 ms`. The sole skip was `native OpenTUI launches and restores a real Node 26 terminal` because this execution was non-TTY. The historical P5 progressive-reveal timeout remains intermittent evidence even though the current focused and broad runs passed it. The other historical OpenTUI failures passed; the sandbox/process intermittent did not reproduce.

## Runtime provenance

`GET http://127.0.0.1:1234/api/v1/models` showed a non-empty loaded instance for exact model `qwen3-coder-30b-a3b-instruct@q4_k_m`: context `32768`, eval batch `2048`, physical batch `512`, parallel `1`, Flash Attention enabled, GPU KV-cache offload enabled, and `8` experts. No runtime setting was changed.

`MANUAL CHECK: LM Studio GPU Offload must show 26`

GPU Offload 26 was not independently observable, so controlled latency remains an Evidence Gap. Native real-TTY behavior also remains an Evidence Gap. Neither prevents the functional live matrix.

## Complete live matrix

Each workload ran once, in order, with a distinct temporary workspace and session. No repair occurred between workloads. The existing `runQualificationSweep()` prerequisite rule was applied to the observed results.

| Workload | Observed | Qualification | Result |
| --- | --- | --- | --- |
| Greeting | **Green** | qualifying | One provider attempt/round, `1479/9` input/output tokens, zero model tools, 34-byte final answer, ordinary profile, no promotion, intervention, or exhaustion. |
| Three-file | **Green** | qualifying | All frozen fixture hashes checked and required paths read. Three attempts/rounds, `10562/631` tokens, six tool calls, final response present, ordinary profile, no promotion, intervention, or exhaustion. Two guessed-path reads failed recoverably and remain in the trace. |
| Gate A | **Not Green** | qualifying | Exact 60-byte result, V1 passed, completed/verified TaskState, hidden acceptance passed, zero intervention/exhaustion, eight provider rounds. **Twelve model-requested tool calls exceeded the frozen maximum of ten.** George-owned V1 process is a separate thirteenth trace tool. |
| B2 `greenfield-express-v2` | **Not Green** | diagnostic-only | Approved `npm install express@5.1.0` passed. P1 completed and V1 passed; P2 failed on an LM Studio request timeout after `120000 ms`. P3 and hidden acceptance did not run. Eleven provider attempts/rounds, `21170/1146` tokens, 20 model-requested calls, ordinary profile, no promotion/intervention/exhaustion. StackState failed at P2. |
| C2 `existing-express-feature-v2` | **Not Green** | diagnostic-only | Frozen fixture commit `a3969e5f3ef7ef2502ffbaf1315399ce3316267d`; approved `npm install` passed. INSPECT read `package.json`, `src/app.js`, and `test/notes.test.js`. Implementation W1 exhausted the eight-call structured-stage limit; V1/V2 and hidden acceptance did not run. Three provider attempts/rounds, `5848/829` tokens, 13 model calls, ordinary profile, no promotion/intervention. TaskState `budget_exhausted`. |

The original B2 P1 structured-stage tool-limit defect did not recur: P1 completed. The original C2 guessed nonexistent paths/no INSPECT evidence defect did not recur: accepted reads were observed. The present Gate A call-ceiling, B2 provider timeout, and C2 implementation-stage limit are fresh blocking observations. B2/C2 results are diagnostic-only because Gate A was Not Green; neither could establish qualifying Phase 9 Green even if its own workload had passed.

## Final failure ledger and historical dispositions

[`failure-ledger.json`](failure-ledger.json) records seven bounded entries: three current live Not Green observations, the current native-TTY skip, the UI-only GPU Offload gap, and the retained historical progressive-reveal and sandbox/process intermittency gaps. No broad test failed in the current run. The three other historical OpenTUI identities (streamed-answer visibility, inactive-task text, draft preservation) passed current focused/broad coverage and are resolved for this sweep. Historical original three-file, Gate A/B2/C2, P2, P3, P4, P5, and native/performance evidence was not rewritten.

## Artifact SHA-256

All five reached workloads have schema-2 attempt/trace pairs. These artifacts contain bounded operational evidence; no raw provider stream, assistant prose log, model reasoning, write/patch body, unrestricted process output, environment/secret dump, workspace copy, or dependency tree was committed.

| Workload | `attempt.json` | `trace.json` |
| --- | --- | --- |
| Greeting | `7847d82457dafff53703809cf2edf31ed7191c0702a9e2baa7b7e46cbb37b554` | `4451cbb95cccfff80fb9211c3729f6b74cc770c6dafe6e8a479924b10a828b71` |
| Three-file | `4ff8ff7f108407de551daf68ce0ce09a14d5fda88354be2200b8f305d2ca9380` | `105be5ff81f02b4aaf0721caa0365d4939ed54ff45d2e839d2801b87656c6b9a` |
| Gate A | `540da94e9fb542d5524c1ce7bc7f95490d28bdb7f420f379238c6da56b4c330f` | `5ab72d92959720509bc219beaa54858e1c9eb36755d17967aa1d377d9420e3b5` |
| B2 | `e4621fc4bdd7b170d53e70123920bd124023012783cb659d7b3868c1e45027b3` | `2a0fd393f1bb8a76efa108d63be1f2213df277c20dc15bb58857332b0c6de9eb` |
| C2 | `169792d4faabbf04bb166ee1a5bc2c2364ea20843896df0870a6ecfcd34438e6` | `5655a1eb3833ced09b7f502927e742b8028cf3ee31f5c94aa8081e91d8547b94` |

## Readiness

**Functional Phase 9 Qualification: Not Green.** The hard safety/runtime/evidence preflight passed, but Gate A exceeded its call ceiling, and B2/C2 did not complete. No current blocking security or recovery regression reproduced. The runtime/terminal/historical Evidence Gaps above remain explicit and nonblocking for functional execution, subject to owner review.

**Phase 9 Ready For Owner Closeout: No.** Phase 9 remains open; owner closeout was not performed.
