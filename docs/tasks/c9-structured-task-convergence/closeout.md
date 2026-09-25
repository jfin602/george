# c9 structured task convergence correction closeout

Status: **IMPLEMENTATION COMPLETE; CONVERGENCE NOT QUALIFIED; PRODUCTION STACK BOUNDARY QUALIFIED DETERMINISTICALLY; OVERALL CORRECTION NOT QUALIFIED**

Date: 2026-09-25

Package: `0.9.10` (unchanged)

Pre-task HEAD and implementation candidate inspected: `e919036dfdae96cc044cf9b1352e0a5d47ec4a23`

P4 production-stack candidate: `a5bdd41387b2ad3c0e7a388955c6f5c44725ecb6`

Live evidence: [`P5-live-evidence.md`](P5-live-evidence.md)

This is an evidence-only correction closeout. It does not repair implementation, rerun a live workload, change limits, rewrite historical evidence, owner-close Phase 9, or open Phase 10.

## Decision

| Decision | Result | Basis |
| --- | --- | --- |
| Implementation Complete | **Yes** | P1 diagnosed the defect set; P2-P4 implemented the planned convergence and production-stack boundaries; exact current source and focused deterministic tests contain each requested behavior and regression guard. |
| Convergence Correction Qualified | **No** | Deterministic correction tests are Green, but the one permitted Gate A attempt was Not Green: the exact edit was absent. Its calls, rounds, tokens, time, George-owned V1 result, and final TaskState are Evidence Gaps, so the `<=10` call and `<=10` round criteria were not established. |
| Production Stack Boundary Qualified | **Yes** | Deterministic full-stack validation, strict ordering, fail-stop, TaskState history, persistence/reopen, no-replay resume, projection, runner delegation, and hidden-acceptance isolation are Green. Gate A did not permit Gate B, so no Gate B result is claimed. |
| Overall c9 Correction Qualified | **No** | The required convergence qualification is Not Green. Deterministic production-stack correctness does not waive Gate A or establish Phase 9 end-to-end usefulness. |

## Convergence diagnosis closeout

P1 established the following source/evidence discontinuities and convergence defects before production repair:

1. Successful inspection tool results existed in the inspection continuation, but the isolated implementation stage received only an inspection item/source marker.
2. Workflow validation evidence retained bounded stdout, stderr, and normalized error data, but TaskState and the isolated correction slice retained only status/exit metadata.
3. Each nested inspection, implementation, validation, discovery, and correction run could create a fresh run budget instead of consuming one task-wide budget.
4. A literal, already-resolved validation command spent a provider round that made no model decision before George executed it.
5. Structured stages inherited the broad ordinary `32` call / `32` round ceilings and had no exact unchanged replay-safe local-read/no-progress guard.
6. The first Phase 9 P4 replay exposed repeated/unrequested work and ended Not Green at 25 calls and 20 rounds. The first greenfield harness continued P2/P3 after P1 failed. The existing-app attempt made 47 calls over 23 rounds and failed before validation.
7. The greenfield sequencing failure exposed a production contract gap, not only a temporary harness defect: `validateTaskStack()` had no production caller or executor, and the single-task service did not own cross-task durable progression.

P1's executable diagnostic guard and evidence remain the authority for these pre-correction facts. The preserved Phase 8 and first Phase 9 failures remain Not Green and are not rewritten by this closeout.

## Convergence implementation audit

Exact current source implements the planned correction without changing ordinary chat semantics:

