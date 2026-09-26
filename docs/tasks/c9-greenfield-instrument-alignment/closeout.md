# c9 greenfield instrument alignment correction closeout

Status: **IMPLEMENTATION COMPLETE; V1 EVIDENCE PRESERVED; V2 INSTRUMENT AND RUNNER QUALIFIED; GATE B2 NOT GREEN; OVERALL CORRECTION NOT QUALIFIED**

Date: 2026-09-25

Package: `0.9.10` (unchanged)

Pre-task HEAD and exact P2 candidate inspected: `e28cf367f92c2aa9e5c6738d0a0fb937c12aeccf`

P1 instrument-alignment candidate: `b4402d2ad768011f9647753802e60c86baaa8324`

Live evidence: [`P2-live-evidence.md`](P2-live-evidence.md)

This is an evidence-only closeout. It does not repair production or instrument code, edit fixtures, rerun Gate A/B2/C2, rewrite v1 evidence, owner-close Phase 9, open Phase 10, or change the package version.

## Decision

| Decision | Result | Basis |
| --- | --- | --- |
| Implementation Complete | **Yes** | P1 added independently versioned v2 instruments, version-specific runner entry points, and permanent v1/v2 semantic, digest, and runner-isolation regressions. The required deterministic validation is Green. |
| v1 Evidence Preserved | **Yes** | The v1 fixture directories and acceptance files are byte-frozen by executable digests and unchanged from the pre-P1 baseline; v1 runner functions are unchanged and still load only v1; the historical greenfield v1 result remains Not Green. |
| v2 Instrument Semantics Qualified | **Yes** | All v2 tasks parse as Task Prompt format 1; top-level INSPECT owns preflight; WORKFLOW contains actual progression; no title heuristic or pre-validation exact-result claim was added; EVIDENCE owns post-validation reporting. |
| v2 Runner Qualified | **Yes** | Deterministic tests prove the v2 functions load only matching v2 prompts and delegate to the production task/stack services; v1 and v2 remain independently runnable. |
| Gate A Inherited Green | **Yes** | P1 changed qualification fixtures, runner entry points, and tests only. Production structured execution, mutation authority, the exact Gate A fixture/acceptance, provider/runtime policy, and stage limits were unchanged. |
| Gate B2 Greenfield Qualified | **No — Not Green** | The one official v2 attempt failed in P1. No mutation succeeded, V1 did not run, StackState failed with P2/P3 pending, and hidden acceptance did not run. |
| Gate C2 Existing-App Qualified / Not Run | **Not Run** | B2 was Not Green, so the gate correctly prohibited C2. No C2 behavior is inferred. |
| Overall c9-greenfield-instrument-alignment Qualified | **No** | Instrument implementation and deterministic semantics are qualified, but mandatory live Gate B2 is Not Green and Gate C2 is unspent. |
| Phase 9 Ready For Owner Closeout | **No** | Phase 9 requires inherited Gate A, B2, and C2 all Green with no new blocking regression. B2 failed and C2 did not run. |

## V1 evidence preservation audit

P1 added v2 files and runner entry points without editing either v1 instrument or either acceptance file. Current executable guards retain these complete-directory and acceptance hashes:

| Evidence | Frozen SHA-256 |
| --- | --- |
| `greenfield-express-v1` directory | `7bda86b5fbbf0f85153bc50ea8e17277fbf5929ac1f645a522030ea41ab79117` |
| `existing-express-feature-v1` directory | `0a6277bfb0bf002bbdea0d334de5f8ffe1bc69d9426351d589b78785d4205ea2` |
| Greenfield acceptance v1 | `052b109605e2eaec752477374f98a9d9c87f6b4e02bf4232d92dc79ce883c849` |
| Existing-app acceptance v1 | `183c74474b02166e2ecfce21019eef2e2c1e20faa91b32d847e6f56e4608d21` |

The v1 metadata remains unchanged: greenfield task-stack digest `c0ea964cc58423ff4646e93135a5e6766bd58dc6379f284219e3856745919063`; existing fixture version `1` and source digest `45856b10bfe4ff3f14e1893da22b9a88b1c3334d3923d2417aee0c09e94a5aba`; Task Prompt format `1`; acceptance version `1`.

`runGreenfieldExpressV1()` and `runExistingExpressFeatureV1()` are unchanged and read only their v1 task filenames before delegating to `runLiveWorkInstrument()`. The versioned-runner regression exercises v1 and v2 separately and observes the expected stack identities.

