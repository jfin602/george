# Phase 6 Closeout — Plugins + External Adapters

Date: 2026-09-23  
Implementation/qualification candidate: P8 commit `b25f48b9d8b3b46fac1031c72cc4b1143270fa37` (`0.6.8`)  
Formal P9 closeout version: `0.6.9`

## State

| State | Truth | Basis |
| --- | --- | --- |
| Implementation Complete | Green | P8 records passing deterministic qualification for the complete P1-P7 Phase 6 surface, plus typecheck, broad test, runner, diff, and lockfile checks. |
| Stability Qualified | Not Green | Five live/native layers are Evidence Gaps. Per the stability contract, an Evidence Gap is not Green. |

This is the formal Phase 6 evidence closeout. It preserves the P8 candidate's
truth: no audited layer is Not Green, but missing live service/browser and
native-terminal evidence is not converted to Green. It is not an owner
closeout or a Phase 7 transition.

## Evidence audit

Every Green and Evidence Gap below is from the current P8 record,
`docs/tasks/p6/P8-qualification-evidence.md`.

| Area | Truth | P8 evidence |
| --- | --- | --- |
| Effect, risk, replay, source metadata; generic approvals and durable interruption truth | Green | The canonical-registry fixture exercises host process, external read, remote mutation, unknown external, browser observation, and browser interaction through ordinary approval. P8 also cites `core/foundation`, `core/session-store`, and GitHub coverage for cancellation, outcome-unknown/no-blind-replay, and durable sanitization. |
| Credential executor-only boundary | Green | The P8 fixture proves Parallel/GitHub credentials are used at their executors while credential and browser-secret sentinels are absent from events, session, provider requests, and approvals. |
| Plugin manifest and lifecycle containment | Green | `plugins/index` coverage cited by P8 covers malformed, oversized, traversal, symlink, and special packages; atomic preservation; non-executing install/uninstall; bounded manifests; and capability-fingerprint re-enable. |
| Plugin skills, hooks, tools, commands, and third-party process trust | Green | P8's application and integrated fixture cover a lazy skill, declarative command, hook, attached process tool, normal approval, and failure isolation. This remains host-process trust, not OS-sandbox evidence. |
| Parallel Search | Green (deterministic) | P8 cites local HTTP-fixture coverage for bounded input/results, timeout/cancellation, malformed/oversized/redirect/unavailable paths, hostile text, and executor-only credentials. |
| GitHub reads, remote mutation, and replay separation | Green (deterministic) | P8 cites local REST-fixture coverage for read/mutation distinction, credential redaction, approval denial/cancellation, and ambiguous comment delivery without blind replay. |
| MCP configuration, transports, namespacing, allowlist, schema translation, authority, and process ownership | Green (deterministic) | P8 exercises attached stdio with hostile annotations, rejected unsupported schema, unknown effect, and child-close evidence; it also cites Streamable HTTP, legacy fallback, allowlisting, header/credential protection, and unavailable/configuration failures. |
| Chrome DevTools profile | Green (deterministic) | P8 combines observation and interaction, verifies browser-secret redaction, and cites curated tools, explicit unknown-tool opt-in, authenticated-session warning, cancellation, bounds, and disablement. |
| Provider-facing schema bounds and adapter disablement/failure isolation | Green | P8's canonical registry fixture proves bounded provider schema size, rejects unsupported MCP schema, and verifies disabled plugins/adapters are not provider-visible; its plugin/adaptor rows record isolation coverage. |
| TUI approval and command presentation | Green (deterministic renderer) | P8 cites `tui/app` coverage for plugin commands and generic external/authenticated-Chrome approvals. This is not native-terminal evidence. |
| Inherited Phase 2-5 safeguards | Green (deterministic) | P8 records the broad suite passing with the prior agent/tool/process/Git, context/skills, Phase 4, and Phase 5 qualification coverage. |
| Parallel live service | Evidence Gap | No explicit `GEORGE_PHASE6_PARALLEL_TEST_KEY` was configured; P8 records only the deterministic local fixture. |
| GitHub live read or mutation | Evidence Gap | No explicit `GEORGE_PHASE6_GITHUB_TEST_TOKEN` or `GEORGE_PHASE6_GITHUB_DISPOSABLE_TARGET` was configured; P8 records no remote request or mutation. |
| MCP live configured server | Evidence Gap | No explicit `GEORGE_PHASE6_MCP_SERVER` was configured. |
| Chrome live DevTools target | Evidence Gap | No explicit `GEORGE_PHASE6_CHROME_DEBUG_TARGET` was configured. |
| Native OpenTUI terminal | Evidence Gap | P8 ran without a TTY; deterministic renderer evidence is not native-terminal proof. |

## Recorded deterministic evidence

P8 records these successful commands for its exact candidate:

```text
node --experimental-ffi --test test/integration/phase6-qualification.test.ts  # 1 passed
npm run typecheck                                                              # passed
npm test                                                                       # 271 passed
npm run test:runner                                                           # 90 passed
git diff --check                                                              # passed
test ! -e package-lock.json                                                   # passed
```

P8 recorded Node `v26.10.0`, npm `11.19.1`, Linux `7.0.0-31-generic`
(`x86_64`), `@modelcontextprotocol/client@2.1.0`, and
`@opentui/core@0.5.12`.

## Scope boundary

P9 adds only this evidence record, the narrow task-status reference, and the
assigned `0.6.9` package version. It adds no Phase 7+ behavior. The Phase 6
boundary remains explicit local plugin packaging and bounded Parallel, GitHub,
MCP, and Chrome DevTools adapters; owner closeout and any `0.7.0` transition
remain separate decisions.
