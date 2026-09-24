# P6 integrated Phase-8 qualification evidence

Status: **IMPLEMENTATION QUALIFIED DETERMINISTICALLY; NOT STABILITY GREEN**

Date: 2026-09-24  
Final candidate: pre-task HEAD `0c2e812fdc18f9255240c0a1c5b56b7fe505cdbd` (`0.8.5`), with this P6 working tree limited to `package.json` version `0.8.6` and this evidence record. No Phase-8 source behavior was changed in P6. Benchmark artifacts report that HEAD as dirty, which is accurate for this final uncommitted candidate.

## Qualification matrix

| Layer | State | Evidence |
| --- | --- | --- |
| Adaptive versus fixed configuration | Green | `profile-selector` and `one-turn` fixtures prove normal adaptive selection and fixed ordinary/medium/large overrides without probing or promotion. `DEFAULT_CONTEXT_PROFILE` remains large. |
| Ordinary, medium, large selection; deterministic monotonic promotion | Green | Focused 89/89 run proves ordinary -> ordinary, required/pressure promotion through medium and large, equal-input equality, and bounded diagnostics. |
| Per-turn immutability and no selection provider call | Green | One-turn tool-continuation fixture emits one canonical context assembly and preserves selected instructions/input for both provider rounds; normal selected turns make one initial provider request. |
| Required/current/project/routed/skill retention; optional defer | Green | Real-assembly fixtures promote selected project, routed-document, and activated-skill material; low-value optional personality material remains explicitly omitted/deferred without promotion. |
| Probe neutrality and canonical evidence | Green | Selector probes use the real assembler without provider, tool, hook, session, permission, or source-lifecycle effects; final assembly alone emits canonical source evidence. |
| Precedence, order, provenance | Green | Context tests prove stable source IDs/precedence/order, whole-source dispositions, and byte-stable provider-facing portions for identical logical context. |
| Compaction, cancellation, failure, recovery, canonical history | Green | Ordinary/medium fixtures make zero compactor calls; large soft/hard-pressure fixtures retain compaction/checkpoints. Existing failed/cancelled compaction, replay-safe recovery, and canonical-history tests passed in the focused run. |
| P4 stable-prefix state | Green | P4 remains **REJECTED / NO MATERIAL BENEFIT**. Its candidate serialization was reverted; source ordering and rendered stable portions are deterministic without a provider-cache claim. |
| P5 continuation/reuse state and fallback | Green | P5 remains **REJECTED**. Focused provider/application/recovery fixtures prove complete continuation bodies, rejected-continuation no-blind-replay behavior, cancellation/error handling, and canonical history independence from `previous_response_id`. Provider continuation/cache is optimization only. |
| Context harness and requested 24,576 band | Green | Benchmark parser accepts 24,576 and rejects 24,577; deterministic ladder cases retain identity/order/sentinels/no tools. |
| Quick/full harness truthfulness | Green | Benchmark unit fixtures prove suite registry, result derivation, failure visibility, timing attribution, JSON/report/compare output, and unavailable-provider failures cannot pass. The quick live run below also reports its failure rather than passing it. |
| Tool permission, session, Git/user work, adapters | Green | Focused and broad deterministic coverage passed approval gating, hostile-context boundaries, session/recovery truth, dirty-work preservation, process policy, and presentation-independent architecture checks. |
| Typecheck and phase runner | Green | `npm run typecheck` passed; `npm run test:runner` passed 90/90. |
| Broad aggregate / native TUI | Not Green | Direct broad Node run was 285/312; all 27 failures are OpenTUI renderer initialization failures because native FFI is unavailable on Node `v24.21.0`. `npm test` cannot start because that runtime rejects required `--experimental-ffi`. |
| Two pre-existing TUI streaming assertions | Not Green, separately preserved | The two historically recorded TUI streaming failures remain separate from Phase 8. This environment cannot reach their assertions because renderer setup fails first, so it supplies no basis to relabel them Green or attribute them to adaptive context work. |
| Native interactive TUI lifecycle | Evidence Gap | No genuine interactive terminal exercise was available. |
| Accepted GPU-Offload-26 runtime control | Evidence Gap | REST verifies all observable control values, but the LM Studio UI-only main-model GPU Offload value 26 cannot be independently inspected here. |
| Live context ladder | Not Green | Final live ladder was 14/15: one 8,192 attempt failed before a response with `Engine protocol predict request failed: fetch failed`. |
| Live quick tool workflow | Not Green | Final quick run was 11/12: one structured-tool sample issued two `read_file` calls where one was required. This is the recorded duplicate-tool-call runtime class, not a P5 compact-continuation candidate. |

