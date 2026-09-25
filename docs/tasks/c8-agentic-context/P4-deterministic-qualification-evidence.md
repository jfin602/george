# P4 deterministic agentic-context qualification evidence

Status: **IMPLEMENTATION QUALIFIED DETERMINISTICALLY; OPERATING-ENVELOPE EVIDENCE GAP REMAINS**

Date: 2026-09-24  
Candidate: pre-task HEAD `efa3127fdc644c5db5ecc0e2f4b44986590a1fff` (`0.8.8`), with this uncommitted P4 working tree limited to this record and the benchmark artifact-leak regression guard. No commit was created by this task.

## P3 decision qualification

P2 measured only the 2,048 requested band and produced one passing family out of three. It established neither a healthy all-family envelope nor a next materially worse region; its GPU Offload 26 control is also unconfirmed. P3 therefore added only `P3-policy-decision.md`: `git show --stat HEAD` confirms no runtime source, profile, selector, assembler, provider, application, or test change was included in P3.

There is no P3 agentic operating-limit field to validate or observe. This is intentional: adding one would manufacture an unmeasured policy. Existing adaptive/fixed profile diagnostics remain observable, but the conclusion that an adaptive limit is qualified is an **Evidence Gap**, not Green.

## Deterministic qualification matrix

| Layer | State | Deterministic evidence |
| --- | --- | --- |
| Agentic suite distinct from synthetic context | Green | `agenticContextCases` produces only the three real application/tool workflow families; `contextLadderCases` remains `fixture: none`, no-tools sentinel retrieval. Their CLI band flags are mutually suite-scoped. |
| Configurable bands and stable bounded families | Green | Benchmark tests sort configured bands, reject duplicates/out-of-range/mis-scoped values, lock the 2k/4k/6k/8k/10k/12k defaults, and lock inspection -> investigation -> edit order. Source fixtures remain at or below 64 KiB. |
| Context/tool/timing record evidence and source-body safety | Green | Scripted application runs for all three families require normal coding schemas and record adaptive selection, profile attempts, bounded category/disposition counts, tool calls, validation, provider rounds, and timing. The added guard proves both JSON record and report omit a known assembled guidance body. |
| Quick/full/synthetic selection | Green | Benchmark tests keep quick/full registry filtering and the synthetic ladder's order, sentinel, no-tool shape, and dedicated `--context-bands` behavior. |
| P3 operating limit / production-policy change | Evidence Gap | P2 was insufficient and P3 made no policy change. No measured healthy envelope exists from which to validate a new adaptive limit. |
| Adaptive determinism and probe neutrality | Green | Selector tests prove deterministic monotonic ordinary -> medium -> large probes with zero provider/tool/hook/permission/session effects; one-turn tests prove selection occurs before the first provider request and is frozen for continuations. |
| Fixed-mode contract | Green | Fixed selection validates exactly one concrete profile, performs zero probes/promotions, and remains bounded by that profile's normal provider-input safety ceiling; it does not inherit an unqualified adaptive limit. |
| Required context, explicit optional defer, and selected material integrity | Green | Context/application tests retain George/current-user/tool/unresolved state, preserve selected project/routed/skill material through promotion, and record whole-source optional omit/defer. Precedence, identities, ordering, duplicate handling, and no-partial-source failure behavior remain covered. |
| Correctness-critical material beyond an adaptive envelope | Evidence Gap | The retained hard-profile behavior fails required context before provider execution (`context budget failures ...`); however P2 established no largest qualified adaptive envelope, so no envelope-specific rejection threshold can truthfully be Green. |
| No selection model call; ordinary/medium compaction | Green | Probe-neutrality and one-turn fixtures show selection makes no model call; ordinary/medium promote rather than invoke provider-backed semantic compaction. |
| Large/fixed Phase-5 recovery and P7 continuation pressure | Green | Phase-5 integration, recovery, and one-turn fixtures retain truthful compaction/checkpoints and fail closed before an unsafe frozen-profile continuation while preserving the complete selected request. |
| Permissions, canonical session, Git/user work, and TUI authority | Green (deterministic core) / Evidence Gap (native TUI) | No P3/P4 runtime boundary changed; focused application/recovery/provider fixtures preserve approval and canonical-session behavior. Native OpenTUI lifecycle remains an inherited environment Evidence Gap on Node 24 because the repository-required FFI flag is unavailable. |

The P2 1/3 attempted-band result remains **Not Green** for the live task/tool behavior it directly observed. It is not evidence of a size cliff and is not relabeled here.

## Permanent regression guard

`test/unit/benchmark/index.test.ts` now requires the agentic scripted records to expose the bounded category and disposition keys while ensuring a known assembled project-guidance body cannot appear in either persisted record JSON or the Markdown report. This closes the confirmed artifact-evidence leakage coverage gap at the benchmark-record layer without changing production context policy.

## Validation

```text
node --test test/unit/benchmark/index.test.ts test/unit/context/index.test.ts test/unit/context/profile-selector.test.ts test/unit/application/one-turn.test.ts test/unit/application/recovery.test.ts test/unit/core/foundation.test.ts test/unit/provider/lm-studio.test.ts test/integration/phase5-qualification.test.ts
  Green: 97/97 passed

npm run typecheck
  Green

npm run test:runner
  Green: 90/90 passed

node --test test/unit/*.test.ts test/unit/**/*.test.ts test/integration/**/*.test.ts
  Not Green: 289/316 passed; all 27 failures are the inherited OpenTUI native-FFI initialization failure on Node v24.21.0, including the Phase-4 integration renderer exercise. No benchmark/context/application/provider/recovery failure occurred.

git diff --check
  Green
```

No production optimization experiment ran in P4. `package.json` remains `0.8.8`; `package-lock.json` is absent. P4 does not close Phase 8 or unblock Phase 9.
