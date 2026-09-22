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

The runner owns prompt execution, Git staging/commit boundaries, version verification, resume semantics, and prompt grammar. Do not silently fork runner behavior in project docs.

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

Use `docs/tasks/p1`, `docs/tasks/p2`, etc. Planning records live under `docs/planning/p1-<slug>/`.

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
