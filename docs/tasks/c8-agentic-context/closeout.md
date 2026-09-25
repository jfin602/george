# c8-agentic-context correction closeout

Status: **IMPLEMENTATION COMPLETE; CORRECTION NOT QUALIFIED**  
Date: 2026-09-25  
Correction: `c8-agentic-context` / P6  
Closeout candidate: `fe4cba4dbc8d829bc5f557fa2f076fec28ed3c38`; package `0.8.8`.

## Closeout state

- **Implementation Complete — Green.** The version-3 `agentic-context` benchmark exists at the real George application/provider/tool boundary, has deterministic regression coverage, and P3 correctly made no unsupported production-policy change after P2 failed to establish an envelope.
- **Correction Qualified — Not Green.** The correction success condition requires a controlled, all-family healthy agentic working-set envelope and real George qualification of its resulting policy. Neither a healthy envelope nor an adjacent measured risk/cliff region exists. The smallest attempted shape has a direct edit-plus-validation failure; runtime and Node-26/TUI controls also remain incomplete.
- **Phase 8 remains unclosed; Phase 9 remains blocked.** This document neither owner-closes Phase 8 nor changes the historical Phase-8 closeout.

## Evidence authority and benchmark contract

The accepted measurement instrument is `agentic-context` suite **v3**, benchmark schema **3**, introduced by P1 (`843ddeb212d509411e8ec8339a5b07217ff04890`) and retained in current `src/benchmark/index.ts` and `test/unit/benchmark/index.test.ts`. It has the bounded ascending bands `2048,4096,6144,8192,10240,12288` and three deterministic George-shaped families per band: repository inspection, multi-round investigation, and edit plus validation. It uses normal coding-tool schemas and actual George application/tool flows; its persisted record includes context selection/dispositions, provider use/timing, tool evidence, and deterministic outcome.

The historical `context` suite remains **synthetic long-context prefill/retrieval characterization only**: its no-tool sentinel/retrieval shape is intentionally distinct from the agentic suite. Its warm observations and the historical synthetic-ladder result must not be presented as proof of a coding-agent profile boundary. P2, P3, P4, and P5 all preserve this classification.

## Envelope and runtime conclusion

| Claim | State | Evidence-only conclusion |
| --- | --- | --- |
| Healthy agentic working-set region | **Evidence Gap** | None is established. P2's only 2,048 requested-band sweep passed 1/3 families; P5's repeat diagnostic passed inspection and investigation but failed edit plus validation. No all-family candidate exists to confirm. |
| Next risk/cliff region | **Evidence Gap** | No adjacent larger region was measured. The failed smallest-band work is a direct Not Green task/tool result, not a context-size cliff. |
| Smallest-band edit plus validation | **Not Green** | P5 observed 10 calls across six tool names instead of the expected `read_file`, `write_file`, `run_process`; unrequested `git_status`, `search_text`, and `git_diff`; an edit mismatch; and 45.826 s workflow time. |
| Runtime provenance | **Evidence Gap for controlled comparison** | P2/P5 REST prechecks directly observed the pinned model and 32,768 context, eval 2,048, physical batch 512, parallel 1, Flash Attention/KV offload enabled, and 8 experts. Main-model GPU Offload 26 was never independently observed, so latency claims are only REST-visible characterization, not controlled comparable performance evidence. |

P5's provider-report input reached 20,765 tokens during the failed edit continuation. That does not make the requested 2,048 band a 2k provider-input result and does not establish a larger envelope.

## Current production policy (unchanged by P3)

The current source policy is the historical/provisional `0.8.8` profile registry, not an empirically accepted agentic-envelope policy:

| Profile | Preferred working set | Soft pressure | Provider-input safety ceiling |
| --- | ---: | ---: | ---: |
| ordinary | 4,096–6,144 | 7,168 | 8,192 |
| medium | 8,192–12,288 | 14,336 | 16,384 |
| large | 12,000–18,000 | 20,000 | 24,576 |

All retain the physical 32,768 target and 8,192 reserved headroom. The physical window is capacity/headroom, not a prompt-fill target. P2 supplied no authority to revise these values, create an agentic-limit field, change routing/promotion, alter compaction/recovery, change provider timeout, or alter runtime configuration; P3 made none of those changes.

Adaptive mode probes ordinary → medium → large monotonically before the first provider request, discards probe side effects, selects once, and freezes that profile for the user turn. It protects George invariants, current user intent, required tools, immediate evidence, and authoritative unresolved/recovery state; it records whole-source omit/defer evidence and may promote for selected project instructions, routed documents, or activated skills when a larger existing profile relieves the pressure. Fixed mode is the explicit operator override: it validates and uses exactly the selected concrete profile, with no adaptive probes or promotions, under that profile's normal provider-input safety ceiling.

