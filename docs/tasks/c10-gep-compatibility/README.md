# c10-gep-compatibility

Follow-up Phase 10 correction after `c10-generation-bottleneck` closed Not Green.

Package remains exactly `0.10.12`.

The parent correction proved:
- terminal TaskState integrity Green;
- 300s default / 600s maximum provider emergency ceiling Green deterministically;
- GEP/1 parser/expansion/SHA/framing/permission/recovery Green;
- deterministic GEP mutation transmission ratio approximately 0.194.

It did not qualify because:
- receipt-only Operation read projection broke legacy `write_file/apply_patch` fallback;
- the Phase 5 long workflow ended `budget_exhausted` for an unestablished reason;
- the real LM Studio/Qwen integrated workload therefore did not run.

This correction:
1. restores legacy read compatibility through bounded additive GEP projection;
2. proves compact editing remains net-cheaper across the whole read->edit exchange;
3. causally isolates and narrowly repairs/characterizes the Phase 5 budget failure;
4. reruns the deterministic/broad gate and then the real local-model qualification.

Prompt order:
1. P1 — GEP bounded dual projection and legacy fallback — Sol High;
2. P2 — Phase 5 budget causal isolation and bounded repair — Sol High;
3. P3 — integrated compatibility/live qualification — Sol Medium;
4. P4 — GEP compatibility closeout — Sol Medium.

Do not redesign GEP, retune context, increase broad budgets, run B2/C2, or open Phase 11.
