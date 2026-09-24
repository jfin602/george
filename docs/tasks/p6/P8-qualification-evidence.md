# Phase 6 P8 qualification evidence

Candidate: pre-task `HEAD` `979f3e7bbf6c56bbc53636bfc70bd2c703d92469` plus the uncommitted P8 implementation delta. The Petri runner owns the resulting implementation commit. Package version: `0.6.8`.

## Deterministic qualification matrix

| Layer | State | Evidence |
| --- | --- | --- |
| Canonical registry and provider surface | Green | `test/integration/phase6-qualification.test.ts` composes built-ins, an enabled managed plugin, Parallel, GitHub, MCP, and Chrome through one `ToolRegistry`; it proves bounded provider schema size, rejects unsupported MCP schema, and verifies disabled plugin/adapters are not provider-visible. |
| Plugin package/lifecycle and contributions | Green | `test/unit/plugins/index.test.ts` covers malformed/oversized/traversal/symlink/special packages, atomic preservation, non-executing install/uninstall, capability-fingerprint re-enable, and bounded manifest schemas. `test/unit/application/one-turn.test.ts` and the P8 fixture cover lazy plugin skill, command, hook, attached process tool, approval, and failure isolation. |
| Effects, approvals, interruption, durable redaction | Green | P8 exercises host process, external read, remote mutation, unknown external, browser observation, and browser interaction through normal approvals; `test/unit/core/foundation.test.ts`, `test/unit/core/session-store.test.ts`, and `test/unit/tools/github.test.ts` cover local effects, cancellation, outcome-unknown/no blind replay, and durable sanitization. |
| Parallel and GitHub adapters | Green | P8 uses local HTTP fixtures with hostile text and executor-only credentials. `test/unit/tools/parallel-search.test.ts` covers timeout/cancellation/oversize/malformed/redirect/unavailable paths. `test/unit/tools/github.test.ts` covers read/mutation distinction, credential omission/redaction, approval denial/cancellation, and ambiguous comment delivery. |
| MCP compatibility adapter | Green | P8 uses an attached stdio server with hostile annotations, unsupported schema, unknown effect, and child-close marker. `test/unit/tools/mcp.test.ts` additionally covers local Streamable HTTP, legacy fallback, allowlisting, header/credential protection, and unavailable/configuration failures. |
| Chrome DevTools profile | Green | P8 combines observation and interaction in the canonical registry and verifies browser-secret redaction. `test/unit/tools/chrome-devtools.test.ts` covers curation, explicit unknown-tool opt-in, authenticated-session warning, cancellation, bounds, and disablement. |
| TUI plugin/command/approval presentation | Green (deterministic renderer) | `test/unit/tui/app.test.ts` covers plugin commands plus generic external and authenticated-Chrome approval presentation. Native terminal evidence is listed separately. |
| Inherited Phases 2–5 | Green (deterministic) | Broad suite includes Phase 2 agent/tool/process/Git tests, Phase 3 context/skills tests, `test/integration/phase4-qualification.test.ts`, and `test/integration/phase5-qualification.test.ts`; all passed in this candidate run. |
| Parallel live service | Evidence Gap | No explicit `GEORGE_PHASE6_PARALLEL_TEST_KEY` was configured. Local fixture is correctness authority. |
| GitHub live read/mutation | Evidence Gap | No explicit `GEORGE_PHASE6_GITHUB_TEST_TOKEN` or designated `GEORGE_PHASE6_GITHUB_DISPOSABLE_TARGET` was configured; no remote request or mutation was attempted. |
| MCP live configured server | Evidence Gap | No explicit `GEORGE_PHASE6_MCP_SERVER` was configured. |
| Chrome live DevTools target | Evidence Gap | No explicit `GEORGE_PHASE6_CHROME_DEBUG_TARGET` was configured. |
| Native OpenTUI terminal | Evidence Gap | This qualification ran without a TTY. Deterministic renderer coverage is not claimed as native-terminal evidence. |

No layer is **Not Green**. Evidence Gaps are intentionally not inferred as passing live evidence.

## Validation run

- `node --experimental-ffi --test test/integration/phase6-qualification.test.ts` — pass (1 test).
- `npm run typecheck` — pass.
- `npm test` — pass (271 tests).
- `npm run test:runner` — pass (90 tests).
- `git diff --check` — pass.
- `test ! -e package-lock.json` — pass.

## Runtime inventory

- Node `v26.10.0`; npm `11.19.1`; Linux `7.0.0-31-generic` (`x86_64`).
- Runtime dependencies: `@modelcontextprotocol/client@2.1.0`, `@opentui/core@0.5.12`.
- Development dependencies: `@types/node@26.6.2`, `typescript@5.9.3`.
