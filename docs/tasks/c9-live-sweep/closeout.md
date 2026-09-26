# c9 live sweep convergence closeout

Status: **NOT QUALIFIED — POST-REPAIR LIVE SWEEP NOT RUN**

Date: 2026-09-26

Package: `0.9.10` (unchanged)

Pre-task HEAD inspected: `937262c639c1bd4ee0d9a6710108bad8bad2ffc6`

This is an evidence-only closeout. P6 did not rerun an official live workload, repair production/tests/fixtures/instruments, rewrite historical evidence, owner-close Phase 9, or open Phase 10.

## Decision

| Decision | Result | Basis |
| --- | --- | --- |
| Failure Evidence Diagnostics Qualified | **Yes — Qualified** | Schema-2 attempt/trace artifacts durably retain bounded provider, turn, cancellation, tool, validation, harness, and observer diagnostics. Application failures remain distinct from harness/observer failures. Schema-1 remains recognizable without invented schema-2 meaning, and the historical schema-1 three-file pair remains byte-identical. Unsafe raw payloads and bodies are excluded by implementation and permanent tests. |
| Full-Sweep Orchestration Qualified | **Yes — Qualified** | Deterministic tests prove common validity/safety failures abort before live work; functional Not Green/Evidence Gap results do not suppress later isolated workloads; prerequisites determine `qualifying` versus `diagnostic-only`; duplicate workload IDs fail before execution; each callback is spent at most once; and diagnostic-only results cannot become qualifying. P2 supplied fresh workspace/session evidence for all five workloads. |
| Failure Ledger Qualified | **Yes — Qualified** | P2 and P5 each retain nine distinct entries. Duplicate identities are rejected; classifications and repair clusters are finite; evidence references are bounded; all referenced SHA-256 values match current committed bytes. |
| P2 Diagnostic Sweep Completed | **Yes — completed; qualifying chain Not Green at B2** | Common preflight was Green and greeting, three-file, Gate A, B2, and C2 each ran exactly once in isolation. B2 was qualifying Not Green; downstream C2 was diagnostic-only Not Green. No P2 failure was rewritten or removed. |
| P3 Agent/Provider/Context Repair Wave | **Complete — two ledger entries repaired with permanent guards** | `live:b2:structured-stage-tool-limit` and `live:c2:inspect-no-evidence` were both traced to missing bounded-stage guidance and repaired in the provider-facing structured-stage slice. P3 validation passed focused `14/14`, affected `187/187`, typecheck, runner `90/90`, and Phase 9 instrument immutability. No P3 item was classified environment-only or left intentionally unresolved. |
| P4 UI/Test-Stability Repair Wave | **Complete for actionable failures; one historical intermittent unresolved** | Four OpenTUI entries were repaired as a shared test viewport/lifecycle defect, with lifecycle synchronization added where required. The sandbox/process historical intermittent did not reproduce and received the justified no-op disposition `unresolved/intermittent`. P4 passed focused OpenTUI `35/35` five consecutive times, affected `102/102`, process/sandbox `5/5`, broad `413/0/1`, typecheck, and runner `90/90`. |
| P5 Post-Repair Sweep Completed | **No — aborted at common validity gate** | The required supported-runtime common floor was Not Green (`267 passed, 1 failed`) on the P4 progressive-final-answer-reveal regression. The later broad pass did not erase that intermittent blocker. The approved common-abort rule therefore spent zero live attempts. |
| Aggregate Broad Suite State | **Automated Green with environment Evidence Gap; not fully Green** | P5 broad was `413 passed, 0 failed, 1 skipped` of 414. Fresh P6 characterization reproduced `413/0/1`. The only broad skip is native real-TTY qualification. Separately, P5 retains the progressive-reveal common-floor intermittent as Not Green. Both are blocking under the current no-blocking-regression/no-blocking-gap owner-closeout rule; neither is silently waived by a later pass. |
| Greeting Smoke | **P5 Not Run / `not-run`** | Common validity abort; zero attempts and no post-repair observed or qualifying result. P2 historical result remains Green/qualifying only. |
| Three-File Inspection Smoke | **P5 Not Run / `not-run`** | Common validity abort; zero attempts and no post-repair observed or qualifying result. P2 historical result remains Green/qualifying only. |
| Fresh Gate A Qualified | **No — P5 Not Run / `not-run`** | Common validity abort; zero attempts. P2 historical Gate A remains Green/qualifying but is not post-repair qualification. |
| Gate B2 Greenfield Qualified | **No — P5 Not Run / `not-run`** | Common validity abort; zero attempts. The P2 qualifying Not Green identity remains an unresolved post-repair Evidence Gap. |
| Gate C2 Existing-App Qualified | **No — P5 Not Run / `not-run`** | Common validity abort; zero attempts. The P2 diagnostic-only Not Green identity remains an unresolved post-repair Evidence Gap. |
| Remaining Failure Count / Classes | **9 entries: 1 Not Green, 8 Evidence Gaps** | Repair clusters: `ui-test-stability` 2 (progressive reveal Not Green; sandbox historical intermittent gap), `environment-only` 2 (native TTY; GPU Offload 26), and `unresolved` 5 (greeting, three-file, Gate A, B2, C2 post-repair qualification gaps). |
| Evidence Auditability Qualified | **Yes — Qualified** | All 19 c9 sweep JSON hashes and both ledger-referenced Markdown hashes match. Every reached P2 workload has an attempt/trace pair; P5 correctly has none because no workload was reached. Artifacts contain no raw provider wire/body, assistant prose log, file/write/patch body, secret/environment dump, unbounded Git/log, dependency tree, or workspace copy. |
| Historical Evidence Preserved | **Yes** | P2 evidence/ledger is unchanged after P2; prior turn-context evidence is unchanged; historical schema-1 hashes remain pinned; v1/v2 instruments, fixtures, and hidden acceptance have no correction-era diff. |
| Overall c9-live-sweep-convergence Qualified | **No — Not Green / incomplete** | The evidence, sweep, and ledger infrastructure is qualified and both repair waves were performed, but P5 common qualification was Not Green and the complete post-repair live chain was not run. |
| Phase 9 Ready For Owner Closeout | **No** | A blocking intermittent regression remains, native terminal and other Evidence Gaps remain, and P5 has no Green qualifying result for greeting, three-file, Gate A, B2, or C2. Diagnostic or pre-repair history cannot substitute for the required post-repair chain. |

