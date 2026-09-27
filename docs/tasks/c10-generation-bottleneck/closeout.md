# Correction 10 closeout — Generation bottleneck

Status: **NOT GREEN / NOT QUALIFIED**

Date: 2026-09-27

Package: `0.10.12` unchanged

## Scope and exact candidate

This is an evidence-only closeout. It changes no production source, tests, runtime settings, qualification instruments, or historical evidence. It does not rerun the real-model workload or broad suite, owner-close Phase 10, or open Phase 11.

The exact P4 evidence candidate and pre-task HEAD is `4e28fe41d80f3787967812431bd9745248773f75`, tree `5a4b1a39c3c3ff764b7935fc2771badf0d59b469`. P4 added evidence only. Its audited production candidate is P3 commit `384091366fcd1addabf0a2cff456a6ece77f7875`, tree `8191d407ad178e7549669ed9d87dc7cd60c5515d`.

The implementation chain is:

| Step | Commit | Tree | Result used here |
| --- | --- | --- | --- |
| P1 terminal TaskState | `73885cfc4c09889db876dc4c75af1645ee88e4a9` | `e105ee87c9a381dce01fbcac201180d428925c33` | Green deterministic |
| P2 provider deadline | `99e5267ca0bc3961003fc0c5877ffbec3f22fa3d` | `4ca12438996a7ee0b53cfa986351dccb21ed372f` | Green deterministic |
| P3 GEP/1 | `384091366fcd1addabf0a2cff456a6ece77f7875` | `8191d407ad178e7549669ed9d87dc7cd60c5515d` | Partly Green; legacy compatibility Not Green |
| P4 qualification evidence | `4e28fe41d80f3787967812431bd9745248773f75` | `5a4b1a39c3c3ff764b7935fc2771badf0d59b469` | Not Green |

The package is exactly `0.10.12`, and root `package-lock.json` is absent.

## P1 audit — terminal TaskState integrity

`src/tasks/state.ts` now performs one immutable terminal transition: if `currentWorkUnit` names an `active` authored unit, `blockTask()` changes only that unit to `blocked`, clears `currentWorkUnit`, retains the requested terminal status/outcome, and appends the blocker. With no active unit it leaves addressed and pending work unchanged.

The permanent state, stack, structured-provider-failure, and session-store regressions passed in P4 and again in this closeout recheck. They cover every terminal outcome, nested StackState child terminalization, lifecycle persistence/reopen, and strict rejection of manually constructed impossible active-work states. No correction-local run produced an invalid terminal active work unit. The durable validator was not weakened.

## P2 audit — generation-aware provider policy

`src/core/config.ts` and `src/provider/lm-studio.ts` retain a provider-independent default absolute emergency timeout of `300000` ms and reject configuration above `600000` ms. The scripted/fake-time regressions passed in P4 and again here:

- accepted prefill remains under the independent 90000 ms first-useful-output policy;
- useful output refreshes the independent 60000 ms active-output inactivity guard;
- productive output crossed 120000 ms and completed at 180000 ms;
- productive output still terminated at the finite 300000 ms emergency ceiling;
- caller cancellation remained authoritative;
- finite fresh retry/canonical rebase and provisional-branch discard remained intact;
- incomplete tool/edit/control proposals did not execute.

This is deterministic evidence only. The P4 live workload did not run, so there is no live greater-than-120-second observation.

## P3 audit — George Edit Protocol v1

`src/application/george-edit.ts` defines bounded, versioned, length-framed `GEP/1` packets. Eligible complete UTF-8 reads receive bounded run-local receipts containing the canonical path, SHA-256, exact snapshot, framing, and mutation epoch. Mixed/truncated/binary/unsupported reads retain inherited evidence; receipt bodies are not durable state; restart begins with an empty registry.

