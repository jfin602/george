# c9-greenfield-instrument-alignment Prompt Assessment

Status: READY FOR QUALIFICATION-INSTRUMENT CORRECTION

Correction: `c9-greenfield-instrument-alignment`  
Roadmap phase: 9  
Required unchanged package version: `0.9.10`

## Trigger

The core Phase 9 structured coding path is now qualified.

Inherited Green:
- production `StackState` task-stack execution;
- structured evidence handoff, task-wide budget, direct George-owned validation, and convergence guards;
- full-file SHA mutation preconditions;
- mandatory first-round INSPECT execution;
- application-owned INSPECT completion;
- exception-safe live trace retention;
- text-framing evidence and mutation fidelity guard;
- mutation-intent authority and fair frozen-edit approval;
- **Gate A exact frozen edit-plus-validation replay**.

Latest Gate A:
- exact required 60-byte file;
- V1 Green;
- completed/verified TaskState;
- hidden acceptance Green;
- 5 model-requested tool calls;
- 3 logical provider rounds;
- zero human coding intervention;
- no stage/task/run-budget exhaustion.

Gate B then exposed a qualification-instrument authoring defect in `greenfield-express-v1`, not a new core execution defect.

## Gate B v1 failure

`greenfield-express-v1/P1-scaffold.task.txt` has no top-level `INSPECT`.

Instead it begins:

`W1 — Inspect the clean repository`

That work unit executes as an ordinary implementation stage because Task Prompt v1 has no work-unit kind field and George does not infer semantics from the title.

Qwen made useful read-only observations, then continued inspecting until the duplicate/no-progress guard correctly exhausted the implementation stage. No mutation or validation occurred.

## Broader instrument drift

Audit shows the v1 issue is not isolated:

### greenfield-express-v1 P2
Has both:
- top-level `INSPECT`;
- `W1 — Inspect current application behavior`.

The work unit duplicates application-owned preflight.

### greenfield-express-v1 P3
Has:
- top-level `INSPECT`;
- `W1 — Inspect implementation and tests`;
- `W3 — Validate and report`.

George-owned validation runs only after all workflow work units. Therefore W3 cannot truthfully report exact V1/V2 outcomes before those validations exist.

### existing-express-feature-v1
Has:
- top-level `INSPECT`;
- `W1 — Inspect frozen baseline`.

Its R6 also combines:
- implementation work: update README;
- post-validation evidence: completion report with focused/broad results.

These are distinct authorities.

## Decision

Do not modify production structured-task semantics to accommodate v1 authoring drift.

Specifically, do NOT:
- infer inspection behavior from a work-unit title;
- add keyword heuristics for `Inspect`, `Validate`, or `Report`;
- raise duplicate/no-progress limits;
- weaken the guard;
- make model work units own George-run validation.

Instead create aligned v2 live-work instruments.

## Task Prompt v1 semantics

No grammar/version change is required.

The existing primitives are sufficient:

- top-level `INSPECT`: application-owned preflight repository observation;
- `WORKFLOW`: actual task progression;
- `VALIDATION`: George-owned validation after workflow work;
- `EVIDENCE`: required post-execution evidence/reporting expectations.

George must not infer stage semantics from natural-language work-unit labels.

## Instrument immutability

Officially exercised v1 instruments are immutable evidence.

Do not edit:
- v1 task files;
- v1 instrument metadata/digests;
- v1 README semantics;
- v1 acceptance tests;
- preserved v1 live results.

Structural corrections create v2 instruments with new task-stack digests.

Behavioral acceptance may remain version 1 where product behavior is unchanged.

## greenfield-express-v2 direction

Create a new self-contained instrument directory.

### P1
Top-level INSPECT:
- clean repository structure;
- package/dependency state;
- Git baseline.

WORKFLOW starts directly with:
- create the minimal application skeleton.

Remove the inspection-only workflow unit.

### P2
Keep top-level INSPECT for current application/package state.

WORKFLOW contains only:
- add routes and validation behavior.

Remove duplicate inspection work.

### P3
Top-level INSPECT:
- routes/validation;
- existing tests;
- current docs.

WORKFLOW contains:
- add focused tests and documentation.

Do not create a `Validate and report` work unit.

Requirements should describe software/documentation outputs only.

Exact validation result/completion reporting belongs in EVIDENCE and qualification closeout after George runs V1/V2.

## existing-express-feature-v2 direction

Use the same frozen baseline behavior/fixture as v1.

Top-level INSPECT remains.

WORKFLOW:
- implement validated tag behavior;
- add feature tests and docs.

Remove duplicate inspect work.

Split old R6:
- README update remains an implementation requirement;
- validation/completion reporting moves to EVIDENCE.

## Acceptance

The required application behavior is unchanged.

Therefore:
- greenfield v2 may reuse greenfield acceptance version 1;
- existing-app v2 may reuse existing-app acceptance version 1;
- existing fixture source may remain fixture version 1 if bytes are unchanged;
- v2 task/instrument metadata/digests must be new.

## Qualification runners

Preserve:
- `runGreenfieldExpressV1()`;
- `runExistingExpressFeatureV1()`.

Add:
- `runGreenfieldExpressV2()`;
- `runExistingExpressFeatureV2()`.

V2 entry points load only matching v2 task files and delegate to the same production stack/task services.

No production orchestration fork.

## Final live gate sequence

Gate A is inherited Green and MUST NOT be rerun in this correction because production execution behavior is out of scope.

Run:

1. Gate B2 — `greenfield-express-v2`, exactly once.
2. If B2 Green, Gate C2 — `existing-express-feature-v2`, exactly once.
3. If B2/C2 Green and no new blocking regression appears, Phase 9 is ready for separate owner closeout.

## Locked non-goals

Do not:
- change `src/application/structured-task.ts` behavior;
- change Task Prompt grammar/version;
- change stage/no-progress limits;
- change provider/context/runtime settings;
- change mutation/approval behavior;
- change Bubblewrap/TUI;
- rerun Gate A;
- rewrite v1 evidence;
- owner-close Phase 9;
- open Phase 10.

## Recommended stack

### P1 — version and freeze aligned v2 instruments

Create v2 fixture/task metadata, v2 runner entry points, and permanent instrument-versioning/semantic regressions.

### P2 — final larger-work live qualification

Run B2 once and C2 only after B2 Green.

### P3 — closeout

Evidence-only. Determine whether Phase 9 is ready for `/closeout phase 9`.

## Prompt count

Three prompts including final closeout.

All prompts:
- `Sol Medium`;
- `Browser required: no.`;
- package remains exactly `0.9.10`.
