# c9 mutation-precondition convergence correction closeout

Status: **IMPLEMENTATION COMPLETE; DETERMINISTIC CORRECTION BOUNDARIES QUALIFIED; REQUIRED P2 PRE-GATE NOT GREEN; FRESH LIVE GATES NOT RUN; OVERALL CORRECTION NOT QUALIFIED**

Date: 2026-09-25

Package: `0.9.10` (unchanged)

Pre-task HEAD and exact P2 candidate inspected: `a1208d1ef53231d5c0a80596c92f9e0a011d0831`

P1 production candidate: `04405570b92680e6297b48391a7d0bdf0aa8ed5e`

Live evidence: [`P2-live-evidence.md`](P2-live-evidence.md)

This is an evidence-only closeout. It does not repair production or fixtures, rerun Gate A/B2/C2, rewrite historical evidence, owner-close Phase 9, open Phase 10, or change the package version.

## Decision

| Decision | Result | Basis |
| --- | --- | --- |
| Implementation Complete | **Yes** | P1 contains the bounded per-call preparation-failure seam, native `create_directory`, canonical path handling, permission integration, recovery intent/reconciliation, structured-stage exposure, bounded progress projection, and permanent regressions. No planned production boundary is absent. |
| Recoverable Mutation Prerequisite Boundary Qualified | **Yes** | Current deterministic coverage proves missing/stale SHA rejection, unchanged bytes, explicit read/SHA/retry convergence, missing-parent terminal `tool.failed` evidence, provider continuation, and later same-response call terminality. Cancellation, budgets, configuration, denial, and unknown-outcome handling retain their stronger semantics. |
| Native `create_directory` Qualified | **Yes** | The canonical built-in is a `workspace_mutation`; it creates safe relative directory chains, is idempotent for existing real directories, rejects collisions/absolute/traversing/symlink paths, and uses no shell, process, or network path. `write_file` still refuses missing parents. |
| Permission Boundary Qualified | **Yes** | Standard mode requests ordinary per-call mutation approval; denial creates nothing. Workspace Autonomous runs only qualified in-workspace creation without prompting. Outside-directory capability was not added, and task/repository/model text cannot raise the configured ceiling. |
| Directory Recovery Qualified | **Yes** | Durable intent contains only the bounded relative path. Reopen observation classifies a canonical real directory as complete, absence as incomplete, and collision/unsafe observation as `outcome_unknown`; recovery never replays the call. Inherited write/patch recovery remains Green. |
| Historical Evidence Preserved | **Yes** | Prior Gate A Green and the first v2 B2 Not Green remain unchanged. Executable guards confirm v1/v2 task, fixture, metadata, format, and acceptance digests; no v3 exists and Task Prompt remains format 1. |
| Evidence Auditability Qualified | **Yes — no live gate reached** | P2 truthfully records that no official live attempt began, so no gate artifact was required or claimed. No current-correction `evidence/**` files or artifact hashes exist. Repository tests confirm bounded sanitized attempt/trace writing and that optional report failure cannot erase those artifacts. This does not qualify any live gate. |
| Fresh Gate A Qualified | **No — Not Run** | P2 stopped before live work because its required deterministic pre-gate was Not Green. No fresh edit, V1, TaskState, hidden acceptance, calls, rounds, intervention, exhaustion, or safe artifact exists. |
| Gate B2 Greenfield Qualified | **No — Not Run by gate** | Fresh Gate A was not reached. No prerequisite convergence path, P1/P2/P3 progression, validation, hidden acceptance, intervention, exhaustion, or safe artifact exists for a fresh B2 attempt. |
| Gate C2 Existing-App Qualified | **No — Not Run by gate** | B2 was not reached. Baseline preservation, focused/broad validation, TaskState, hidden acceptance, intervention, exhaustion, and safe artifacts remain unspent. |
| Overall `c9-mutation-precondition-convergence` Qualified | **No** | The production implementation and correction-specific deterministic boundaries are qualified, but the required P2 pre-gate was Not Green and all mandatory fresh live gates are Not Run. |
| Phase 9 Ready For Owner Closeout | **No** | Phase 9 requires a Green deterministic gate sequence plus fresh Gate A, B2, and C2 Green. Those live results do not exist. |

