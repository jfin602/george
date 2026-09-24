# P5 provider-native continuation reuse experiment

Status: **REJECTED — correctness regression despite lower reported continuation input**

Date: 2026-09-24  
Package: `0.8.5`  
Pre-task HEAD: `6d6733d9edd31b18425fa710cb7f8637030e7d77`

## Hypothesis and deterministic proof

The sole candidate omitted unchanged `instructions` and `tools` from LM Studio Responses requests that carried `previous_response_id` and function-call outputs. The application still supplied the complete canonical normalized request on every round; a rejected compact request would have fallen back once to that complete body. No session, transcript, tool ordering, permission, retry, recovery, or cross-turn state behavior was changed.

Wire fixtures proved initial, compact continuation, full fallback after HTTP 422, cancellation, and HTTP-500 request shapes. They also proved that cancellation/error paths did not retry or replay. The candidate was then removed after live correctness failed. The retained adapter fixtures now assert the final complete initial/continuation bodies, rejection without blind replay, cancellation, and provider-error paths. The application fixture asserts that canonical instructions and tools remain present for tool continuations. `previous_response_id` remains an optional provider transport value, never canonical session authority; interrupted continuations remain historical evidence and are not replayed.

## Controlled live evidence

The paired runs used the real application/provider/tool path. The quick suite contains `structured-tool-use-001` and `independent-multi-tool-001`, each of which performs an intra-turn `read_file` continuation. The control temporarily restored the pre-experiment complete continuation body; the candidate omitted the two repeated fields. The final source state is the control body.

Control command:

```bash
npm run benchmark -- --suite quick --repetitions 3 --label p8-p5-reuse-control
```

Control artifact: `/home/jfin/dev/george/artifacts/benchmarks/2026-09-24T22-14-08-218Z-173981`

Candidate command:

```bash
npm run benchmark -- --suite quick --repetitions 3 --label p8-p5-reuse-candidate --compare /home/jfin/dev/george/artifacts/benchmarks/2026-09-24T22-14-08-218Z-173981/results.json
```

Candidate artifact: `/home/jfin/dev/george/artifacts/benchmarks/2026-09-24T22-15-22-376Z-174448`

Both runs were dirty at the pre-task HEAD above, on Node `v24.21.0`, Linux `7.0.0-31-generic`, AMD Ryzen AI 9 465 w/ Radeon 880M, 20 CPUs, 32,910,184,448 bytes memory, with model `qwen3-coder-30b-a3b-instruct@q4_k_m` at `http://127.0.0.1:1234`.

REST-visible runtime control matched: context length `32768`, eval batch `2048`, physical batch `512`, parallel `1`, Flash Attention `true`, GPU KV-cache offload `true`, and experts `8`. The LM Studio UI-only GPU Offload `26` value was not independently observable: **Evidence Gap**.

| Tool-bearing evidence | Complete-body control | Omitted-fields candidate |
| --- | ---: | ---: |
| Correct tool cases | 5/6 | 4/6 |
| Structured-tool cases | 2/3 | 1/3 |
| Independent-multi-tool cases | 3/3 | 3/3 |
| Structured provider input when completed | 747 | 442 |
| Multi-tool provider input | 881 | 576 |
| Logical provider calls/rounds on completed tool cases | 2 / 2 | 2 / 2 |
| Retries | 0 | 0 |

The candidate saved 305 provider-reported input tokens in each successful tool-bearing case and had faster observed provider-active time in several samples. That benefit is invalid: two candidate structured-tool runs performed the expected tool call but returned an incorrect final answer. The control separately had one known LM Studio pre-response `Engine protocol predict request failed: fetch failed`; it is retained as a provider failure, not attributed to the candidate. Neither run is a Green performance qualification.

## Decision and validation

**REJECTED.** LM Studio accepts the compact request shape but does not reliably retain enough instructions/tool semantics for the structured continuation. The candidate implementation and its fallback were reverted. George retains the established complete continuation request as the rebuild/fallback-safe path; it preserves canonical context, permissions, ordering, transcript commit rules, and Phase 5 no-blind-replay recovery behavior. No cross-turn reuse, parallelism, batching, or cache authority was added.

Final reverted-state validation:

- `node --test test/unit/provider/lm-studio.test.ts test/unit/application/one-turn.test.ts test/unit/application/recovery.test.ts test/integration/agent-loop.test.ts`: **66/66 pass**.
- `npm run typecheck`: pass.
- Broad direct Node run: **285/312 pass**; the same 27 pre-existing OpenTUI native-FFI failures reproduced, including the Phase 4 renderer fixture. No failure is in the provider/application experiment path.
- `npm run test:runner`: **90/90 pass**.
- `git diff --check`: pass. No `package-lock.json` exists.

P3 remains **Not Green** (14/15 live ladder) and P4 remains **REJECTED / NO MATERIAL BENEFIT**. Their recorded runtime-control Evidence Gap and pre-existing TUI native-FFI Not Green state are unchanged.
