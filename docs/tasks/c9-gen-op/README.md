# c9-gen-op

Inserted Phase 9 correction for provider-generation efficiency and final-sweep validity.

Trigger:
- accepted local Responses requests were incorrectly switching onto the 60s active-output stall timer during prompt prefill;
- dynamic mission-card text was rewriting per-round instructions and hurting stable-prefix locality;
- Qwen spent substantial wall time generating intermediate prose that George did not need or display.

This correction adds:
- useful-output-aware watchdog semantics;
- stable provider instruction prefix plus late dynamic mission-card/control context;
- Generation Operation Protocol v1 for structured implementation/correction;
- non-executable George `handoff` control;
- bounded cached/output-generation observability;
- qualification-owned workload deadlines, including one 20-minute B2 whole-stack ceiling.

Prompt order:
1. P1 — useful-output stall semantics — Sol High;
2. P2 — stable-prefix Gen-Op v1 and qualification deadlines — Sol High;
3. P3 — deterministic and bounded live qualification — Sol Medium;
4. P4 — closeout — Sol Medium.

Package remains `0.9.10`.

This correction does not implement Phase 10 parallelism/helper work and does not run the official final five-workload sweep.

After Green closeout, rerun:
`npm run codex:phase -- c9-final-live-convergence --closeout`