## Failure evidence diagnostics audit

`Failure Evidence Diagnostics Qualified`.

`src/qualification/live-work.ts` emits artifact schema 2 with a bounded `failures` array. The normalized entries preserve finite source/category/event type, redacted code/message, safe provider code/reason/status when present, and turn/attempt/call/tool/validation identity. Authoritative application events use `source: application`; acceptance/harness and observer failures use their own sources and categories.

Permanent coverage proves durability for `provider.error`, `turn.failed`, `turn.cancelled`, `tool.failed`, failed validation, harness error, and observer error. It also proves raw provider payload/body, assistant prose, write/patch/file bodies, common credential forms, unrestricted event JSON, and unsafe diagnostics do not survive artifact writing.

Schema versioning is explicit and independent from instrument versioning. The historical schema-1 three-file attempt and trace remain `eb536899...` and `edaf9160...`; schema 1 is recognized without fabricating a `failures` array. Greenfield/existing-app instruments remain v1/v2; no v3 instrument was created.

## Full-sweep orchestration audit

`Full-Sweep Orchestration Qualified`.

`runQualificationSweep` validates ordered unique workload identities and backward-only prerequisites before spending callbacks. A common Not Green/Evidence Gap returns every workload as `Not Run` / `not-run` with zero attempts. Once common state is Green, a functional failure is recorded and each later isolated callback still runs once. A later result is qualifying only when all declared prerequisites are both Green and qualifying; otherwise it is diagnostic-only. A persistence failure becomes a common Evidence Gap and prevents later spending.

P2 additionally records fresh temporary workspace paths per live attempt and distinct session/task identities. Its five attempt IDs are unique, every workload has exactly one attempt/trace pair, and C2 remained diagnostic-only after B2 failed. P5 correctly exercised the opposite branch: common Not Green caused zero callbacks and five `Not Run` results.

