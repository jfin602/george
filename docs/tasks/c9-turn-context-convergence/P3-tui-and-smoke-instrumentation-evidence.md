# c9 turn context convergence P3 TUI and smoke instrumentation evidence

Status: **GREEN — ORDINARY TUI BASE-AGENT WIRING AND LIVE-SMOKE SUPPORT QUALIFIED**

Date: 2026-09-26

Pre-task HEAD: `13ff0bb79e49f4995c38d3aac7ae2d186cbe62b9`

Package: `0.9.10` (unchanged)

P3 replaces the production TUI's indirect `CodingWorkflowApplicationService.agent` construction with the canonical base `AgentLoopApplicationService`. The same base agent and `LocalSessionStore` are passed to `StructuredTaskApplicationService`; resumed sessions are recovered and saved before the renderer is created. Explicit coding-workflow construction remains unchanged.

## Deterministic wiring evidence

The production composition test proves:

- ordinary `hi` makes exactly one scripted provider request and commits one direct response;
- ordinary provider instructions exclude `CODING_WORKFLOW_GUIDANCE`;
- explicit `createCodingWorkflowApplicationService` instructions retain that guidance;
- ordinary requests still advertise `read_file`, `list_directory`, `search_text`, `git_status`, `git_diff`, `write_file`, `apply_patch`, `create_directory`, and `run_process`;
- a Task Prompt v1 submission remains available through the same structured service and receives the coding tool surface;
- fixed context configuration, standard approval dispatch, and cancellation-before-provider behavior are preserved;
- ordinary persistence reopens with the committed response;
- a resumed interrupted directory mutation is reconciled and saved before first use without a provider request.

No semantic chat/coding classifier was added. No agent-loop business logic moved into the TUI layer.

## Ordinary-turn qualification support

`runOrdinaryTurnQualification` reuses the existing live-work event bounds, sanitization, trace schema, and artifact writer. Its bounded trace adds only:

- successful `read_file` path identities;
- final assistant response presence, UTF-8 byte count, and SHA-256.

Assistant prose, provider deltas, file bodies, raw provider streams, and unrestricted tool results are not written as evidence. Deterministic acceptance helpers classify the greeting and three-file shapes from provider rounds, model-requested tools, terminal state, exhaustion evidence, intervention count, response evidence, successful read identities, and adjacent monotonic envelope promotions.

## Frozen three-file fixture

Fixture root: `test/fixtures/c9-turn-context-convergence/three-file-inspection`

The preparation helper verifies the exact names and hashes before copying the files into an empty temporary workspace and initializes a non-George Git repository through an argument-array process call. It does not create a commit.

| File | Bytes | SHA-256 |
| --- | ---: | --- |
| `README.md` | 4,108 | `4e3a3f35fa75c7f421809af3c209673de887a043e1107db16c5daf14908e1abb` |
| `plan.js` | 5,571 | `2f15fd8d0ac3ed9f1c2e22d8f4561fd29444f018e07540ad2ac24aeb3d9968fb` |
| `plan.test.js` | 5,253 | `ced5709631a0014008b505029415cb93e1a0fa5527590467d67891a9aa1f270f` |

The exported P4 prompt asks Qwen to inspect what it needs and explain `compileReleasePlan`; it does not state a maximum file count. This fixture is separate from and does not change either v1/v2 Phase 9 live-work instrument.

## Validation

Supported validation runtime: Node `v26.10.0`; npm `11.19.1`.

| Command / scope | Result |
| --- | --- |
| New TUI composition and qualification/live-work tests | **Green: 12/12 passed** |
| Fixture focused tests | **Green: 8/8 passed** |
| Provider/tool/registry; context/profile/one-turn; mutation/recovery/coding workflow; diagnostics/session/run-budget; Phase 4/5/9 integration; frozen Phase 8/Gate A replay; qualification/live-work; v1/v2 immutability | **Green: 208/208 passed** |
| `npm run typecheck` | **Green** |
| `npm run test:runner` | **Green: 90/90 passed** |
| `npm run test:tui` characterization | **Not Green: 31 passed, 6 failed, 1 skipped, 38 total** |
| Broad `npm test` characterization | **Not Green: 401 passed, 4 failed, 1 skipped, 406 total** |
| `git diff --check` | **Green** |

The broad failures are the retained OpenTUI renderer identities for streamed-answer rendering, inactive-task text rendering, progressive reveal timing, and draft-preservation rendering. The isolated TUI run additionally observed timing failures in thinking-timer cleanup and approval rendering; both passed in the broad run. The native real-TTY case remained skipped. These aggregate renderer results are characterization only and are not relabeled Green or repaired in P3.

## Changed files

Production:

- `src/tui/main.ts`
- `src/tui/composition.ts`
- `src/qualification/live-work.ts`

Tests and fixture:

- `test/unit/tui/composition.test.ts`
- `test/unit/qualification/live-work.test.ts`
- `test/fixtures/c9-turn-context-convergence/three-file-inspection/{README.md,plan.js,plan.test.js}`

Evidence:

- `docs/tasks/c9-turn-context-convergence/P3-tui-and-smoke-instrumentation-evidence.md`

## Integrity and deferred live work

- `package.json` remains exactly `0.9.10`.
- No root lockfile exists.
- No v1/v2 instrument, acceptance, metadata, historical attempt, or hidden fixture changed.
- No official greeting smoke or three-file smoke ran.
- Gate A, Gate B2, and Gate C2 did not run.
- No v3 instrument was created.
- Profiles/runtime were not retuned.
- Phase 9 was not owner-closed and Phase 10 was not opened.
