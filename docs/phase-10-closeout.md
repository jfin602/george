# Phase 10 closeout — Agent Loop Throughput

Status: **FORMAL EVIDENCE CLOSEOUT; NOT GREEN; NOT READY FOR PHASE 11 PLANNING**

Date: 2026-09-26

Assigned package: `0.10.12`

Exact P11 candidate: `89cdd0413b3c8456bc9679a6352c534b655b4931` (`0.10.11`)

Closeout result: that exact committed candidate plus only this evidence record and the `package.json` version change to `0.10.12`; the Petri runner owns the authoritative implementation commit.

## Scope and verdict

This is an evidence-only closeout. It changes no production source, test, benchmark instrument, live-work instrument, runtime setting, or acceptance rule. It does not repair the P10 regression, rerun an expensive live workload, owner-close Phase 10, alter `BOOT.md` or the roadmap, or open Phase 11.

The optimized primary-only baseline is **not ready for Phase 11 planning**. P10 recorded a required deterministic affected-floor failure, the supported Node/provider environment was unavailable, the Phase 10 fast and milestone live gates did not run, and no comparable P1-to-final live or benchmark delta exists. P11's helper result is an Evidence Gap. Performance evidence does not convert any of those functional or evidence failures to Green.

## Candidate and evidence chain

| Phase 10 step | Authoritative commit | Package | Closeout use |
| --- | --- | ---: | --- |
| P1 baseline | `9161bfce2034cc1dedd660ce8a581872b77ee450` | `0.10.1` | Telemetry, immutable B3/C3 identities, and baseline Evidence Gap |
| P2 useful-output watchdog | `bdc2111257644d40a15d38f1be387151b6e65d15` | `0.10.2` | Accepted disposition |
| P3 stable prefix | `3167be9c30781c112d4ba0e0f18512997c772603` | `0.10.3` | Accepted disposition |
| P4 Human/Operation protocol | `410647c7bbdc9c218a2000270167476022a4c9cc` | `0.10.4` | Accepted disposition |
| P5 deterministic round elimination | `945151f9abb57045af9f2371b97ef7250c156610` | `0.10.5` | Reverted shortcut plus retained observability |
| P6 sequential batching | `a080f558e36fdb5a53a257c40ddcacfba03829e5` | `0.10.6` | Accepted disposition |
| P7 read-only concurrency | `dd8e0794e11419a3e0b150d8a2ce44e3322530c6` | `0.10.7` | Accepted production behavior; current regression recorded below |
| P8 focused correction | `35d0319a487a93ce461e07aca811b332f089a809` | `0.10.8` | Accepted disposition |
| P9 output policy | `4b510792e2a01197a0063034bfc2a69692efd7a6` | `0.10.9` | Revised opt-in contract |
| P10 primary-only qualification | `5aed800278faa03f509dbec9b0dad4b02e7687c4` | `0.10.10` | Not Green qualification and bounded evidence summary |
| P11 helper A/B | `89cdd0413b3c8456bc9679a6352c534b655b4931` | `0.10.11` | Evidence Gap; exact closeout candidate |

Primary evidence is `docs/tasks/p10/P1-baseline.md`, `docs/tasks/p10/optimization-ledger.md`, `docs/tasks/p10/P10-primary-qualification.md`, `docs/tasks/p10/P10-primary-qualification-evidence.json`, and `docs/tasks/p10/P11-helper-ab.md`. Phase 9 authority and historical truth remain in `docs/phase-9-owner-closeout.md`.

## Optimization disposition and current production audit

| Step | Disposition | Current P11 production truth |
| --- | --- | --- |
| P2 useful-output watchdog | **Accepted** | `src/application/one-turn.ts` and `src/application/provider-stall.ts` keep response acceptance, first useful output, active output, and absolute timeout distinct. Attempt timing remains durable and observable. |
| P3 stable prefix / late context | **Accepted** | Provider requests retain stable instructions and explicit late `roundContext`; LM Studio places late context after initial input or continuation tool results. Canonical state does not depend on provider cache state. |
| P4 Human / Operation protocol | **Accepted** | Human mode remains conversational. Operation mode accepts completed typed tools or the exact non-executable v1 `handoff`, bounds and discards routine internal prose, and cannot grant permission, validate, execute, or complete TaskState. |
| P5 deterministic round elimination | **Reverted** | The mutation-receipt semantic-completion shortcut is absent. George still requires an explicit completed semantic handoff; direct George-owned inspection/work/validation/correction/stack transitions remain durably counted as avoided confirmation rounds. |
| P6 sequential batching | **Accepted** | A completed same-response batch is prevalidated, duplicate call IDs fail closed, each member retains canonical policy/effect evidence, and provider continuation results remain in provider order. |
| P7 read-only concurrency | **Accepted; qualification retains an intermittent Not Green result** | Only contiguous distinct replay-safe `local_read` calls without hook, approval, mutation, dependency, or ambiguity barriers overlap. Provider continuation order remains deterministic. P10 failed a historical integration assertion that requires concurrent `tool.completed` lifecycle events themselves to arrive in provider order. The closeout recheck passed that assertion, establishing intermittency without erasing the P10 failure. No repair is made here. |
| P8 focused correction | **Accepted** | Correction Frame v1 is bounded and derived from canonical TaskState/current evidence; stale evidence is excluded, genuine repair remains model-owned, and George directly reruns failed declared validation while preserving the original failure. |
| P9 output policy | **Revised** | Automatic per-mode ceilings were removed. Only an explicit application request can supply a provider-neutral maximum; capable LM Studio requests map it to `max_output_tokens`, unsupported adapters inherit behavior, and incomplete payloads never execute. |