## Recoverable mutation prerequisite audit

The low-level mutation authority is unchanged. Existing targets require an explicit lowercase current-content SHA-256, and a missing or stale value fails before mutation. The executor receives only the provider-supplied `expectedSha256`; neither the registry adapter nor the application loop reads and injects one automatically.

The agent-loop integration regression reproduces the B2 failure class. A missing-SHA write and a safe nested write with an absent parent each produce terminal bounded failure results without `tool.started`; a later read in the same provider response completes. The next continuation receives all three results, the provider explicitly reads `package.json`, then supplies the observed SHA while separately creating `src/`; the retry writes succeed and no premature file exists.

The new preparation seam accepts only George `validation` and `tool` errors as ordinary no-side-effect failures. Cancellation, configuration, and budget errors still throw through their existing stop paths; approval denial remains `approval.denied` plus denied tool evidence; remote mutation `outcome_unknown` still emits conservative recovery evidence. Current cancellation, run-budget, provider/configuration, approval, same-response ordering, and recovery suites are Green.

## Native directory, permission, and recovery audit

`create_directory` is registered beside `write_file` and `apply_patch` as a built-in `workspace_mutation` with one bounded required `path`. Canonical workspace code rejects empty/NUL/oversized, absolute, traversal, symlink, non-directory, and non-canonical targets; creates missing components one at a time; rechecks each component and the final target; and returns only bounded path/creation metadata. Nested creation, existing-directory idempotence, collisions, symlink escapes, cancellation before mutation, and `create_directory -> write_file` are regression-covered. The file mutation resolver remains unchanged, so `write_file` does not create parents.

Structured INSPECT still exposes only the five read-only inspection tools. Implementation and correction stages add `create_directory` to the existing read/write/patch surface; `run_process` was not added for directory creation. Progress classifies the call as editing and projects only path/count metadata.

Standard approval, denial, Workspace Autonomous in-workspace execution, and absolute outside-path rejection are exercised through the application service. Phase 9 integration separately proves task permission expectations cannot raise the configured user policy, while inherited hostile-context tests prove repository/model content cannot bypass approval.

The recovery intent is exactly `{ name: "create_directory", path }`. Recovery observes canonical filesystem state after reopen: existing real directory is `confirmed_complete`, absence is `confirmed_incomplete`, and collision/unsafe state is `outcome_unknown`. The recovery provider is never called. Existing exact-write confirmation and ambiguous patch/write no-replay behavior remain Green.

## Historical and instrument immutability audit

The prior `c9-mutation-intent-authority` Gate A remains historical Green: exact 60-byte result, George-owned V1 Green, completed/verified TaskState, hidden acceptance Green, 5 model-requested calls, 3 logical provider rounds, zero intervention, and no exhaustion. It is not a fresh qualification result for this production candidate.

The first official `greenfield-express-v2` B2 remains historical Not Green: the existing `package.json` write lacked `expectedSha256`, the later missing-parent write did not reach normal terminal execution, zero mutations and validations completed, P1/StackState failed, P2/P3 remained pending, hidden acceptance did not run, and intervention/exhaustion were zero/none. This correction does not rewrite that attempt.

Current executable immutability checks passed with these authorities:

| Instrument | Current immutable authority |
| --- | --- |
| Greenfield v1 | Complete-directory SHA-256 `7bda86b5fbbf0f85153bc50ea8e17277fbf5929ac1f645a522030ea41ab79117`; task-stack digest `c0ea964cc58423ff4646e93135a5e6766bd58dc6379f284219e3856745919063`; acceptance SHA-256 `052b109605e2eaec752477374f98a9d9c87f6b4e02bf4232d92dc79ce883c849`. |
| Existing-app v1 | Complete-directory SHA-256 `0a6277bfb0bf002bbdea0d334de5f8ffe1bc69d9426351d589b78785d4205ea2`; fixture source digest `45856b10bfe4ff3f14e1893da22b9a88b1c3334d3923d2417aee0c09e94a5aba`; acceptance SHA-256 `183c74474b02166e2ecfce21019eef2e2c1e20faa91b32d847e6f56e4608d21`. |
| Greenfield v2 | Instrument version `2`, Task Prompt format `1`, task-stack digest `a8497efe8f26862c782bb8fb9a12201993df6175a30a5bf68a5149dc832c7618`, reused acceptance version `1`. |
| Existing-app v2 | Instrument version `2`, Task Prompt format `1`, task-stack digest `66f262fd8f73171cdf5fc023d2be3a5032569fee9ebd8041241abcaf1c0eb0e9`, fixture version `1` with unchanged source digest, reused acceptance version `1`. |

