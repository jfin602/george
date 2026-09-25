# P5 live George agentic-context qualification evidence

Status: **NOT GREEN — no healthy agentic envelope established; controlled-runtime and Node-26/TUI evidence gaps remain**

Date: 2026-09-25
Correction: `c8-agentic-context` / P5
Exact P4 candidate: `6492a5f661796a106aee6d98c79c990873308b4f` (`c8-agentic-context/P4: Deterministic agentic-context correction qualification`), package `0.8.8`. This P5 working tree adds only this evidence record; no production context/profile/routing/runtime behavior changed and no commit was created.

## Scope and runtime control

P2/P3 established **no accepted healthy agentic working-set region**. Per the approved qualification plan, P5 therefore ran one bounded smallest-band diagnostic only; it did not ascend the sweep, repeat failures, confirm a candidate, or invent a production envelope.

Immediately before live work, the required `/api/v1/models` precheck reported the pinned `qwen3-coder-30b-a3b-instruct@q4_k_m` loaded instance with context `32,768`, eval batch `2,048`, physical batch `512`, parallel `1`, Flash Attention `true`, GPU KV offload `true`, and experts `8`.

Main-model **GPU Offload 26 is unconfirmed**: no independent LM Studio UI observation was available. REST does not expose it. These timings are consequently controlled only for the REST-visible settings, not an accepted comparable latency claim.

Benchmark provenance:

- command: `npm run benchmark -- --suite agentic-context --agentic-context-bands 2048 --repetitions 1 --label c8-p5-smallest-diagnostic-2k`
- artifact: [`results.json`](../../../artifacts/benchmarks/2026-09-25T02-26-41-473Z-352012/results.json) and [`report.md`](../../../artifacts/benchmarks/2026-09-25T02-26-41-473Z-352012/report.md)
- suite/schema: `agentic-context` / `v3` / schema `3`; one repetition; all three P1 families
- runtime emitted by the artifact: Node `v24.21.0`, npm `11.19.0`, Linux `7.0.0-31-generic`, x64, AMD Ryzen AI 9 465 w/ Radeon 880M, 20 CPUs, `32,910,184,448` bytes memory; LM Studio Responses loopback at `http://127.0.0.1:1234`

This host does not provide Node 26 (`node --version` was `v24.21.0`) or a real TTY (`tty` reported `not a tty`). The conditional OpenTUI smoke was therefore **not run**: no supported Node-26 native TUI or terminal-restoration evidence is claimed, and no normal HOME/XDG session state was touched.

## P1 smallest-band diagnostic

All cases selected adaptive ordinary profile `qwen3-coder-30b-a3b-instruct-q4_k_m-lm-studio-32k-ordinary` as the only attempted profile. The initial assembled estimates were `2,360`, `2,369`, and `2,378`; the profile budget/headroom was respectively `8,192/5,832`, `8,192/5,823`, and `8,192/5,814`. Every case recorded two whole-source omissions, one routed source, zero deferred/duplicate/failed source dispositions, zero promotion reasons, and zero compactions. Those fixture omissions are explicit disposition evidence, not dropped required context.

| Family | Deterministic result; expected vs observed tools | Provider usage and latency | Truth |
| --- | --- | --- | --- |
| Inspection | **Pass.** Expected exactly one `read_file`; observed one `read_file`, no unrequested/duplicate call. | 2 attempts / 2 rounds; 0 retries/timeouts; provider input/output `5,064/37`; response start `175 ms`; first useful output `7,754 ms`; provider active `10,994 ms`; workflow `11,028 ms`. | Green for this one bounded case. |
| Multi-round investigation | **Pass.** Expected four `read_file` calls; observed four `read_file`, no unrequested/duplicate call. | 5 attempts / 5 rounds; 0 retries/timeouts; provider input/output `13,271/113`; response start `41 ms`; first useful output `3,655 ms`; provider active `18,140 ms`; workflow `18,148 ms`. | Green for this one bounded case. |
| Edit + validation | **Fail.** Expected exactly three calls, `read_file`, `write_file`, `run_process`; observed 10 calls with six unique names: `git_status`, `read_file`, `search_text`, `run_process`, `write_file`, `git_diff`; one validation ran, but the fixture edit did not match required content. `git_status`, `search_text`, and `git_diff` are unrequested unique tools. The v3 record retains total/unique names, not per-call name sequence: it proves at least three unrequested calls and at least four repeats, but cannot attribute all seven excess calls per tool. | 7 attempts / 7 rounds; 0 retries/timeouts; provider input/output `20,765/406`; response start `34 ms`; first useful output `2,046 ms`; provider active `45,655 ms`; workflow `45,826 ms`; tools `118 ms`. | **Not Green** — deterministic edit failure and expanded/unrequested tool plan at the smallest measured request shape. |

