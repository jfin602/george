# c9 live sweep P5 post-repair evidence

Status: **ABORTED AT COMMON VALIDITY GATE — LIVE MATRIX NOT RUN**

Date: 2026-09-26

Pre-task HEAD: `518cc8e7c20e04b8ed8cc6badd897a5e8825e18a`

Package: `0.9.10` (unchanged)

P5 changed evidence, ledger, and this report only. It made no production, test, fixture, instrument, hidden-acceptance, profile, runtime, Phase 9 closeout, or Phase 10 change.

## Common validity and safety qualification

All executable commands used Node `v26.10.0` and npm `11.19.1`.

| Check | Result |
| --- | --- |
| P1 diagnostics/sweep/ledger, P3/P4 regressions, provider/context/tool, permission/security/recovery, Phase 4/5/9 integration, instrument immutability, sandbox, application/TUI affected floor | **Not Green: 267 passed, 1 failed; 268 total** |
| Failed identity | `committed final answers reveal progressively without delaying canonical durability, and cancellation stops the reveal` |
| Bounded signature | `Timed out waiting for frame predicate after 20 passes`; renderer idle at frame 13 with no updated cells |
| `npm run typecheck` | **Green** |
| `npm run test:runner` | **Green: 90/90 passed** |
| Application runnable/composition | **Green**, exercised by the affected application/integration floor |
| Package | **Green: exactly `0.9.10`** |
| Root `package-lock.json` | **Green: absent** |
| Initial `git diff --check` | **Green** |
| Supported runtime | **Green: Node `v26.10.0`** |
| Evidence writer | **Green:** P1 writer tests passed and all P5 JSON evidence parsed |

The failed identity is a P4 permanent regression. It later passed inside the required single broad run. That later pass does not erase the earlier failure; the identity remains an intermittent common validity blocker.

Under the approved correction contract, only a validity/safety/evidence-integrity blocker may abort the live matrix. This observation meets that condition, so no official live workload was spent.

## Full broad suite

Exact `npm test` ran once.

**413 passed, 0 failed, 1 skipped; 414 total.** Duration: `8585.839343 ms`.

The only skipped identity was:

- `native OpenTUI launches and restores a real Node 26 terminal` — `SKIP` in the non-TTY qualification environment; retained as an Evidence Gap.

No test failed in the broad run. The earlier common-floor progressive-reveal timeout is retained separately as an intermittent failure and is not hidden by this pass.

### Pre-repair P2 broad dispositions

| P2 identity | P5 disposition | Evidence |
| --- | --- | --- |
| `broad:draft-preservation-rendering` | **resolved** | Passed in the focused floor and exact broad run. |
| `broad:inactive-task-text-rendering` | **resolved** | Passed in the focused floor and exact broad run. |
| `broad:progressive-final-answer-reveal` | **retained / intermittent** | Failed in the focused floor, then passed in the exact broad run. |
| `broad:streamed-answer-visibility` | **resolved** | Passed in the focused floor and exact broad run. |
| `broad:native-real-tty` | **retained** | Still skipped in the non-TTY environment. |

The historical sandbox-process non-completion did not reproduce in the focused floor or broad run. P4 established no cause, so its unresolved/intermittent Evidence Gap is retained rather than declared repaired.

## Runtime controls

The exact loaded model was `qwen3-coder-30b-a3b-instruct@q4_k_m`.

REST exposed context `32768`, eval batch `2048`, physical batch `512`, parallel `1`, Flash Attention enabled, GPU KV-cache offload enabled, and `8` experts. No retuning occurred.

`MANUAL CHECK: LM Studio GPU Offload must show 26`

GPU Offload 26 remains UI-only and unobserved, so controlled latency remains an Evidence Gap.

## Post-repair live matrix

The canonical chain remained `greeting -> three-file -> Gate A -> B2 -> C2`.

| Workload | Observed result | Qualification status | Attempts |
| --- | --- | --- | --- |
| Greeting | **Not Run** | `not-run` | 0 |
| Three-file | **Not Run** | `not-run` | 0 |
| Gate A | **Not Run** | `not-run` | 0 |
| B2 | **Not Run** | `not-run` | 0 |
| C2 | **Not Run** | `not-run` | 0 |

No schema-2 attempt/trace pair exists for these workloads because the common validity gate aborted before any live attempt. Consequently there are no post-repair provider/tool/profile/task/validation/hidden-acceptance metrics to report.

The pre-repair B2 and C2 failures cannot be classified as resolved: both remain retained qualification Evidence Gaps until a valid post-repair live sweep executes them.

## Remaining failure ledger

The post-repair ledger contains nine entries:

- one intermittent P4 renderer Not Green observation;
- one native-TTY environment Evidence Gap;
- one retained historical sandbox-process intermittent Evidence Gap;
- one GPU Offload 26 controlled-latency Evidence Gap;
- five live qualification Evidence Gaps caused by the common abort, including the retained B2/C2 identities.

The ledger also records every pre-repair identity disposition. Three P2 renderer failures are resolved; the progressive-reveal, native-TTY, sandbox, B2, C2, and GPU-control identities are retained. The three post-repair live-chain gaps before B2/C2 are new.

## Artifact hashes

| Artifact | SHA-256 |
| --- | --- |
| `evidence/post-repair/preflight.json` | `ca8063b7396180c9807b6ea8efb0710584e9d2e5cf75ca24bdf35ec67ac1c105` |
| `evidence/post-repair/broad-suite.json` | `449878b794d4ae8b9504de112cab3d398903f615265685f9ef362a4f12a5560f` |
| `evidence/post-repair/runtime.json` | `05b18c15579d3c3c828051a4676f289ac6bf2d8210db9b337c9fcd87a813da39` |
| `evidence/post-repair/sweep.json` | `e24e7c78f1e46d6a9a3897e12fc52f73259a88a27e3118b4089bb7f13c3cad59` |
| `evidence/post-repair/failure-ledger.json` | `d107e749be702fae0e98567d7078312a579dcf643d620805e91ba4c4a6b81d6c` |

## P5 raw result

- Common qualification: **Not Green**.
- Exact broad suite: **automated tests Green; native real-TTY Evidence Gap**.
- Complete post-repair live sweep: **Not Run due common validity abort**.
- Qualifying chain: **not established**.
- Phase 9 readiness input: **Not Green / incomplete**.
- Phase 9 remains open.
- Phase 10 is not opened.

P6 owns the final audit; this report makes no owner-closeout decision.