The parser and canonical expansion regressions passed in P4 and again here. They cover multiple original-snapshot ranges/files, creation, deletion, delimiter content, malformed and unknown versions, invalid UTF-8/NUL, bounds, unknown/stale receipts, SHA drift, overlap, out-of-range edits, ambiguous targets, LF/CRLF framing, cancellation, denial, and mixed or incomplete responses. A completed packet is fully parsed and prevalidated only after `provider.response.completed`, then expanded to existing `apply_patch`/`write_file` calls. ToolRegistry classification, workspace containment, approval, recovery intent, Git evidence, mutation freshness, and current-content SHA checks remain canonical.

GEP/1 as a whole is nevertheless **Not Green**. Receipt-only projection removes `sha256` and `text` from eligible Operation-mode `read_file` evidence while legacy `write_file`/`apply_patch` remain advertised as compatibility fallbacks. The frozen Phase 8 replay and framing-recovery paths therefore cannot use that fallback. These are correction-local P3 compatibility regressions, not parser or mutation-engine failures.

### Deterministic mutation transmission evidence

The retained representative fixture edits two existing files through three non-overlapping ranges:

| Measurement | Value |
| --- | ---: |
| Provider-emitted GEP packet | 69 bytes |
| Equivalent expanded canonical mutation arguments | 356 bytes |
| Mutation Transmission Ratio | `69 / 356 = 0.19382022471910113` |
| Required maximum | `0.70` |
| Resulting bytes | Byte-identical to canonical expected output |

The metric is Green and avoids repeated path/SHA/old-text transmission. It does not override the legacy compatibility failure.

## P4 evidence reconciliation

P4 common validity was Green on Node `v26.10.0`, npm `11.19.1`, LM Studio `0.4.25+1` with backend `2.46.0`, and loaded `qwen3-coder-30b-a3b-instruct@q4_k_m` at context length 32768. The deterministic gate then failed, so the disposable live workload correctly stopped with zero provider attempts and rounds. Live reads, new-file creation, substantial GEP edit, validation, durable reopen, tokens, timing, live transmission ratio, and human intervention remain Evidence Gaps rather than zero-valued results.

P4 recorded `272/275` on the focused floor and `514/518` with 3 failures and 1 native-TTY skip on the single broad run. The failures were:

1. Phase 5 long workflow expected `completed` but observed `budget_exhausted`; cause remains unestablished and it is an inherited-floor failure.
2. Frozen Phase 8 structured replay left `label.js` unchanged because receipt-only evidence broke the legacy mutation fallback.
3. Frozen framing-authority recovery received no reread SHA for the same P3 compatibility defect.

The broad suite remains Not Green and was not rerun for this closeout.

## Decision table

