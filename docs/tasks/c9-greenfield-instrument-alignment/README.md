# c9-greenfield-instrument-alignment

Qualification-only Phase 9 correction.

Gate A is already Green on the corrected production structured-task path.

Gate B exposed semantic drift in the historical v1 live-work instruments:
- preflight INSPECT work duplicated as ordinary WORKFLOW units;
- one greenfield work unit attempted to own validation/reporting before George-owned validation runs;
- existing-app v1 contains the same duplicated inspection pattern.

This correction does not modify production structured-task behavior.

It:
- preserves v1 instruments/results immutably;
- creates aligned greenfield/existing-app v2 instruments;
- retains Task Prompt format 1;
- adds v2 qualification runner entry points;
- reuses unchanged behavioral acceptance where product behavior is unchanged;
- runs B2 then C2;
- determines whether Phase 9 is ready for separate owner closeout.

Prompt order:
1. P1 — version/freeze aligned v2 instruments;
2. P2 — final B2/C2 live qualification;
3. P3 — correction closeout.

Package remains `0.9.10`.
