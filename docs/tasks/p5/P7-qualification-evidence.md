# Phase 5 P7 qualification evidence

Candidate: uncommitted Phase-5 P7 working tree based on pre-task `HEAD` `cb587fcf3a358df744670d2740bc273af4b7e315`; package `0.5.7`.

## Deterministic qualification matrix

| Layer | Result | Evidence |
| --- | --- | --- |
| Integrated durable long workflow | Green | `test/integration/phase5-qualification.test.ts` starts from a persisted Phase-4-shaped Git fixture, crosses pressure twice, creates version-1 digest-bearing checkpoints for ranges `0..12` and `0..14`, retains the raw tail and unresolved validation state outside derived summary text, performs approved write/process/validation work, persists completion, and reopens with the complete transcript/events. Tool-round provisional text and mutation body are absent from durable state. |
| Canonical session persistence correction | Green | P7 found that a save after reopen could rebuild from sanitized events and discard old canonical transcript entries. `src/core/session-store.ts` now preserves canonical `session.transcript` while omitting only a trailing unfinished user entry. `test/unit/core/session-store.test.ts` permanently guards reopen/resave preservation. |
| Budgets, pressure, exhaustion, cancellation | Green | `test/unit/core/run-budget.test.ts` and `test/unit/application/one-turn.test.ts` cover finite local accounting, soft pressure, provider/tool/process/context usage, wall-clock checks, cancellation precedence, and explicit hard exhaustion. |
| Compaction and authority separation | Green | `test/unit/application/one-turn.test.ts` covers completed-history-only compaction, checkpoint reuse, raw-tail retention, cancellation/failure, and derived-history trust; the P7 fixture covers two advancing checkpoints with canonical history unchanged. |
| Retry/replay safety | Green | `test/unit/application/one-turn.test.ts` covers bounded pre-response provider retry/backoff and cancellation; post-response-start/text failures do not retry or commit/duplicate provisional assistant text. |
| Recovery and process cleanup | Green (Linux fixture) | `test/unit/application/recovery.test.ts` proves hash/byte-only positive write reconciliation and explicit patch/process/approval/provider uncertainty with no replay. `test/unit/tools/process.test.ts` proves timeout/cancellation descendant cleanup and records completed/uncertain cleanup only; it makes no sandbox or cross-platform claim. |
| Hook boundaries | Green | `test/unit/core/hooks.test.ts` plus `test/unit/application/one-turn.test.ts` cover ordering, enable/disable, duplicate rejection, bounded/malformed output, timeout/cancellation, failure isolation, sanitized process environment, approval through the canonical registry, recursion suppression, and non-authoritative output. |
| Diagnostics and growth characterization | Green | `test/unit/core/diagnostics.test.ts` covers correlation, redaction, rotation/retention, sink isolation, and repeated storage/RSS measurements. In the broad deterministic run, the repeated fixture observed session `372 -> 819` bytes, diagnostics `1049 -> 2102` bytes, and RSS `100032512 -> 100032512` bytes; these are observations, not frozen thresholds. |
| Inherited transcript/tool/provider hardening | Green | `test/integration/agent-loop.test.ts`, `test/unit/tools/read-only.test.ts`, `test/unit/application/progress.test.ts`, `test/unit/provider/lm-studio.test.ts`, and `test/unit/tui/app.test.ts` cover root-list normalization and containment, bounded invalid-call diagnostics, bounded provider metadata, provisional tool-round suppression, one final assistant commit, progressive reveal/cancellation truth, `Thinking...`, and compact Work grouping with textual status/stable identity. |
| OpenTUI test renderer | Green | `test/unit/tui/app.test.ts` covers long history, streaming, cancellation, approval, draft preservation, resize, scrollback/selection, restored sessions, grouping, and clean shutdown. This is test-renderer evidence only. |
| Native terminal | Evidence Gap | This execution had no usable TTY (`TTY=unavailable`), so no native OpenTUI responsiveness, interaction, or terminal-restoration result is claimed. |
| Live LM Studio/Qwen long flow and recovery | Not Green | Loopback `http://127.0.0.1:1234/v1/models` exposed `qwen3-coder-30b-a3b-instruct@q4_k_m`. A bounded 60-second `smoke:lm-studio` tool-cycle attempt produced no completion JSON before it exited, so no live long compaction/tool/validation/reopen result is claimed. Deterministic fixtures remain the correctness authority. |

## Commands and environment

- Focused Phase-5 command: `node --experimental-ffi --test test/integration/phase5-qualification.test.ts test/unit/application/one-turn.test.ts test/unit/application/recovery.test.ts test/unit/core/run-budget.test.ts test/unit/core/hooks.test.ts test/unit/core/diagnostics.test.ts test/unit/core/session-store.test.ts test/unit/tools/process.test.ts` — 41 passed.
- Phase-2/3/4 + renderer command: `node --experimental-ffi --test test/integration/agent-loop.test.ts test/integration/phase4-qualification.test.ts test/unit/tools/read-only.test.ts test/unit/tools/mutation.test.ts test/unit/context/index.test.ts test/unit/skills/index.test.ts test/unit/application/coding-workflow.test.ts test/unit/application/progress.test.ts test/unit/tui/app.test.ts` — 71 passed.
- Exact runner: `npm run test:runner` — 90 passed.
- Broad deterministic aggregate: `npm run check` — typecheck plus 236 passed.
- Final checks: `git diff --check` passed; `package-lock.json` is absent.
- Node `v26.10.0`; npm `11.19.1`; platform `Linux 7.0.0-31-generic x86_64 GNU/Linux`.

No Phase-6 adapters, network tools, plugins, utility-model runtime, daemon/background ownership, Tauri, scheduling, or multi-agent behavior was added.
