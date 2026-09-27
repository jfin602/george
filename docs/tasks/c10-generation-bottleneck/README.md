# c10-generation-bottleneck

Active Phase 10 correction for the live generation bottleneck exposed by the owner Express smoke/redesign run.

Package remains exactly `0.10.12`.

The correction addresses one coupled failure chain:

`verbose mutation output -> healthy long generation hits 120s ceiling -> incomplete retry/replay -> terminal provider failure -> invalid terminal TaskState persistence`

It introduces:
- durable terminal TaskState cleanup for active work units;
- a 300s default / 600s maximum finite provider emergency ceiling while retaining first-evidence and active-inactivity guards;
- George Edit Protocol v1 (GEP/1), a compact Operation-mode text mutation channel using ephemeral read receipts and line-addressed edits;
- expansion of compact edits back into the existing SHA/framing/permission/recovery mutation authority;
- deterministic transmission-efficiency evidence and one supported Node 26 + real LM Studio/Qwen qualification.

Prompt order:

1. P1 — terminal TaskState integrity — Sol High;
2. P2 — generation-aware provider deadline — Sol High;
3. P3 — George Edit Protocol v1 — Sol High;
4. P4 — integrated generation qualification — Sol Medium;
5. P5 — generation bottleneck closeout — Sol Medium.

Out of scope:
- context profile/compaction changes;
- helper inference;
- GPU/runtime tuning;
- new concurrency work;
- frozen B2/C2 redesign;
- browser/visual-model feedback.

Phase 10 historical/intermittent P7 evidence is preserved and not relabeled by this correction.
