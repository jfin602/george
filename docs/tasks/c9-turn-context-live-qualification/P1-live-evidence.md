# c9 turn context live qualification P1 evidence

Status: **GREETING GREEN; THREE-FILE NOT GREEN; OFFICIAL SEQUENCE STOPPED**

Date: 2026-09-26

Pre-task HEAD: `1686af3c446bbab9acbc9d7cea50fb53d0bb5af3`

Exact production candidate: `25d51a93d229e9b8cc76f56eb4b7b9afae1a5723`

Package: `0.9.10` (unchanged)

P1 made no production, test, script, dependency, profile, runtime-setting, qualification-helper, fixture, instrument, or hidden-acceptance change. It stopped after the first required Not Green live result and did not run Gate A, B2, or C2.

## Candidate identity

**Green.** The complete committed and working-tree diff from `25d51a...` contains only allowed boot, roadmap, stability, planning, prompt, evidence, and closeout documentation. There is no change under `src/**`, `test/**`, `scripts/**`, `package.json`, dependency lock/shrinkwrap state, runtime configuration, the three-file fixture, Gate A fixture/helper, v1/v2 instruments, or hidden acceptance.

The inherited controlled comparison remains the exact baseline `d7804684801fa8418050c34d9ef097ca1adf80b6` against production candidate `25d51a...`. It was referenced rather than rerun.

## Fresh sanity preflight

All required checks used Node `v26.10.0` and npm `11.19.1` unless noted.

| Check | Result |
| --- | --- |
| Provider contract/result projection; continuation accounting/promotion; context/profile/one-turn; mutation/recovery/Git preservation; progress/session/run-budget; production TUI composition; qualification/live-work; Phase 4/5/9 integration and v1/v2 immutability | **Green: 198/198 passed** |
| `npm run typecheck` | **Green** |
| `npm run test:runner` | **Green: 90/90 passed** |
| Package / root lockfile / initial diff hygiene | **Green:** exactly `0.9.10`, no root `package-lock.json`, `git diff --check` passed |

One broader affected invocation additionally included the real sandbox process integration and was **Not Green: 190 passed, 1 failed** when its nested `node --test test/unit/tools/process.test.ts` process did not complete. The same sandbox file immediately passed `3/3` in isolation, and the exact broad characterization also passed that sandbox identity. This establishes an intermittent validation observation; it does not erase the failed invocation or establish a production regression in the unchanged candidate.

## Current broad characterization

One supported Node-26 `npm test` characterization was **Not Green: 400 passed, 5 failed, 1 skipped; 406 total**.

It reproduced the complete retained controlled identity/signature set:
- streamed-answer renderer visibility;
- inactive-task text rendering;
- progressive final-answer reveal timing;
- draft-preservation rendering;
- approval rendering timing;
- skipped native real-TTY case.

No new broad failure, skip, or materially worsened retained signature appeared. Aggregate broad remains Not Green; the inherited controlled candidate regression delta remains Green and applicable.

## Runtime provenance

Before any provider request P1 printed:

`MANUAL CHECK: LM Studio GPU Offload must show 26`

`GET http://127.0.0.1:1234/api/v1/models` exposed a non-empty loaded instance for exactly `qwen3-coder-30b-a3b-instruct@q4_k_m` with:

- context length `32,768`;
- eval batch `2,048`;
- physical batch `512`;
- parallel `1`;
- Flash Attention enabled;
- GPU KV-cache offload enabled;
- experts `8`.

REST-visible runtime provenance is **Green**. No model was loaded, unloaded, or retuned. GPU Offload 26 remains a UI-only **Evidence Gap**, so this run makes no controlled latency/performance claim.

## Greeting smoke

**Green** on exactly one official attempt.

- terminal status: `completed`;
- provider attempts/rounds: `1/1`;
- provider-reported input/output tokens: `1,479/9`;
- model-requested tools: `0`;
- final response: present, `34` UTF-8 bytes, SHA-256 `cd153d3c18e782c4f4b3ceec574adccc8e68bc557110b0bc263b01e09bfcc8ef`;
- selected profile: ordinary;
- coding-workflow guidance: absent;
- envelope promotions/retries/exhaustion/human intervention: none/none/none/zero.

No assistant prose was retained.

## Three-file inspection smoke

**Not Green** on exactly one official attempt. The stop contract was applied; the attempt was not rerun.

- terminal status: `failed`;
- provider attempts/rounds: `3/3`;
- provider-reported input/output tokens: `4,334/208`;
- model-requested tools: `9`;
- successful required reads: `README.md`, `plan.js`, and `plan.test.js`;
- final response: absent;
- selected profile: ordinary;
- context assemblies: `1`;
- envelope promotions/retries/exhaustion/human intervention: none/none/none/zero;
- provider continuation ended with one bounded `provider.error` followed by `turn.failed`;
- one unrequested `run_process` call for `node --version` was denied by the unchanged production permission boundary.

The frozen fixture helper verified the exact three paths and SHA-256 values before preparing the non-George workspace. Source composition remained a single initial assembly and no promotion occurred. The bounded artifact schema records the terminal provider-error category but does not retain its diagnostic code/message; that finer failure signature is an Evidence Gap. No raw provider stream was retained.

## Remaining official gates

| Gate | State | Reason |
| --- | --- | --- |
| Fresh Gate A | **Not Run by gate** | Three-file smoke was Not Green |
| Gate B2 | **Not Run by gate** | Gate A was not reached |
| Gate C2 | **Not Run by gate** | B2 was not reached; C2 remains unspent |

Historical turn-context P4/closeout evidence and prior qualification-preflight Gate A/B2 history remain unchanged.

## Bounded JSON and SHA-256

| JSON | SHA-256 |
| --- | --- |
| `evidence/runtime.json` | `81e8eaab8b39c067a6fc9b0aea9a7fdadc8c91c9f26b59846ab6f6b254beb951` |
| `evidence/greeting/attempt.json` | `b8b5e3ff4192cb6c5bad911c4b166fd21001fabf6d33d642931f81a53091f573` |
| `evidence/greeting/trace.json` | `be4ea3a88b20eac2984bb7e2459ab2b125c5e3638825098592184364ac017424` |
| `evidence/three-file/attempt.json` | `eb536899b5b4cac658692b440673b78697aa896d30b2d5270355016b77d88bec` |
| `evidence/three-file/trace.json` | `edaf91604eb3937923ba316a5562060fd220165d6417fc6b59ce022d5ab21f7c` |

Artifacts contain bounded event/type, metrics, state, tool-argument summaries, digests, and runtime controls only. They contain no raw provider stream, full assistant prose, file/write/patch body, unbounded Git snapshot/log, workspace copy, dependency tree, secret, or environment dump.

## P1 result

| Decision | State |
| --- | --- |
| Production Candidate Identity Preserved | **Green** |
| Prior Deterministic Qualification Reused | **Green** |
| Required Fresh Hard Sanity Floor | **Green** |
| Aggregate Broad Suite | **Not Green — retained** |
| Broad Regression Delta Still Applicable | **Green** |
| Loaded Runtime Provenance | **Green** |
| GPU Offload 26 / Controlled Latency | **Evidence Gap / unavailable** |
| Greeting Smoke | **Green** |
| Three-File Inspection Smoke | **Not Green** |
| Fresh Gate A | **Not Run by gate** |
| Gate B2 Greenfield | **Not Run by gate** |
| Gate C2 Existing-App | **Not Run by gate** |
| Overall P1 | **Not Green; stopped at three-file smoke** |

Phase 9 remains open. Phase 10 remains unopened.
