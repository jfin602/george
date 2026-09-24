# P3 adaptive-profile qualification evidence

Status: **NOT GREEN** — deterministic qualification is Green; the final live ladder is 14/15 and its GPU Offload 26 control is an Evidence Gap.

Date: 2026-09-24  
Package: `0.8.3`  
P1-P2 candidate SHA / pre-task HEAD: `7bc21ee2f94386e247b28488b93a94155c5388a4`  
Live-run provenance: that SHA with this P3 working tree dirty; Node `v24.21.0`; Linux `7.0.0-31-generic`; AMD Ryzen AI 9 465 w/ Radeon 880M; 20 CPUs; 32,910,184,448 bytes memory.

## Scope

Only benchmark requested-band tooling changed: its maximum is now `24,576`, with a 24k synthetic shape that assembles within the existing large profile. The normal context default remains the existing four-band ladder; runtime profile ceilings and values are unchanged.

The final-large required-source probe now returns the large selection to the canonical assembler. This preserves existing Phase 5 hard-pressure compaction rather than making an adaptive large turn fail before its canonical compaction path can run.

## Deterministic qualification — Green

Focused command:

```bash
node --test test/unit/benchmark/index.test.ts test/unit/context/profile-selector.test.ts test/unit/context/profiler.test.ts test/unit/application/one-turn.test.ts
```

Result: **52/52 passed**.

The test set proves:

- ordinary, medium, and large fixtures select as required; identical session state produces identical selected diagnostics and source evidence;
- each fixed ordinary/medium/large override has no adaptive attempts or promotion;
- required-source failures promote ordinary -> medium -> large; applicable selected project instructions, routed documents, and activated skills promote; lower-value optional material may omit/defer;
- discarded probes have no provider, tool, hook, session, permission, or duplicate canonical source-evidence effects; source ordering/precedence stays deterministic;
- a selected profile remains fixed through tool continuation; ordinary and medium make zero compactor calls; large preserves soft and hard compaction plus checkpoint evidence;
- diagnostics retain bounded mode, attempts, and promotion reasons; the 24,576 requested-band parser accepts exactly the new upper bound and rejects 24,577.

The broader existing Phase 5 compaction/recovery tests in the same one-turn file also passed.

## Live ladder — Not Green

Exact controlled command was run after the 24k bound/shape check:

```bash
echo "MANUAL CHECK: LM Studio GPU Offload must show 26" && \
curl -fsS http://127.0.0.1:1234/api/v1/models | jq '
.models[]
| select(.key == "qwen3-coder-30b-a3b-instruct@q4_k_m")
| {
    key,
    loaded_instances: [
      .loaded_instances[]
      | {
          id,
          context_length: .config.context_length,
          eval_batch_size: .config.eval_batch_size,
          physical_batch_size: .config.physical_batch_size,
          parallel: .config.parallel,
          flash_attention: .config.flash_attention,
          offload_kv_cache_to_gpu: .config.offload_kv_cache_to_gpu,
          num_experts: .config.num_experts
        }
    ]
  }
' && \
npm run benchmark -- \
  --suite context \
  --context-bands 2048,4096,8192,16384,24576 \
  --repetitions 3 \
  --label p8-adaptive-profile-qualification \
  --compare /home/jfin/dev/george/artifacts/benchmarks/2026-09-24T20-03-38-980Z-90704/results.json
```

Final artifact (ignored local benchmark output):

`/home/jfin/dev/george/artifacts/benchmarks/2026-09-24T22-02-56-512Z-148135`

REST-visible settings matched the accepted control: model key/instance matched; context length `32768`; eval batch `2048`; physical batch `512`; parallel `1`; Flash Attention `true`; GPU KV cache offload `true`; experts `8`. The main-model GPU Offload UI value **26 was not independently observable from this environment**. Therefore controlled-runtime provenance is **Evidence Gap**, not Green.

Correctness is separate from timing:

- result: **14/15 passed**, 15 provider attempts, 14 provider rounds, 0 tool calls, 0 retries;
- 24,576 band: **3/3 passed**, actual provider input `13,821` tokens;
- 8,192 repetition 2 failed before a provider response with `Engine protocol predict request failed: fetch failed`;
- this is a live provider failure, so the ladder is **Not Green** and cannot be accepted as a performance result.

| Requested band | Result | Actual provider input | Rep-1 provider/model | Warm provider/model (reps 2-3) |
| ---: | --- | ---: | ---: | --- |
| 2,048 | 3/3 pass | 1,466 | 1,213 ms | 1,843 / 1,188 ms |
| 4,096 | 3/3 pass | 2,746 | 1,109 ms | 1,034 / 1,057 ms |
| 8,192 | 2/3 pass | 5,306 | 1,344 ms | failed / 1,531 ms |
| 16,384 | 3/3 pass | 10,428 | 2,429 ms | 2,026 / 2,072 ms |
| 24,576 | 3/3 pass | 13,821 | 94,802 ms | 2,835 / 2,828 ms |

The table intentionally separates the first shape pass from warm repetitions. The 24k first shape took 94.802 s with first output at 92.417 s; its warm first-output timings were 640 ms and 611 ms. No speed claim is made because the run failed and runtime control is not fully evidenced.

An earlier same-command preflight artifact, `/home/jfin/dev/george/artifacts/benchmarks/2026-09-24T21-59-56-548Z-147432`, showed the original 24k synthetic fixture exceeded the large budget before provider execution. It is retained only as diagnostic evidence; the final artifact above uses the bounded 24k fixture and is the relevant result.

## Gate truth

| Evidence | State |
| --- | --- |
| Deterministic adaptive/profile/recovery qualification | Green |
| Requested 24,576 benchmark-tool acceptance | Green |
| Live 24k execution | Green (3/3) |
| Complete live context ladder | Not Green (14/15) |
| Independently confirmed GPU Offload 26 control | Evidence Gap |
| P3 hard gate | **Not Green** |

## Validation

- `npm run typecheck`: pass.
- Focused P3 command above: 52/52 pass.
- `npm run test:runner`: 90/90 pass.
- Broad direct Node test command: 280/307 pass; 27 **pre-existing TUI Not Green** failures use the same unavailable OpenTUI native FFI path, including the Phase 4 fixture renderer setup. They were reproduced, not hidden or relabeled.
- `npm test` and `npm run test:tui` cannot start on local Node `v24.21.0` because it rejects the repository-required `--experimental-ffi` option; the direct broad run above confirms the same native-FFI limitation.
- No `package-lock.json` exists.
