# P9 qualification evidence

Status: **DETERMINISTIC FLOORS PARTIALLY GREEN; P4 AND BOTH LIVE-WORK INSTRUMENTS NOT GREEN; NATIVE-TUI EVIDENCE GAP REMAINS**

Date: 2026-09-25  
Phase: 9 / P9  
Package: `0.9.9`  
Pre-task George HEAD: `ed3e1db503b2d34a90160c30be0fb2e6745e465c`

## 2026-09-25 closeout refresh — authoritative current live evidence

Refresh candidate: George `0.9.10`, HEAD `9b031333d3091df37aaab9b2c03175df76101bac`; Node `v26.10.0`, npm `11.19.0`, Linux `7.0.0-31-generic`, Bubblewrap `0.9.0`, clean baseline, and no root lockfile. The exact pinned Qwen model was loaded. REST observed context 32768, eval batch 2048, physical batch 512, parallel 1, Flash Attention on, GPU KV-cache on, and 8 experts. GPU Offload 26 remains UI-only and unconfirmed. `npm run smoke:lm-studio` was Green: one read-only tool cycle in 12.829 s with 409/4 input/output tokens.

| Instrument | State | Actual result |
| --- | --- | --- |
| Phase 8 structured replay | **Not Green** | Required edit remained unchanged; V1 failed; TaskState ended `budget_exhausted` during active correction. 25 calls, 20 provider attempts/rounds, 0 retries, ordinary profile, `63,253 / 1,801` tokens, 344.745 s, 7 approvals, 0 human interventions. |
| `greenfield-express-v1` | **Not Green** | P1 failed before V1. It made 5 calls across 2 rounds (`2,583 / 326` tokens; 42.363 s). The temporary harness then incorrectly installed dependencies and ran P2/P3 despite P1 failure; those executed attempts are retained as invalid/non-qualifying (P2: 22 calls/6 rounds, 157.066 s; P3: 22 calls/6 rounds, 96.594 s). App tests and hidden acceptance failed. No valid stack pass is claimed. |
| `existing-express-feature-v1` | **Not Green** | Deterministic fixture commit `a3969e5f3ef7ef2502ffbaf1315399ce3316267d`; authorized `npm install` passed. P1 failed before validation: 47 calls, 23 rounds, 0 retries, ordinary profile, `49,446 / 1,937` tokens, 449.249 s, 0 approvals/sandbox events/interventions. Baseline `npm test` passed; hidden acceptance failed. |
| Actual Bubblewrap containment | **Green** | Real current-host containment test passed workspace access, outside read/write and symlink denial, secret isolation, network isolation, descendant cleanup, Node/npm/test/typecheck/Git workflows. |
| Native OpenTUI | **Evidence Gap** | Node 26 is available, but this execution has neither stdin nor stdout TTY; no native behavior was simulated. |

The full bounded machine-readable evidence is [`live-results.json`](../../../artifacts/phase9-live-qualification-20260925T133841Z/live-results.json); the environment and human-readable summary are in the same Git-ignored artifact directory. No raw provider payloads, secrets, or hidden acceptance source were recorded.

## Frozen instruments

| Instrument | Frozen contract | Model-visible initial workspace | Hidden acceptance | Prerequisite/policy |
| --- | --- | --- | --- | --- |
| `greenfield-express-v1` v1 | [`P1-scaffold.task.txt`](../../../test/fixtures/p9-live-work/greenfield-express-v1/P1-scaffold.task.txt), [`P2-api.task.txt`](../../../test/fixtures/p9-live-work/greenfield-express-v1/P2-api.task.txt), [`P3-tests-docs-closeout.task.txt`](../../../test/fixtures/p9-live-work/greenfield-express-v1/P3-tests-docs-closeout.task.txt); Task Prompt format 1; task-stack SHA-256 `c0ea964cc58423ff4646e93135a5e6766bd58dc6379f284219e3856745919063` | New clean Git repository, no dependencies or lockfile. | [`greenfield-express-v1.test.mjs`](../../../test/acceptance/p9-live-work/greenfield-express-v1.test.mjs), version 1; never copied into the workspace. | Explicit user-approved network access and `npm install express@5.1.0`; otherwise Evidence Gap. |
| `existing-express-feature-v1` v1 | [`P1-tag-feature.task.txt`](../../../test/fixtures/p9-live-work/existing-express-feature-v1/P1-tag-feature.task.txt); Task Prompt format 1; fixture-source SHA-256 `45856b10bfe4ff3f14e1893da22b9a88b1c3334d3923d2417aee0c09e94a5aba` | [`base/`](../../../test/fixtures/p9-live-work/existing-express-feature-v1/base) is initialized and committed with fixed author, committer, timestamp, and message; the qualification creates the same clean commit twice and asserts identical SHA. | [`existing-express-feature-v1.test.mjs`](../../../test/acceptance/p9-live-work/existing-express-feature-v1.test.mjs), version 1; outside the copied workspace. | Explicit user-approved network access and `npm install`; otherwise Evidence Gap. |

The integration guard verifies the frozen digests, valid task stacks, clean deterministic existing-app baseline, and acceptance-suite isolation. It also verifies the restricted policy intersection, durable TaskState round-trip, bounded current-work slice, and safe Task projection. The persistence probe found and fixed one defect: state clones left an own `currentWorkUnit: undefined` property that strict durable-state parsing rejected. `clone` now omits absent optional fields; the new round-trip assertion is its regression guard.