Rejected and revised experiments remain part of the record. No reverted P5 shortcut or rejected P9 automatic ceiling is present in the exact P11 production tree.

## Baseline-to-final primary-only evidence

P1 could not create a supported quick/full or fast-live baseline because the host was Node `v24.21.0` rather than `>=26.4.0 <27` and LM Studio refused connection. P10 observed the same common validity failure. Therefore no P1-to-final live-model cumulative performance delta is comparable; unavailable measurements are not zero.

| Metric | P1 baseline | Final accepted primary-only evidence | Cumulative conclusion |
| --- | --- | --- | --- |
| Provider attempts / completed rounds / retries | Not Run | P10 quick + full + selected agentic: `60 / 0 / 40` | No comparable cumulative delta; every attempt failed before a completed round |
| Elapsed / provider-active time | Unavailable | `6,811 / 222 ms` across the three independent failed suites | Failure timing only; no speedup claim |
| Input / cached-input / output tokens | Unavailable | Unavailable | Evidence Gap; never inferred |
| Internal text | Unavailable | Unavailable in P10 failed provider runs | No live cumulative claim |
| Tool batches / concurrent batches | Unavailable | `0 / 0` in P10 failed provider runs | No live cumulative claim |
| Model rounds avoided / correction cycles | `0 / 0` default telemetry | `0 / 0` in P10 failed provider runs | No live cumulative claim |
| Tool calls / validations | Unavailable | `4 / 4` across the three failed suites | Not efficacy evidence |
| Benchmark correctness | Not Run | quick `0/4`; full `0/13`; selected agentic `0/3` | **Not Green**; provider unavailable |
| Fast completion / hidden acceptance | Not Run / `not_run` | all five Not Run / `not_run` | Evidence Gap |

The bounded deterministic per-step evidence remains useful but is not a substitute for a cumulative live comparison:

- P2's fake-time accepted-prefill fixture changed attempts `2 -> 1`, retries `1 -> 0`, and false stalls `1 -> 0`, with completed rounds unchanged.
- P3 changed distinct instruction prefixes `2 -> 1` and mission-card-bearing instruction requests `2 -> 0`; both sides used two rounds and one tool call, and cached input was unreported.
- P4's comparable case used two Operation rounds, one tool call, one control, 21 ignored internal-text bytes, and zero operator assistant commits; provider rounds were unchanged.
- P5 retained no provider-round reduction. It records George-owned avoided-transition reasons but reverted the unsafe shortcut that would have removed a correction continuation.
- P6's three-read fixture used one selection round, one width-three batch, compression `2`, three calls, and two total provider rounds; batching did not itself reduce provider rounds.
- P7's delayed three-read fixture changed wall time `125 -> 41 ms` (`-84 ms`, `-67%`) while summed member time stayed `124 -> 123 ms`; provider rounds remained two and result order stayed stable.
- P8's deterministic correction workload completed hidden acceptance with 12 attempts/rounds, 18 tool calls, three correction provider rounds, two reinspection calls, one direct validation rerun, and ten recorded avoided transitions. The exact P7/P8 B3/C3 comparison was `416.417 / 417.294 ms`, treated as noise rather than gain.
- P9 retained no automatic output ceiling and established no token, provider-time, or provider-round improvement. The explicit opt-in policy and telemetry are the revised result.

P10 raw benchmark identities remain:

| Suite | Artifact | SHA-256 |
| --- | --- | --- |
| quick | `artifacts/benchmarks/2026-09-27T00-23-39-577Z-509520/results.json` | `ba0b6e7d6f63c8b61ea8ea65f3c0beb41d06afa3d8ad608191e0497b55ecae45` |
| full | `artifacts/benchmarks/2026-09-27T00-23-54-681Z-509690/results.json` | `71c9a54fc9c3d646ba144641888103beecd9ac70ff800ffe622be9ef3bce852d` |
| agentic context, band 2048 | `artifacts/benchmarks/2026-09-27T00-24-03-687Z-509871/results.json` | `74cb51189e9c32b4a51309f9dab451e4c89c971b15f4dbc814e1a9412a2724cd` |

