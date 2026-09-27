# c10-gep-compatibility Prompt Assessment

Status: READY FOR CORRECTION EXECUTION

Correction: `c10-gep-compatibility`  
Roadmap phase: 10  
Required unchanged package version: `0.10.12`

## Current candidate truth

HEAD entering planning: `7b184fd28a602fafb6496e5cf4b0b12791743a53`.

Parent correction:
- focused 272/275;
- broad 514/518 with 3 failures and 1 native-TTY skip;
- live workload Not Run;
- GEP mutation ratio 69/356 ~= 0.194.

Direct P3 compatibility failures:
- frozen Phase 8 provider expects SHA/framing in read evidence before legacy write;
- framing recovery expects reread SHA before legacy patch;
- current `GeorgeEditReceiptRegistry.project()` deliberately removes `sha256` and raw `text` for eligible reads;
- P3's own test asserts that destructive projection.

Separate inherited/current failure:
- Phase 5 long workflow in Human mode ends `budget_exhausted`;
- run-budget capacity is generous, so root cause must be traced before any budget change;
- fixed small context/continuation accounting is a plausible seam, not an established cause.

## Decomposition

P1 repairs the known GEP coexistence defect and adds net-transport evidence.

P2 is causal diagnosis first, implementation second. It may repair code only after the first bad historical boundary and exhausted budget dimension are established.

P3 spends the live-model gate only after the deterministic/broad floor is Green.

P4 is evidence-only.

## Model routing

- P1 — Sol High: provider evidence/mutation compatibility and performance boundary.
- P2 — Sol High: historical debugging across context/budget/reliability contracts.
- P3 — Sol Medium: deterministic + real-model qualification.
- P4 — Sol Medium: closeout.

## Key risks

- dual projection duplicates too much source and erases generation savings;
- restoring legacy fields accidentally creates two canonical snapshots;
- oversized files gain misleading GEP receipts;
- Phase 5 failure is misdiagnosed and “fixed” by inflating budgets;
- historical candidate tests are modified instead of used for causality;
- real-model workload is spent before deterministic Green.

Every repaired defect gets a permanent executable regression.
