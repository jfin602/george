# P7 adaptive continuation-pressure evidence

Status: **IMPLEMENTATION QUALIFIED DETERMINISTICALLY; NOT STABILITY GREEN**

Date: 2026-09-24
Candidate: pre-task HEAD `237b629da59b30b275250f322a13afe09fa45a87` (`0.8.6`), with the P7 working tree at `0.8.7`. No commit was created by this task.

## Confirmed defect and narrow correction

The accepted P6 loop froze and repeated its initial provider request through tool continuations, but did not account for accumulated tool-result payloads against the frozen selected profile. The first P7 ordinary fixture failed on the unmodified candidate: it made a fourth provider request where the regression requires a bounded stop after three (`4 !== 3`). This was a real continuation-pressure gap, not a selection, compaction, or provider-reuse experiment.

`AgentLoopApplicationService` now retains a deterministic estimate of serialized completed tool results for the current turn. Before each continuation it adds that estimate to the selected assembly estimate and fails with a bounded `budget` error if it exceeds the frozen profile's provider-input ceiling. A provider-reported input count above that ceiling also fails explicitly. Neither path drops, summarizes, reroutes, or resizes context, and neither makes an extra model call.

## Deterministic fixtures and observations

| Fixture | Initial selected profile | Continuation shape | Observed/provider input growth | Result |
| --- | --- | --- | --- | --- |
| Ordinary pressure | ordinary | Three sequential bounded `read_file` results, each 10,000 UTF-16 code units; current intent, George invariants, selected routed document, activated skill, and interrupted provider-continuation state all present | scripted completed-round input usage: 4,000 -> 6,000 -> 7,800; next serialized-result estimate exceeds ordinary's 8,192 ceiling | Three provider calls; the fourth is not made; explicit bounded `budget` failure; zero compactor calls |
| Medium pressure | medium | Two sequential bounded `read_file` results, each 16,000 UTF-16 code units | scripted completed-round input usage: 8,000 -> 12,000 -> 16,000, below medium's 16,384 ceiling | Three provider calls complete; the frozen complete request and each continuation remain intact; zero compactor calls |

The ordinary fixture proves all continuation request objects retain current user intent, George-owned instructions, selected routed guidance, activated-skill guidance, and authoritative unresolved state. The medium fixture proves the same immutable request behavior near the next envelope. Tool results retain their normal structured call IDs. No provider-backed semantic compaction occurs in either ordinary or medium path.

## Permanent regression guards

- `frozen adaptive profiles retain critical context through safe continuation growth and stop before an unsafe continuation` proves ordinary selection, multi-round growth, required-context retention, no fourth unsafe provider request, no compactor call, and explicit failure.
- `a frozen medium profile retains its complete request through substantial continuation results` proves medium selection, 16,000-token reported input, complete request reuse across rounds, structured continuations, no compactor call, and completion.
- Existing LM Studio continuation fixtures remain the P5 accepted state: full instructions/tools on continuations; rejected continuations, cancellation, and provider errors do not trigger blind fallback/replay. `previous_response_id` remains transport-only.

## Validation

```text
Pre-correction: node --test test/unit/application/one-turn.test.ts --test-name-pattern='frozen adaptive profiles'
  Not Green as expected: 29/30 pass; the new guard failed with 4 provider calls instead of the required 3.

npm run typecheck
  pass

node --test test/unit/benchmark/index.test.ts test/unit/context/profile-selector.test.ts test/unit/context/profiler.test.ts test/unit/context/compaction.test.ts test/unit/application/one-turn.test.ts test/unit/application/recovery.test.ts test/unit/provider/lm-studio.test.ts test/integration/agent-loop.test.ts
  91/91 pass

node --test test/unit/*.test.ts test/unit/**/*.test.ts test/integration/**/*.test.ts
  287/314 pass; all 27 failures are the inherited OpenTUI native-FFI initialization failure on Node v24.21.0

npm run test:runner
  90/90 pass

npm test
  Not Green: Node v24.21.0 rejects the repository-required --experimental-ffi option before tests start.
```

The changed boundary adds one deterministic local serialization estimate only after a tool result. It does not alter normal no-tool provider request shape or call count. The focused deterministic benchmark harness remains applicable; no new live benchmark claim is made because this is a correctness guard, not a throughput optimization, and the existing native-FFI/live-runtime evidence state remains unchanged.

## Truth

- **Green:** deterministic continuation-pressure safety, frozen-profile immutability, ordinary/medium no-compaction behavior, P5 continuation/reuse rejection and no-replay semantics, session/recovery/permission preservation, typecheck, and runner tests.
- **Not Green:** `npm test` cannot start on the installed Node v24.21.0 because `--experimental-ffi` is unsupported; this is the inherited native-FFI environment result, not a P7 failure.
- **Evidence Gap:** no new live LM Studio continuation-pressure run. P7 makes no live latency, cache, or provider-capacity claim.

`package-lock.json` is absent. P7 does not owner-close Phase 8 or advance Phase 9.
