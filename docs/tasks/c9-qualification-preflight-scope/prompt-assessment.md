# c9-qualification-preflight-scope Prompt Assessment

Status: READY FOR QUALIFICATION-POLICY CORRECTION

Correction: `c9-qualification-preflight-scope`  
Roadmap phase: 9  
Required unchanged package version: `0.9.10`

## Trigger

`c9-mutation-precondition-convergence` completed its production implementation and deterministically qualified the intended boundaries:

- missing/stale existing-file SHA remains fail-closed;
- explicit `read_file.sha256 -> expectedSha256` retry convergence is Green;
- missing-parent preparation now produces terminal bounded tool failure rather than escaping the provider turn;
- native `create_directory` is qualified for safe in-workspace directory chains;
- Standard/Workspace Autonomous permission behavior is qualified;
- directory interruption/recovery is qualified;
- structured implementation/correction exposes the tool while INSPECT remains read-only;
- inherited stack/state/budget/recovery/Gate-A deterministic floors remain Green.

P2 then stopped before live work because its authored preflight said all listed checks must be Green and included full `npm test`.

Observed current candidate:
- correction-specific floor: `72/72` Green;
- expanded affected/inherited floor at closeout: `179/179` Green;
- Phase 9 integration: `5/5` Green;
- runner: `90/90` Green;
- typecheck: Green;
- package/version/lock/diff hygiene: Green;
- broad Node 26: `383 passed, 5 failed, 1 skipped`.

The immediately preceding `c9-greenfield-instrument-alignment` broad characterization recorded:
- `379 passed, 5 failed, 1 skipped`;
- failures described as OpenTUI test-renderer failures;
- native-TTY skip retained.

No fresh Gate A/B2/C2 was spent.

## Root cause

The approved mutation-precondition qualification plan says:

- focused correction suites must be Green;
- Phase 9 integration must be Green;
- inherited c9 affected floor must be Green;
- typecheck/runner/diff/version/lock hygiene must be Green;
- broad `npm test` should be run under supported Node 26 and retained unrelated TUI/native failures classified truthfully.

The generated P2 prompt accidentally compiled the broad characterization into an absolute Green prerequisite.

That is a qualification-authoring defect.

## Important caution

Do not infer non-regression from failure counts alone.

P1 did not edit TUI source/tests, but it did edit application-loop and progress modules consumed by the TUI. Therefore the five current renderer failures must be compared to a controlled pre-change baseline by exact test identity and bounded failure signature/category before they can be called retained rather than candidate-induced.

## Locked policy

Qualification has two distinct layers.

### Hard affected-system preflight

Must be Green:
- correction-specific deterministic tests;
- materially affected inherited floors;
- phase integration;
- security/permission/recovery invariants touched by the candidate;
- frozen replay and instrument immutability where applicable;
- typecheck;
- runner;
- diff/version/lock hygiene.

A hard failure blocks live work.

### Broad characterization + regression delta

Run the broad suite as required, but preserve two truths:

1. aggregate broad state;
2. candidate regression delta versus a documented baseline.

Aggregate Not Green stays Not Green.

Broad regression delta may be Green if all failures/skips are materially equivalent to baseline and no new/worsened affected regression exists.

A Green delta is not a waiver and does not relabel the broad suite Green.

## Controlled comparison

Compare exactly:

Baseline:
`d7e565ccb0e694166e6fe4346b56f4746f0697f1`

Candidate:
`04405570b92680e6297b48391a7d0bdf0aa8ed5e`

Use the same:
- Node/npm;
- exact `npm test` command;
- dependency identity;
- TTY/non-TTY conditions;
- relevant environment.

Do not move active HEAD.

Preferred safe materialization:
- use read-only `git archive` for each immutable commit into isolated temporary directories;
- verify baseline/candidate `package.json` dependency identity before reusing the current installed dependency tree;
- if identical and current `node_modules` is usable, link or otherwise reuse it in both temporary snapshots;
- do not run `git checkout`/`git switch` or rewrite active repository state;
- do not commit temporary logs/workspaces.

Capture bounded summaries:
- pass/fail/skip totals;
- exact failing/skipped test identities;
- bounded failure category/signature;
- runtime/command provenance.

Counts alone are not sufficient.

## Permanent executable regression guard

Add a small qualification-layer pure classifier/type, not a CI framework.

It should accept:
- hard-preflight result;
- bounded broad baseline summary;
- bounded broad candidate summary.

It should return or expose separately:
- aggregate candidate broad state;
- broad regression delta;
- live-gate eligibility;
- bounded reasons.

Tests must prove:
- hard Green + unchanged baseline failures => aggregate Not Green + delta Green + eligible;
- new failure => delta Not Green + ineligible;
- worsened material signature/category => delta Not Green + ineligible;
- affected pass -> skip/fail => delta Not Green;
- missing/ambiguous baseline evidence => Evidence Gap/ineligible;
- hard Not Green blocks regardless of broad delta.

Do not let the helper reinterpret actual test outcomes.

## P1 evidence outcome

Create tracked bounded evidence for the controlled comparison.

If comparison is materially equivalent:
- candidate aggregate broad suite remains Not Green;
- broad regression delta = Green;
- current live preflight becomes eligible, subject to P2 rerunning the hard current-candidate checks.

If comparison is Not Green/Evidence Gap:
- preserve it;
- P2 must not spend live gates.

## Live gate sequence

If eligible in P2:

1. fresh Gate A — one official attempt;
2. B2 — one official `greenfield-express-v2` attempt only after A Green;
3. C2 — one official `existing-express-feature-v2` attempt only after B2 Green.

No current-correction live gate has been spent yet.

## Locked non-goals

Do not:
- change production agent-loop/filesystem/tool behavior;
- repair the five OpenTUI failures;
- relabel broad Not Green as Green;
- waive native-TTY evidence;
- edit v1/v2 instruments/acceptance;
- change Task Prompt format;
- retune LM Studio/Qwen/context/stage/run budgets;
- spend a live gate before preflight eligibility;
- owner-close Phase 9;
- open Phase 10.

## Recommended stack

### P1 — qualification policy guard + controlled baseline comparison

`Sol Medium`.

Implement the pure qualification classifier/tests and produce bounded baseline/candidate/delta evidence. No production agent behavior changes. No live gates.

### P2 — fresh Phase 9 live qualification

`Sol Medium`.

Re-run hard current-candidate preflight, characterize current broad state, verify controlled delta remains usable, then Gate A -> B2 -> C2 with stop-on-first-failure and committed sanitized attempt/trace evidence.

### P3 — closeout

`Sol Medium`.

Audit policy guard, controlled comparison, live gates, historical evidence preservation, and Phase 9 owner-closeout readiness.

## Prompt count

Three prompts including final closeout.

All prompts:
- Browser required: no;
- package remains exactly `0.9.10`;
- no root `package-lock.json`;
- Phase 10 remains unopened.
