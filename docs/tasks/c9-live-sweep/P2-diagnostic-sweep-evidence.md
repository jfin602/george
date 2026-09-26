# c9 live sweep P2 diagnostic evidence

Status: **COMPLETE — PRE-REPAIR SWEEP NOT GREEN**

Date: 2026-09-26

Pre-task HEAD: `cccf662ffd47de0f5255d70452fe00b4b1332299`

Package: `0.9.10` (unchanged)

P2 changed no production source, tests, qualification semantics, fixture/instrument, hidden acceptance, profile, or runtime setting. It ran each declared live workload exactly once in a fresh workspace/session and performed no repair between workloads.

## Common preflight

All executable preflight used Node `v26.10.0` and npm `11.19.1`.

| Check | Result |
| --- | --- |
| P1 schema-2 diagnostics, sweep, ledger, provider/context/tool/permission/recovery/security, structured task/stack, Phase 4/5/9 integration, frozen instrument/acceptance, and real sandbox floor | **Green: 223/223 passed** |
| `npm run typecheck` | **Green** |
| `npm run test:runner` | **Green: 90/90 passed** |
| Application runnable/composition | **Green**, exercised by the focused application/integration floor |
| Package | **Green:** exactly `0.9.10` |
| Root `package-lock.json` | **Green:** absent |
| Initial `git diff --check` | **Green** |
| Bounded schema-2 evidence writer | **Green**, deterministic tests passed and all five live attempt/trace pairs persisted |
| Loaded REST-visible runtime | **Green:** exact pinned model and required controls present |

The common validity/safety/evidence-integrity gate was Green, so the live matrix was eligible.

## Broad suite

Exact `npm test` ran once under Node `v26.10.0`.

**Aggregate Not Green: 409 passed, 4 failed, 1 skipped; 414 total.** Duration: `8882.151896 ms`.

Every failed/skipped identity:

1. `test renderer shows identity, configuration, streamed text, and read-only activity` — retained OpenTUI assertion: frame did not match `/streamed answer/`.
2. `Transcript and Task pages switch without changing session state or the composer draft` — retained OpenTUI assertion: frame did not match `/No structured task is active/`.
3. `committed final answers reveal progressively without delaying canonical durability, and cancellation stops the reveal` — retained OpenTUI timeout: frame predicate did not pass after 20 passes.
4. `streaming does not overwrite draft input and returns the composer to ready state` — retained OpenTUI assertion: frame did not match `/streamed answer/`.
5. `native OpenTUI launches and restores a real Node 26 terminal` — skipped in the non-TTY environment; recorded as an Evidence Gap.

The historical nested sandbox-process non-completion did not reproduce: the focused floor and broad run both passed that identity. The ledger retains it only as a distinctly labeled historical/intermittent Evidence Gap; it is not reported as a P2 failure.

## Runtime

The exact loaded model was `qwen3-coder-30b-a3b-instruct@q4_k_m`. REST exposed context `32768`, eval batch `2048`, physical batch `512`, parallel `1`, Flash Attention enabled, GPU KV-cache offload enabled, and `8` experts. No retuning occurred.

`MANUAL CHECK: LM Studio GPU Offload must show 26`

GPU Offload 26 remained UI-only and unobserved, so controlled latency remains an Evidence Gap. Functional execution was not blocked.

## Complete live matrix

The canonical prerequisite chain was `greeting -> three-file -> Gate A -> B2 -> C2`.

| Workload | Observed result | Qualification status | Bounded result |
| --- | --- | --- | --- |
| Greeting | **Green** | `qualifying` | Completed; 1 attempt/round, `1479/9` input/output tokens, 0 tools, ordinary profile, no promotion/retry/exhaustion/intervention, expected 34-byte final response. |
| Three-file | **Green** | `qualifying` | Completed; 5 attempts/rounds, `16433/613` tokens, 4 tools; all required reads succeeded, final response present, ordinary profile, no promotion/retry/exhaustion/intervention. |
| Gate A | **Green** | `qualifying` | Exact 60-byte edit, V1 passed, completed TaskState, hidden acceptance passed; 5 attempts/rounds, `14622/466` tokens, 8 tools, ordinary profile, no promotion/retry/exhaustion/intervention. The expected framing rejection and successful patch recovery are retained in the trace. |
| B2 `greenfield-express-v2` | **Not Green** | `qualifying` | P1 and StackState ended `budget_exhausted` after the structured-stage 8-call limit; 4 attempts/rounds, `6597/918` tokens, 13 requested tools, ordinary profile, no promotion/retry/intervention. No mutation or validation completed; P2/P3 remained pending and hidden acceptance did not run. |
| C2 `existing-express-feature-v2` | **Not Green** | `diagnostic-only` | INSPECT produced no accepted read evidence and exhausted its 4-call limit after requests for nonexistent `app.py` and `test_app.py`; 1 attempt/round, `803/190` tokens, 5 requested tools, ordinary profile, no promotion/retry/intervention. Implementation, V1/V2, and hidden acceptance did not run. |