The historical `greenfield-express-v1` Gate B result remains **Not Green**. Its inspection-only W1 exhausted duplicate/no-progress after 8 model-requested / 6 executed calls over 4 rounds; no mutation or validation occurred, P1 and StackState ended `budget_exhausted`, and hidden acceptance did not run. V2 does not reclassify or replace that evidence.

## V2 instrument semantics and versioning audit

| Instrument | Instrument version | Task format | Task-stack digest | Fixture | Acceptance |
| --- | ---: | ---: | --- | --- | --- |
| `greenfield-express-v2` | `2` | `1` | `a8497efe8f26862c782bb8fb9a12201993df6175a30a5bf68a5149dc832c7618` | New clean-repository instrument | Explicit reuse of greenfield acceptance version `1` |
| `existing-express-feature-v2` | `2` | `1` | `66f262fd8f73171cdf5fc023d2be3a5032569fee9ebd8041241abcaf1c0eb0e9` | Version `1`, unchanged source digest `45856b10bfe4ff3f14e1893da22b9a88b1c3334d3923d2417aee0c09e94a5aba` | Explicit reuse of existing-app acceptance version `1` |

The v2 authoring matches current Task Prompt v1 authority:

- each task uses top-level INSPECT for repository/package/Git/source/test/documentation preflight;
- greenfield P1/P2/P3 WORKFLOW begins with application creation, route behavior, and tests/documentation respectively;
- existing-app WORKFLOW contains tag implementation followed by tests/documentation;
- no workflow title or prose asks George to infer `Inspect`, `Validate`, or `Report` semantics;
- no pre-validation requirement claims exact George-owned validation results;
- EVIDENCE requests exact validation and final task/stack reporting only after George runs validation;
- acceptance behavior and dependency prerequisites remain explicit and unchanged.

No production title-based heuristic, grammar revision, or Task Prompt format 2 was introduced.

## Runner audit

`runGreenfieldExpressV2()` loads the ordered P1/P2/P3 files from its supplied v2 root and delegates the definitions to the production stack boundary. `runExistingExpressFeatureV2()` loads the v2 single task and delegates to the production task boundary. Neither function contains task orchestration logic or redirects a v1 entry point.

Deterministic runner tests exercised all four entry points and observed only these identities:

- greenfield v1: `greenfield-express-v1:1`, `:2`, `:3`;
- greenfield v2: `greenfield-express-v2:1`, `:2`, `:3`;
- existing-app v1: `existing-express-feature-v1`;
- existing-app v2: `existing-express-feature-v2`.

V2 Runner is **Qualified**.

## Live qualification

### Gate A — inherited Green

The qualifying `c9-mutation-intent-authority` attempt remains authoritative: exact 60-byte result, George-owned V1 Green, completed/verified TaskState, hidden acceptance Green, 5 model-requested calls, 3 logical provider rounds, zero human coding intervention, and no exhaustion.

P1 did not change production structured task/stack execution, evidence/budget/direct-validation/convergence controls, SHA mutation preconditions, mandatory INSPECT tool choice/completion, exception-safe trace retention, text framing/mutation fidelity, mutation-intent authority, Bubblewrap containment, context/runtime policy, or Gate A inputs. Gate A therefore remains **Green** without rerun.

### Gate B2 — Not Green

Exactly one official attempt ran on P1 candidate `b4402d2ad768011f9647753802e60c86baaa8324` under Node `v26.10.0`, npm `11.19.1`, and pinned `qwen3-coder-30b-a3b-instruct@q4_k_m`. The exact authorized prerequisite `npm install express@5.1.0` passed.

P1 top-level INSPECT completed correctly after one required-tool round containing four successful read-only calls. The implementation round then proposed three `write_file` calls. The first attempted to replace dependency-created `package.json` without `expectedSha256`; it failed, the later writes did not complete, and zero mutations succeeded. The missing precondition is a bounded-evidence inference consistent with the recorded arguments, existing file, and production existing-file guard; the safe artifact omits raw tool-error bodies.

TaskState failed with W1 still active, R1-R3 pending, V1 pending with zero attempts, and blocker `Work unit W1 did not complete.` StackState fail-stopped at P1 with P2/P3 pending. Hidden acceptance remained `not_run`.