## Phase 9 authority audit

| Contract | State | Closeout finding |
| --- | --- | --- |
| Human / Operation boundary | Green deterministically through P10 evidence | Human text remains operator-facing; Operation prose/control remains non-authoritative and completion-gated. No live efficacy claim is available. |
| Useful-output timing and recovery | Green deterministically through P10 evidence | Acceptance and useful generation are separate; finite retry/rebase and response-completion-before-side-effect rules remain. Supported live timing is an Evidence Gap. |
| Stable-prefix context | Green deterministically through P10 evidence | Stable instructions and fresh late mission context coexist; canonical context, provenance, and recovery evidence remain George-owned. Cache benefit is an Evidence Gap. |
| Deterministic round elimination | Green for retained authority; rejected shortcut absent | Validation sequencing/truth, revalidation, completion, evidence freshness, permissions, and stack progression remain George-owned. No retained semantic reasoning round was removed. |
| Batching | Green deterministically through P10 evidence | Calls retain individual schema, effect, permission, cancellation, budget, and result evidence; one ordered continuation is retained. |
| Read concurrency | **Not Green historical / intermittent** | Production boundary matches the accepted ledger. The P10 lifecycle-order assertion failed once and passed in the bounded closeout recheck; provider-result ordering remains separately asserted. Under the flaky-test rule the later pass does not erase the failure. |
| Focused correction | Green deterministically through P10 evidence | Bounded fresh evidence, preserved failure history, model-owned repair, and direct George-owned revalidation remain. |
| Output policy | Green for the revised opt-in contract | No default production ceiling exists; no partial payload can execute. Performance benefit remains an Evidence Gap. |
| Permission / containment | Green in inherited Phase 9 deterministic authority; no new live proof | ToolRegistry classification, approvals, Workspace Autonomous containment, outside reject/ask, process boundaries, and inability of model/task text to elevate authority remain unchanged. |
| Recovery / replay | Green in inherited and affected deterministic evidence | Replay-safe provider recovery remains finite; mutations, approvals, processes, ambiguous effects, and outcome-unknown operations are not blindly replayed. |
| Evidence / TaskState / validation | Green in inherited and affected deterministic evidence | Canonical TaskState/StackState, inspection freshness, failure history, validation truth, hidden acceptance, and durable bounded diagnostics remain application-owned. The current aggregate affected floor is nevertheless Not Green because of the P7 lifecycle assertion. |

## Live matrix and immutable instruments

P10 invoked the fast controller once in canonical order. The unsupported Node runtime and unreachable provider stopped all callbacks at common validity, so no expensive live workload is rerun for this closeout.

| Gate | Deadline | P10 result | Attempts / hidden acceptance |
| --- | ---: | --- | --- |
| greeting | 120,000 ms | Not Run | `0 / not_run` |
| three-file | 240,000 ms | Not Run | `0 / not_run` |
| Gate A | 360,000 ms | Not Run | `0 / not_run` |
| B3 | 300,000 ms | Not Run | `0 / not_run` |
| C3 | 240,000 ms | Not Run | `0 / not_run` |

The immutable fast identities remain unchanged:

- B3 `greenfield-core-v1`: task digest `1e4db7e14cdbdfcf6711367c4b920a17caf819d8281e5bf82e0f59b2b85eb95e`; acceptance v1 SHA-256 `6fae093f474006f0b097f38b900dfda39613719f6ae2e2e8e883193f987137c0`.
- C3 `existing-core-edit-v1`: task digest `a3f3628d8c4df48708cd96dae04710a8ccabcc4a6818102f92d56750327028df`; fixture digest `d455c41b7f6da50c322fd8e54a04241ad06f030284ef6bf5e4c08003ba5b8a7b`; acceptance v1 SHA-256 `11d61eef45433f07514f10b19772139e813a245a9a7915def2c496193728d491`.

P10 also invoked the milestone controller once in B2 -> C2 order. Both were Not Run with zero attempts because the same common validity gate failed. Their frozen identities and Phase 9 outcomes remain immutable:

- B2 metadata `f0b6a694…f9f`, task stack `a8497efe…7618`, acceptance v1 `052b1096…c849`: Phase 9 remains **Not Green** after P2 V1 failed and correction did not complete; P10 adds only an Evidence Gap/Not Run observation.
- C2 metadata `ab86b304…e5e5`, task stack `66f262fd…c7618`, fixture `45856b10…5aba`, acceptance v1 `183c7447…8d21`: Phase 9 remains **Not Green** after provider stall/timeout retry exhaustion before mutation/validation; P10 adds only an Evidence Gap/Not Run observation.

