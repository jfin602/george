# Correction 9 Qualification Plan — Generation Operation Protocol

Status: **APPROVED QUALIFICATION DIRECTION**

Date: 2026-09-26

Correction: `c9-gen-op`  
Package remains `0.9.10`.

## Preserve existing evidence

Do not rewrite prior Phase 8/9 attempts, `c9-final-live-convergence` P1/P2, `c9-provider-stall-recovery`, frozen Gate A/B2/C2 instruments, or hidden acceptance.

The owner-supplied LM Studio developer log is diagnostic source evidence, not normal George session evidence.

## P1 — useful-output watchdog semantics

Permanent deterministic coverage must prove:

1. `response.started` establishes acceptance/identity without entering the short active-output timeout;
2. accepted responses may spend the full first-useful-output allowance prefilling;
3. text generation starts useful-output activity;
4. function/control-call generation progress starts or refreshes useful-output activity;
5. payload-free provider activity distinguishes acceptance from output progress;
6. the devlog-shaped accepted-prefill case does not die at 60000 ms;
7. no useful output by the first-evidence ceiling still stalls;
8. useful output that later becomes inactive still uses the active-output threshold;
9. caller cancellation wins;
10. completion cleans timers;
11. original -> one safe retry -> one rebase -> terminal provider failure remains finite;
12. provisional incomplete-response proposals remain unexecuted/uncommitted;
13. the absolute provider timeout remains 120000 ms.

Use fake time.

## P2 — stable-prefix alignment and Gen-Op v1

### Stable-prefix contract

Prove:
- stable base instructions remain byte-identical across continuations when unchanged;
- dynamic mission-card/control state is delivered through a late bounded round-context seam;
- mission card still recomputes after tool results, mutations, and failures;
- late context participates in continuation token/pressure accounting;
- canonical rebase receives current round context without reusing failed response IDs;
- ordinary turns remain unchanged.

### Provider wire contract

For the LM Studio adapter:
- initial request serializes stable instructions plus late dynamic context;
- continuation preserves `previous_response_id`, tool results, and late dynamic context;
- tool definitions remain stable;
- response IDs/tool results stay correlated;
- provider adapter remains TaskState-blind;
- unsupported/malformed round-context encoding fails explicitly.

### Gen-Op control

Prove:
- structured implementation/correction exposes normal selected coding tools plus one non-executable George handoff control;
- internal rounds require tool/control output rather than ordinary free-form completion;
- valid handoff ends only the current model-operation stage;
- TaskState advances only through existing George orchestration;
- handoff never enters ToolRegistry approval/execution;
- malformed/unknown control fails closed;
- response must complete before tool execution or control acceptance;
- provisional control/tool proposals from incomplete responses are discarded;
- ordinary chat/final user-facing responses remain conversational.

Define deterministic fail-closed behavior for handoff + executable tool, multiple handoffs, and free text in operation mode.

### Qualification deadlines

Add a qualification-owned outer deadline seam to ordinary/live-work instruments.

Prove:
- deadline combines safely with caller cancellation;
- one timer wraps a whole stack invocation;
- B2 does not reset its deadline between P1/P2/P3;
- deadline expiry becomes bounded Not Green evidence;
- later diagnostic sweep workloads still run under existing policy;
- production RunBudget defaults remain unchanged.

Freeze:
- greeting 180000 ms;
- three-file 300000 ms;
- Gate A 600000 ms;
- B2 1200000 ms;
- C2 900000 ms.

### Safe aggregate metrics

Where provider usage exposes it, normalize optional cached input tokens.

Record bounded aggregate internal text bytes/estimated tokens and tool/control counts without persisting raw internal prose.

Historical artifacts must remain readable or be explicitly versioned.

## P3 — deterministic + bounded live Gen-Op qualification

Run focused:
- provider stall;
- LM Studio provider;
- agent loop;
- structured task/task stack;
- context/continuation;
- mission-card/evidence freshness;
- retry/recovery;
- run budget;
- live-work/sweep;
- TUI/work projection where affected;
- Phase 5/9 integration;
- `npm run typecheck`;
- `npm run test:runner`;
- `npm test` exactly once;
- `git diff --check`.

Record runtime provenance:
- candidate SHA/version;
- Node/npm/platform;
- exact model ID;
- LM Studio version/build if deterministically obtainable;
- REST-visible runtime controls;
- GPU Offload 26 confirmed/unconfirmed;
- context profile;
- Gen-Op version;
- watchdog thresholds;
- qualification deadline.

If LM Studio version/build cannot be established, record an Evidence Gap and do not attribute cache behavior solely to George.

Run one bounded representative structured Qwen workload, not the official final five-workload sweep.

Measure correctness, tool/control sequence, provider attempts/rounds, retries/rebases, input/cached/output tokens where available, internal text amount, time to response acceptance, time to first useful output, provider/total elapsed, context profile/promotions, mission-card retention, and intervention count.

Do not repeatedly rerun until Green.

## P4 — closeout

Create `docs/tasks/c9-gen-op/closeout.md`.

Decision table:
- Useful-Output Watchdog Semantics Qualified;
- False 60s Prefill Stall Removed;
- Absolute Provider Timeout Preserved;
- Stall Recovery Ladder Preserved;
- Stable Instruction Prefix Qualified;
- Late Dynamic Round Context Qualified;
- Mission Card Authority Preserved;
- Gen-Op v1 Qualified;
- George Handoff Control Non-Authoritative;
- Response-Completion Side-Effect Boundary Preserved;
- Provisional Branch Discard Safety Preserved;
- Internal Prose Reduction Measured;
- Cached-Input Evidence Recorded/Gap;
- Qualification Workload Deadlines Qualified;
- B2 Whole-Stack 20m Deadline Qualified;
- Production RunBudget Unchanged;
- Phase 5 Reliability Floors Green;
- Phase 9 Structured/Recovery Floors Green;
- Broad Suite;
- Historical Live Evidence Preserved;
- Remaining Blocking Failure Count;
- Overall `c9-gen-op` Qualified;
- Final Five-Workload Sweep Ready To Rerun.

If ready, state exactly:

`next action: npm run codex:phase -- c9-final-live-convergence --closeout`

Do not run the official final sweep in this correction.
