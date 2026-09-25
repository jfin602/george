# P2 agentic working-set envelope evidence

Status: **Evidence Gap — no empirically healthy envelope established**  
Correction: `c8-agentic-context` / P2  
Measured candidate: pre-task HEAD `843ddeb212d509411e8ec8339a5b07217ff04890`; package `0.8.8`; benchmark schema/suite `3` / `v3`.

## Scope and control

This is evidence only. No production profile, selector, context-assembly, provider-timeout, or runtime behavior changed.

The P1 `agentic-context` suite uses the real George application/provider/tool boundaries, normal built-in coding tools, adaptive context selection, and the three deterministic task families. It is the correction's coding-agent measurement instrument; the historical synthetic `context` ladder remains only a prefill/runtime characterization.

Pre-series repository state was clean and `package.json` reported `0.8.8`. `package-lock.json` was absent.

The required REST precheck was observed immediately before the series:

| Control | Observed |
| --- | --- |
| Model | `qwen3-coder-30b-a3b-instruct@q4_k_m` |
| Loaded instance | `qwen3-coder-30b-a3b-instruct@q4_k_m` |
| Context / eval batch / physical batch | 32,768 / 2,048 / 512 |
| Parallel / Flash Attention / GPU KV offload / experts | 1 / enabled / enabled / 8 |
| Main-model GPU Offload 26 | **Unconfirmed** — REST does not expose the UI-only value and no independent LM Studio UI observation was available. |

The REST-visible controls match the accepted configuration, but the missing UI observation means latency comparisons are **not fully controlled**. Runtime provenance emitted by the benchmark: Node `v24.21.0`, npm `11.19.0`, Linux `7.0.0-31-generic`, x64, AMD Ryzen AI 9 465 w/ Radeon 880M, 20 CPUs, 32,910,184,448 bytes memory, provider `http://127.0.0.1:1234`.

Historical context: the accepted Phase-8 synthetic warm controls observed roughly 1.15 s at 1,466 provider-input tokens, 1.06 s at 2,746, 1.46 s at 5,306, and 2.24 s at 10,428. They do not qualify an agentic envelope. Post-`0.8.8` George-shaped evidence had already shown a roughly 12,945-estimated-token request taking about 88 s to first useful output, while later isolation controls became invalid after runtime loss.

## Attempted exploratory band

Only the first ascending band was run. Artifact: [`results.json`](../../../artifacts/benchmarks/2026-09-25T02-17-19-859Z-332542/results.json) and [`report.md`](../../../artifacts/benchmarks/2026-09-25T02-17-19-859Z-332542/report.md). Label: `c8-agentic-explore-2k`; one repetition; 3 cases; started `2026-09-25T02:17:19.859Z`; benchmark working tree was clean at the candidate above.

All three cases selected adaptive `qwen3-coder-30b-a3b-instruct-q4_k_m-lm-studio-32k-ordinary` only (provider-input budget 8,192; reserved headroom 8,192), with no promotions or compactions. Each recorded two omitted sources, zero deferred/duplicate/failed sources, and one routed source. The omission is benchmark fixture disposition evidence, not a silent drop of required context.

| Family / requested band | Estimated / provider input / output | Expected vs. observed tools and task result | First useful / provider-active / workflow | Provider calls, retries, timeout | Truth |
| --- | ---: | --- | ---: | --- | --- |
| Repository inspection / 2,048 | 2,360 / 5,307 / 99 | Expected exactly 1 `read_file`; observed 4 calls: `read_file`, `git_status`, `list_directory`, `search_text`. Three unrequested unique tools; no duplicate call is evidenced by the persisted aggregate. Deterministic case failed. | 25,268 ms / 32,482 ms / 32,516 ms | 2 attempts / 2 rounds; 0 retries; no timeout | **Not Green** — unrequested tool behavior and 32.5 s completion at the smallest band. |
| Multi-round investigation / 2,048 | 2,369 / 13,271 / 113 | Expected and observed 4 `read_file` calls; no unrequested or duplicate behavior evidenced. Deterministic case passed. | 3,139 ms / 16,099 ms / 16,106 ms | 5 attempts / 5 rounds; 0 retries; no timeout | Single-family pass only; insufficient to establish the envelope. |
| Edit plus validation / 2,048 | 2,378 / 21,936 / 468 | Expected 3 calls (`read_file`, `write_file`, `run_process`); observed 13 calls across `git_status`, `read_file`, `search_text`, `run_process`, `list_directory`, `write_file`, `git_diff`. Four unrequested unique tools; with 13 calls across 7 unique tools, at least 6 repeat calls occurred, but v3 artifacts do not preserve exact per-tool duplicates. One validation completed, but the fixture edit did not match expected content. | 14,568 ms / 59,960 ms / 60,112 ms | 7 attempts / 7 rounds; 0 retries; no timeout | **Not Green** — tool-plan expansion and deterministic edit failure. |

All per-case context-selection facts are preserved in the linked artifact. Category-token evidence was respectively `core/project/tools/task/skills/routed/conversation/toolResults` = `40/717/751/63/0/706/71/0`, `40/718/751/73/0/705/70/0`, and `50/718/751/72/0/705/70/0`. Remaining headroom was respectively 5,832, 5,823, and 5,814 estimated tokens. Provider response-start latency was 112 ms, 49 ms, and 27 ms. Tool/approval/other workflow time was 17/0/16 ms, 3/0/4 ms, and 105/0/47 ms respectively.

Series aggregate: 1/3 passed; 108,778 ms workflow time; 108,541 ms provider-active time; 14 attempts/rounds; 7,753 ms average provider round; 21 tool calls; 0 retries; 40,514 reported input tokens; 680 output tokens. No P2 run reached the provider's 120-second timeout.

## Decision

- Largest empirically healthy working-set region: **none established**. The smallest attempted band did not meet the required all-family correctness/tool-behavior gate.
- Next materially worse/risk region: **not established**. This directly measured 2,048-band result is a Not Green agentic task/tool result, but one failed smallest-band sweep does not identify a context-size threshold; larger bands were not run.
- Confirmation runs: **not run**. There was no healthy candidate to confirm, and repeating a failed base band would not establish a healthy/worse boundary.
- P3 policy authority: **insufficient**. Do not change production context policy or invent replacement profile numbers from this result.

The evidence is both an agentic Not Green at the attempted request shape and an envelope **Evidence Gap**: no controlled healthy region and no adjacent materially worse region were measured. GPU Offload 26 is also unconfirmed, so latency comparisons cannot be called fully controlled. The next measurement attempt requires independent LM Studio UI confirmation and a P1-suite correction/qualification decision if the benchmark's smallest-band deterministic tool behavior is expected to represent a valid baseline; P2 itself must not change it.

## Required validation

| Check | Result |
| --- | --- |
| `npm run typecheck` | Green. |
| `npm run test:runner` | Green: 90/90 passed. |
| Focused benchmark coverage: `node --test test/unit/benchmark/index.test.ts` | Green: 16/16 passed. |
| `git diff --check` | Green. |
| `package-lock.json` / package version | Absent / unchanged at `0.8.8`. |

The package's generic `npm test -- test/unit/benchmark/index.test.ts` launcher was also attempted but is an environment Evidence Gap, not a benchmark failure: Node `v24.21.0` rejects its required `--experimental-ffi` flag. The repository's locked runtime contract is Node 26; the focused benchmark file passed through Node 24's direct test runner above.