## Deterministic commands

```bash
npm run typecheck
node --test test/unit/benchmark/index.test.ts test/unit/context/profile-selector.test.ts test/unit/context/profiler.test.ts test/unit/application/one-turn.test.ts test/unit/provider/lm-studio.test.ts test/unit/application/recovery.test.ts test/integration/agent-loop.test.ts
npm run test:runner
node --test test/unit/*.test.ts test/unit/**/*.test.ts test/integration/**/*.test.ts
```

Results: typecheck passed; focused adaptive/context/application/provider/recovery/integration run **89/89** passed; runner **90/90** passed; broad direct Node run **285/312** passed with the 27 native-FFI TUI failures above. The broad run still exercises the full benchmark harness deterministically; no uncontrolled live full comparison was run after the quick/context runtime failures and missing UI-only control proof.

## Live characterization (non-comparable)

Both commands preflighted the pinned model at `http://127.0.0.1:1234`. REST-visible values were: physical context `32768`, eval batch `2048`, physical batch `512`, parallel `1`, Flash Attention `true`, GPU KV-cache offload `true`, experts `8`; Node `v24.21.0`, Linux `7.0.0-31-generic`, AMD Ryzen AI 9 465 w/ Radeon 880M, 20 CPUs, and 32,910,184,448 bytes memory. GPU Offload 26 was not visible, so these runs are characterization only and were not compared to an accepted baseline.

```bash
npm run benchmark -- --suite context --context-bands 2048,4096,8192,16384,24576 --repetitions 3 --label p8-p6-final-context-characterization
npm run benchmark -- --suite quick --repetitions 3 --label p8-p6-final-quick-characterization
```

Context artifact: `/home/jfin/dev/george/artifacts/benchmarks/2026-09-24T22-20-15-033Z-186148`.

| Requested band | Actual provider input | Result | Warm provider/model observation |
| ---: | ---: | --- | --- |
| 2,048 | 1,466 | 3/3 | 1,199 / 1,214 ms |
| 4,096 | 2,746 | 3/3 | 1,025 / 1,084 ms |
| 8,192 | 5,306 | 2/3 | rep 1 failed pre-response; reps 2-3: 1,357 / 1,308 ms |
| 16,384 | 10,428 | 3/3 | 2,153 / 2,130 ms |
| 24,576 | 13,821 | 3/3 | 2,822 / 2,875 ms |

The first 2,048 shape was 2,675 ms; later warm-state observations remain separated above. The full ladder made 15 provider attempts, 14 completed rounds, zero tools, and zero retries. It is Not Green because one provider attempt failed.

Quick artifact: `/home/jfin/dev/george/artifacts/benchmarks/2026-09-24T22-21-14-855Z-187523`.

| Case | Result | Provider rounds on passing samples | Input tokens on passing samples |
| --- | --- | ---: | ---: |
| short reasoning | 3/3 | 1 | 81 |
| 2,048 context | 3/3 | 1 | 1,466 |
| structured tool use | 2/3 | 2 | 747 |
| independent multi-tool inspection | 3/3 | 2 | 881 |

The failed structured-tool repetition made three provider rounds and two tool calls; the harness correctly recorded `Expected 1-1 tool calls; observed 2.` No acceptance, cache, latency, or token-reduction claim is made from either live artifact.

## Final integrity checks

- `git diff --check`: pass.
- `package-lock.json`: absent.
- No correction cycle: no deterministic Phase-8 regression was confirmed; the live failures are recorded, not papered over.
- P6 does not owner-close Phase 8 or advance Phase 9.
