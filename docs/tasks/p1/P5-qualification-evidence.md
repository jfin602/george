# Phase 1 P5 qualification evidence

Recorded: 2026-09-22T15:33:40-05:00  
Assessment baseline: `c47cf78d36326bf0a5bd1c13186c56003db9fe2a` / package `0.1.0`  
Exact pre-task source baseline: `8e32613bc765021e15e38df487d7769412d540b9` / package `0.1.4`  
Qualified candidate: that source with this P5 evidence file and package version `0.1.5`; pre-existing runner artifacts under `.codex-runs/p1/2026-09-22T20-04-32-424Z/` remain runner-owned and unmodified except for its run metadata.

Runtime: Node `v26.10.0`; npm `11.19.1`; Linux non-interactive stdin (`test -t 0` was false).

| Layer | Result | Evidence |
| --- | --- | --- |
| Exact Petri phase-runner tests | Green | `npm run test:runner`: 90 passing, 0 failed. |
| Phase prompt grammar | Green | `npm run codex:phase:validate -- p1`: all P1–P6 prompts valid; P6 remains manual closeout. |
| Core/config/session | Green | `npm run test:core`: 6 passing, 0 failed. |
| Provider and SSE | Green | `npm run test:provider`: 9 passing, 0 failed; includes split CRLF/multiline SSE, tool calls, abort/timeout, HTTP, malformed, and incomplete streams. |
| Workspace, read-only tools, application integration | Green | `node --test test/unit/application/one-turn.test.ts test/unit/tools/read-only.test.ts test/unit/core/workspace.test.ts`: 8 passing, 0 failed. |
| OpenTUI test renderer | Green | `npm run test:tui`: 5 passing, 0 failed; covers streaming, multiline input, resize/scrollback, cancellation, idle exit, and renderer destruction. |
| TypeScript | Green | `npm run typecheck` completed successfully. |
| Broad deterministic aggregate | Green | `npm run check`: typecheck plus 118 passing tests, 0 failed. |
| `--experimental-ffi` launch contract | Green | `package.json` `start` and `tui` both invoke `node --experimental-ffi src/tui/main.ts`. |
| Native OpenTUI terminal lifecycle | Evidence Gap | This runner has no genuine usable stdin TTY. Native startup, text submission, cancellation/exit, terminal restoration, and resize were not simulated. |
| Live LM Studio smoke | Evidence Gap | No `GEORGE_*`/`LM_STUDIO_*` model configuration was present. `http://127.0.0.1:1234/v1/models` was unreachable, so no model ID, request, prompt body, or secret was logged. |
| `git diff --check` | Green | Completed successfully, including this final evidence report. |
| No `package-lock.json` | Green | Explicit repository scan found none. |
| Prompt-owned child/native process cleanup | Green | Final process scan found no `src/tui/main.ts` or `lm-studio-smoke.ts` process. No TUI or smoke child was started during this qualification. |

No evidence-discovered defect required a correction cycle. This P5 task does not expand Phase-1 scope.