| Decision | State | Evidence / consequence |
| --- | --- | --- |
| Terminal TaskState Integrity Qualified | **Green** | Source audit plus state/structured/session regressions |
| Active Work Unit Terminalization Qualified | **Green** | Active unit becomes `blocked`; `currentWorkUnit` clears atomically |
| StackState Child Terminalization Qualified | **Green** | Nested terminal child remains structurally valid |
| Durable Session Round Trip Green | **Green** | Legitimate terminal states reopen; impossible state still rejects |
| Default Provider Emergency Ceiling 300s | **Green** | Constant, config, adapter, and fake-time checks |
| Maximum Configurable Provider Ceiling 600s | **Green** | Values above 600000 ms reject |
| Healthy Active Generation Beyond 120s Qualified | **Green, deterministic** | Productive scripted generation completed at 180000 ms; live observation absent |
| First-Useful-Output Guard Preserved | **Green** | Accepted prefill does not become useful output |
| Active-Inactivity Guard Preserved | **Green** | 60000 ms active silence still aborts |
| Caller Cancellation Preserved | **Green** | Caller abort wins and prevents unsafe continuation |
| Finite Retry/Rebase Safety Preserved | **Green** | Bounded retry/rebase and provisional-branch discard passed |
| George Edit Protocol v1 Qualified | **Not Green** | Parser/expansion pass, but required legacy coexistence fails |
| Ephemeral Read Receipt Freshness Qualified | **Green** | Run-local epoch, restart, reread, and current SHA checks passed |
| GEP Parser/Framing Qualified | **Green** | Length framing, bounds, ambiguity rejection, LF/CRLF passed |
| SHA Preconditions Preserved | **Green** | Expansion derives and rechecks receipt SHA through canonical mutation |
| Text Framing Preserved | **Green** | Canonical mutation framing tests passed |
| ToolRegistry/Permission Boundary Preserved | **Green** | GEP expands through registered mutation tools and normal approval |
| Response Completion Before Mutation Preserved | **Green** | Partial/incomplete GEP and tool proposals do not execute |
| Legacy Mutation Compatibility Preserved | **Not Green** | Two frozen fallback/recovery regressions fail |
| Mutation Transmission Ratio | **Green** | `0.19382022471910113`, with byte-identical output |
| Node 26 + Real LM Studio/Qwen Live Qualification | **Evidence Gap** | Common validity Green; integrated workload Not Run after deterministic gate failed |
| Phase 5/9 Reliability Floors | **Not Green** | Phase 5 failure plus two frozen structured/fallback failures |
| Broad Suite | **Not Green** | P4: 514 passed, 3 failed, 1 native-TTY skip; not rerun here |
| Phase 10 P7 Historical/Intermittent Evidence Preserved | **Not Green, historical/intermittent** | Current assertion passed; prior lifecycle-order failure remains immutable |
| Remaining Blocking Failure Count | **Not Green — 3 failing tests** | One unresolved inherited-floor failure and two correction-local P3 compatibility failures |
| Nonblocking Evidence Gaps | **Evidence Gap** | Integrated live workload/metrics and native real-TTY evidence absent |
| Overall `c10-generation-bottleneck` Qualified | **Not Green / No** | Correction-local compatibility blockers and required live evidence gap remain |
| Phase 10 Closeout Ready To Reassess | **Not Green / No** | The correction has not established a qualified replacement candidate |

## Historical evidence preserved

No prior result is relabeled:

- Phase 8 `c8-agentic-context` remains Not Green / Evidence Gap, including the failed edit-plus-validation workload and missing healthy envelope/adjacent cliff/runtime controls.
- Phase 9 greeting, three-file, and Gate A remain Green in their recorded final sweep; B2 remains Not Green after failed P2 V1/correction, and C2 remains Not Green after provider stall/timeout exhaustion before mutation/validation.
- Formal Phase 10 remains Not Green / not ready for Phase 11. Its unsupported earlier primary-provider runs, absent comparable P1-to-final delta, P10 benchmark/live Evidence Gaps, helper A/B Evidence Gap, and P7 historical/intermittent Not Green lifecycle-order result remain unchanged.
- Current P4/closeout passes of the P7 assertion establish only intermittency; they do not erase the historical failure.

## Bounded closeout recheck

No live workload, benchmark, frozen B2/C2 workload, or broad suite was rerun.

| Check | Result |
| --- | --- |
| P4 correction-focused deterministic command | **Not Green — 275 total; 272 passed; 3 failed; 0 skipped**; exact same failure identities/signatures as P4 |
| `fnm exec --using=26.10.0 npm run typecheck` | **Green** |
| `fnm exec --using=26.10.0 npm run test:runner` | **Green — 90/90** |
| `git diff --check` | **Green** |
| Package / root lockfile | **Green — `0.10.12`; root `package-lock.json` absent** |

The focused rerun again passed the Phase 10 P7 assertion. Under the flaky-test rule, that pass does not erase its earlier Not Green result.

## Verdict and roadmap boundary

`c10-generation-bottleneck` is **Not Green and not Qualified**. Performance and transmission-efficiency evidence cannot convert the functional legacy-compatibility failures, inherited reliability failure, or missing integrated live workload to Green.

Phase 10 formal closeout/readiness is **not ready to be reassessed** from this candidate. A later authorized implementation correction must repair the P3 legacy fallback defect with a permanent regression guard, resolve or validly characterize the remaining inherited-floor failure, restore the required deterministic gate, and obtain the required supported live workload evidence. This document does not owner-close Phase 10, declare Phase 10 Green, authorize Phase 11 planning, or open Phase 11.