## Failure ledger audit

`Failure Ledger Qualified`.

The P2 ledger preserves nine individual identities: two `agent-provider-context`, five `ui-test-stability`, and two `environment-only`. The P5 ledger also preserves nine individual identities: two `ui-test-stability`, two `environment-only`, and five `unresolved`. No identities collapse; duplicate identity input is rejected. Classification, finite repair cluster, metrics/state projections, bounded diagnostics, and evidence references are normalized and sorted deterministically.

The P5 `preRepairDispositions` section accounts for every P2 identity: three renderer entries resolved; progressive reveal, native TTY, sandbox intermittent, B2, C2, and GPU-control retained.

## P2 diagnostic sweep

| Workload | Observed result | Qualification status | Historical evidence |
| --- | --- | --- | --- |
| Greeting | **Green** | `qualifying` | 1 attempt/round, 0 tools, ordinary profile, final response present, no exhaustion/intervention. |
| Three-file | **Green** | `qualifying` | 5 attempts/rounds, 4 successful tools, all required reads, final response present, ordinary profile, no exhaustion/intervention. |
| Gate A | **Green** | `qualifying` | Exact 60-byte edit, V1 and hidden acceptance passed, TaskState completed; expected framing rejection and safe patch recovery retained. |
| B2 `greenfield-express-v2` | **Not Green** | `qualifying` | P1/StackState ended `budget_exhausted` at the eight-call stage limit; no mutation, validation, or hidden acceptance completed. |
| C2 `existing-express-feature-v2` | **Not Green** | `diagnostic-only` | INSPECT exhausted four calls after guessed nonexistent paths; no accepted read evidence, implementation, validation, or hidden acceptance. |

Every P2 failure and Evidence Gap remains immutable historical evidence.

## P3 agent/provider/context repair dispositions

| P2 identity | Disposition and root cause | Repair and permanent guard | Validation / remaining state |
| --- | --- | --- | --- |
| `live:b2:structured-stage-tool-limit` | Actionable George defect; missing bounded implementation-stage prerequisite guidance caused the model to rediscover SHA, parent-directory, and text-framing rules inside the fixed eight-call allowance. | The current implementation/correction slice states the eight-call allowance and tells the provider to read existing files/use `expectedSha256`, preserve `textFraming`, and create parents explicitly. `structured-task.test.ts` pins all prerequisites and the ledger identity. | P3 focused `14/14`; affected `187/187`; typecheck and runner Green. No environment-only or intentionally unresolved remainder. P5 did not run B2, so live resolution remains unproven and is retained as a qualification Evidence Gap. |
| `live:c2:inspect-no-evidence` | Actionable George defect sharing the stage-guidance root; the provider did not know the four-call INSPECT limit or that one successful read-only evidence round should end inspection, and guessed paths. | The inspection slice states at most four read-only calls, requires discovery from observed paths/workspace listing, forbids guessed paths, and stops after the first successful evidence round. `structured-task.test.ts` pins the limit/no-guessed-path guidance and ledger identity. | Same Green P3 validation. No environment-only or intentionally unresolved P3 item. P5 did not run C2, so live resolution remains unproven and is retained as a qualification Evidence Gap. |

No stage limit, context profile, provider/runtime control, permission, recovery rule, SHA/framing rule, fixture, instrument, or hidden acceptance was changed.

## P4 UI/test-stability repair dispositions

| P2 identity | Disposition | Root cause / repair / guard |
| --- | --- | --- |
| `broad:streamed-answer-visibility` | **Fixed** | The shared 18-row test fixture collapsed the content viewport after Phase 9 chrome additions. It now uses 24 rows; the original semantic assertion and explicit constrained-resize coverage remain. |
| `broad:inactive-task-text-rendering` | **Fixed** | Same viewport/lifecycle root and guard. |
| `broad:progressive-final-answer-reveal` | **Fixed in P4, retained intermittent in P5** | Same viewport/lifecycle repair and unchanged semantic assertion. The P5 common floor timed out, although the later exact broad run and fresh P6 runs passed; the unexplained intermittent remains blocking. |
| `broad:draft-preservation-rendering` | **Fixed** | Same viewport/lifecycle root and guard. |
| `deterministic:sandbox-process-historical-intermittent` | **Justified no-op; unresolved/intermittent** | It did not reproduce in P2, P4, or P5; P4 process/sandbox `5/5` and broad passed. No cause was established, so no repair was invented. |

