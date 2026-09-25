# c9-structured-task-convergence

Phase 9 correction stack for the live structured-task convergence failure observed after package `0.9.10`.

Trigger evidence:
- frozen P4 structured replay: Not Green, 25 model tool calls, 20 provider rounds, 63,253 / 1,801 provider tokens, 344.745 s;
- greenfield P1: Not Green before validation; temporary harness incorrectly continued later tasks;
- existing-app: Not Green, 47 calls, 23 rounds, validation never reached, 449.249 s;
- deterministic Phase 9 and real Bubblewrap containment remain Green.

The correction began as a convergence repair. P1 additionally proved an unfinished Phase 9 product boundary: George can validate structured stack metadata but has no production application-owned executor for ordered multi-task stacks. P4–P6 therefore complete and qualify that already-approved Phase 9 stack contract in addition to the P1–P3 convergence work.

The correction still does not retune context, redesign TUI, change Bubblewrap policy, or begin Phase 10.

Prompt order:
1. P1 — convergence diagnostic/evidence;
2. P2 — stage evidence continuity + shared task budget;
3. P3 — direct validation + convergence guards;
4. P4 — production structured task-stack execution + thin fail-stop qualification runner;
5. P5 — gated live convergence and production-stack qualification;
6. P6 — convergence + stack-boundary correction closeout.

Required unchanged package version for every prompt: `0.9.10`.

Primary live acceptance gate: the exact frozen Phase 8 structured replay must become functionally Green with zero human coding intervention, <=10 model-requested tool calls, and <=10 logical provider rounds before the larger frozen live-work instruments are spent again.