| Boundary | Current implementation | Deterministic evidence |
| --- | --- | --- |
| Inspection handoff | `StructuredTaskApplicationService` projects allowlisted successful local-read results, sanitizes and bounds each item, caps the stage projection at 8 items / 8 KiB, supplies it only to the dependent implementation stage, clears it after mutation, and re-inspects after reopen rather than durably storing raw bodies. | Bounded handoff, mutation invalidation, and reopen/re-inspection tests are Green. |
| Validation diagnostics | Task validation attempts durably retain sanitized bounded stdout/stderr/error and truncation/redaction markers; the correction slice includes only the relevant failed attempt. | Failure/correction and session round-trip tests are Green. |
| Task-wide budget | One caller-supplied or newly created `RunBudget` is threaded through inspection, implementation, DISCOVER, direct validation, and correction; the coding workflow honors supplied budgets. | Shared-budget and direct-validation budget-exhaustion tests are Green. |
| Literal validation | `CodingWorkflowApplicationService.validate()` executes the resolved process through the canonical process, policy, approval, event, recovery, and budget path without running the provider. DISCOVER retains one bounded provider decision. | Direct-validation and DISCOVER tests are Green. |
| Structured ceilings | Inspection is capped at 6 rounds / 4 calls, implementation at 10 / 8, correction at 8 / 6, and DISCOVER at one provider completion. Submission limits can reduce but cannot raise service ceilings. | Structured ceiling and general limit-reduction tests are Green. |
| Exact no-progress guard | Structured submissions fingerprint validated replay-safe local reads by tool plus normalized arguments, suppress an exact repeat in the same mutation epoch, advance the epoch after a successful workspace mutation, and terminate after the bounded duplicate count. | Duplicate suppression, exhaustion, and mutation-epoch tests are Green. |
| Ordinary non-regression | The stage limits and duplicate guard are opt-in submission reductions. Ordinary workflow calls still use their established budgets and loop behavior. | Ordinary workflow budget and ordinary-loop comparison tests are Green. |

No deterministic regression was observed in the implemented convergence boundary. This establishes implementation completeness, not live convergence qualification.

## Production stack boundary audit

P4 closes the product gap found by P1:

- `StackState` is canonical, bounded, fingerprinted, session/workspace-bound state containing ordered per-task `TaskState` records, current/completed task identity, terminal outcome, blocker summary, and effective permission projection.
- the session schema persists and strictly reparses StackState while retaining legacy taskless and single-task session compatibility;
- `StructuredTaskStackApplicationService` parses and validates every definition and the complete stack before provider or tool work;
- execution advances only in strict ordinal order through the production single-task structured service;
- the first non-completed task makes the stack terminal and leaves later tasks pending;
- completed and failing per-task TaskState, including validation history, remains in StackState;
- reopen skips completed tasks, resumes at the next task, and refuses interrupted work until Phase 5 reconciliation instead of blindly replaying it;
- the application-owned projection exposes bounded stack/task/current-work/terminal state to the existing Task view and header;
- `runLiveWorkInstrument()` delegates stack execution to the production stack service and runs hidden acceptance only after stack state is `completed`.

The deterministic fail-stop regression proves a failing P1 produces zero P2/P3 provider calls. The durable-resume regression proves a completed P1 and its V1 history survive reopen and only P2/P3 invoke the provider. Separate runner tests prove hidden acceptance stays outside the model-visible workspace, is not invoked after stack failure, and the frozen greenfield P1/P2/P3 prompts are passed together to the production stack boundary.

This boundary is **Qualified, deterministic**. Gate B live usefulness was not eligible to run and is not inferred from these tests.

## Qualification evidence

### Deterministic correction floor

Observed for this closeout:

| Check | Result |
| --- | --- |
| Focused c9 convergence, Phase 8 replay, stack, live-runner, task-state, session-store, recovery, coding-workflow, and agent-loop suite | **Green: 85/85 passed.** |
| `node --test test/integration/phase9-qualification.test.ts` | **Green: 3/3 passed** within the focused run and again standalone. |
| `npm run typecheck` | **Green.** |
| `npm run test:runner` | **Green: 90/90 passed.** |
| Package version | **Green: exactly `0.9.10`.** |
| Root `package-lock.json` | **Green: absent.** |
| `git diff --check` | **Green.** |

### Live gates

Gate A received exactly one official P5 attempt and was **Not Green**. The recovered fixture remained:

```js
export const label = (value) => value.trim();
```

