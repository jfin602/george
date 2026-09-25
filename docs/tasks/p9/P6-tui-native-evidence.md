# P6 Transcript / Task native TUI evidence

Status: **EVIDENCE GAP — supported native TUI host unavailable**

Date: 2026-09-25
Phase: 9 / P6
Package: `0.9.6`

## Host observation

- Node: `v24.21.0`
- stdin/stdout real TTY: no
- Required Node 26 native path: unavailable. `npm run test:tui` stopped before tests because this host rejects `--experimental-ffi` (`node: bad option: --experimental-ffi`).

Node 24 and the non-TTY host cannot establish native OpenTUI Green evidence. The compatible direct renderer attempt also cannot initialize OpenTUI FFI on this runtime, so it is not treated as a behavioral result.

## Deterministic qualification performed

- `node --test --test-name-pattern='task renderer uses' test/unit/tui/app.test.ts` — Green.
- `npm run typecheck` — Green.
- `npm run test:runner` — Green (90/90).
- `git diff --check` — Green.

`test/unit/tui/native-smoke.test.ts` is the conditional Node 26 + real-TTY launch/restoration path. It skips outside that host contract. The new deterministic guard renders Task data from `TaskState` plus the existing bounded work projection and proves it contains task/workflow/validation/access sections without command/provider payloads. The full OpenTUI interaction suite remains pending a Node 26 real-TTY environment.

No root `package-lock.json` was created.