B2 was the first upstream Not Green result. C2 still ran in isolation as required, but its result is diagnostic-only and is not Phase 9 qualifying evidence.

## Failure ledger

The normalized ledger contains 9 individual entries.

### `agent-provider-context`

- `live:b2:structured-stage-tool-limit` — new, Not Green, qualifying workload observation.
- `live:c2:inspect-no-evidence` — new, Not Green, diagnostic-only workload observation.

### `ui-test-stability`

- `broad:streamed-answer-visibility` — retained.
- `broad:inactive-task-text-rendering` — retained.
- `broad:progressive-final-answer-reveal` — retained.
- `broad:draft-preservation-rendering` — retained.
- `deterministic:sandbox-process-historical-intermittent` — historical/intermittent Evidence Gap only; not reproduced in P2.

### `environment-only`

- `broad:native-real-tty` — non-TTY Evidence Gap.
- `runtime:gpu-offload-26` — UI-only controlled-latency Evidence Gap.

### `unresolved`

None.

No repair diagnosis beyond the bounded observations was performed.

## Artifact hashes

| Artifact | SHA-256 |
| --- | --- |
| `evidence/pre-repair/preflight.json` | `b3391306c9e0f817285e5e1d77fc30e58f89e140c742a52a9f4376fe59ffc9b1` |
| `evidence/pre-repair/broad-suite.json` | `75d6121f2f91e93988208fbdff996ebbabedb0b31c38aba7ef30e4019566b21d` |
| `evidence/pre-repair/runtime.json` | `bfc0aac0b60475f29f9a9db522d0fba8ad01fb9281078350ea31d582ccefa88b` |
| `evidence/pre-repair/greeting/attempt.json` | `d21c0b1ff3439d7b9717767c0a14f37b92e41590532ff2f9d0f7ba8026bc17bf` |
| `evidence/pre-repair/greeting/trace.json` | `36de01b6f5470d4819456d945026493367a43a0209f3e38a8b7535d2fcfbdabb` |
| `evidence/pre-repair/three-file/attempt.json` | `d52ca220244f048616c05828a3eaeeab28befe7c96c688cc9ed8f319bdfc2685` |
| `evidence/pre-repair/three-file/trace.json` | `38a74ff2755a517ea289fc9266a903e697e4ae811b1348ae8821916cf0861311` |
| `evidence/pre-repair/gate-a/attempt.json` | `f117a34da30d93deceae752b4e555ad3fa9e8e26bd7696d15b61aebd08d374e5` |
| `evidence/pre-repair/gate-a/trace.json` | `2919087f0b2ce5d95c0aec0028f95b4b5b476351c21ea1850cb2e111dba064c8` |
| `evidence/pre-repair/b2/attempt.json` | `a090a956c32c381e7b1ee68810c0c75f16e21d8ce7db13fffbafe716297ae848` |
| `evidence/pre-repair/b2/trace.json` | `140f147bb5532ad9a0d2e0871fe32463f8739b1d965823fe125a91d004a61083` |
| `evidence/pre-repair/c2/attempt.json` | `b541545f7fb2cd33543309254729282920a4bed59b8b37b12acd9c1b83d42239` |
| `evidence/pre-repair/c2/trace.json` | `a40d36087d231bc069e53916a66b2b2ceb33829982816ba9ed3e47c3e00d83a5` |
| `evidence/pre-repair/failure-ledger.json` | `c5330441b3a5f10321ff1020b233cc88d256327d3227ab1be7478396708fcb62` |

## P2 result

- Common preflight: **Green**.
- Complete pre-repair sweep: **Completed exactly once per workload**.
- Aggregate broad suite: **Not Green**.
- Qualifying chain: **Not Green at B2**.
- Downstream C2: **Diagnostic-only Not Green**.
- Repairs: **Not performed by scope**.
- Phase 9: **remains open**.
- Phase 10: **not opened**.
