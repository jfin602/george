# c9-final-live-convergence

Final Phase 9 convergence correction.

This correction starts from the pushed full-sweep evidence where deterministic/broad validation is effectively Green, greeting and three-file are Green, and the remaining live blockers are:

- Gate A: functionally correct but 12 model tool calls exceeded the historical <=10 efficiency ceiling;
- B2: P1 completed; P2 timed out after LM Studio streamed an incomplete provider response with tool proposals but no completion;
- C2: implementation spent the eight-call stage ceiling re-inspecting already observed state, so the first legitimate patch became call 9.

The correction deliberately keeps Phase 9 single-primary-model.

It adds:
- deterministic per-round mission-card alignment;
- path/resource-aware ephemeral evidence freshness and reuse;
- hard-runaway versus efficiency-metric separation;
- bounded safe retry for incomplete provider branches with no executed/committed/ambiguous side effect;
- one final five-workload qualification sweep;
- evidence-only closeout.

Prompt order:

1. P1 — deterministic mission-card alignment and convergence budgets — Sol High;
2. P2 — safe partial-provider-response recovery — Sol High;
3. P3 — final five-workload Phase 9 qualification — Sol Medium;
4. P4 — final live-convergence closeout — Sol Medium.

Package remains exactly `0.9.10`.
