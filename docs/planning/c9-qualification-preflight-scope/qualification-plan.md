# Correction 9 Qualification Plan — Qualification Preflight Scope

Status: APPROVED QUALIFICATION DIRECTION

Authority:
- `docs/planning/c9-qualification-preflight-scope/decision-record.md`;
- current Phase 9 qualification authority;
- `docs/planning/c9-mutation-precondition-convergence/qualification-plan.md`;
- historical `c9-mutation-precondition-convergence` P2 evidence/closeout.

Package remains `0.9.10`.

## Gate 0 — qualification-policy regression guard

Implement the smallest qualification-layer representation needed to keep these states separate:

1. hard affected-system preflight;
2. aggregate broad-suite state;
3. controlled broad regression delta;
4. live-gate eligibility.

Deterministic tests must prove:

- hard Green + broad aggregate Not Green + materially unchanged baseline failures => regression delta Green and eligible;
- a newly failing test identity => regression delta Not Green and ineligible;
- a worsened retained failure signature/category relevant to the candidate => delta Not Green and ineligible;
- a previously passing affected test becoming skipped/failing => delta Not Green and ineligible;
- missing/non-equivalent baseline evidence => Evidence Gap/ineligible rather than assumed unchanged;
- hard-preflight Not Green always blocks regardless of broad delta;
- aggregate broad Not Green remains Not Green even when delta is Green.

The helper must not inspect hidden acceptance or alter test results. It classifies supplied bounded evidence only.

## Gate 1 — controlled broad baseline comparison

Compare:

- baseline `d7e565ccb0e694166e6fe4346b56f4746f0697f1`;
- candidate `04405570b92680e6297b48391a7d0bdf0aa8ed5e`.

Use equivalent:
- Node/npm;
- dependency versions/state;
- environment relevant to OpenTUI;
- exact `npm test` command;
- TTY/non-TTY conditions.

Do not move active HEAD.

For both runs capture a bounded summary:
- commit;
- runtime;
- exact command;
- pass/fail/skip totals;
- exact failing/skipped test names;
- bounded failure category/signature;
- duration only as supporting evidence, not equivalence authority.

Do not commit raw unbounded test logs. A tracked bounded JSON/Markdown summary is sufficient.

### Equivalence rule

Broad delta may be Green only if all candidate failures/skips are accounted for by materially equivalent baseline failures/skips and no new affected regression appears.

Counts alone are insufficient.

The known five OpenTUI test identities must be compared explicitly when reproduced.

If the baseline cannot reproduce under equivalent conditions, classify the delta as Evidence Gap and do not spend live gates.

## Gate 2 — hard current-candidate preflight

Against the unchanged production candidate, require Green:

- mutation-precondition focused deterministic floor;
- expanded inherited c9 affected floor;
- Phase 9 integration;
- frozen Gate A deterministic replay;
- v1/v2 fixture/task/metadata/digest/acceptance immutability;
- typecheck;
- runner;
- diff/version/root-lockfile hygiene.

Run current broad `npm test` as characterization and classify:
- aggregate state;
- controlled delta versus Gate 1.

Live eligibility requires hard-preflight Green **and** broad regression delta Green.

It does not require aggregate broad-suite Green.

## Live Gate A

Only after Gate 0/1/2 eligibility is Green, run exactly one fresh official Gate A against the unchanged mutation-precondition production candidate.

Use the unchanged:
- frozen fixture;
- fair Phase 9 approval helper;
- George-owned validation;
- hidden acceptance;
- provider/runtime/context/stage/correction/run-budget controls.

Green criteria remain:
- exact 60-byte edit;
- V1 Green;
- completed/verified TaskState;
- hidden acceptance Green;
- zero human coding intervention;
- no exhaustion;
- <=10 model-requested tool calls;
- <=10 logical provider rounds.

If Not Green, stop. Do not rerun or repair inside qualification.

## Live Gate B2

Only after fresh Gate A Green.

Run exactly one official attempt against unchanged `greenfield-express-v2` version/digest and acceptance version 1.

Green criteria remain unchanged:
- P1/P2/P3 strict completion;
- declared validations Green;
- completed StackState;
- hidden acceptance Green;
- zero human coding intervention;
- no task/stage/correction/run-budget exhaustion.

If Not Green, stop and leave C2 unspent.

## Live Gate C2

Only after B2 Green.

Run exactly one official attempt against unchanged `existing-express-feature-v2`.

Require:
- focused validation Green;
- broad validation Green;
- completed/verified TaskState;
- baseline behavior preserved;
- hidden acceptance Green;
- zero intervention;
- no exhaustion.

## Evidence retention

Create bounded tracked evidence under the new correction task folder.

At minimum preserve:
- baseline broad summary;
- candidate broad summary;
- regression-delta classification;
- each reached live gate's sanitized `attempt.json` and `trace.json`;
- runtime provenance;
- SHA-256 for committed evidence JSON.

Do not commit raw provider streams, write/patch bodies, secrets/environment dumps, workspace copies, dependency trees, or unbounded test logs.

## Closeout

Report separately:
- Qualification Policy Guard Qualified;
- Controlled Broad Baseline Comparison Qualified;
- Hard Preflight Qualified;
- Aggregate Broad Suite State;
- Broad Regression Delta;
- Live Eligibility;
- Fresh Gate A;
- B2;
- C2;
- Historical Evidence Preserved;
- Overall Correction Qualified;
- Phase 9 Ready For Owner Closeout.

Phase 9 is ready for separate owner closeout only if:
- policy guard Green;
- controlled baseline comparison sufficient;
- hard preflight Green;
- broad regression delta Green;
- fresh Gate A Green;
- B2 Green;
- C2 Green;
- no new blocking regression.

The aggregate broad suite may remain Not Green and must remain labeled that way.