Approval/thinking-lifecycle tests exposed through the same wait surface now synchronize on the actual approval lifecycle rather than a fixed delay. The permanent OpenTUI detector retains the semantic assertions, thinking lifecycle, approval paths, and small-resize coverage. P4 validation was focused `35/35` for five consecutive repetitions, process/sandbox `5/5`, affected `102/102`, broad `413/0/1`, typecheck Green, and runner `90/90`.

## P5 post-repair sweep

Common qualification was **Not Green**: `267 passed, 1 failed` of 268. The failed P4 permanent regression was `committed final answers reveal progressively without delaying canonical durability, and cancellation stops the reveal`, with bounded signature `Timed out waiting for frame predicate after 20 passes`; the later broad pass does not erase it.

The exact P5 broad run was `413 passed, 0 failed, 1 skipped` of 414. There were no broad-run failures. The sole skip was `native OpenTUI launches and restores a real Node 26 terminal` in the non-TTY environment. The historical sandbox intermittent did not reproduce, but remains unresolved because no cause was established.

Runtime provenance was Green for the exact pinned `qwen3-coder-30b-a3b-instruct@q4_k_m`: context `32768`, eval batch `2048`, physical batch `512`, parallel `1`, Flash Attention on, GPU KV-cache offload on, and `8` experts. GPU Offload 26 remained UI-only and unobserved, so controlled latency remains an Evidence Gap. No retuning occurred.

| P5 workload | Observed result | Qualification status | Attempts |
| --- | --- | --- | --- |
| Greeting | **Not Run** | `not-run` | 0 |
| Three-file | **Not Run** | `not-run` | 0 |
| Gate A | **Not Run** | `not-run` | 0 |
| B2 | **Not Run** | `not-run` | 0 |
| C2 | **Not Run** | `not-run` | 0 |

The remaining ledger therefore has nine entries: one intermittent renderer Not Green, three non-live Evidence Gaps (native TTY, historical sandbox intermittent, GPU Offload 26), and five post-repair live qualification Evidence Gaps. No post-repair provider/tool/profile/task/validation/hidden-acceptance result exists.

## Evidence hash audit

All committed c9 sweep artifacts match their recorded SHA-256 values:

| Artifact | SHA-256 |
| --- | --- |
| `evidence/pre-repair/preflight.json` | `b3391306c9e0f817285e5e1d77fc30e58f89e140c742a52a9f4376fe59ffc9b1` |
| `evidence/pre-repair/broad-suite.json` | `75d6121f2f91e93988208fbdff996ebbabedb0b31c38aba7ef30e4019566b21d` |
| `evidence/pre-repair/runtime.json` | `bfc0aac0b60475f29f9a9db522d0fba8ad01fb9281078350ea31d582ccefa88b` |
| `evidence/pre-repair/greeting/attempt.json` | `d21c0b1ff3439d7b9717767c0a14f37b92e41590532ff2f9d0f7ba8026bc17bf` |
| `evidence/pre-repair/greeting/trace.json` | `36de01b6f5470d4819456d945026493367a43a0209f3e38a8b7535d2fcfbdabb` |
| `evidence/pre-repair/three-file/attempt.json` | `d52ca220244f048616c05828a3eaeeab28befe7c96c688cc9ed8f319bdfc2685` |
| `evidence/pre-repair/three-file/trace.json` | `38a74ff2755a517ea289fc9266a903e697e4ae811b1348ae8821916cf0861311` |
| `evidence/pre-repair/gate-a/attempt.json` | `f117a34da30d93deceae752b4e555ad3fa9e8e26bd7696d15b61aebd08d374e5` |
| `evidence/pre-repair/gate-a/trace.json` | `2919087f0b2ce5d95c0aec0028f95b4b5b476351c21ea1850cb2e111dba064c8` |
| `evidence/pre-repair/b2/attempt.json` | `a090a956c32c381e7b1ee68810c0c75f16e21d8ce7db13fffbafe716297ae848` |
| `evidence/pre-repair/b2/trace.json` | `140f147bb5532ad9a0d2e0871fe32463f8739b1d965823fe125a91d004a61083` |
| `evidence/pre-repair/c2/attempt.json` | `b541545f7fb2cd33543309254729282920a4bed59b8b37b12acd9c1b83d42239` |
| `evidence/pre-repair/c2/trace.json` | `a40d36087d231bc069e53916a66b2b2ceb33829982816ba9ed3e47c3e00d83a5` |
| `evidence/pre-repair/failure-ledger.json` | `c5330441b3a5f10321ff1020b233cc88d256327d3227ab1be7478396708fcb62` |
| `evidence/post-repair/preflight.json` | `ca8063b7396180c9807b6ea8efb0710584e9d2e5cf75ca24bdf35ec67ac1c105` |
| `evidence/post-repair/broad-suite.json` | `449878b794d4ae8b9504de112cab3d398903f615265685f9ef362a4f12a5560f` |
| `evidence/post-repair/runtime.json` | `05b18c15579d3c3c828051a4676f289ac6bf2d8210db9b337c9fcd87a813da39` |
| `evidence/post-repair/sweep.json` | `e24e7c78f1e46d6a9a3897e12fc52f73259a88a27e3118b4089bb7f13c3cad59` |
| `evidence/post-repair/failure-ledger.json` | `d107e749be702fae0e98567d7078312a579dcf643d620805e91ba4c4a6b81d6c` |

