# c9-live-sweep

Execution stack for the approved `c9-live-sweep-convergence` Phase 9 correction.

Purpose: stop discovering one live defect per correction. Once common runtime/safety/evidence-validity gates are Green, run the entire isolated workload matrix, record every failure, repair the complete observed wave, and run the entire matrix again.

Historical result entering this stack:
- runtime Green;
- greeting Green;
- three-file Not Green;
- A/B2/C2 historically Not Run;
- three-file failure ended `provider.error -> turn.failed` but schema-1 evidence did not retain the bounded provider diagnostic.

Prompt order:
1. P1 — schema-v2 failure diagnostics + full-sweep infrastructure;
2. P2 — complete pre-repair diagnostic sweep;
3. P3 — agent/provider/context repair wave;
4. P4 — UI/test-stability repair wave;
5. P5 — complete post-repair sweep;
6. P6 — evidence-only closeout.

Package remains exactly `0.9.10`.

Planning authority:
- `docs/planning/c9-live-sweep-convergence/decision-record.md`;
- `docs/planning/c9-live-sweep-convergence/qualification-plan.md`.

No historical attempt is rewritten. Diagnostic-only downstream successes never satisfy upstream-gated Phase 9 acceptance.
