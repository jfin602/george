# Phase 10 P1 Baseline

Status: DETERMINISTIC INSTRUMENTATION GREEN; LIVE EVIDENCE GAP

Date: 2026-09-26  
Package: `0.10.1`  
Pre-task HEAD: `3249b3d5194fd075b54bf0983ea4056ebd6a4475`  
Implementation identity: uncommitted P1 working-tree result; the Petri phase runner owns the authoritative implementation commit.

## Candidate and provenance

| Dimension | Observed value |
| --- | --- |
| OS | Linux 7.0.0-31-generic x86_64 |
| Node | `v24.21.0` |
| npm | `11.19.0` |
| Required Node | `>=26.4.0 <27` |
| Provider endpoint | `http://127.0.0.1:1234` |
| Provider probe | connection refused before any official provider attempt |
| Configured default model | `qwen3-coder-30b-a3b-instruct@q4_k_m` |
| Loaded/pinned model evidence | unavailable; no LM Studio model endpoint was reachable |
| Runtime controls / GPU Offload 26 | unavailable |
| Human coding intervention in live work | not applicable; live work did not start |
| Root `package-lock.json` | absent |

The available Node 24 runtime is below the supported Node 26.4+ floor. LM Studio was also unreachable. These are common validity failures, so P1 did not run mock or unsupported live evidence.

## Comparable telemetry baseline

Benchmark schema remains `3` / suite `v3`; live-work artifacts remain additive schema `2`, and the existing schema-1 live-work recognizer is unchanged. Historical artifacts retain their original semantics.

| Metric | P1 production source | Unavailable/default semantics |
| --- | --- | --- |
| provider input/output tokens | existing provider usage | `null`/absent unless every applicable completed response reports it |
| cached input tokens | LM Studio `input_tokens_details.cached_tokens` | `null` unless every applicable completed response reports it; never inferred |
| internal text bytes / estimated tokens | future Operation-mode producer | `null`; P1 does not classify Human text as internal text |
| tool batch count / widths | completed provider responses containing tool calls | `0` / empty widths when no completed tool batch is observed |
| concurrent read batch count | future concurrency producer | `0` before concurrency exists |
| parallel wall time / summed child runtime | future concurrency timing producer | `null` before timing exists |
| model rounds avoided | future deterministic-transition producer | `0` before round elimination exists |
| George controls | future Operation Protocol producer | `0` before controls exist |
| Human / Operation rounds | future explicit execution-mode producer | `null` / `null`; P1 does not infer mode |
| correction cycles | projected TaskState corrections in live work | projected count when TaskState exists; otherwise `0` |

Benchmark JSON, Markdown reports, and comparisons now expose the compatible fields. Live trace JSON exposes the same metric names. Metrics are observation only and grant no execution authority.

## Frozen fast live instruments

| Gate | Instrument | Version | Task digest | Fixture digest | Acceptance version / SHA-256 |
| --- | --- | ---: | --- | --- | --- |
| B3 | `greenfield-core-v1` | 1 | `1e4db7e14cdbdfcf6711367c4b920a17caf819d8281e5bf82e0f59b2b85eb95e` | n/a | 1 / `6fae093f474006f0b097f38b900dfda39613719f6ae2e2e8e883193f987137c0` |
| C3 | `existing-core-edit-v1` | 1 | `a3f3628d8c4df48708cd96dae04710a8ccabcc4a6818102f92d56750327028df` | `d455c41b7f6da50c322fd8e54a04241ad06f030284ef6bf5e4c08003ba5b8a7b` | 1 / `11d61eef45433f07514f10b19772139e813a245a9a7915def2c496193728d491` |

B3 is a two-task pure-Node stack. P2 imports the P1 title normalizer, so stack ordering has a real cross-task dependency. C3 is a tiny existing pure-Node repository requiring source/test/README inspection, preservation of the baseline normalizer, one feature, focused validation, broad validation, TaskState completion, and hidden acceptance. Both prohibit network and dependency installation. Acceptance code is outside the copied/model-visible workspace and independently versioned.

Once either v1 instrument is used in an official live attempt, structural changes require a new instrument version. Acceptance behavior changes require a new acceptance version and digest independently of the task/fixture version.

## Baseline executions

### Benchmarks

| Suite | Result | Artifact path |
| --- | --- | --- |
| quick | Evidence Gap — Not Run; supported runtime/provider unavailable | none |
| full | Evidence Gap — Not Run; supported runtime/provider unavailable | none |

No `artifacts/benchmarks/<run-id>/results.json` or report was created. A failed unsupported run was not substituted for a baseline.

### Fast live matrix

Canonical order and qualification-owned ceilings are frozen as:

`greeting (120000 ms) -> three-file (240000 ms) -> Gate A (360000 ms) -> B3 (300000 ms) -> C3 (240000 ms)`

Common state: Evidence Gap / invalid for live execution because the supported Node/runtime/model gates were unavailable.

| Workload | Observed result | Attempts | Artifact path |
| --- | --- | ---: | --- |
| greeting | Not Run | 0 | none |
| three-file | Not Run | 0 | none |
| Gate A | Not Run | 0 | none |
| B3 | Not Run | 0 | none |
| C3 | Not Run | 0 | none |

The matrix was not spent. B2 and C2 were not run.

## Deterministic validation

- Focused benchmark/provider/session/live-work/sweep/B3/C3 set: Green, 86 tests passed, 0 failed, 0 skipped.
- Phase 9 frozen-instrument and inherited qualification regression: Green, 5 tests passed, 0 failed, 0 skipped.
- TypeScript: Green, `npm run typecheck`.
- Phase runner: Green, 90 tests passed, 0 failed, 0 skipped via `npm run test:runner`.
- Diff hygiene: Green, `git diff --check` produced no findings.
- Root `package-lock.json`: absent.

P1 changes observability and qualification plumbing only. It does not add Operation mode, stable-prefix behavior, concurrency, model-round elimination, helper inference, or production provider/tool orchestration changes.
