# c10-generation-bottleneck Implementation Plan

Status: READY FOR PROMPT EXECUTION

Correction: `c10-generation-bottleneck`  
Required unchanged package version: `0.10.12`

## P1 — terminal TaskState integrity

Implement one state-law repair:
- when `blockTask()` terminalizes a task with an active `currentWorkUnit`, set that authored work unit to `blocked` and clear `currentWorkUnit` in the same immutable transition.

Keep already addressed/pending work untouched.

Prove durable save/reopen for provider failure, cancellation, budget exhaustion, permission block, planning-needed, and nested StackState cases.

Do not weaken durable validators.

## P2 — generation-aware provider deadline

Change provider configuration to:
- default absolute timeout 300000 ms;
- maximum configurable timeout 600000 ms.

Keep first-useful-output and active-inactivity watchdogs independent.

Use fake time/scripted providers to prove productive output can cross 120000 ms, complete before 300000 ms, and still terminate at the finite emergency ceiling.

Preserve caller cancellation, incomplete-branch discard, retry/rebase safety, and explicit small timeout overrides used by tests.

## P3 — GEP/1

### Run-local receipt registry

During an Operation-mode run, retain bounded ephemeral snapshots only for eligible complete UTF-8 reads.

Receipt state includes exact path/SHA/text/framing/freshness epoch.

Provider projection may add a short receipt ID and deterministic line-addressed text view.

Do not persist file bodies in durable session evidence.

### Grammar

Implement a versioned bounded compact packet.

The exact syntax may be chosen during implementation, but it must:
- avoid JSON oldText/newText repetition;
- support replacement ranges and new UTF-8 files;
- use collision-safe deterministic framing;
- support multiple non-overlapping edits;
- be easy to parse without inference.

### Execution

A completed GEP packet is parsed before any mutation executes.

Resolve every receipt/range and prevalidate the whole packet.

Expand accepted edits to inherited mutation calls.

Execute through the normal mutation authority and emit normal tool/work/recovery/Git evidence.

For existing files, line ranges refer to the original receipt snapshot.

Invalid/stale/overlapping/unsupported packets fail closed before side effects.

### Coexistence

Operation mode accepts:
- normal tool calls;
- GEP packets;
- handoff.

Define one fail-closed rule for ambiguous mixtures.

Legacy mutation calls remain available for ineligible/fallback targets and non-GEP compatibility.

### Efficiency

Add deterministic instrumentation/fixture proving Mutation Transmission Ratio <= 0.70 on a representative existing-file edit.

## P4 — qualification

Create:
- `docs/tasks/c10-generation-bottleneck/qualification-report.md`;
- bounded evidence under `docs/tasks/c10-generation-bottleneck/evidence/`.

Run deterministic/broad floors once.

Then run one disposable supported Node 26 + LM Studio/Qwen workload exercising:
- reads/receipts;
- new file;
- substantial existing-file GEP edit;
- validation;
- durable reopen.

Do not use the owner's existing Express workspace.

Do not repeatedly rerun to obtain Green.

## P5 — closeout

Create `docs/tasks/c10-generation-bottleneck/closeout.md`.

Evidence-only.

If correction-local gates are Green, state whether Phase 10 formal closeout/readiness should now be reassessed. Do not owner-close Phase 10.

## Regression priorities

Permanent guards must cover:
- impossible active-work-unit terminal state;
- productive generation >120s;
- inactivity still aborting;
- finite emergency timeout;
- stale/malformed GEP;
- range/framing/SHA correctness;
- no mutation before response completion;
- legacy mutation compatibility;
- session persistence after correction-local failures.
