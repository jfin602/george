# c9 turn context live qualification closeout

Status: **NOT QUALIFIED — THREE-FILE SMOKE NOT GREEN**

Date: 2026-09-26

Package: `0.9.10` (unchanged)

Pre-task HEAD inspected: `6f39cb78da281f21bde14735ad9c8c5386eaa8af`

Exact production candidate: `25d51a93d229e9b8cc76f56eb4b7b9afae1a5723`

This is an evidence-only closeout. P2 did not rerun an official greeting, three-file, Gate A, B2, or C2 attempt; change production, tests, fixtures, instruments, acceptance, dependencies, profiles, or runtime settings; owner-close Phase 9; or open Phase 10.

## Decision

| Decision | Result | Basis |
| --- | --- | --- |
| Production Candidate Identity Preserved | **Green** | `src/**`, `test/**`, `scripts/**`, and `package.json` have identical Git object identities at the candidate and current HEAD: `5acf9de1968e0d012ae15e0e73c8529f2f180ed1`, `1832ef5f1304c13e1bbd45b198ec1bbe52fecc35`, `9888a412ae0ca5d22f5d37c33255c4dcf1ae8d01`, and `0d6e81b52a0e0de5fd7310d76948b9576277bdb0`. The three-file fixture, Phase 9 live-work fixtures/instruments, and qualification source trees are likewise unchanged (`a98bac54ef8263bef78cb5fcacd1d2a1a0fe3af5`, `b5b9dfacf2fdd2aa4f79cdd3f3657b1598853dcc`, and `af73ec4014f4d9ca6beaed6b5f4a2b25a9f7069c`). Every later path is allowed planning, prompt, qualification-evidence, authority, or closeout documentation. |
| Prior Deterministic Qualification Reused | **Green** | The unchanged candidate retains the turn-context convergence qualification: bounded provider projection, provider-grounded continuation accounting, adaptive ordinary -> medium -> large promotion, fixed-profile and above-large fail-closed behavior, and ordinary TUI base-agent composition. P2's supported Node 26 affected floor passed `148/148`. |
| Fresh Hard Sanity Preflight | **Green** | P1 recorded the required fresh hard floor `198/198`, typecheck Green, runner `90/90`, package/root-lockfile/diff hygiene Green, and no new affected regression. P2 reconfirmed an affected floor `148/148`, typecheck Green, and runner `90/90` under Node `v26.10.0`. |
| Aggregate Broad Suite State | **Not Green — retained** | P1's supported Node-26 `npm test` characterization was `400 passed, 5 failed, 1 skipped; 406 total`. The five OpenTUI renderer failures and native real-TTY skip were the complete retained controlled set. P2 did not rerun the full broad suite; its selected characterization reproduced the same five retained renderer identities (`178/183`). |
| Broad Regression Delta Still Applicable | **Green** | The controlled baseline `d7804684801fa8418050c34d9ef097ca1adf80b6` versus exact candidate `25d51a...` remains applicable because production/test/instrument identity is unchanged and P1 observed no new or materially worsened affected failure or skip. Aggregate Not Green is not relabeled. |
| Loaded Runtime Provenance | **Green** | Before the official sequence, REST showed a loaded exact `qwen3-coder-30b-a3b-instruct@q4_k_m` instance with context `32,768`, eval batch `2,048`, physical batch `512`, parallel `1`, Flash Attention enabled, GPU KV-cache offload enabled, and `8` experts. `retuned` is false. |
| GPU Offload 26 / Controlled Latency | **Evidence Gap** | The UI-only GPU Offload value was not independently observed. This did not block functional attempts because REST-visible controls were healthy, but no controlled latency/performance claim is qualified. |
| Greeting Smoke | **Green** | Exactly one official attempt completed in `1` provider attempt / `1` logical round with `0` tool calls. A final response was present (`34` UTF-8 bytes; SHA-256 `cd153d3c18e782c4f4b3ceec574adccc8e68bc557110b0bc263b01e09bfcc8ef`), coding-workflow guidance was absent, no budget exhausted, and human intervention was `0`. |
| Three-File Inspection Smoke | **Not Green** | Frozen hashes were intact: `README.md` `4e3a3f35fa75c7f421809af3c209673de887a043e1107db16c5daf14908e1abb`, `plan.js` `2f15fd8d0ac3ed9f1c2e22d8f4561fd29444f018e07540ad2ac24aeb3d9968fb`, and `plan.test.js` `ced5709631a0014008b505029415cb93e1a0fa5527590467d67891a9aa1f270f`. All three required reads succeeded, but the only official attempt ended after `3` provider attempts / `3` rounds and `9` requested tools with no final response. There was one initial context assembly, no envelope promotion, no retry or exhaustion, and `0` human intervention. A bounded `provider.error` preceded `turn.failed`; its diagnostic code/message was not retained. |
| Fresh Gate A Qualified | **Not Run by gate** | Three-file was Not Green, so no fresh exact 60-byte edit, V1, TaskState, hidden acceptance, call/round, intervention, or exhaustion result exists. |
| Gate B2 Greenfield Qualified | **Not Run by gate** | Gate A was not reached. No fresh P1/P2/P3, validation, StackState, hidden acceptance, provider usage/promotion, intervention, or exhaustion result exists. The historical `28,306 > 8,192` frozen-ordinary continuation failure remains immutable; deterministic projection/promotion qualification addresses its defect class, but no fresh B2 live evidence was spent to prove non-recurrence. |
| Gate C2 Existing-App Qualified | **Not Run by gate** | B2 was not reached, so baseline preservation, focused/broad validation, TaskState, hidden acceptance, intervention, and exhaustion remain unspent. |
| Evidence Auditability Qualified | **Green** | All five live-qualification JSON SHA-256 values match the P1 ledger. All fifteen earlier committed qualification/turn-context JSON values also match their historical ledgers. Every reached P1 attempt has sanitized attempt/trace files. The evidence contains no raw provider stream, assistant prose log, file/write/patch body, unbounded Git snapshot/log, secret/environment dump, workspace copy, or dependency tree. |
| Historical Evidence Preserved | **Yes** | Current turn-context-convergence evidence is byte-unchanged from `d8c27d13e6c1c86d53aa4d0f2f42acc7d18d5939`; prior qualification-preflight evidence is unchanged from the production candidate. Historical P4 Not Run states, Gate A/B2 outcomes, and v1/v2 instruments were not rewritten. |
| Overall c9-turn-context-live-qualification Qualified | **No — Not Green** | Runtime provenance and greeting were Green, but the required three-file smoke was Not Green and the stop contract left A, B2, and C2 Not Run. |
| Phase 9 Ready For Owner Closeout | **No** | The owner-closeout rule requires Green greeting, three-file, A, B2, and C2 evidence with no blocker. Those conditions are not met. |