instead of the required `.toUpperCase()` implementation, and the direct recovery-time Node test failed with `george` instead of `GEORGE`. Human coding intervention was zero. The evidence postprocessor then failed before serializing the official attempt's TaskState, George-owned V1 result, event timeline, budgets, and provider metrics. Those dimensions remain Evidence Gaps and cannot satisfy the call/round gates. The direct recovery test is supporting failure evidence; it is not substituted for George-owned V1 evidence.

Gate B `greenfield-express-v1` was **not run by gate** because Gate A failed. Therefore there is no corrected production-stack live result or hidden-acceptance result. Gate C `existing-express-feature-v1` was likewise **not run by gate** because Gate B was not reached. These remain explicit additional Phase 9 end-to-end usefulness gates.

### Longitudinal metrics

| Attempt | Result | Calls | Rounds | Input / output tokens | Elapsed |
| --- | --- | ---: | ---: | ---: | ---: |
| Preserved Phase 8 | Not Green | 10 | 7 | 20,765 / 406 | 45.826 s |
| First Phase 9 | Not Green | 25 | 20 | 63,253 / 1,801 | 344.745 s |
| c9 P5 Gate A | **Not Green** | Evidence Gap | Evidence Gap | Evidence Gap | Evidence Gap |

The first Phase 9 attempt regressed from preserved Phase 8 by `+15` calls, `+13` rounds, `+42,488` input tokens, `+1,395` output tokens, and `+298.919 s`. No c9 numerical improvement or delta is claimed because the postprocessor did not retain those official-attempt metrics.

## Remaining Not Green and Evidence Gaps

| Scope | State | Closeout truth |
| --- | --- | --- |
| c9 Gate A exact edit | **Not Green** | The recovered target was unchanged. This result is not waived. |
| c9 Gate A George-owned validation, final TaskState, calls/rounds/tokens/timing/budgets/handoff/correction evidence | **Evidence Gap** | The postprocessor failed before serialization; no rerun was authorized. |
| c9 Gate B greenfield production stack | **Not run by gate** | Gate A did not permit it. Deterministic stack correctness remains Green, but live usefulness is unproved. |
| c9 Gate C existing app | **Not run by gate** | Gate B was not reached. |
| First Phase 9 P4 replay | **Not Green** | Required edit absent, V1 failed, and the task ended `budget_exhausted` after 25 calls / 20 rounds. |
| First Phase 9 greenfield live work | **Not Green** | P1 failed before validation; temporary-harness P2/P3 attempts remain preserved and non-qualifying. |
| First Phase 9 existing-app live work | **Not Green** | Failed before required validation; hidden acceptance failed. |
| Phase 8 edit-plus-validation / agentic envelope | **Not Green / Evidence Gap** | The live edit failed; no healthy all-family envelope or risk/cliff region was established. |
| Controlled latency | **Evidence Gap** | REST-visible runtime controls were captured, but UI-only GPU Offload 26 was not independently confirmed. |
| Native OpenTUI | **Evidence Gap** | No supported Node-26 real-TTY qualification was added. This closeout shell used Node `v24.21.0`; `npm test` rejected `--experimental-ffi`. The flagless broad run reported 334/363 pass and 28 OpenTUI/renderer-dependent failures. |
| Bubblewrap containment | **Green, inherited** | Real Phase 9 containment evidence remains Green and unchanged; this correction did not rerun or alter it. |
| Earlier accepted phase gaps | **Unchanged** | Phase 1-6 native/live gaps, Phase 5 live Qwen Not Green, Phase 6 external-service gaps, and Phase 7 restored-runtime Not Green remain as recorded in `docs/phase-9-closeout.md`; c9 does not relabel them. |

## Handoff

The production structured task-stack architecture is now present and deterministically qualified. The live convergence premise is not qualified, and the corrected greenfield/existing-app usefulness gates remain unspent. Owner acceptance and any Phase 9 owner closeout remain separate actions; Phase 10 is not opened by this record.
