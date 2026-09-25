# P4 Phase 8 structured edit-validation regression evidence

Status: **NOT GREEN — live structured replay executed and exhausted during correction**

Date: 2026-09-25
Phase: 9 / P4
Package: `0.9.4`
Pre-task George HEAD: `ba49ea742749002192b6200427518f2c35764a4c`

## 2026-09-25 closeout refresh — live replay

George `0.9.10` at `9b031333d3091df37aaab9b2c03175df76101bac` ran one official replay against the loaded pinned Qwen instance. The target began and ended as `export const label = (value) => value.trim();` (SHA-256 `4cd4635c7d8ef07c10bf7a2296d0f4d79cd3e753c1794774656eac5e764d4352`), so the required edit was not produced. George observed one V1 validation failure (exit 1), entered correction cycle 1, and then ended `budget_exhausted` with correction still active. This is **Not Green**, not an Evidence Gap.

| Dimension | 2026-09-25 Phase 9 P4 live result |
| --- | --- |
| Model/runtime | Pinned `qwen3-coder-30b-a3b-instruct@q4_k_m`; Node `v26.10.0`; REST-visible reference controls matched (GPU Offload 26 remains UI-unconfirmed). |
| Functional edit / validation | Not Green / Not Green: target unchanged; V1 failed once. |
| Tool calls | 25: `read_file`, `git_status`, `search_text`, `git_diff`, `list_directory`, `apply_patch`, `write_file`, and George-owned `run_process`; repeated and unrequested calls were observed. |
| Provider / context | 20 attempts and rounds, 0 retries; ordinary adaptive profile; reported input/output tokens `63,253 / 1,801`. |
| Time / approvals / intervention | `344.745 s`; 7 standard-mode approvals; 0 human interventions. |
| Final TaskState | `budget_exhausted`; W1 addressed; R1/R2 addressed; V1 failed; correction 1 active. |

The full bounded event/result record is [`live-results.json`](../../../artifacts/phase9-live-qualification-20260925T133841Z/live-results.json). The historical Phase 8 P5 result below remains Not Green unchanged in substance.

## Frozen structured counterpart

The immutable structured Task Prompt v1 counterpart is [`p9-phase8-structured-edit-validation.task.txt`](../../../test/fixtures/p9-phase8-structured-edit-validation.task.txt). It uses the exact Phase 8 functional fixture target:

- initial `src/label.js`: `export const label = (value) => value.trim();`
- required repair: `export const label = (value) => value.trim().toUpperCase();`
- George-owned literal validation: `node --test test/label.test.js`

The deterministic guard is [`phase8-structured-replay.test.ts`](../../../test/unit/application/phase8-structured-replay.test.ts). It creates the same `agentic-edit-validation-2048-001` local fixture, proves the exact repair and validation ledger, and proves that inspection only receives local read/Git tools while implementation receives the bounded local coding surface. It does not modify or replace any Phase 8 artifact.

## Required runtime control

Immediately before the proposed replay, the required command was run exactly:

```text
MANUAL CHECK: LM Studio GPU Offload must show 26
curl: (7) Failed to connect to 127.0.0.1 port 1234 after 0 ms: Couldn't connect to server
```

No pinned model, loaded instance, or REST-visible setting was available from `http://127.0.0.1:1234/api/v1/models`. GPU Offload 26 remains unconfirmed because it is UI-only; the command printed the required manual reminder, but no UI observation was available. The unavailable runtime blocks both functional live execution and controlled latency claims.

## Side-by-side truth

| Dimension | Preserved Phase 8 P5 result | Phase 9 P4 structured counterpart |
| --- | --- | --- |
| Provenance | `c8-agentic-context` P5, `agentic-edit-validation-2048-001`, package `0.8.8`; [`P5 live evidence`](../../c8-agentic-context/P5-live-qualification-evidence.md) | Frozen Task Prompt v1 and deterministic guard above, package `0.9.4` |
| Functional edit | **Not Green**: required content was not produced | **Evidence Gap**: no live model turn ran |
| Validation | **Not Green**: one validation ran but the edit did not match | **Evidence Gap**: no process was started |
| Tool names/calls | **Not Green**: 10 calls across `git_status`, `read_file`, `search_text`, `run_process`, `write_file`, `git_diff`; at least 3 unrequested and at least 4 repeats | **Evidence Gap**: no live calls. The frozen task intentionally makes validation George-owned, so its model tool surface excludes `run_process`. |
| Provider attempts / rounds / retries | **Not Green**: `7 / 7 / 0` | **Evidence Gap**: `0 / 0 / 0` observed because no provider was reachable |
| Context/profile/tokens | ordinary adaptive profile; provider input/output `20,765 / 406` | **Evidence Gap**: no context assembly or provider usage observed |
| Wall time / intervention | `45.826 s`; no intervention recorded | no live wall time; no intervention; stopped at runtime precheck |
| Final TaskState ledger | Phase 8 had no structured TaskState ledger | **Evidence Gap**: no live TaskState was created; deterministic guard proves the expected completed ledger only with a scripted provider |

The original Phase 8 result remains **Not Green** historical evidence. A future structured pass would be improvement evidence only; it would not establish a healthy context envelope or delete this failure.

## Classification and bounded hardening decision

- **Green, deterministic only:** frozen prompt parsing, exact local repair, George-owned validation ledger, and stage-bounded tool surfaces.
- **Not Green, historical:** the Phase 8 P5 live edit-plus-validation result remains Not Green exactly as recorded.
- **Evidence Gap:** P4 has no live structured functional result and no controlled latency result because LM Studio was unavailable before execution.

No P1–P3 orchestration defect was exposed by a live replay. Therefore P4 made no speculative orchestration, retry, context-profile, LM Studio, or runtime change, and did not spend the permitted post-fix replay.

## Validation

| Check | Result |
| --- | --- |
| `node --test test/unit/application/phase8-structured-replay.test.ts test/unit/application/structured-task.test.ts test/unit/tasks/parser.test.ts test/unit/tasks/state.test.ts` | Green: 11/11 passed. |
| Live runtime precheck | Evidence Gap: LM Studio loopback unavailable; no replay run. |
| `npm run typecheck` | Green. |
| `npm run test:runner` | Green: 90/90 passed. |
| `git diff --check` | Green. |

No root `package-lock.json` was created.
