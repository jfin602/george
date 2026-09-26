# c9-mutation-precondition-convergence

Production Phase 9 correction after the aligned `greenfield-express-v2` Gate B2 attempt.

The v2 instrument is semantically qualified and remains frozen. Its first official B2 attempt exposed two connected production convergence gaps:

- an existing-file `write_file` without `expectedSha256` is safely rejected, but the model must be able to observe that failure, read the file, and retry explicitly;
- a later nested-file write targeted `src/app.js` while `src/` did not exist; pre-dispatch recovery-intent preparation escaped before normal terminal tool evidence, and the structured coding surface has no native directory-creation tool.

This correction preserves all existing SHA, framing, permission, recovery, instrument-version, and hidden-acceptance boundaries.

Prompt order:
1. P1 — implement mutation prerequisite convergence and native `create_directory`;
2. P2 — deterministic pre-gate plus fresh Gate A -> B2 -> C2 live qualification;
3. P3 — evidence-only correction closeout.

Package remains exactly `0.9.10`.

Authority:
- `docs/planning/c9-mutation-precondition-convergence/decision-record.md`;
- `docs/planning/c9-mutation-precondition-convergence/qualification-plan.md`;
- current Phase 9 decision/qualification authority;
- historical `docs/tasks/c9-greenfield-instrument-alignment/{P2-live-evidence,closeout}.md`.

Historical v1/v2 attempts are immutable. Phase 9 remains open until a separate owner closeout.
