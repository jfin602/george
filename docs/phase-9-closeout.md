# Phase 9 Closeout — Structured Task Execution + Workspace Autonomy

Status: **EVIDENCE-ONLY CLOSEOUT — OWNER ACCEPTANCE NOT GRANTED**

Date: 2026-09-25  
Package boundary: `0.9.10`  
Exact implementation/qualification candidate before this closeout boundary: `9d22d74b7f1e9b2d68a45439e90b6c3410a0442f` (`Implemented Phase 9 qualification at 0.9.9.`)  
Qualification artifact: [`P9-qualification-evidence.md`](tasks/p9/P9-qualification-evidence.md)  
Mandatory longitudinal replay artifact: [`P4-phase8-regression-evidence.md`](tasks/p9/P4-phase8-regression-evidence.md)

This record audits the existing P1–P9 candidate and records observed evidence. It does not repair code, retune context/runtime, open Phase 10, alter Phase 9 planning history, or constitute owner acceptance.

## Candidate and deterministic qualification

The candidate implements Task Prompt v1 parsing and fail-closed diagnostics in `src/tasks/parser.ts`; canonical TaskState, validation/correction truth, and bounded projections in `src/tasks/state.ts`; strict durable session parsing and TaskState persistence in `src/core/session-store.ts`; and provider-independent structured orchestration in `src/application/structured-task.ts`.

The observed architecture boundary is preserved: the complete TaskState is durable George authority, while `projectStructuredTaskSlice` sends a bounded current-work-unit view. The structured service records inspection from actual tool events, blocks unavailable required `READ FIRST` sources, runs literal validation through George, retains failed validation attempts across correction, bounds correction cycles, and converts ambiguous recovery into `planning_needed` rather than replaying it.

Task Prompt v1 treats the marker as mandatory structured parsing; malformed marked inputs reject before provider/tool execution, while unmarked input remains ordinary conversation. The parser/test qualification covers invalid sections and IDs, references/cycles, `KIND`, validation forms, and permission values.

| Area | State | Evidence |
| --- | --- | --- |
| Prompt v1 parser and fail-closed behavior | Green | `test/unit/tasks/parser.test.ts`; Phase 9 integration qualification. |
| TaskState authority, validation/correction/stack/resume truth | Green | `test/unit/tasks/state.test.ts`, `test/unit/application/structured-task.test.ts`, durable round-trip in Phase 9 integration. |
| Persistence schema/migration boundary | Green | `src/core/session-store.ts` strictly reparses serialized task definitions/states; the `currentWorkUnit: undefined` persistence defect is guarded by the round-trip assertion in `test/integration/phase9-qualification.test.ts`. |
| Bounded provider slices, `READ FIRST`, `INSPECT`, and work-unit orchestration | Green | `src/application/structured-task.ts`; parser/state/structured/replay/integration qualification. |
| Validation, correction, stack, and recovery safety | Green where deterministically runnable | Failed attempts remain durable; correction is bounded; completion requires observed passing validation; ambiguous recovery blocks planning. |

## Policy and containment

The effective execution policy intersects prompt expectations with the configured user ceiling. Standard mode remains approval-based. Workspace Autonomous auto-permits only qualified workspace-native operations; outside-workspace access is exactly `reject` (deny without prompting) or `ask` (one bounded resource/action approval). An approved outside capability remains separate from the canonical workspace resolver. Network, remote mutation, browser interaction, and credentials/environment policy remain independent. The legacy host `run_process` path remains separately non-sandboxed and approval-required.

Bubblewrap is a distinct autonomous-process backend. Its deterministic command/fail-closed construction alone is not containment proof; this host also has real containment qualification recorded in P9: allowed workspace execution, outside read/write and symlink denial, secret isolation, network isolation, descendant timeout cleanup, and representative Node/npm/test/typecheck/Git workflows. Bubblewrap was observed as `0.9.0` in that qualification.

| Area | State | Evidence |
| --- | --- | --- |
| Standard/autonomous policy and task-permission intersection | Green | `test/integration/agent-loop.test.ts`; Phase 9 integration qualification. |
| Outside `reject` / exact scoped `ask` | Green | Integration evidence records deny-without-prompt and exact-call outside access; no broad workspace grant. |
| Host-process fallback truth | Green | Existing host executor remains non-sandboxed/approval-required; autonomous process selection is distinct and fails closed when unavailable. |
| bwrap command construction/fail-closed path | Green | `src/tools/sandbox-process.ts`, `test/unit/tools/sandbox-process.test.ts`. |
| Actual OS containment | Green | Real Bubblewrap containment cases recorded in P9 qualification; this is not mock-only evidence. |

## Transcript, Task, and live-work evidence