There is **no qualified adaptive envelope** today. Consequently, an envelope-specific policy for correctness-critical selected material cannot truthfully be Green. Present hard-profile behavior is still fail-closed: required-context assembly failure is promoted through the existing profiles and, if the largest cannot safely assemble it, fails before provider execution rather than silently partially dropping the required source. A future measured envelope policy must explicitly fail/degrade before provider execution when correctness-critical selected material cannot fit that qualified envelope; it must not omit it or send an unqualified giant prompt. This future envelope-specific behavior remains an **Evidence Gap**, not a production claim.

## Preserved contract layers

| Layer | State | Current/source and deterministic evidence |
| --- | --- | --- |
| Phase-3 trust, precedence, and source integrity | **Green** | Current context assembly and `test/unit/context/index.test.ts` retain stable source identity/order, precedence, duplicate handling, and whole-source omit/defer/fail semantics. Repository/project/skill text cannot expand executable authority. P3 changed no source, selector, or assembler behavior. |
| Adaptive/fixed selection, routing, and promotion diagnostics | **Green, deterministic** | `src/context/profile-selector.ts` and selector/one-turn tests prove provider/tool/session-neutral probing, selection before inference, frozen per-turn selection, concrete fixed override, promotion reasons, and bounded diagnostics. The operating values themselves remain provisional, not agentically qualified. |
| Phase-5 compaction/recovery authority | **Green, deterministic** | Large/fixed pressure retains checkpointed compaction/recovery; canonical George session history remains authoritative and compaction is derived. `test/integration/phase5-qualification.test.ts`, recovery tests, and P4's focused qualification preserve failed/cancelled compaction, recovery evidence, and no replay of ambiguous work. Ordinary/medium promote rather than semantically compact merely to stay small. |
| P7 frozen-turn continuation pressure | **Green, deterministic and one bounded live guard** | `src/application/one-turn.ts` estimates completed serialized tool results before continuation and fails explicitly when the frozen ceiling would be exceeded; it neither drops/summarizes/reroutes/resizes context nor sends an unsafe extra call. P7 fixtures cover ordinary stop and medium safe continuation. P5 separately observed a live ordinary stop at estimated 9,065 over the 8,192 ceiling after three reads, with no continuation, resize, or compaction. |
| Benchmark/context/application/provider regressions | **Green, deterministic** | P4/P5 focused command passed 97/97: benchmark, context, selector, application, recovery, core, provider, and Phase-5 integration tests. `npm run typecheck` and `npm run test:runner` were Green (90/90). P4 also guards source-body exclusion from benchmark artifacts. |
| Real George coding-agent qualification | **Not Green** | P5 directly exercised real inspection, multi-round, and edit/validation work at the bounded diagnostic shape. The first two passed; the required edit/validation family failed, so no all-family production-policy qualification follows. |
| Native TUI | **Evidence Gap** | P5 had Node v24.21.0 and `not a tty`, not the required Node-26 usable TTY; no OpenTUI startup/activity/Ready/exit/restoration claim was made. |

## Remaining Not Green and Evidence Gaps

- **Not Green:** P2's 2,048 requested-band sweep was 1/3; P5's smallest bounded diagnostic was 2/3 because edit plus validation failed with expanded/unrequested tools and an incorrect edit. These are retained as live task/tool failures, not reclassified as a size threshold.
- **Not Green:** inherited broad/native validation remains blocked by Node v24's lack of the required `--experimental-ffi` support; P4 recorded 289/316 direct broad tests, with 27 OpenTUI native-FFI initialization failures. This is neither repaired nor attributed to c8.
- **Evidence Gap:** healthy envelope, adjacent risk/cliff region, confirmation repetitions, independently confirmed GPU Offload 26, controlled comparable latency, Node-26 real-TTY/OpenTUI qualification, and broad live continuation-pressure performance/capacity evidence.

## Integrity and final checks

P2–P5 leave the package version at `0.8.8`, preserve the 32,768 physical target and all existing production behavior, and do not alter `docs/phase-8-closeout.md`. At this P6 closeout candidate, `package.json` reports `0.8.8`, `package-lock.json` is absent, and `git diff --check` passes.

The next permissible correction work is measurement only after independent runtime control is available and the benchmark's smallest-band tool-behavior baseline is resolved or explicitly qualified. It must establish and confirm a healthy all-family agentic region plus the next materially worse region before any production envelope/routing change is proposed.
