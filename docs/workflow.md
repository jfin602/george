# Repository Workflow

Status: CURRENT WORKFLOW CONTRACT

George adopts Petri's repository workflow while keeping qualification proportional to a developer-agent project.

## Session bootstrap

Read `BOOT.md`, `AGENTS.md`, and the narrowest relevant docs before substantial repository-aware work.

## Documentation

`/docs-review -> explicit approval -> /docs-apply`

## Implementation planning

`/prompt-ass -> /prompt-plan -> /prompt-write <folder>`

Do not jump from a substantial idea directly to implementation prompts.

## Planning philosophy

> Plan richly; prompt sparsely; validate rigorously.

`/prompt-ass` owns task decomposition, preserved behavior, dependencies, prompt order, deferred work, risks, and evidence.

`/prompt-plan` inspects actual source/tests, traces affected producers/consumers, identifies likely scope and failure modes, and defines validation.

`/prompt-write` distills the accepted plan into the smallest precise implementation brief. Do not copy planning analysis wholesale.

## Structured task authoring — planned Phase 9 contract

Phase 9 adds George Task Prompt v1 as the execution-facing prompt contract.

Rich architecture/decomposition remains in `/prompt-ass` and `/prompt-plan`. For Phase 9 and later structured stacks, `/prompt-write` should compile that accepted plan into the standardized constrained-natural-language grammar in `docs/planning/p9-structured-task-execution/task-format-v1.md` rather than emitting a frontier-model memo whose structure must be inferred by the local executor.

The format is human-readable but deterministically parseable. Sol/Astra or a human may author it. George validates structure before execution and owns requirement/work-unit/validation/stop-condition state.

A structured prompt cannot grant permissions. Declared permission expectations are intersected with the user's configured execution ceiling.

Historical Phase 1-8 task prompts keep their original grammar/evidence and are not rewritten retroactively.

## Phase runner

George uses the exact Petri Codex phase runner currently stored in:
- `scripts/codex-phase.mjs`;
- `scripts/codex-phase-core.mjs`;
- `scripts/validate-codex-phase.mjs`.

Validate a generated stack with:

`npm run codex:phase:validate -- <folder>`

Run implementation prompts with:

`npm run codex:phase -- <folder>`

Run implementation plus closeout with:

`npm run codex:phase -- <folder> --closeout`

The current runner owns prompt execution, Git staging/commit boundaries, version verification, resume semantics, and the historical Petri prompt grammar. Do not silently fork existing runner behavior in project docs.

Phase 9 implementation may extend or replace the execution-facing grammar with George Task Prompt v1 only through the approved decision/format contracts and regression coverage. Existing task-stack history and commit/version resume semantics must remain truthfully migratable or explicitly versioned rather than silently reinterpreted.

## Prompt metadata

Because George intentionally uses the exact Petri runner, every newly generated prompt must include exactly one canonical line:

`- Browser required: yes.`

or:

`- Browser required: no.`

Use `yes` only when the prompt genuinely requires direct browser execution/evidence and therefore cannot be truthfully completed by the ordinary CLI phase runner. Browser-required prompts are manual handoff points.

Phase 1 has no browser requirement; all Phase 1 prompts should use `Browser required: no.`

## Material-gate rule

Return `Planning needed` only when the approved plan no longer safely fits current source, a trust/security boundary is unresolved, or proceeding would silently change approved scope.

Routine cleanup and bounded repository hygiene should normally be repaired and validated rather than turned into manual gates.

## Benchmark-gated optimization work

The Phase 7-13 performance/developer-usefulness campaign uses the formal npm benchmark harness plus, from Phase 9 onward, frozen live-work task-stack qualification over the real George application/provider/tool path.

Canonical optimization loop:

`last accepted baseline -> one bounded optimization -> benchmark -> accept/revise/revert -> record new baseline -> next optimization`

Use:
- `npm run benchmark -- --suite quick` for representative per-change gates;
- `npm run benchmark -- --suite full` for initial/final broad qualification or whenever the affected behavior warrants it;
- `--compare <results.json>` when comparing against a recorded baseline;
- generated `artifacts/benchmarks/<run-id>/results.json`, `report.md`, and optional `comparison.md` as performance evidence.

Benchmark evidence complements tests and phase qualification; it does not replace them. Do not accept a speed change that regresses deterministic correctness, permission/recovery guarantees, or required evidence semantics. Do not combine multiple unmeasured performance changes into one acceptance gate.

After Phase 9 establishes `greenfield-express-v1` and `existing-express-feature-v1`, rerun those frozen live-work instruments at later phase closeouts when the supported environment is available. Preserve their prompt/fixture/hidden-acceptance versions so longitudinal results remain comparable.

## Stability questions

Every substantial task should answer:

1. What user-visible or aggregate behavior could accidentally change even if edited functions are locally correct?
2. What invariants must survive the representation or architecture change?
3. What behavior can only be proven through integrated model/process/tool/runtime evidence rather than unit tests?
4. What baseline is used for comparison?

## Corrections

Use `c<phase>-<slug>` for bounded repairs.

Every correction stack must repair the defect, add a permanent executable regression guard for the defect class, and run broader affected-system validation. A later passing rerun does not erase an unexplained failure.

## Phase folders

Use `docs/tasks/p1`, `docs/tasks/p2`, etc. Planning records live under `docs/planning/p1-<slug>/`. Multi-digit phase folders such as `p10`, `p11`, and later are supported by the phase runner; phase-derived versions such as `0.10.<prompt>` are valid semantic versions under the runner contract.

Early package versions follow `0.<phase>.<prompt>` for runner compatibility and may be revisited before public release.

## Test-command truth

Command names are evidence only for what they actually execute.

At bootstrap:
- `npm run test:runner` exercises the ported phase-runner tests;
- `npm test` currently targets `test/unit/**/*.test.ts`;
- `npm run typecheck` performs TypeScript static checking;
- `npm run check` currently composes typecheck plus `npm test`.

Phase 1 must establish explicit commands/coverage for any provider, TUI, or integration evidence it introduces. Do not describe `npm test` as provider/TUI/integration qualification unless its implementation actually includes those tests.

## Closeout truth

Keep implementation completion separate from broader qualification.

Evidence is Green, Not Green, or Evidence Gap. An Evidence Gap is not a pass. Owner acceptance of a known gap is a waiver, not retroactive evidence.