Transcript/Task presentation is a projection of application state: `renderTask` and `taskHeader` render deterministic TaskState data, and do not become TaskState authority. Deterministic projection evidence is Green. Full OpenTUI/native interaction is not Green: the qualification host was Node `v24.21.0`, stdin/stdout were not TTYs, and `--experimental-ffi` was rejected. The direct renderer attempt had 27 FFI initialization failures and 27 non-renderer passes. Node 26 real-TTY evidence remains an Evidence Gap.

The frozen `greenfield-express-v1` and `existing-express-feature-v1` Task Prompt v1 instruments, fixture digests/baseline, and hidden acceptance isolation are Green deterministically. Neither live instrument ran: LM Studio was unavailable and network/dependency installation was not user-authorized. Their raw live dimensions are therefore recorded as stopped-before-execution zeros, not a score or a pass.

| Area | State | Evidence |
| --- | --- | --- |
| Transcript/Task deterministic projection | Green | `test/integration/phase9-qualification.test.ts`; persisted TaskState renders header/task projection without provider/process payloads. |
| Native Node-26 real-TTY/OpenTUI behavior | Evidence Gap | `P6-tui-native-evidence.md`; unsupported Node 24/no TTY/FFI host cannot establish native behavior. |
| Frozen greenfield and existing-app instruments + hidden acceptance isolation | Green, deterministic only | `test/integration/phase9-qualification.test.ts`; frozen fixture/task/acceptance digests recorded in P9 evidence. |
| `greenfield-express-v1` live execution and acceptance | Evidence Gap | No LM Studio/provider or authorized network installation; no model workspace or acceptance run. |
| `existing-express-feature-v1` live execution and acceptance | Evidence Gap | Same unavailable provider/unauthorized network condition; no model workspace or acceptance run. |

## Phase 8 replay and inherited contracts

The historical Phase 8 P5 `agentic-edit-validation-2048-001` is preserved as **Not Green**: the required edit was not produced; one validation ran but did not match; ten calls included unrequested/repeated behavior; and seven provider attempts/rounds were observed. Phase 9's frozen structured counterpart is deterministic Green only. Its live replay is an **Evidence Gap** because LM Studio was unreachable before execution. Neither result is relabeled or erased, and no claim is made that context size caused the P8 failure.

The current ordinary/medium/large context profiles remain provisional inherited operating policy, not empirically optimal agentic envelopes. Phase 3 context/source integrity, Phase 5 recovery/replay safety, Phase 6 external-effect boundaries, and Phase 8 P7 continuation-pressure safety remain deterministic regression floors; applicable renderer-independent P2–P8 coverage passed in P9 qualification. This closeout makes no new live provider, context-envelope, or performance claim.

## Remaining Not Green and Evidence Gaps

The following are retained explicitly, including inherited owner-accepted historical truth:

| Scope | State | Remaining evidence condition |
| --- | --- | --- |
| Phase 1–4 | Evidence Gap | Native-terminal/live-model evidence accepted historically; not recreated here. |
| Phase 5 | Evidence Gap / Not Green | Native-terminal evidence gap and live LM Studio/Qwen Not Green remain historical truth. |
| Phase 6 | Evidence Gap | Live Parallel/GitHub/MCP/Chrome and native-terminal qualification remain absent. |
| Phase 7 | Not Green | Final restored-runtime verification remains Not Green; only the separate `parallel=1` warm control was Green. |
| Phase 8 | Not Green | P5 edit-plus-validation failed; no healthy all-family agentic envelope was established. |
| Phase 8 | Evidence Gap | No healthy/risk boundary or confirmation repetitions; Offload 26 unconfirmed; comparable latency incomplete; no correction-time Node-26 real-TTY; no adaptive-envelope-specific fail/degrade threshold. |
| Phase 9 P4 | Evidence Gap | No live structured replay; LM Studio unavailable. Historical Phase 8 result remains Not Green. |
| Phase 9 TUI | Evidence Gap | No supported Node-26 real-TTY/OpenTUI qualification. |
| Phase 9 live-work | Evidence Gap | Both frozen live stacks lack provider/network-authorized execution, hidden acceptance, raw provider/tool/context/time evidence, TaskState ledger, and live sandbox/permission events. |
| Phase 9 controlled latency/runtime control | Evidence Gap | LM Studio was unreachable and UI-only GPU Offload 26 was not observed. |

## Closeout validation and hygiene

The following commands were observed against package `0.9.10`:

| Command | Result |
| --- | --- |
| `npm run typecheck` | Green. |
| `npm run test:runner` | Green: 90/90 passed. |
| `node --test test/integration/phase9-qualification.test.ts` | Green: 3/3 passed. |
| `git diff --check` | Green. |
| Root `package-lock.json` | Green: absent after validation. |

No owner closeout or Phase 10 transition follows from this record.
