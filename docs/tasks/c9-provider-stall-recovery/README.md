# c9-provider-stall-recovery

Inserted Phase 9 correction for provider/model stalls discovered during the first `c9-final-live-convergence` P3 attempt.

The defect is not merely replay safety. P2 can safely discard an incomplete response and retry, but repeated local-model stalls can still burn many minutes and eventually fail under a misleading downstream convergence/budget condition.

This correction adds:
- application-owned provider liveness/watchdog policy;
- explicit suspected-stall versus recovery-triggering thresholds;
- one replay-safe identical fresh retry maximum;
- one canonical request rebase maximum after repeated stall;
- pressure-gated stall recovery compaction rather than unconditional compaction;
- a recursion guard because the default semantic compactor uses the same provider;
- truthful provider-class terminal failure when recovery is exhausted;
- bounded TUI/evidence visibility;
- permanent regressions preserving P2 replay safety and strict duplicate/no-progress behavior.

Prompt order:

1. P1 — provider stall watchdog and bounded recovery — Sol High;
2. P2 — provider stall recovery qualification — Sol Medium;
3. P3 — provider stall recovery closeout — Sol Medium.

Package remains exactly `0.9.10`.

This correction deliberately does **not** run the official final five-workload live sweep.

After P3 is reviewed Green, resume the existing final-convergence stack:

`npm run codex:phase -- c9-final-live-convergence --closeout`

The runner should detect the already committed P1/P2 prefix and start a new P3 sweep, then auto-run P4 closeout. Preserve the interrupted prior P3 attempt as historical evidence.
