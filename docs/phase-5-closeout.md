# Phase 5 Closeout — Reliability + Long Runs

Date: 2026-09-23  
Implementation/qualification candidate: P7 commit `0ea556034c70861297997a046e622162876a8d00` (`0.5.7`)  
Formal P8 closeout marker: `dee176d91a1a37d143fea8ce3a75833d1e42b5e6` (`0.5.8`)

## State

| State | Truth | Basis |
| --- | --- | --- |
| Implementation Complete | Green | P1-P7 Phase 5 scope is present and the deterministic focused, integrated, inherited-regression, TUI-renderer, runner, and typecheck evidence recorded by P7 passed. |
| Stability Qualified | Not Green | Native-terminal evidence remains an Evidence Gap and the bounded live LM Studio/Qwen smoke was Not Green because it produced no completed result. |

This is the formal Phase 5 evidence closeout. It preserves the exact P7 evidence truth and does not convert missing or failed live evidence into a pass.

The P8 marker advanced the package to `0.5.8` and updated the Phase 5 task status, but referenced this formal record without actually adding it. This file restores that missing documentation record without changing implementation or qualification truth.

## Evidence audit

| Area | Truth | Basis |
| --- | --- | --- |
| Long-run budgets and exhaustion | Green | Deterministic tests cover finite application-owned accounting, soft pressure, provider/tool/process/context usage, cancellation precedence, and explicit hard exhaustion. |
| Canonical versus derived evidence | Green | Canonical transcript/session events remain authoritative while compaction checkpoints, diagnostics, recovery projections, and hook results remain derived bounded evidence. |
| Context compaction | Green | Deterministic and integrated evidence covers pressure-triggered completed-history compaction, versioned digest-bearing checkpoint provenance, recent raw-tail retention, multiple advancing checkpoints, preserved unresolved state, and canonical history remaining intact. |
| Durable session preservation | Green | P7 corrected reopen-resave transcript loss and installed a permanent regression test preserving completed canonical history while excluding unfinished trailing user state. |
| Replay-safe retry | Green | Bounded retry/backoff occurs only before provider response acceptance/output; post-response-start/text failures do not automatically retry or duplicate canonical assistant/tool effects. |
| Interruption reconciliation | Green | Safe write reconciliation uses desired hash/byte evidence; patch/process/approval/provider ambiguity remains explicit and no interrupted side effect is blindly replayed. |
| Process cleanup | Green on Linux deterministic fixtures | Timeout/cancellation descendant cleanup is covered with PID start-time identity checks and structured cleanup uncertainty. This is not a sandbox or cross-platform proof. |
| Lifecycle hooks | Green | Ordering, enable/disable, duplicate handling, bounded I/O, timeout/cancellation, malformed output, failure isolation, sanitized process environment, canonical process approval, recursion suppression, and non-authoritative hook output are covered. |
| Diagnostics and growth characterization | Green | Correlated bounded/redacted diagnostics, rotation/retention, sink isolation, and repeated storage/RSS measurements are covered. Measurements remain observations rather than frozen performance thresholds. |
| Inherited Phase 2/3/4 safeguards | Green | Permission/tool/process/Git safety, context/skills, durable sessions, workflow evidence, transcript truth, provider diagnostics, root listing normalization, provisional tool-round text suppression, and work rendering remain covered by the broad regression matrix. |
| OpenTUI test renderer | Green | Deterministic renderer evidence covers long history, streaming, approvals, cancellation, draft preservation, resize, scrollback/selection, grouping, and clean shutdown. |
| Native OpenTUI terminal | Evidence Gap | P7 had no usable TTY; genuine native long-history responsiveness, interaction, and terminal restoration were not exercised. |
| Live LM Studio/Qwen | Not Green | The pinned Qwen model was visible on loopback LM Studio, but the bounded live smoke produced no completion result. No successful live long-run/compaction/recovery claim is made. |

## Recorded deterministic evidence

P7 records:

```text
focused Phase-5 matrix                         # 41 passed
Phase-2/3/4 + renderer matrix                 # 71 passed
npm run test:runner                           # 90 passed
npm run check                                 # typecheck + 236 passed
git diff --check                              # passed
test ! -e package-lock.json                   # passed
```

Runtime recorded by P7:

```text
Node v26.10.0
npm 11.19.1
Linux 7.0.0-31-generic x86_64 GNU/Linux
```

The authoritative detailed qualification record is:

- `docs/tasks/p5/P7-qualification-evidence.md`.

## Accepted implementation boundary

Phase 5 closes at:

- application-owned finite long-run budgets and explicit exhaustion;
- provider-facing completed-history compaction with bounded provenance-bearing checkpoints;
- replay-safe bounded provider retry/backoff;
- evidence-based interruption reconciliation with no blind side-effect replay;
- hardened process cleanup/identity evidence without sandbox claims;
- George-owned deterministic lifecycle hook runtime with no authority escalation;
- bounded structured diagnostics and performance characterization;
- preserved Phase 2 permission/process/Git boundaries;
- preserved Phase 3 context/skill trust and precedence;
- preserved Phase 4 canonical transcript/session/workflow/progress evidence;
- attached local long-running work only.

Phase 5 does not claim plugin packaging/external adapters, browser/network tools, utility-model specialization, daemon/background-job ownership, scheduling, Tauri, or multi-agent execution.

## Qualification limitations carried forward

The following are intentionally unresolved at formal closeout:

1. **Native terminal — Evidence Gap.** The real OpenTUI Phase-5 long-history/streaming/approval/cancellation/recovery path still needs native-terminal characterization.
2. **Live LM Studio/Qwen — Not Green.** The supported model was available, but the bounded smoke did not produce a completed result. This should be investigated or re-qualified later; deterministic evidence remains the correctness authority.

Neither limitation is relabeled Green by this closeout.
