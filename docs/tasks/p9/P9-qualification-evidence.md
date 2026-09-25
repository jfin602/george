# P9 qualification evidence

Status: **DETERMINISTIC QUALIFICATION GREEN; LIVE-WORK / LM STUDIO / NATIVE-TUI EVIDENCE GAPS REMAIN**

Date: 2026-09-25  
Phase: 9 / P9  
Package: `0.9.9`  
Pre-task George HEAD: `ed3e1db503b2d34a90160c30be0fb2e6745e465c`

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
| P4 Phase 8 structured replay | Evidence Gap / preserved Not Green | [`P4-phase8-regression-evidence.md`](P4-phase8-regression-evidence.md) remains unchanged: the historical P8 edit-plus-validation run is Not Green; its frozen structured counterpart has no live LM Studio run. |
| Inherited P2–P8 floors | Green where runnable | Agent loop (10), Phase 5 (1), Phase 6 (1), and the renderer-independent Phase 4 interrupted-resume case (1) passed; parser/state/structured/sandbox replay tests passed. The remaining renderer-dependent Phase 4 fixture shares the Node-24 FFI Evidence Gap above. |
| Live greenfield and existing-app work | Evidence Gap | Neither live stack ran. Network/dependency installation was not user-authorized and LM Studio was unavailable; fixtures and hidden acceptance were not weakened or copied into model workspaces. |

## Runtime controls and live raw dimensions

The required preflight printed `MANUAL CHECK: LM Studio GPU Offload must show 26`. The follow-up `curl -fsS http://127.0.0.1:1234/api/v1/models` failed with connection refused, so no pinned model instance, REST-visible context/batch/parallel/flash/KV/expert settings, model token usage, or UI-only Offload 26 confirmation was observed.

| Dimension | `greenfield-express-v1` v1 | `existing-express-feature-v1` v1 |
| --- | --- | --- |
| George/task/fixture/acceptance | George `0.9.9`; Task Prompt 1; fixture and acceptance v1 | George `0.9.9`; Task Prompt 1; fixture and acceptance v1 |
| Pinned model/provider/runtime/context | Evidence Gap — LM Studio unreachable; Node `v24.21.0` | Evidence Gap — LM Studio unreachable; Node `v24.21.0` |
| Hidden acceptance / required validation | Not run; no model workspace was created | Not run; no model workspace was created |
| Human interventions / defects repaired | No live run; none observed | No live run; none observed |
| Provider rounds / attempts / retries | `0 / 0 / 0` observed | `0 / 0 / 0` observed |
| Tool calls / duplicate or unrequested calls | `0 / 0` observed | `0 / 0` observed |
| Context/profile/tokens / wall time | No provider context or live wall time | No provider context or live wall time |
| Final TaskState ledger | No live task state | No live task state |
| Outside approvals / sandbox events | No live events | No live events |

GPU Offload 26 is unconfirmed, so there is no controlled latency claim. Functional live evidence is also absent because the provider was unavailable. These zeros are stopped-before-execution observations, not passing scores.

## Validation

| Check | Result |
| --- | --- |
| `node --test test/integration/phase9-qualification.test.ts` | Green: 3/3 passed. |
| Focused parser/state/structured/recovery/sandbox/P4 tests | Green: 19/19 passed, including real bwrap containment. |
| Inherited agent-loop/Phase 5/Phase 6 tests | Green: 13 applicable tests passed. |
| Direct full OpenTUI renderer attempt | Evidence Gap: 27 FFI-initialization failures and 27 non-renderer tests passed under unsupported Node 24; retained as visible host evidence, not ignored. |
| `npm run typecheck` | Green. |
| `npm run test:runner` | Green: 90/90 passed. |
| `git diff --check` | Green. |
| Root `package-lock.json` | Green: absent. |

No live result overwrites the P4 or Phase 8 historical failure. No root `package-lock.json` was created.
