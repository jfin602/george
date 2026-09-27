# Phase 10 P10 Primary-only Qualification

Status: **NOT GREEN — deterministic regression and unsupported live environment**

Date: 2026-09-26 CDT (benchmark artifacts use 2026-09-27 UTC)  
Pre-task HEAD / exact committed candidate: `4b510792e2a01197a0063034bfc2a69692efd7a6`  
Implementation result: uncommitted evidence/version changes on that HEAD; the Petri runner owns the authoritative commit  
Package: `0.10.10`

P10 made no production repair, runtime/context retuning, helper-model call, or frozen-instrument change. It changed only the assigned package version and qualification evidence.

## Candidate audit

Every P2-P9 ledger entry has an explicit disposition. The current production tree contains the accepted P2, P3, P4, P6, P7, and P8 changes and the revised P9 opt-in output-policy contract. The rejected P5 mutation-receipt completion shortcut is absent; George still requires semantic completion. The rejected P9 automatic mode ceilings are absent; a limit is sent only when an application explicitly supplies one.

| Step | Disposition | Frozen production conclusion |
| --- | --- | --- |
| P2 useful-output watchdog | accepted | acceptance, first-useful-output, active-output, and absolute timeout states remain distinct |
| P3 stable prefix | accepted | stable instructions plus late bounded round context retained |
| P4 Operation protocol | accepted | Operation prose stays non-authoritative; completed tool/control payloads remain required |
| P5 deterministic round elimination | reverted | unsafe mutation-receipt completion is absent; observability of already-deterministic transitions remains |
| P6 batching | accepted | completed batches are prevalidated and returned in provider order |
| P7 read concurrency | accepted | only qualified replay-safe local reads overlap; provider-result order remains deterministic |
| P8 correction | accepted | bounded correction frame and direct George-owned revalidation retained |
| P9 output policy | revised | explicit opt-in contract/telemetry retained; automatic ceilings removed |

The focused audit exposed a current regression in the accepted P7 area: one historical integration assertion still requires `tool.completed` events to occur in provider order, although concurrent read completion order is intentionally nondeterministic and provider continuation order is asserted separately. Per P10's qualification-only rule, it was recorded and not repaired or rerun.

## Runtime and validity

| Dimension | Observed |
| --- | --- |
| OS | Linux 7.0.0-31-generic x86_64 |
| Node / npm | `v24.21.0` / `11.19.0` |
| Required Node | `>=26.4.0 <27` |
| Provider / model | `http://127.0.0.1:1234` / `qwen3-coder-30b-a3b-instruct@q4_k_m` |
| Provider probe | connection refused |
| Context policy | adaptive; 32,768-token physical profiles with ordinary as the initial/default profile |
| Loaded model/runtime controls/GPU Offload 26 | unavailable because the provider endpoint was unreachable |
| Root `package-lock.json` | absent |

The unsupported Node runtime and unreachable primary provider are common validity failures. No live workload callback ran and no task, hidden-acceptance, latency, cache, token, or GPU result is promoted to Green.

## Deterministic validation

| Gate | Result |
| --- | --- |
| Focused provider/agent/context/structured/recovery/batching/concurrency/correction/Operation/output-policy plus Phase 5/9/10 floor | **Not Green: 227 passed, 1 failed, 0 skipped (228 total)**. Failure: `calls execute in provider order across same-response and multiple tool rounds`; observed completion order `second, first, third`, expected `first, second, third`. |
| `npm run typecheck` | Green |
| `npm run test:runner` | Green: 90 passed, 0 failed, 0 skipped |
| `npm test` exactly once | **Not Green before discovery**: Node 24 rejected `--experimental-ffi`; 0 tests executed |
| `git diff --check` | Green |

Because a required deterministic floor is failing, P10 does not claim completion.

## Benchmarks

P1 created no quick/full artifact because the same runtime/provider gates were unavailable. Direct P1 artifact comparisons therefore remain an Evidence Gap; no zero baseline or synthetic delta was invented. Each P10 benchmark was invoked once against the accepted primary-only candidate.

