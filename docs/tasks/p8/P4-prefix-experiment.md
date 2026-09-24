# P4 stable-prefix experiment

Status: **REJECTED / NO MATERIAL BENEFIT**

Date: 2026-09-24  
Package: `0.8.4`  
Pre-task HEAD: `214d52aea8d2453f9544a21e0048aa454ed28c06`

## Candidate and deterministic audit

The context assembler already emits deterministic guidance/conversation/tool-definition channels from ordered source identity. The application sends the rendered guidance and conversation as the Responses `instructions` and initial `input`; the LM Studio adapter sends the same registry tool definitions separately. No context source, precedence, disposition, profile threshold, message role, permission, canonical session state, or continuation behavior was changed.

The one candidate canonically sorted object keys in the complete LM Studio Responses JSON body, retaining arrays unchanged. A focused adapter fixture proved raw request bytes were identical for equivalent tool schemas constructed with different object-key insertion order. The candidate was then removed: it did not reduce provider input tokens, and no LM Studio prefix/cache reuse or latency benefit attributable to it was observed. The retained context regression test proves identical logical context has byte-stable rendered provider-facing portions and identical source ID/precedence/order/disposition.

## Controlled benchmark

Command:

```bash
npm run benchmark -- --suite context --context-bands 2048,4096,8192,16384,24576 --repetitions 3 --label p8-stable-prefix-experiment --compare /home/jfin/dev/george/artifacts/benchmarks/2026-09-24T22-02-56-512Z-148135/results.json
```

Candidate artifact: `/home/jfin/dev/george/artifacts/benchmarks/2026-09-24T22-08-48-666Z-161845`.

Provenance: dirty working tree at pre-task HEAD above; Node `v24.21.0`; Linux `7.0.0-31-generic`; AMD Ryzen AI 9 465 w/ Radeon 880M; 20 CPUs; 32,910,184,448 bytes memory; model `qwen3-coder-30b-a3b-instruct@q4_k_m`; LM Studio `http://127.0.0.1:1234`.

REST-visible runtime control matched P3: context length `32768`, eval batch `2048`, physical batch `512`, parallel `1`, Flash Attention `true`, GPU KV-cache offload `true`, experts `8`. The LM Studio UI-only GPU Offload `26` setting was not independently observable: **Evidence Gap**.

The candidate run passed **15/15**, with 15 provider attempts/rounds, zero tools, and zero retries. Provider input remained exactly `1,466`, `2,746`, `5,306`, `10,428`, and `13,821` tokens for the five bands—zero context reduction. Its medians were 1,244 ms, 1,053 ms, 1,413 ms, 2,230 ms, and 2,869 ms. These are not an attributable improvement: the P3 comparison artifact is 14/15 after an 8k provider failure and includes a 94.8 s first 24k shape, while benchmark process order is not proof of cache residency. No provider-reported prefix-cache metric exists in this run.

## Decision and validation

The canonical-serialization candidate is reverted. Do not infer provider-native reuse from deterministic JSON bytes; P5 owns any continuation/reuse experiment.

Final reverted-state validation: focused context/provider/profile/one-turn tests **71/71 pass**; `npm run typecheck` passes; `npm run test:runner` **90/90 passes**. The direct broad Node run is **280/307 pass** with the same 27 pre-existing OpenTUI native-FFI failures, including the Phase 4 renderer fixture; no failure is in this experiment's context/provider path. P3's complete live ladder remains **Not Green** (14/15), and its GPU Offload 26 confirmation remains an **Evidence Gap**; neither is relabeled by this experiment. `npm test`/`npm run test:tui` remain unavailable on Node `v24.21.0`, which rejects the repository-required `--experimental-ffi` option.
