# Phase 9 Closeout — Structured Task Execution + Workspace Autonomy

Status: **EVIDENCE-ONLY CLOSEOUT — OWNER ACCEPTANCE NOT GRANTED; LIVE QUALIFICATION NOT GREEN**

Date: 2026-09-25  
Package boundary: `0.9.10`  
Exact implementation/qualification candidate before this closeout boundary: `9d22d74b7f1e9b2d68a45439e90b6c3410a0442f` (`Implemented Phase 9 qualification at 0.9.9.`)  
Qualification artifact: [`P9-qualification-evidence.md`](tasks/p9/P9-qualification-evidence.md)  
Mandatory longitudinal replay artifact: [`P4-phase8-regression-evidence.md`](tasks/p9/P4-phase8-regression-evidence.md)

This record audits the existing P1–P9 candidate and records observed evidence. It does not repair code, retune context/runtime, open Phase 10, alter Phase 9 planning history, or constitute owner acceptance.

## Post-closeout correction refresh — current Phase 9 state

This document's original P1-P9 candidate audit and the 2026-09-25 live closeout refresh remain historical evidence. Later Phase 9 corrections do not rewrite those failures.

Current package remains `0.9.10`; Phase 9 is still open and has not received owner acceptance.

The subsequent correction chain materially narrowed and then qualified the core structured edit path:

1. **`c9-structured-task-convergence`** — qualified production stack authority and bounded stage evidence/budget/convergence behavior.
2. **`c9-qwen-workunit-convergence`** — qualified full-file `read_file.sha256` -> safe existing-file mutation preconditions and typed live tracing.
3. **`c9-inspection-execution`** — qualified mandatory first-round structured INSPECT tool execution and exception-safe attempt retention.
4. **`c9-inspection-stage-completion`** — qualified application-owned INSPECT completion after one successful tool round.
5. **`c9-text-file-edit-fidelity`** — qualified full-file text-framing evidence and recoverable framing-preservation guards.
6. **`c9-mutation-intent-authority`** — qualified model-intent/approval separation and a fair frozen-edit approval envelope. The exact frozen Gate A is now **Green**: Qwen selected an ordinary same-target `apply_patch`, produced the required 60-byte file, George-owned V1 passed, TaskState completed/verified, hidden acceptance passed, there was zero human coding intervention, and no stage/task/run-budget exhaustion occurred.

After Gate A Green, the current `greenfield-express-v1` Gate B remained **Not Green**, but for a qualification-instrument authoring defect rather than a newly observed production-loop defect. Its P1 encodes preflight repository inspection as an ordinary workflow unit (`W1 — Inspect the clean repository`) instead of using the dedicated top-level `INSPECT` phase. Qwen therefore continued read-only implementation-stage work until the structured duplicate/no-progress guard correctly terminated the stage. No mutation or validation ran.

Audit of the v1 instruments found the same semantic drift elsewhere:
- greenfield P2 and P3 contain top-level `INSPECT` plus redundant workflow units named as inspection;
- greenfield P3 contains `W3 — Validate and report` even though George-owned validation executes after workflow units, so that work unit cannot truthfully own exact validation results;
- existing-app v1 likewise duplicates top-level `INSPECT` with `W1 — Inspect frozen baseline`, and its completion-reporting requirement mixes model work with George-owned post-validation evidence.

The v1 instruments and their Not Green outcomes remain immutable evidence. Phase 9 will not teach George to infer stage semantics from titles such as `Inspect`, `Validate`, or `Report`. Instead, structural instrument fixes are versioned as v2 qualification instruments that use top-level `INSPECT` for preflight observation and reserve `WORKFLOW` for actual task progression.

Final Phase 9 qualification from here:
- Gate A: inherited Green from `c9-mutation-intent-authority`; do not respent it unless production execution behavior changes;
- Gate B2: one official `greenfield-express-v2` attempt;
- Gate C2: one official `existing-express-feature-v2` attempt only after B2 Green;
- Phase 9 is ready for owner closeout only after B2 and C2 are Green and no new blocking regression appears.

