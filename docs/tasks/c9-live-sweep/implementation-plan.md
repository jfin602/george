# c9-live-sweep Implementation Plan

Status: READY FOR PROMPT EXECUTION

Task folder: `c9-live-sweep`  
Planning authority: `c9-live-sweep-convergence`  
Required unchanged package version: `0.9.10`

## Authority

Read:
- `BOOT.md`;
- `AGENTS.md`;
- workflow/stability/current Phase 9 qualification authority;
- `docs/planning/c9-live-sweep-convergence/{decision-record,qualification-plan}.md`;
- `docs/tasks/c9-turn-context-live-qualification/{P1-live-evidence,closeout}.md`;
- three-file attempt/trace;
- current qualification source/tests;
- current agent/provider/TUI/process tests before implementation.

## P1 — failure diagnostics + sweep infrastructure

### A. Schema-v2 failure diagnostics

Inspect `src/qualification/live-work.ts`, core application events, provider error normalization, and qualification tests.

Preserve schema-1 historical semantics.

Introduce schema 2 only if the durable attempt/trace structure changes incompatibly.

Schema 2 must retain bounded safe failure details from authoritative events, including:
- provider errors;
- terminal turn failures/cancellations;
- tool failures;
- validation failures;
- harness/observer errors separately.

Prefer small normalized structures rather than copying raw event bodies.

Use existing sanitization primitives.

### B. Failure evidence derivation

The trace must not rely solely on thrown harness exceptions.

A turn can return a failed workflow completion while authoritative application events contain the actual provider/turn failure. Derive failure evidence from those events.

Keep:
- top-level harness/observer failure;
- application/provider terminal failure;
- tool/validation terminal failures
distinct.

### C. Full-sweep orchestrator/classifier

Add a qualification-only module, for example `src/qualification/sweep.ts`, or the smallest equivalent.

It should represent:
- common preflight validity;
- ordered workload IDs;
- observed results;
- prerequisite relationships;
- qualifying vs diagnostic-only status;
- common-abort state;
- one-attempt-per-workload accounting.

Keep it provider/tool/presentation independent.

Do not put production agent business logic in the sweep helper.

### D. Failure ledger

Define a bounded JSON-compatible ledger schema.

The ledger can be assembled from normalized deterministic/broad/live observations.

It must preserve stable identities and individual failure entries.

Add validation/normalization so malformed/unbounded diagnostics fail closed rather than leaking raw content.

### E. Tests

Permanent tests must cover:
- provider error code/message retained safely;
- turn failed/cancelled details retained;
- tool/validation failures retained;
- provider/app vs harness/observer distinction;
- raw secrets/provider bodies/file bodies excluded;
- schema-1 historical artifacts remain untouched/understood;
- schema-2 writer/reader deterministic;
- all-Green sweep;
- three-file fail then A/B2/C2 execute diagnostic-only;
- A fail then B2/C2 diagnostic-only;
- B2 fail then C2 diagnostic-only;
- common runtime invalid -> live workload callbacks not invoked;
- evidence-writer failure aborts;
- one workload cannot run twice in one sweep;
- ledger retains multiple simultaneous failures without identity collapse.

### F. P1 evidence

Create:
`docs/tasks/c9-live-sweep/P1-sweep-infrastructure-evidence.md`.

No live workloads.

Do not repair the three-file provider behavior yet.

## P2 — complete pre-repair sweep

P2 changes no production/test/qualification behavior.

### A. Common preflight

Run:
- P1 qualification infrastructure tests;
- provider/context/tool/permission/recovery floors;
- structured task/stack integration;
- instrument/fixture immutability;
- typecheck;
- runner;
- package/diff/root-lockfile hygiene;
- complete `npm test`.

Record every broad failure and skip.

Only a validity/safety/evidence-integrity blocker aborts live execution.

### B. Runtime

Use loaded:
`qwen3-coder-30b-a3b-instruct@q4_k_m`.

Capture REST controls.

No retuning.

### C. Full live sweep