| Suite | Individual result | Elapsed / provider-active ms | Attempts / rounds / retries | Tools / validations | Artifact |
| --- | --- | ---: | ---: | ---: | --- |
| quick | **0/4** | 1303 / 60 | 12 / 0 / 8 | 0 / 0 | `artifacts/benchmarks/2026-09-27T00-23-39-577Z-509520/results.json` (`ba0b6e7d…ae45`) |
| full | **0/13** | 4340 / 103 | 39 / 0 / 26 | 3 / 3 | `artifacts/benchmarks/2026-09-27T00-23-54-681Z-509690/results.json` (`71c9a54f…52d`) |
| selected agentic-context, band 2048 | **0/3**: inspection, multi-round investigation, and edit-plus-validation all failed | 1168 / 59 | 9 / 0 / 6 | 1 / 1 | `artifacts/benchmarks/2026-09-27T00-24-03-687Z-509871/results.json` (`74cb5118…24cd`) |

Every provider attempt failed before a completed round. Input, cached-input, output-token, and internal-text measurements are unavailable. Full and agentic edit cases also truthfully record unchanged fixtures after provider failure; those individual failures are not hidden by aggregate timing.

## Fast live and milestone instruments

The fast controller was invoked exactly once in canonical order. Failed common validity prevented all five callbacks, so every result is `Not Run`, `not-run`, zero attempts: greeting (120000 ms), three-file (240000 ms), Gate A (360000 ms), B3 (300000 ms), and C3 (240000 ms).

B3 remained `greenfield-core-v1`, task digest `1e4db7e…b95e`, acceptance version 1 / `6fae093f…37c0`. C3 remained `existing-core-edit-v1`, task digest `a3f3628d…28df`, fixture digest `d455c41b…a7b`, acceptance version 1 / `11d61eef…7915`.

After the fast controller, the milestone controller was invoked exactly once in B2 -> C2 order. The same common failure prevented both callbacks, so B2 and C2 are `Not Run`, `not-run`, zero attempts. Their qualification-owned ceilings were 900000 ms and 600000 ms respectively; production RunBudget was unchanged.

- B2 metadata `f0b6a694…f9f`, task stack `a8497efe…7618`, acceptance version 1 / `052b1096…c849`.
- C2 metadata `ab86b304…e5e5`, task stack `66f262fd…c7618`, fixture `45856b10…5aba`, acceptance version 1 / `183c7447…8d21`.

Phase 9's B2 validation/correction failure and C2 provider timeout/retry exhaustion remain historical Not Green evidence. This P10 Evidence Gap neither rewrites that history nor supplies new efficacy evidence.

## Cumulative primary-only delta from P1

| Metric | P1 | P10 | Comparable delta |
| --- | ---: | ---: | ---: |
| Successful benchmark cases | Not Run | 0/20 across the three independent suites | unavailable |
| Elapsed / provider-active time | unavailable | recorded per suite above | unavailable |
| Attempts / completed rounds | unavailable | 60 / 0 | unavailable |
| Retries | unavailable | 40 | unavailable |
| Input / cached / output tokens | unavailable | unavailable | unavailable |
| Internal text | unavailable | unavailable | unavailable |
| Tool batches / concurrent batches | unavailable | 0 / 0 | unavailable |
| Model rounds avoided / correction cycles | unavailable | 0 / 0 | unavailable |
| Tool calls / validations | unavailable | 4 / 4 | unavailable |
| Fast task completion / hidden acceptance | Not Run / not run | Not Run / not run | unavailable |
| B2/C2 completion / hidden acceptance | historical Not Green / not run | Not Run / not run | no new longitudinal result |

The only qualified cumulative performance evidence remains the deterministic per-step ledger: P2 removed one false retry in its fixture; P3 stabilized request prefixes; P6 compressed multi-call continuation boundaries; P7 reduced the delayed three-read fixture wall time 125 -> 41 ms; P8 retained correction efficacy with direct revalidation. No live-model cumulative speedup is claimed.

## Artifact authority and remaining gaps

The committed bounded summary is `docs/tasks/p10/P10-primary-qualification-evidence.json`. Raw benchmark JSON/report pairs remain under the three artifact directories above; their report SHA-256 values are `8a3367ae…e5cb`, `b94bcd49…2c2a4`, and `0405c2f…197c` respectively.

Remaining Not Green/Evidence Gaps: the focused concurrency assertion, broad-suite launcher failure, unsupported Node runtime, unreachable primary provider, absent loaded-model/runtime-control proof, UI-only GPU Offload 26, all live fast/milestone efficacy, P1-to-P10 live deltas, native real-TTY behavior, and the inherited historical Phase 9 B2/C2 outcomes.