| Dimension | B2 result |
| --- | --- |
| Provider attempts / logical rounds / retries | `2 / 2 / 0` |
| Provider-emitted proposals / registered tool requests / started tools | `7 / 6 / 5` |
| Successful mutations | `0` |
| Provider input / output tokens | `3,746 / 345` |
| Context | 2 ordinary-profile assemblies; no promotion or compaction |
| Validation / hidden acceptance | Not run / `not_run` |
| Exhaustion / duplicate-no-progress | None |
| Final state | P1 TaskState `failed`; StackState `failed` at `0/3` completed |
| Human coding intervention | `0` |
| Total live-work time | `71,371.469 ms` plus `2,597.047 ms` dependency prerequisite |

B2 is **Not Green**. Correct INSPECT alignment, truthful fail-stop, zero intervention, and absence of exhaustion do not satisfy the required functional, validation, StackState, and hidden-acceptance gates.

### Gate C2 — not run

C2 was correctly not run because B2 was Not Green. The existing-app fixture commit, dependency step, mutations, focused/broad validation, baseline preservation, TaskState, hidden acceptance, calls/rounds/tokens, and intervention dimensions remain **Not Run**, not Green or Evidence Gap inferred from another layer.

## Inherited production boundaries and retained gaps

| Boundary | Closeout truth |
| --- | --- |
| Production task-stack execution | **Green, inherited and exercised truthfully in B2.** Strict ordering/fail-stop preserved P2/P3 as pending after P1 failed. |
| Evidence, shared budget, direct validation, and convergence controls | **Green, inherited.** No duplicate/no-progress, stage, correction, or run-budget exhaustion occurred in B2. |
| SHA mutation preconditions | **Green, inherited; enforced in B2.** The failed overwrite did not weaken the current-content precondition. |
| INSPECT required tool call and application-owned completion | **Green, inherited and exercised.** P1 preflight used a required read-only tool round and completed without continuation. |
| Exception-safe trace | **Green, inherited and exercised.** Attempt, trace, outcome, and runtime artifacts were retained and their recorded hashes rechecked. |
| Text framing and mutation fidelity | **Green, inherited; no B2 mutation completed.** No framing regression was observed or inferred. |
| Mutation-intent authority | **Green, inherited.** B2 requested no exceptional framing intent or outside-workspace mutation. |
| Bubblewrap containment | **Green, inherited and re-exercised deterministically** by the affected floor. |
| Context/runtime policy | **Unchanged.** UI-only GPU Offload 26 remains unconfirmed, so controlled latency remains an Evidence Gap. |
| Native OpenTUI | **Evidence Gap, unchanged.** No supported Node-26 real-TTY qualification was added. |

## Closeout validation and hygiene

| Check | Result |
| --- | --- |
| P2 deterministic pre-gate under Node 26 | **Green: 160/160 passed**, as recorded in `P2-live-evidence.md`. |
| Current focused v1/v2 fixture and runner tests | **Green: 13/13 passed.** |
| Current inherited c9 affected floor | **Green: 114/114 passed**, including Gate A replay, mutation/framing authority, structured task/stack/state/budget/recovery, provider behavior, Phase 9 integration, Phase 5, and real Bubblewrap cases. |
| Phase 9 integration | **Green: 5/5 passed**, including v1 freeze and v2 semantic/version checks. |
| `npm run typecheck` | **Green.** |
| `npm run test:runner` | **Green: 90/90 passed.** |
| `npm test` on the closeout host | **Not runnable:** Node `v24.21.0` rejects the required `--experimental-ffi` option. |
| Flagless broad characterization | **Not Green: 356/385 passed, 28 failed, 1 skipped.** Failures are retained OpenTUI/native-FFI-dependent behavior on Node 24, including the Phase 4 renderer path; the native-TTY case remains skipped. |
| P2 live artifact hashes | **Green:** runtime, B2 harness/outcome/attempt/trace, dependency-created package, and lockfile match the hashes recorded in `P2-live-evidence.md`. |
| Package version | **Green: exactly `0.9.10`.** |
| Root `package-lock.json` | **Green: absent.** |
| `git diff --check` | **Green.** |

The correction implementation is complete, but its mandatory live qualification is not. Phase 9 remains open: B2 is Not Green and C2 is unspent, so a separate `/closeout phase 9` is not yet authorized. The implementation result is this single uncommitted closeout document on unchanged pre-task HEAD `e28cf367f92c2aa9e5c6738d0a0fb937c12aeccf`; the phase runner owns staging and commit creation.
