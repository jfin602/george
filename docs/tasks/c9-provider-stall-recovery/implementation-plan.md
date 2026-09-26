# c9-provider-stall-recovery Implementation Plan

Status: READY FOR PROMPT EXECUTION

Correction: `c9-provider-stall-recovery`  
Roadmap phase: 9  
Required unchanged package version: `0.9.10`

## Authority

Read:
- `BOOT.md`;
- `AGENTS.md`;
- current workflow/stability/Phase 5/8/9 authority;
- `docs/planning/c9-provider-stall-recovery/{decision-record,qualification-plan}.md`;
- `docs/planning/c9-final-live-convergence/{decision-record,qualification-plan}.md`;
- actual local P1/P2 implementation commits from `c9-final-live-convergence`;
- interrupted P3 trace/evidence and owner-supplied LM Studio developer logs.

Do not assume the remote planning snapshot equals the current local implementation.

## P1 implementation seams

### 1. Provider activity signal

Trace `ModelProvider`, `ProviderStreamOptions`, `ProviderEvent`, and the LM Studio SSE parser.

Prefer the smallest provider-independent activity seam that allows the application watchdog to know that the wire is still making progress even when no semantic provider event is emitted yet.

A bounded callback/heartbeat is acceptable.

Requirements:
- no raw SSE payload persistence;
- no event-log spam;
- semantic ProviderEvents remain unchanged unless a new event is truly needed;
- LM Studio adapter does not choose retry/rebase policy.

### 2. Stall policy

Create one validated application-owned policy rather than scattering timers.

Target initial defaults:
- suspected warning: ~60 s inactivity;
- first-evidence recovery: ~90 s;
- post-activity recovery: ~60 s;
- absolute provider timeout: existing 120 s, unchanged;
- stall-specific identical fresh retries: 1;
- canonical rebases: 1.

Use deterministic fake-clock/timer abstractions in tests; do not sleep for real minutes.

### 3. Attempt watchdog

The canonical provider attempt should own a child AbortController separate from user cancellation.

The watchdog must:
- classify its own abort separately from caller cancellation;
- reset on semantic provider events and bounded provider activity heartbeat;
- clean up timers/controllers on every completion/failure path;
- preserve the provider adapter's absolute timeout as a final ceiling.

### 4. Recovery classification

Extend the P2 safe-incomplete-response classification rather than building a parallel retry system.

Track enough per-attempt state to decide:
- safe identical retry;
- safe canonical rebase;
- unsafe/no automatic recovery;
- terminal provider stall.

Provisional text/tool proposals from a discarded branch never execute/commit.

### 5. Canonical structured rebase

Use the P1 mission-card/alignment seam and current structured evidence model.

The rebase should not merely send another request with the same failed `previous_response_id`.

Reconstruct a bounded new request from authoritative current state/evidence.

Required preservation:
- user/task objective;
- applicable requirements/invariants/stops;
- effective permissions;
- valid observed inspection/tool evidence;
- current SHA/framing facts when still valid;
- completed prior-round provider-result evidence needed for the current unit;
- unresolved failures/recovery state;
- pending George-owned completion/validation condition.

No model assertion can manufacture canonical completion.

If the stage cannot reconstruct safely, fail instead of guessing.

### 6. Context-pressure branch

Use current request estimate and effective profile soft-pressure threshold.

Do not rely solely on initial `context.assembled` diagnostics because continuation/tool-result growth can change pressure.

For repeated eligible stall:
- low pressure -> rebase directly;
- high pressure + compactable completed history -> one bounded stall-pressure compaction/reduction;
- high pressure without safe compaction -> safe rebase without dropping critical state or terminate.

Extend checkpoint reason vocabulary only if needed and keep old session evidence readable.

### 7. Compactor recursion guard

The default `ProviderContextCompactor` uses the same provider.

Stall-triggered compaction must:
- get a strict one-shot timeout/budget;
- not inherit automatic provider stall retry/rebase recursion;
- record failure;
- fall back only when non-compacted rebase remains safe;
- otherwise terminate.

### 8. Terminal/evidence semantics

Keep GeorgeError code `provider` unless the codebase has a stronger compatible typed mechanism.

Use bounded cause/diagnostic metadata for:
- stall phase;
- attempt count;
- elapsed/inactivity;
- request estimate/profile;
- pressure state;
- recovery action;
- compaction outcome.

Do not expose raw prompt/tool/file/provider bodies.

Ensure structured task terminal state is not falsely `budget_exhausted`.

### 9. Presentation

Extend derived Work/TUI projection only as required to surface:
- suspected stall;
- retry;
- request rebuild;
- compaction;
- terminal stall.

Presentation cannot trigger or suppress recovery.

### 10. Permanent regressions

Script at minimum:
- no first evidence -> fresh retry -> success;
- response started -> stall -> fresh retry -> success;
- provisional text -> stall -> discarded;
- provisional tool calls -> stall -> none execute;
- repeated low-pressure stall -> rebase, no compaction;
- repeated high-pressure stall -> one compaction/rebase;
- compactor stall -> no recursive recovery;
- rebase success;
- rebase stall -> provider terminal failure;
- user cancellation wins;
- activity heartbeat prevents false stall;
- timer cleanup;
- failed continuation IDs not reused;
- duplicate/no-progress remains strict;
- actual budget exhaustion remains budget exhaustion;
- ordinary unsafe-rebase case terminates safely.

Run affected provider, application, context, structured-task, Phase 5, Phase 9, TUI, typecheck, runner, broad suite, and diff hygiene.

P1 must not run the official final live sweep.

## P2 qualification

Create:
`docs/tasks/c9-provider-stall-recovery/qualification-report.md`

Record:
- actual local baseline/HEAD entering P1;
- P1 commit;
- chosen watchdog constants;
- absolute timeout;
- recovery ladder limits;
- focused tests;
- Phase 5/9 floors;
- typecheck;
- runner;
- broad suite totals;
- diff/package/lockfile hygiene;
- any remaining Evidence Gap.

No production repair in P2 unless a deterministic qualification test itself exposes a narrow correction-stack implementation defect that is explicitly repaired with a permanent regression before P2 completes. Do not run live Gate A/B2/C2.

## P3 closeout

Evidence-only.

Audit the P1/P2 code and report, create `closeout.md`, and decide only whether the final five-workload sweep is ready to rerun.

If ready, state exactly:

`next action: npm run codex:phase -- c9-final-live-convergence --closeout`

Do not execute it from P3.

## Model routing

- P1 — Sol High;
- P2 — Sol Medium;
- P3 — Sol Medium.