Series aggregate: `2/3` deterministic passes; `74,789 ms` provider-active across `14` attempts/rounds; `75,002 ms` workflow; `15` total tool calls; zero retries and zero timeouts. The first useful output was observed in every case. Provider-reported input grows across tool continuations and reaches `20,765` in the failed edit case, so the requested 2,048 band must not be represented as an all-family 2k provider-input observation.

The artifact is the authority for persisted context/profile, usage, timing, and aggregate tool evidence. It does not persist an exact per-tool call sequence, so that granularity remains an evidence limitation rather than a guessed duplicate count.

## Live frozen-turn continuation-pressure check

Because the provider completed meaningful multi-round P1 work, one separate bounded, disposable local fixture re-exercised the P7 frozen-profile guard. It used the same pinned model and REST-visible runtime, a temporary workspace plus isolated temporary user-config root, only the canonical `read_file` tool, and three 10,000-character local read results. The model requested exactly three `read_file` calls in its first provider round; George executed them, then stopped before submitting a continuation.

| Observation | Result |
| --- | --- |
| Selected profile / initial estimate | adaptive ordinary / `192` estimated tokens |
| Provider attempts / completed rounds | `1 / 1` |
| Tool calls | exactly `read_file`, `read_file`, `read_file`; no other tool exposed |
| Terminal result | explicit `budget` failure: estimated continuation context `9,065` exceeded ordinary provider-input budget `8,192` |
| Compaction / resize / extra provider call | none observed; zero continuation request was sent |

This is **Green** for the live fail-closed continuation-pressure safety behavior. It is not an envelope or latency result: the three tool calls arrived in one provider round and the test deliberately stops before an unsafe continuation.

## Qualification conclusion

- **Green:** REST-visible pinned runtime settings; real P1 inspection and multi-round investigation at the bounded diagnostic shape; live frozen-turn fail-closed guard; deterministic P4 qualification remains applicable.
- **Not Green:** the exact P1 edit-plus-validation workload at the smallest attempted band. It failed deterministically, made unrequested tool calls, and took `45.826 s`; this is task/tool behavior evidence, not a proven context-size threshold.
- **Evidence Gap:** no empirically healthy all-family envelope, no next materially worse/risk region, no confirmation point, no independently observed GPU Offload 26, no Node-26 real-TTY/OpenTUI smoke, and no controlled comparable latency conclusion.

P5 leaves P3's production-policy decision intact: largest accepted healthy agentic region remains **none established**, and there is no authority to change profile values, selection/routing, compaction, provider timeout, or physical 32k runtime configuration. The historical synthetic context ladder remains characterization only. Phase 8 is not owner-closed and Phase 9 is not advanced.

## Validation

| Check | Result |
| --- | --- |
| `node --test test/unit/benchmark/index.test.ts test/unit/context/index.test.ts test/unit/context/profile-selector.test.ts test/unit/application/one-turn.test.ts test/unit/application/recovery.test.ts test/unit/core/foundation.test.ts test/unit/provider/lm-studio.test.ts test/integration/phase5-qualification.test.ts` | Green: 97/97 passed. |
| `npm run typecheck` | Green. |
| `npm run test:runner` | Green: 90/90 passed. |
| `git diff --check` | Green. |
| `package-lock.json` / package version | Absent / unchanged at `0.8.8`. |
