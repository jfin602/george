# c9-gen-op Implementation Plan

Status: READY FOR PROMPT EXECUTION

Correction: `c9-gen-op`  
Roadmap phase: 9  
Required unchanged package version: `0.9.10`

## P1 — useful-output stall semantics

Trace LM Studio SSE normalization and application watchdog transitions.

Implement the smallest typed provider-activity vocabulary that distinguishes:
- response accepted/created;
- useful output progress.

Required semantics:
- request start keeps first-useful-output timing active;
- response acceptance records identity but does not switch to active-output timeout;
- text/function-call/control-call generation progress starts active-output timing;
- completion stops timers.

Keep current bounded retry/rebase and 120000 ms absolute provider timeout.

Add devlog-shaped fake-time regressions.

## P2 — stable-prefix request shape

Replace `base instructions + changing mission card` with a provider-independent late round-context seam.

Target shape:
- stable `instructions`;
- stable base `input`;
- optional bounded dynamic round context;
- provider-native continuation and tool results.

Mission-card authority, freshness, token accounting, and canonical rebase behavior remain intact.

Lock LM Studio initial/continuation wire bodies with tests.

## P2 — Gen-Op v1

Add application-owned structured operation mode.

Expose selected coding tools plus one provider-visible George control with `op=handoff`.

Do not register that control with ToolRegistry.

A valid completed handoff returns control to structured orchestration without executing a tool or changing TaskState by model assertion.

Structured implementation/correction internal rounds require tool/control output each logical round.

Define deterministic fail-closed behavior for malformed/mixed control responses.

Do not execute streamed proposals before response completion.

## P2 — qualification deadline seam

Extend qualification helpers only.

Add optional outer deadline to ordinary-turn, single structured, and stack live qualification.

The same deadline wraps an entire stack invocation.

Deadline expiry produces bounded Not Green evidence through normal cancellation and does not change production RunBudget.

Freeze final-sweep deadlines:
- greeting 180000;
- three-file 300000;
- Gate A 600000;
- B2 1200000 total stack;
- C2 900000.

## P2 — observability

Normalize optional cached input tokens when provider usage supplies them.

Add safe aggregate round evidence for internal text amount, executable tool calls, and George control calls without retaining raw prose.

Keep historical artifacts readable or version explicitly.

## P3 — qualification

Create:
- `docs/tasks/c9-gen-op/qualification-report.md`;
- bounded evidence under `docs/tasks/c9-gen-op/evidence/`.

Run deterministic floors, broad suite once, and one bounded representative live Qwen Gen-Op test.

Do not run the official final five-workload sweep.

## P4 — closeout

Evidence-only.

If Green, hand back to `c9-final-live-convergence` for a fresh complete P3 sweep.

## Regression priorities

Protect:
- Phase 5 replay safety;
- stall recovery;
- canonical assistant buffering;
- TaskState/validation authority;
- mission-card freshness;
- permissions/tool validation;
- SHA/framing;
- hidden acceptance;
- duplicate/no-progress;
- ordinary chat;
- session persistence;
- continue-and-record sweep policy.
