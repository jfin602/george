# c9 turn context convergence P2 continuation convergence evidence

Status: **GREEN — DETERMINISTIC CONTINUATION CONVERGENCE QUALIFIED**

Date: 2026-09-26

Pre-task HEAD: `fd6546266e2ba726445bc022f9787c0e7a7ba485`

Package: `0.9.10` (unchanged)

P2 separates the frozen initial context selection from a turn-local effective provider-input envelope. Adaptive turns may promote monotonically through the existing ordinary, medium, and large profiles. Fixed turns remain fixed. No profile constant, source selection, provider adapter payload, TUI base-agent wiring, live instrument, or acceptance artifact changed.

## Continuation formula and authority

For each completed response, George computes:

`chainAfterResponse = max(previousRequestEstimate, reportedInputTokens ?? 0) + (reportedOutputTokens ?? serializedResponseEstimate)`

Before a tool continuation, George computes:

`nextRequestEstimate = chainAfterResponse + serializedProjectedToolResultsEstimate + 32`

The deterministic serializer estimate remains the existing four-code-units-per-token approximation. The fixed 32-token term is the bounded protocol/serialization margin.

The provider's reported input is compared with the prior local request estimate using `max`, because the reported input already represents the provider chain and must not be added to the same historical estimate. Reported output is the strongest available output observation; serialized response output is the deterministic fallback when usage is absent. Only newly projected P1 tool results and the fixed margin are added for the next request.

Run-wide provider input/output accounting remains separate and consumes each completed response's reported usage before continuation-envelope handling.

## Promotion and failure sequences

Deterministic tests exercise:

- ordinary -> medium from an 8,000-token reported input, 300-token reported output, the new projected read result, and the 32-token margin;
- medium -> large on the next tool round from a 16,000-token reported input, 300-token reported output, the new projected read result, and the same margin;
- no demotion and exactly one `context.assembled` event throughout that sequence;
- byte-identical base instructions, current input, and tool definitions across every continuation;
- zero semantic compactions and no provider/tool call caused by either promotion;
- deterministic fallback promotion when provider usage is absent;
- fixed ordinary failure before a locally unsafe second request;
- adaptive failure before a locally knowable request above the 24,576-token large ceiling;
- provider-reported input above ordinary but within medium promoting a completed final response instead of retroactively failing it;
- provider-reported input above large terminating without committing provisional assistant text.

The initial profile-selector tests remain unchanged and Green: initial adaptive source-selection promotion is still finalized before the first provider request.

## Provider-result projection preservation

The agent loop still calls `ToolRegistry.projectProviderResult()` before continuation estimation and transmission. The P1 mutation regression remains Green: canonical `write_file` evidence retains the 122-entry Git snapshot (11,918 serialized bytes), while the provider continuation receives the 148-byte path/bytes/SHA receipt without the snapshot.

## Observability

New bounded `context.envelope.promoted` evidence records:

- turn ID;
- from/to profile IDs;
- finite reason (`continuation-estimate` or `provider-usage`);
- observed/estimated tokens;
- the promoted provider-input ceiling.

The event is normalized in durable session evidence, external diagnostics, progress/activity projections, and qualification live-work `envelopePromotions`/artifact evidence. It contains no context, tool, file, or provider body. Historical `context.assembled` evidence continues to describe the initial selected source composition and is not rewritten.

## Validation

Available runtime: Node `v24.21.0`; npm `11.19.0`. The repository-supported Node 26 runtime was not available in this shell.

| Command / scope | Result |
| --- | --- |
| Context selector/assembler, one-turn continuation, LM Studio adapter, progress/diagnostics/session consumers, live-work trace, mutation/coding workflow/recovery, Phase 5 and affected Phase 9 floor | **Green: 187/187 passed** |
| `npm run typecheck` | **Green** |
| `npm run test:runner` | **Green: 90/90 passed** |
| `npm test` | **Not runnable on Node 24:** `node: bad option: --experimental-ffi` |
| Direct portable broad characterization without the unsupported flag | **Not Green: 373 passed, 28 failed, 1 skipped, 402 total** |

All 28 portable broad failures report the same unavailable OpenTUI native-FFI initialization on Node 24; the skipped case is the native Node 26 terminal test. The affected non-OpenTUI floor is Green. This evidence does not relabel the broad aggregate Green or claim Node 26/native-TTY verification.

## Integrity

- `package.json` remains `0.9.10`.
- No root `package-lock.json` exists.
- Phase 9 v1/v2 task, instrument, metadata, and acceptance immutability tests are Green.
- No live smoke or official gate ran.
- No v3 instrument was created.
- Phase 9 was not owner-closed and Phase 10 was not opened.
