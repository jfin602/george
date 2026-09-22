# Phase 2 / P6 qualification evidence

Date: 2026-09-22  
Candidate source: `37ecef882c9506a35072040ad8e6cbe837aae74c` (pre-task `HEAD`); final working tree differs only by this evidence record and package version `0.2.6`, pending the phase-runner-owned commit.  
Runtime: Node `v26.10.0`, Linux `x64`. The ordinary shell selected Node `v24.21.0`, which cannot accept the required `--experimental-ffi` flag; all qualification commands below used the supported Node 26 runtime explicitly.

| Layer | Result | Evidence |
| --- | --- | --- |
| Petri phase runner | Green | `npm run test:runner` — 90 passing; `npm run codex:phase:validate -- p2` — valid P1–P6 grammar and P7 manual closeout. |
| Core, config, session, workspace | Green | `npm run test:core` — 6 passing, including configuration, normalized session events, cancellation, bounded instructions, traversal, and symlink rejection. |
| Provider SSE, schemas, continuation | Green | `npm run test:provider` — 11 passing: split SSE, custom tools, function-call identity/deduplication, structured continuation, malformed/incomplete/error, timeout, and cancellation paths. |
| Canonical registry and read-only tools | Green | `npm run check` — registry validation rejects unknown/malformed/schema-invalid calls before execution; bounded read/list/search and fixed read-only Git checks pass. |
| Workspace mutation and Git safeguards | Green | `npm run check` — 4 mutation checks pass: preconditioned atomic writes/patches, unsafe path and bounded-input rejection, cancellation cleanup, machine-readable Git dirty-state marking and preservation. |
| Process execution | Green | `npm run check` — literal argv, workspace cwd, closed stdin, bounded stdout/stderr, sanitized environment, exit/signal, real timeout, AbortSignal cancellation, and Linux descendant cleanup checks pass. The descendant fixture waits beyond its child marker delay and proves no orphan marker was written. |
| Multi-round fixture agent loop | Green | `npm run test:integration` — 7 passing: ordered same-round/multi-round calls, original call IDs/results, invalid-call recovery, recoverable executor failure, hard limits, and cancellation. |
| Approval policy | Green | `npm run test:integration` — read tools auto-allow; write/process calls request one-call approval; allow-once, denial, cancellation, dirty-target marker, and explicit process non-sandbox warning pass. Repository/model text remains untrusted context and cannot change this code-owned policy. |
| OpenTUI test renderer | Green | `npm run test:tui` — 6 passing: tool activity, approval allow/deny/cancel, draft preservation, multiline submit, resize/scrollback, Ctrl+C/idle exit, and renderer destruction. |
| Architecture boundaries | Green | `npm run check` — core/provider/application OpenTUI-import guard and FFI launch-script guard pass. |
| Broad deterministic aggregate and types | Green | `npm run check` — `tsc --noEmit` plus 136 passing deterministic tests. |
| Diff and lockfile hygiene | Green | `git diff --check` passed before and after the P6 documentation/version delta; `test ! -e package-lock.json` passed. |
| Native terminal | Evidence Gap | This runner has neither stdin nor stdout attached to a TTY. Native OpenTUI startup, real approval interaction, resize, and terminal restoration were not claimed as exercised. |
| Live LM Studio/Qwen loop | Evidence Gap | No configured `GEORGE_MODEL`; loopback `http://127.0.0.1:1234/v1/models` was unreachable. No model was downloaded or substituted. |

## Negative-case audit

The Green deterministic evidence covers the required failures closed: invalid tool calls do not reach executors; workspace traversal and symlink escapes fail; read-only tools retain fixed non-mutating behavior; tool processes do not inherit the secret sentinel or unrestricted environment; and dirty Git state is not reset, cleaned, stashed, checked out, or silently overwritten. The agent loop assembles the fixed George-owned policy before repository text, and approval/registry decisions are code-owned rather than prompt-controlled.

`npm run check` exercised real prompt-owned timeout/cancellation/descendant cleanup. After qualification, a process-table inspection found no `george-process-*` or `lm-studio-tool-cycle-smoke` child; the only matching entries were the inspection command itself.

## Commands run on the final candidate

```text
PATH=/home/jfin/.local/share/fnm/node-versions/v26.10.0/installation/bin:$PATH npm run test:runner
PATH=/home/jfin/.local/share/fnm/node-versions/v26.10.0/installation/bin:$PATH npm run test:core
PATH=/home/jfin/.local/share/fnm/node-versions/v26.10.0/installation/bin:$PATH npm run test:provider
PATH=/home/jfin/.local/share/fnm/node-versions/v26.10.0/installation/bin:$PATH npm run test:integration
PATH=/home/jfin/.local/share/fnm/node-versions/v26.10.0/installation/bin:$PATH npm run test:tui
PATH=/home/jfin/.local/share/fnm/node-versions/v26.10.0/installation/bin:$PATH npm run check
PATH=/home/jfin/.local/share/fnm/node-versions/v26.10.0/installation/bin:$PATH npm run codex:phase:validate -- p2
git diff --check
test ! -e package-lock.json
```