## Layer truth

| Layer | State | Observed evidence |
| --- | --- | --- |
| Task parser, TaskState, validation/correction, bounded slicing, persistence/resume | Green | `node --test test/integration/phase9-qualification.test.ts` — 3/3 passed; focused structured/task tests — 16 applicable tests passed. |
| Transcript/Task deterministic projection | Green | The Phase 9 integration test renders `taskHeader`/`renderTask` from persisted TaskState without provider or process bodies. |
| Full OpenTUI renderer and native TUI | Evidence Gap | Host is Node `v24.21.0`, stdin/stdout are not TTYs, and Node rejects `--experimental-ffi`. Direct `test/unit/tui/app.test.ts` ran 54 tests: 27 passed and 27 failed before behavior because OpenTUI FFI is unavailable. This is also recorded in [`P6-tui-native-evidence.md`](P6-tui-native-evidence.md). It is not native Green. |
| Workspace Autonomous policy; outside reject/ask | Green | `test/integration/agent-loop.test.ts` passed, including autonomous inside writes and rejected/exact-call outside access. Task expectations remain intersected with the configured user ceiling. |
| Autonomous process containment | Green | Bubblewrap `0.9.0` was available; real containment tests passed: workspace operation, outside read/write denial, symlink denial, secret isolation, network isolation, descendant timeout cleanup, Node/npm/test/typecheck/Git workflows. This is real bwrap evidence, not a mock command test. |
| P4 Phase 8 structured replay | Not Green / preserved Not Green | The historical P8 edit-plus-validation run remains Not Green; the frozen Phase 9 counterpart also executed Not Green. |
| Inherited P2–P8 floors | Green where runnable | Agent loop (10), Phase 5 (1), Phase 6 (1), and the renderer-independent Phase 4 interrupted-resume case (1) passed; parser/state/structured/sandbox replay tests passed. The remaining renderer-dependent Phase 4 fixture shares the Node-24 FFI Evidence Gap above. |
| Live greenfield and existing-app work | Not Green | Both ran with explicit authorized dependency installation and pinned Qwen. Neither completed required validation/acceptance; greenfield also has a retained harness sequencing defect after its P1 failure. |

## Runtime controls and live raw dimensions

The required preflight printed `MANUAL CHECK: LM Studio GPU Offload must show 26`. This refresh reached the pinned loaded instance and captured the REST-visible values above; Offload 26 remains unconfirmed because it is UI-only.

| Dimension | `greenfield-express-v1` v1 | `existing-express-feature-v1` v1 |
| --- | --- | --- |
| George/task/fixture/acceptance | George `0.9.10`; Task Prompt 1; fixture/acceptance v1; no valid stack pass | George `0.9.10`; Task Prompt 1; fixture/acceptance v1; hidden acceptance failed |
| Pinned model/provider/runtime/context | Loaded pinned Qwen; Node `v26.10.0`; ordinary adaptive profile | Same loaded pinned Qwen/Node/profile |
| Hidden acceptance / required validation | Acceptance failed; P1 V1 and later required validation remained unexecuted | Acceptance failed; V1/V2 remained unexecuted |
| Human interventions / defects repaired | 0; temporary harness incorrectly continued P2/P3 after P1 failure | 0 |
| Provider rounds / attempts / retries | P1 `2 / 2 / 0`; P2 `6 / 6 / 0`; P3 `6 / 6 / 0` | `23 / 23 / 0` |
| Tool calls / duplicate or unrequested calls | P1/P2/P3 `5 / 22 / 22`; repeated calls observed | `47`; repeated calls observed |
| Context/profile/tokens / wall time | ordinary; `2,583 / 326`, `8,232 / 1,218`, `7,107 / 832`; `42.363`, `157.066`, `96.594 s` | ordinary; `49,446 / 1,937`; `449.249 s` |
| Final TaskState ledger | P1/P2 failed; P3 budget exhausted; no validation pass | failed; W1 addressed, W2 active; V1/V2 pending |
| Outside approvals / sandbox events | `0 / 0` | `0 / 0` |

GPU Offload 26 is unconfirmed, so there is no controlled latency claim. Functional live evidence is present and Not Green; the figures above are raw observations, not passing scores.

## Validation

| Check | Result |
| --- | --- |
| `node --test test/integration/phase9-qualification.test.ts` | Green: 3/3 passed. |
| Focused parser/state/structured/recovery/sandbox/P4 tests | Green: 19/19 passed, including real bwrap containment. |
| Inherited agent-loop/Phase 5/Phase 6 tests | Green: 13 applicable tests passed. |
| Direct full OpenTUI renderer attempt | Evidence Gap: 27 FFI-initialization failures and 27 non-renderer tests passed under unsupported Node 24; retained as visible host evidence, not ignored. |
| `npm run typecheck` | Green. |
| `npm run test:runner` | Green: 90/90 passed. |
| `npm test` | Not Green: 337/345 passed; 7 OpenTUI test-renderer failures. |
| `git diff --check` | Green. |
| Root `package-lock.json` | Green: absent. |

No live result overwrites the P4 or Phase 8 historical failure. No root `package-lock.json` was created.