## Helper A/B

Final classification: **Evidence Gap**.

P11 selected one bounded derived-context experiment over `multi-round-repository-001` v1 but did not implement or execute it. The provider endpoint was unreachable, no primary model was proven loaded, no distinct helper model was configured, and no substitute model was installed or used. Primary/helper tokens, rounds, time, memory overhead, correctness, hidden acceptance, and failure-rate deltas are unavailable.

Helper behavior is **not** the Phase 10 production baseline. No production helper routing or delegation exists; the unchanged primary-only path is the only production path. Any later experiment must keep helper output derived, bounded, discardable, tool-less, non-authoritative, and unable to affect permissions, TaskState/StackState, validation, completion, evidence, or instruction precedence.

## Green / Not Green / Evidence Gap matrix

| Evidence item | State | Authority / consequence |
| --- | --- | --- |
| P2, P3, P4, P6, P8 retained behavior | **Green, deterministic** | Accepted per-step affected floors; live benefit not implied |
| P5 production disposition | **Green revert** | Unsafe mutation-receipt completion absent; rejected result preserved |
| P9 production disposition | **Green revise** | Explicit opt-in policy retained; automatic ceilings absent |
| P7 production boundary | **Green source audit / Not Green intermittent evidence** | Boundary matches ledger; the P10 event-order assertion failed, while the closeout recheck passed it |
| P10 focused affected floor | **Not Green** | `227/228`; `calls execute in provider order across same-response and multiple tool rounds` expected lifecycle completion order `first, second, third`, observed `second, first, third` |
| P10 broad `npm test` | **Not Green** | Node 24 rejected `--experimental-ffi`; zero tests executed |
| TypeScript and phase runner at P10 | **Green** | Typecheck passed; runner `90/90` |
| P1-to-P10 benchmark/live delta | **Evidence Gap** | No supported P1 baseline and no completed P10 provider round |
| P10 quick/full/selected benchmark correctness | **Not Green** | `0/4`, `0/13`, and `0/3`; provider unavailable |
| greeting / three-file / Gate A / B3 / C3 | **Evidence Gap** | All Not Run with zero attempts; no functional, latency, or hidden-acceptance claim |
| P10 B2/C2 milestone | **Evidence Gap** | Both Not Run; historical Phase 9 Not Green outcomes unchanged |
| Helper A/B | **Evidence Gap** | No valid helper candidate or A/B execution; no benefit claim |
| Supported Node 26.4+ runtime | **Evidence Gap** | Closeout host remained Node `v24.21.0` |
| Loaded pinned LM Studio/Qwen runtime | **Evidence Gap** | Endpoint refused connection; model/runtime controls unavailable |
| GPU Offload 26 | **Evidence Gap** | Remains UI-only/unconfirmed |
| Native real-TTY behavior | **Evidence Gap** | Non-TTY qualification environment |
| Historical sandbox/process intermittency | **Evidence Gap** | No established root cause; inherited Phase 9 record unchanged |
| Phase 7 final restored-runtime verification | **Not Green, historical** | Duplicate structured-tool read remains recorded; accepted warm `parallel=1` control remains separately Green |
| Phase 8 agentic-context qualification | **Not Green / Evidence Gap, historical** | No all-family healthy envelope or adjacent cliff; failed edit-plus-validation and missing controls remain immutable |
| Phase 9 B2/C2 | **Not Green, historical** | Owner waiver permits prior roadmap progression but does not relabel either result |

## Closeout recheck

The closeout runs only bounded deterministic/version/hygiene checks. It does not rerun quick/full/agentic benchmarks, the fast live matrix, B2/C2, or helper inference.

| Check | Closeout result |
| --- | --- |
| Phase 10 focused provider/agent-loop/structured/batching/concurrency/correction/Operation/benchmark/live-work floor | Green on bounded closeout recheck: `241/241`; this establishes P10's earlier concurrency assertion failure as intermittent and does not erase it |
| `npm run typecheck` | Green |
| `npm run test:runner` | Green: `90/90` |
| `git diff --check` | Green |
| Package version | `0.10.12` |
| Root `package-lock.json` | Absent |

## Phase 11 planning readiness

**Not ready.** Before Phase 11 planning can truthfully use a frozen optimized primary-only Phase 10 baseline, a later authorized task must repair and permanently guard the P7 lifecycle-event-order regression, run the required deterministic/broad floors on supported Node 26, and obtain supported primary-provider evidence sufficient to establish fast-gate efficacy and a comparable primary-only benchmark baseline. That work is outside this evidence-only closeout.

This document is not an owner closeout and does not authorize Phase 11 work.
