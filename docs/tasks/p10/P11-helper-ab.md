# Phase 10 P11 Helper A/B Experiment

Result: **Evidence Gap**

Date: 2026-09-26 CDT

Pre-task HEAD: `5aed800278faa03f509dbec9b0dad4b02e7687c4`

Implementation result: uncommitted evidence/version changes on that HEAD; the Petri runner owns the authoritative commit

Package: `0.10.11`

P11 did not change production behavior, add helper routing, install a model, or run B2/C2. The accepted Phase 10 primary-only baseline remains unchanged.

## Selected experiment

Exactly one helper job was selected: bounded compression of recent completed `read_file` results before the next primary-model continuation. The frozen comparison workload would have been benchmark case `multi-round-repository-001` version 1 from benchmark suite v3, using the same fixture and acceptance in both arms: exactly four `read_file` calls and final answer `REPOSITORY_TRACE_CONFIRMED`.

The helper arm would use the existing provider-independent `ContextCompactor` boundary with no advertised tools. Its output would be limited to 16 KiB, labeled `DERIVED HELPER CONTEXT — NON-AUTHORITATIVE`, and supplied only as discardable provider context. Canonical tool results, session events, TaskState/StackState, permission decisions, validation results, completion state, and instruction precedence would remain George-owned. Empty, oversized, malformed, tool-calling, failed, timed-out, or absent helper output would be discarded and the unchanged primary-only arm used.

This design was not implemented because no explicitly configured secondary local model was available. It remains experiment definition, not production architecture.

## Runtime discovery

| Evidence | Observation |
| --- | --- |
| Configured primary model ID | `qwen3-coder-30b-a3b-instruct@q4_k_m` |
| Primary model loaded proof | unavailable |
| Helper model ID | unavailable; no candidate was selected or substituted |
| `GET http://127.0.0.1:1234/api/v1/models` | connection refused, curl exit 7 |
| `GET http://127.0.0.1:1234/v1/models` | connection refused, curl exit 7 |
| LM Studio CLI discovery | `lms` not installed, exit 127 |
| Visible LM Studio/model processes | none matched `lm studio`, `lm-studio`, `llama`, or `qwen` |
| Node / npm | `v24.21.0` / `11.19.0`; Node is below the required `>=26.4.0 <27` range |
| Host memory at discovery | 32,910,180,352 bytes total; 25,935,454,208 bytes available; no swap |

The REST probes are the authoritative current loaded-model check available on this host. They could not establish even the primary runtime, much less a distinct loaded helper. Per R5/S1, P11 stopped before an A/B run rather than using the configured primary model as a helper or installing another runtime.

## A/B measurements

| Metric | Primary-only | Helper-assisted | Delta |
| --- | ---: | ---: | ---: |
| Helper latency | not applicable | unavailable | unavailable |
| Helper input/output tokens | not applicable | unavailable | unavailable |
| Primary provider rounds | unavailable | unavailable | unavailable |
| Primary input/output tokens | unavailable | unavailable | unavailable |
| Total elapsed | unavailable | unavailable | unavailable |
| Memory/runtime overhead | unavailable | unavailable | unavailable |
| Task correctness | not run | not run | unavailable |
| Hidden acceptance/validation | not run | not run | unavailable |
| New failure mode | none introduced | candidate absence prevented execution | not comparable |

Unavailable measurements are not recorded as zero. No benefit claim is possible.

## Boundary and fallback result

- Helper authority: none; no helper request was made and no production delegation exists.
- Derived-context bound: the existing compactor rejects empty, NUL-containing, tool-calling, incomplete, or over-16-KiB output, but no P11 helper harness was added without a valid candidate.
- Fallback: the production primary-only path is untouched and remains the only path.
- Canonical evidence: unchanged; no helper output exists.
- B2/C2: not run.

## Validation

| Gate | Result |
| --- | --- |
| P11 experimental helper tests | not applicable: S1 stopped the task before a harness was created |
| Existing compaction/fallback boundary | Green: 69 passed, 0 failed (`one-turn.test.ts` and `provider-stall.test.ts`) |
| `npm run typecheck` | Green |
| `npm run test:runner` | Green: 90 passed, 0 failed |
| `git diff --check` | Green |
| Root `package-lock.json` | absent |

Final classification: **Evidence Gap**. Phase 12 may revisit the single selected job only after an explicit secondary local model is loaded and after the Phase 11 primary-only baseline is frozen; it must then measure the complete end-to-end A/B before any promotion.
