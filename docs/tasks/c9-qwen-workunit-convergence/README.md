# c9-qwen-workunit-convergence

Follow-on Phase 9 correction after `c9-structured-task-convergence`.

The prior correction is implementation-complete and its production task-stack boundary is qualified, but live Gate A remained Not Green.

This correction isolates a newly confirmed edit-enablement defect:

- safe overwrite/patch requires a current SHA-256;
- `read_file` does not currently return one;
- structured inspection therefore cannot give Qwen the safe mutation precondition;
- the deterministic replay hid the defect by hard-coding the hash.

It also fixes the live evidence processor that lost Gate A telemetry after execution.

Prompt order:
1. P1 — mutation-precondition visibility;
2. P2 — resilient live trace capture;
3. P3 — gated live Qwen qualification;
4. P4 — correction closeout.

Package version remains `0.9.10`.

Do not reopen production stack execution, Bubblewrap, TUI, context-profile tuning, or Phase 10 work.
