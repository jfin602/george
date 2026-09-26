# c9 turn context convergence P4 live evidence

Status: **HARD PREFLIGHT GREEN; BROAD REGRESSION DELTA GREEN; RUNTIME EVIDENCE GAP; LIVE WORK NOT RUN**

Date: 2026-09-26

Pre-task HEAD: `25d51a93d229e9b8cc76f56eb4b7b9afae1a5723`

Package: `0.9.10` (unchanged)

P4 made no production, test, fixture, profile, runtime, TUI, qualification-semantic, instrument, or hidden-acceptance change. It stopped at the first required live boundary because LM Studio exposed no loaded instance from which the required REST-visible runtime controls could be captured.

## Hard affected-system preflight

All hard checks ran under Node `v26.10.0` and npm `11.19.1`.

| Check | Result |
| --- | --- |
| Provider projection/contract; continuation accounting and promotion; context assembler/profile selection/one-turn | **Green**, included in affected floor |
| Tool registry, mutation, process/sandbox, recovery, Git dirty-state | **Green**, included in affected floor |
| TUI composition and greeting guard | **Green**, included in affected floor |
| Qualification/live-work helpers and frozen three-file hashes | **Green**, included in affected floor |
| Phase 9 task/stack integration, frozen Gate A replay, v1/v2 immutability | **Green**, included in affected floor |
| Complete affected deterministic floor | **Green: 216/216 passed** before evidence generation and **Green: 216/216 passed** after evidence generation |
| `npm run typecheck` | **Green** |
| `npm run test:runner` | **Green: 90/90 passed** |
| Package / root lockfile / initial diff hygiene | **Green:** exactly `0.9.10`, no root `package-lock.json`, `git diff --check` passed |

## Controlled broad regression delta

The exact baseline `d7804684801fa8418050c34d9ef097ca1adf80b6` and candidate `25d51a93d229e9b8cc76f56eb4b7b9afae1a5723` were materialized with `git archive` without moving active HEAD. Both used Node `v26.10.0`, npm `11.19.1`, exact `npm test`, non-TTY execution, identical hard-linked `node_modules`, package/dependency identity `d01d095de8e27144ee1a0967e8f54b0aa3cc1ce5281b753138e1d9c708041c5c`, and identical read-only copies of Git metadata.

| Run | Aggregate | Exact retained observations |
| --- | --- | --- |
| Baseline | **Not Green: 389 passed, 5 failed, 1 skipped; 395 total** | Five OpenTUI renderer identities and the native real-TTY skip |
| Candidate | **Not Green: 401 passed, 4 failed, 1 skipped; 406 total** | Four of the same renderer identities and the same native real-TTY skip |
| Regression delta | **Green** | No new or worsened identity/category/signature; one baseline renderer timeout passed |

The tracked delta is the exact output of `classifyQualificationPreflight()` for the bounded summaries with hard preflight Green. Counts are supporting evidence only. Aggregate broad remains Not Green and is not relabeled by the Green delta.

One discarded setup invocation intended for the baseline ran from the active candidate directory before the working directory error was noticed. It changed nothing, is not used by the comparison, and the baseline and candidate summaries above each come from their correctly materialized tree.

## Runtime provenance — Evidence Gap

Before live work P4 printed:

`MANUAL CHECK: LM Studio GPU Offload must show 26`

`GET http://127.0.0.1:1234/api/v1/models` listed the exact required model `qwen3-coder-30b-a3b-instruct@q4_k_m`, but its `loaded_instances` array was empty. Every other listed model also had no loaded instance.

Therefore P4 could not capture the required pre-live REST-visible context length, eval batch, physical batch, parallelism, Flash Attention, GPU KV-cache offload, or expert count. Main-model GPU Offload 26 also remained UI-only and unobserved. No model/runtime setting was changed and no warm-up or unofficial provider request was used to manufacture provenance.

This is an **Evidence Gap** at the first required live boundary. The stop contract prevents spending any live smoke or gate.

## Live sequence

| Evidence | State | Reason |
| --- | --- | --- |
| Ordinary greeting smoke | **Not Run by gate** | Required REST-visible loaded-runtime controls unavailable |
| Synthetic three-file inspection smoke | **Not Run by gate** | Greeting was not reached |
| Fresh Gate A | **Not Run by gate** | Both smokes were not Green |
| Fresh Gate B2 | **Not Run by gate** | Gate A was not reached |
| Gate C2 | **Not Run by gate** | B2 was not reached; C2 remains unspent |

No greeting, three-file, Gate A, Gate B2, or Gate C2 attempt/trace JSON exists because no official attempt began. Historical Gate A/B2/correction evidence remains unchanged.

## Final validation after evidence generation

- Affected deterministic floor: **Green: 216/216 passed**.
- Fresh current broad `npm test`: **Not Green: 400 passed, 5 failed, 1 skipped; 406 total**. It reproduced the complete retained baseline identity/signature set and introduced no new failure or skip.
- Package: **Green**, exactly `0.9.10`.
- Root `package-lock.json`: **Green**, absent.
- `git diff --check`: **Green**.

The controlled candidate run had four retained failures while the final current characterization had all five retained failures. This is the known renderer timing variability; both sets are subsets of the exact controlled baseline identities and neither aggregate is called Green.

## Bounded JSON and SHA-256

| JSON | SHA-256 |
| --- | --- |
| `evidence/broad-baseline.json` | `f6a2ebaeced5c9ba0f694049f9d219d5f4e8a7536befbd37ce09d9046914a8f4` |
| `evidence/broad-candidate.json` | `8e013c706b88199c7e5afb7d50c8b33c7461ba8f4645dc9225cb2a7e9976b321` |
| `evidence/broad-delta.json` | `6ae0b600619afa29fd962948e3fa99f0f2767e354072a4dad3bfac8385612a86` |
| `evidence/runtime.json` | `b1003428f26e84f3fef29501d7345cc0457ef43647a7c36e152565c4ef02c943` |

No raw provider stream, assistant prose log, write/patch/file body, unbounded Git snapshot/log, workspace copy, dependency tree, secret, or environment dump is tracked.

## Qualification result

| Decision | State |
| --- | --- |
| Hard affected-system preflight | **Green** |
| Aggregate broad suite | **Not Green — retained** |
| Broad regression delta | **Green** |
| REST-visible loaded runtime controls | **Evidence Gap** |
| P4 live qualification | **Evidence Gap / stopped** |
| Phase 9 ready for owner closeout | **No** |

Phase 9 remains open. Phase 10 remains unopened.