Correction evidence:
- [`c9-structured-task-convergence`](tasks/c9-structured-task-convergence/closeout.md);
- [`c9-qwen-workunit-convergence`](tasks/c9-qwen-workunit-convergence/closeout.md);
- [`c9-inspection-execution`](tasks/c9-inspection-execution/closeout.md);
- [`c9-inspection-stage-completion`](tasks/c9-inspection-stage-completion/closeout.md);
- [`c9-text-file-edit-fidelity`](tasks/c9-text-file-edit-fidelity/closeout.md);
- [`c9-mutation-intent-authority`](tasks/c9-mutation-intent-authority/closeout.md).

Phase 10 remains gated on Phase 9 owner closeout.

## 2026-09-25 live closeout refresh

The refresh ran on clean HEAD `9b031333d3091df37aaab9b2c03175df76101bac`, package `0.9.10`, Node `v26.10.0`, npm `11.19.0`, Linux `7.0.0-31-generic`, and Bubblewrap `0.9.0`. The exact pinned Qwen instance was loaded with the expected REST-visible context/batch/parallel/Flash Attention/GPU-KV/expert controls. GPU Offload 26 remains UI-only and unconfirmed. The bounded LM Studio smoke was Green.

Live qualification is **Not Green**. The P4 structured replay left the required label repair unchanged, observed a failed validation, and ended `budget_exhausted` in active correction (25 calls; 20 rounds; 344.745 s; `63,253 / 1,801` reported tokens). The historical Phase 8 failure remains independently Not Green.

Both frozen live-work instruments were exercised and are **Not Green**. Greenfield P1 failed before validation; a temporary-harness sequencing defect then ran P2/P3 after that failure, so those preserved attempts are non-qualifying and no stack result is claimed. Existing-app P1 failed before required validation; baseline tests passed independently, but hidden acceptance failed. Neither run had human intervention. See [`P9-qualification-evidence.md`](tasks/p9/P9-qualification-evidence.md) for raw dimensions and [`live-results.json`](../artifacts/phase9-live-qualification-20260925T133841Z/live-results.json) for bounded records.

Current deterministic results are mixed: typecheck, runner, Phase 9 integration, P4 deterministic replay, sandbox tests, and real Bubblewrap containment are Green; full `npm test` is **Not Green** with 337/345 passing and seven OpenTUI test-renderer failures. Native TUI remains an Evidence Gap because this host has no real TTY. No owner acceptance or Phase 10 transition follows.

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

The frozen `greenfield-express-v1` and `existing-express-feature-v1` Task Prompt v1 instruments, fixture digests/baseline, and hidden acceptance isolation are Green deterministically. Both live instruments then ran with explicit authorized dependency installation and are Not Green as recorded in the refresh.

| Area | State | Evidence |
| --- | --- | --- |
| Transcript/Task deterministic projection | Green | `test/integration/phase9-qualification.test.ts`; persisted TaskState renders header/task projection without provider/process payloads. |
| Native Node-26 real-TTY/OpenTUI behavior | Evidence Gap | `P6-tui-native-evidence.md`; unsupported Node 24/no TTY/FFI host cannot establish native behavior. |
| Frozen greenfield and existing-app instruments + hidden acceptance isolation | Green, deterministic only | `test/integration/phase9-qualification.test.ts`; frozen fixture/task/acceptance digests recorded in P9 evidence. |
| `greenfield-express-v1` live execution and acceptance | Not Green | P1 failed; P2/P3 are preserved non-qualifying attempts after the temporary harness sequencing defect; acceptance failed. |
| `existing-express-feature-v1` live execution and acceptance | Not Green | P1 failed before validation and hidden acceptance failed. |

## Phase 8 replay and inherited contracts

The historical Phase 8 P5 `agentic-edit-validation-2048-001` is preserved as **Not Green**. Its Phase 9 structured counterpart also ran Not Green: the required edit remained absent, V1 failed, and the task exhausted correction. Neither result is relabeled or erased, and no claim is made that context size caused the failure.

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
| Phase 9 P4 | Not Green | Live structured replay executed but left the repair absent, failed V1, and exhausted active correction. Historical Phase 8 result remains independently Not Green. |
| Phase 9 TUI | Evidence Gap | No supported Node-26 real-TTY/OpenTUI qualification. |
| Phase 9 live-work | Not Green | Both instruments executed with provider/network-authorized setup but did not complete validation/acceptance; greenfield's later attempts are non-qualifying after its harness defect. |
| Phase 9 controlled latency/runtime control | Evidence Gap | REST runtime controls were observed but UI-only GPU Offload 26 remains unconfirmed; no controlled comparison is claimed. |

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