Execute all five exactly once:
- greeting;
- three-file;
- Gate A;
- B2;
- C2.

Use fresh isolated workspace/session state for every workload.

No repair between attempts.

After any upstream failure, continue later workloads but mark them diagnostic-only.

Persist schema-2 bounded attempt/trace for every reached workload.

### D. P2 ledger

Create:
- `P2-diagnostic-sweep-evidence.md`;
- `evidence/pre-repair/failure-ledger.json`;
- runtime JSON;
- per-workload attempt/trace artifacts.

The ledger must include:
- every full-broad failure/skip;
- the native TTY Evidence Gap;
- the historical sandbox-process intermittent observation as historical/intermittent context if not reproduced;
- every live Not Green/Evidence Gap.

Assign repair cluster:
- `agent-provider-context`;
- `ui-test-stability`;
- `environment-only`;
- `unresolved`.

No production repair in P2.

## P3 — agent/provider/context repair wave

Use only P2 ledger + architecture contracts as scope authority.

Repair all actionable `agent-provider-context` entries.

Likely surfaces may include:
- provider stream/error handling;
- multi-round tool-loop convergence;
- three-file terminal provider failure;
- tool selection/recovery interaction;
- structured Gate A/B2/C2 failures;
- context continuation;
- qualification evidence integration.

Do not assume these defects exist until the ledger says so.

For each repaired entry:
1. reproduce deterministically at the lowest reliable layer;
2. fix the smallest production boundary;
3. add permanent regression coverage;
4. preserve permissions/recovery/context contracts;
5. reference the ledger entry in P3 evidence.

If a ledger entry is provider/environment-only and not repairable in George, classify it rather than coding around it.

Create `P3-agent-repair-evidence.md`.

Run affected tests + full broad characterization.

No live reruns in P3.

## P4 — UI/test-stability repair wave

Read P2 ledger and P3 result.

Repair actionable `ui-test-stability` entries:
- OpenTUI renderer failures;
- presentation lifecycle/synchronization;
- draft/reveal/approval rendering;
- sandbox/process test intermittency;
- other test/integration stability defects.

For each:
- establish actual cause;
- add deterministic regression protection;
- prefer lifecycle/event synchronization over sleeps;
- do not increase arbitrary timeouts merely to mask races.

If no actionable P4 entries exist after P3, make P4 an evidence-backed no-op verification.

Create `P4-ui-test-stability-evidence.md`.

Run relevant focused tests and full `npm test`.

No live reruns in P4.

## P5 — complete post-repair sweep

P5 changes no implementation.

### Common preflight

Require the corrected repo to be valid/runnable:
- P1 sweep infrastructure Green;
- all P3/P4 permanent regressions Green;
- permission/security/recovery floors Green;
- Phase 9 integration/instrument immutability;
- typecheck;
- runner;
- package/diff/root-lockfile hygiene;
- loaded pinned runtime.

Run complete `npm test` and record every remaining failure/skip.

### Full live matrix

Run all five exactly once in isolated environments:
- greeting;
- three-file;
- A;
- B2;
- C2.

Do not functional-fail-fast.

Classify observed vs qualifying/diagnostic-only.

Create:
- `P5-post-repair-sweep-evidence.md`;
- `evidence/post-repair/failure-ledger.json`;
- runtime + every workload attempt/trace.

No repair inside P5.

## P6 — closeout

Evidence-only.

Audit before/after failure ledgers and implementation waves.

Create:
`docs/tasks/c9-live-sweep/closeout.md`.

Phase 9 ready = Yes only if the P5 qualifying chain and required deterministic/security/integration boundaries are Green with no blocker.

Aggregate broad suite should be reported truthfully. Any retained failure remains Not Green even if Phase 9 owner chooses a later waiver.

If ready:
`next action: /closeout phase 9`.

## Model routing

- P1: `Sol High`;
- P2: `Sol Medium`;
- P3: `Sol High`;
- P4: `Sol High`;
- P5: `Sol Medium`;
- P6: `Sol Medium`.

Current runner supports these labels. Do not substitute Terra.