Ledger-external references also match: prior P1 live evidence `3fb4aebec2c4b81cf3ad7f183507e485ce91713ea9397eb5a8886449aa112628` and P4 evidence `3a6f736545e3a33dbdfc69575f4861fab9f67085f4bf96b88545889a07b7d427`.

## Current identity and P6 validation

Current committed identities at pre-task HEAD:

- `src/**`: `67b4dd430ecea57d0812956081f00e76fd27ea11`;
- `test/**`: `4c2fa331ecc55d93489f2728167b98caed700251`;
- `scripts/**`: `9888a412ae0ca5d22f5d37c33255c4dcf1ae8d01`;
- `package.json`: `0d6e81b52a0e0de5fd7310d76948b9576277bdb0`;
- qualification source: `7987d1b9401ec4bfbb1a73ea10ff0f91c7f58d70`;
- qualification tests: `37e4cd0edcf4412ff5ca2e3de93ae1816a830e22`;
- Phase 9 live-work instrument tree: `b5b9dfacf2fdd2aa4f79cdd3f3657b1598853dcc`;
- hidden acceptance tree: `8d1a0367e86a23a05ad9188c0f5c8eedccfda757`;
- three-file fixture tree: `a98bac54ef8263bef78cb5fcacd1d2a1a0fe3af5`.

Immutable instrument authorities remain greenfield v1 task stack `c0ea964c...`, greenfield v2 `a8497efe...`, existing-app v1/v2 fixture `45856b10...`, existing-app v2 task stack `66f262fd...`, greenfield acceptance `052b1096...`, and existing-app acceptance `183c7447...`.

Fresh P6 executable validation used the installed supported Node `v26.10.0` and npm `11.19.1`; the default shell Node 24 was not used for qualification:

| Check | Result |
| --- | --- |
| Correction diagnostics/sweep, P3/P4 guards, and Phase 9 integration/immutability focused set | **Green: 72/72 passed** |
| `npm run typecheck` | **Green** |
| `npm run test:runner` | **Green: 90/90 passed** |
| Current exact `npm test` characterization | **413 passed, 0 failed, 1 skipped; 414 total**; native real-TTY only |
| Package | **Green: exactly `0.9.10`** |
| Root `package-lock.json` | **Green: absent** |
| `git diff --check` | **Green** |
| P6 scope | **Green:** only this closeout document was added; no implementation, test, fixture, instrument, acceptance, or historical-evidence repair |

The fresh passes are current characterization only. They do not erase the P5 common-floor failure, authorize fishing for a pass, or substitute for the unspent official post-repair live matrix.

Phase 9 remains open. Phase 10 remains unopened.