Only v1 and v2 instrument directories exist. P1/P2 changed no live-work fixture, task, metadata, or acceptance file, and hidden acceptance remains outside model-visible workspaces.

## Fresh live gates

### Fresh Gate A — Not Run

No official attempt began. The exact 60-byte edit, George-owned V1, TaskState, hidden acceptance, calls, rounds, intervention, and exhaustion are all **Not Run**, not inferred from the deterministic replay or historical Gate A.

### Fresh Gate B2 — Not Run by gate

Fresh Gate A was not reached, so the exact `greenfield-express-v2` prerequisite and workload were unspent. There is no observed missing-SHA/read/retry, missing-parent, `create_directory`, or later mutation path for this candidate. P1/P2/P3, declared validations, final StackState, hidden acceptance, intervention, and exhaustion are all **Not Run**.

### Gate C2 — Not Run by gate

B2 was not reached. Fixture baseline preservation, focused and broad validations, completed/verified TaskState, hidden acceptance, intervention, and exhaustion are all **Not Run**.

## Evidence auditability

No current-correction official live gate was reached, so the absence of `evidence/gate-a`, `evidence/gate-b2`, and `evidence/gate-c2` is expected rather than an Evidence Gap. P2 records no artifact paths or SHA-256 values and makes no fresh live claim.

The task folder contains only bounded prompt/planning/evidence prose; it contains no raw provider stream, write/patch body, secret/environment capture, workspace copy, dependency tree, or unbounded output. Current `live-work` tests verify that committed `attempt.json` and `trace.json` use the repository-defined sanitized projections and are written before optional report rendering, so an optional presentation failure cannot erase the safe envelope. No fresh gate is called auditable or Green because none ran.

## Closeout validation and hygiene

| Check | Result |
| --- | --- |
| Current focused correction plus inherited c9 floor under Node 26 | **Green: 179/179 passed** across mutation/path, agent loop, recovery/session persistence, structured task/stack, progress, live-work, Gate A replay, permission, budget/provider continuation, Phase 4/5/6 inheritance, and real Bubblewrap coverage. |
| Phase 9 integration | **Green: 5/5 passed**, including v1 byte/digest freeze, v2 metadata/digests/semantics, Task Prompt format 1, acceptance isolation, restrictive policy, and inherited executable floors. |
| `npm run typecheck` | **Green.** |
| `npm run test:runner` | **Green: 90/90 passed.** |
| Broad `npm test` on Node `v26.10.0` | **Not Green: 383/389 passed, 5 failed, 1 skipped.** The same five `test/unit/tui/app.test.ts` renderer failures recorded by P2 remain; the native OpenTUI real-terminal case remains skipped. These unrelated retained failures are not relabeled Green or repaired here. |
| P2 required deterministic pre-gate | **Not Green.** Its correction-specific `72/72`, typecheck, runner, package, lockfile, and diff checks were Green, but its required broad Node 26 suite was Not Green, so P2 correctly stopped before live work. |
| Package version | **Green: exactly `0.9.10`.** |
| Root `package-lock.json` | **Green: absent.** |
| `git diff --check` | **Green.** |
| P3 scope | **Green:** only this closeout document was added; no production, fixture, task, metadata, acceptance, historical evidence, or package repair was made. |

The production correction is implementation-complete and deterministically qualified at its own boundaries, but the mandatory qualification sequence is incomplete. Phase 9 remains open, and `/closeout phase 9` is not authorized by this evidence.
