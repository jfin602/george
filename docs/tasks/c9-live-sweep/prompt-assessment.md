# c9-live-sweep Prompt Assessment

Status: READY FOR FULL-SWEEP CONVERGENCE STACK

Task folder: `docs/tasks/c9-live-sweep`  
Planning authority: `docs/planning/c9-live-sweep-convergence/`  
Roadmap phase: 9  
Required unchanged package version: `0.9.10`

## Trigger

The latest live qualification established:
- loaded pinned LM Studio runtime: Green;
- greeting smoke: Green;
- three-file inspection smoke: Not Green;
- Gate A/B2/C2: Not Run under the historical fail-fast functional gate.

The three-file attempt:
- read all three required fixture files successfully;
- used one context assembly;
- stayed on ordinary;
- had no envelope promotion;
- had no retry/exhaustion;
- had zero human intervention;
- requested nine tools across three provider rounds;
- included one denied unrequested `run_process node --version`;
- ended on `provider.error -> turn.failed`;
- produced no final response.

The existing schema-1 artifact preserved only the provider-error event type, not the bounded diagnostic code/message.

The current strategy therefore loses both debugging throughput and root-cause detail.

## Locked correction strategy

### Common aborts remain fail-fast

Abort before or during the sweep only when later evidence would be invalid or unsafe, including:
- unsupported/unloaded runtime;
- missing/materially invalid REST runtime provenance;
- broken critical permission/security/recovery invariant;
- corrupted fixture/instrument identity;
- target application not runnable;
- evidence writer unable to persist bounded authoritative attempt truth.

### Functional failures do not stop discovery

After common gates are Green, run exactly once each in isolated workspaces/sessions:

1. greeting;
2. three-file;
3. Gate A;
4. B2;
5. C2.

No repair between them.

A failed workload does not suppress later diagnostic execution.

### Observed result vs qualification status

Every workload records:
- observed result: Green / Not Green / Evidence Gap;
- qualification status: qualifying / diagnostic-only.

A downstream Green after an upstream failure remains diagnostic-only and does not satisfy Phase 9 owner-closeout prerequisites.

### No pass fishing

Do not rerun a failed workload against the same candidate simply to obtain Green.

A fresh full sweep is authorized only after an approved repair wave changes the relevant implementation.

## First implementation requirement: fix evidence before retesting

The next sweep is useful only if failures are actionable.

P1 must preserve bounded/redacted diagnostics for:
- provider errors;
- turn failures/cancellations;
- tool failures;
- validation failures;
- harness/observer failures as a separate category.

The existing artifacts declare schema version 1.

If the durable structure changes incompatibly, introduce artifact schema version 2. Do not mutate historical schema-1 evidence.

This artifact version is independent of greenfield/existing-app instrument versions. No v3 live-work task instrument is authorized.

## Consolidated failure ledger

P2 and P5 each produce one bounded ledger containing every Not Green/Evidence Gap observation from:
- deterministic/affected validation;
- full broad `npm test`;
- live workloads.

Each entry should retain:
- stable identity;
- layer/workload;
- observed result;
- qualifying/diagnostic-only where relevant;
- failure class;
- bounded diagnostic code/message;
- failed tool/validation;
- provider rounds/attempts/tokens/tools;
- context profile/promotions;
- TaskState/StackState/hidden acceptance;
- intervention/exhaustion;
- new/retained/intermittent/environment-only/unresolved classification;
- bounded evidence references/hashes;
- repair cluster.

The ledger must not hide individual failures behind aggregate counts.

## Repair clustering

P3 owns the agent/provider/context/tool/structured-task/qualification cluster.

P4 owns the OpenTUI/test-stability/sandbox-process cluster.

Both are ledger-driven:
- no speculative repair;
- no changing frozen task acceptance just to pass;
- no arbitrary timeout inflation as a substitute for diagnosing races;
- every repaired defect class receives permanent regression coverage.

## Final qualification

P5 runs the complete matrix again after P3/P4.

It also does not functional-fail-fast.

P6 performs evidence-only closeout.

Phase 9 is ready only if the final qualifying chain is Green and no blocking deterministic/broad regression remains.

## Recommended stack

### P1 — failure diagnostics and sweep infrastructure
**Sol High**

Qualification infrastructure + regression coverage. No three-file production repair yet.

### P2 — complete pre-repair diagnostic sweep
**Sol Medium**

No production repair. Run all deterministic/broad/live observations and emit the complete failure ledger.

### P3 — agent/provider/context repair wave
**Sol High**

Repair every actionable P2 agent-path defect in one bounded wave.

### P4 — UI/test-stability repair wave
**Sol High**

Repair every actionable P2 UI/test/sandbox stability defect. No-op verification if the ledger has none.

### P5 — complete post-repair sweep
**Sol Medium**

No repair. Re-run everything and record every remaining failure.

### P6 — closeout
**Sol Medium**

Evidence-only audit.

## Non-goals

Do not:
- rewrite historical attempts/evidence;
- create greenfield/existing v3 merely for sweep orchestration;
- retune Qwen/LM Studio merely to pass;
- weaken permission/recovery/context safety;
- relabel diagnostic-only downstream success as qualifying;
- owner-close Phase 9 inside this stack;
- open Phase 10.

All prompts:
- Browser required: no.
- Version remains exactly `0.9.10`.
- No root `package-lock.json`.