## Evidence hash audit

| JSON | SHA-256 |
| --- | --- |
| `evidence/runtime.json` | `81e8eaab8b39c067a6fc9b0aea9a7fdadc8c91c9f26b59846ab6f6b254beb951` |
| `evidence/greeting/attempt.json` | `b8b5e3ff4192cb6c5bad911c4b166fd21001fabf6d33d642931f81a53091f573` |
| `evidence/greeting/trace.json` | `be4ea3a88b20eac2984bb7e2459ab2b125c5e3638825098592184364ac017424` |
| `evidence/three-file/attempt.json` | `eb536899b5b4cac658692b440673b78697aa896d30b2d5270355016b77d88bec` |
| `evidence/three-file/trace.json` | `edaf91604eb3937923ba316a5562060fd220165d6417fc6b59ce022d5ab21f7c` |

## P2 validation

All executable validation below used Node `v26.10.0`.

| Check | Result |
| --- | --- |
| Current affected provider/tool/context/structured-task/qualification/integration floor | **Green: 148/148 passed** |
| Selected aggregate characterization including OpenTUI renderer tests | **Not Green — retained: 178 passed, 5 failed; 183 total**; the exact five retained renderer identities only |
| `npm run typecheck` | **Green** |
| `npm run test:runner` | **Green: 90/90 passed** |
| P1 full broad characterization audit | **Verified, not rerun:** `400 passed, 5 failed, 1 skipped; 406 total`, retained identities only |
| Package | **Green:** exactly `0.9.10` |
| Root `package-lock.json` | **Green:** absent |
| Candidate-sensitive tree identity | **Green:** unchanged |
| P2 scope | **Green:** only this closeout document changed |

Phase 9 remains open. Phase 10 remains unopened.
