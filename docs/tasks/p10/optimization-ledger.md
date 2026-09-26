# Phase 10 Optimization Ledger

Status: P1 BASELINE ESTABLISHED WITH LIVE EVIDENCE GAP

Phase 10 package line: `0.10.x`  
Baseline implementation package: `0.10.1`  
Pre-task HEAD: `3249b3d5194fd075b54bf0983ea4056ebd6a4475`

The phase runner owns the implementation commit. P1 therefore identifies the implementation candidate as the uncommitted `0.10.1` working-tree result based on the pre-task HEAD; the runner-created commit becomes the authoritative candidate identity after this task.

| Step | Candidate | Change | Correctness evidence | Benchmark / live evidence | Intended metric | Observed delta | Disposition |
| --- | --- | --- | --- | --- | --- | --- | --- |
| P1 baseline | uncommitted `0.10.1` result on `3249b3d5194fd075b54bf0983ea4056ebd6a4475` | Additive Phase 10 telemetry, frozen B3/C3, fast-matrix identity | Focused telemetry/instrument tests Green; typecheck Green; runner tests Green | Quick/full benchmark and fast live matrix: Evidence Gap because Node 26.4+ and LM Studio were unavailable | Establish comparable baseline; no optimization delta | Deterministic baseline only; no live/performance values fabricated | baseline recorded; no accept/revise/revert optimization decision |
| P2 useful-output watchdog | uncommitted `0.10.2` result on `9161bfce2034cc1dedd660ce8a581872b77ee450` | Separate response acceptance from useful output, retain active-output/absolute ceilings, and persist per-attempt acceptance/useful-output/provider-active timing | Affected provider/recovery/Phase 5/9/10 floor Green: 204 passed; typecheck Green; runner Green: 90 passed; diff hygiene Green | Comparable fake-time accepted-prefill case: baseline 2 attempts / 1 completed round / 1 retry / false stall at 60001 ms; candidate 1 attempt / 1 completed round / 0 retries / no stall, with acceptance 0 ms, first useful output 60001 ms, provider-active 60001 ms. Live provider evidence remains an Evidence Gap: Node `v24.21.0` is below the supported floor and `127.0.0.1:1234` refused connection. | Eliminate false accepted-prefill stalls and expose truthful attempt timing without weakening recovery | -1 attempt, -1 retry, -1 false stall in the focused case; completed rounds unchanged; no timeout inflation | **accept** — deterministic correctness/recovery stayed Green and the known false-stall class was removed; live latency remains unclaimed |

## P1 artifact authority

- Detailed baseline record: `docs/tasks/p10/P1-baseline.md`.
- Benchmark artifacts: none created; supported runtime gate failed before benchmark execution.
- Fast live attempt artifacts: none created; common runtime gates were invalid, so all five workloads remained Not Run with zero attempts.
- Phase 9 B2/C2: not run and not modified.

P2-P9 append one row per independently measured optimization. Missing live evidence remains an Evidence Gap, never a zero-latency baseline or a functional pass.

## P2 measurement detail

The comparable case used the production watchdog defaults and the same devlog-shaped sequence on an isolated archive of baseline HEAD and on the candidate: request accepted at fake time 0, no useful output through 60001 ms, then text and completion. Baseline classified acceptance as active output and stalled/retried at 60001 ms. The candidate kept the first-useful-output window active, completed before the unchanged 90000 ms first-output and 120000 ms absolute ceilings, and recorded `{responseAcceptanceMs: 0, firstUsefulOutputMs: 60001, providerActiveMs: 60001}`.

This is deterministic watchdog/attempt evidence, not GPU, server-prefill, or supported live-model timing. The focused live comparison was not runnable because the required Node 26.4+ runtime and LM Studio endpoint were unavailable. B2/C2 and the full B3/C3 matrix were not run.
