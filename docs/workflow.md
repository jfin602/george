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

Early package versions follow `0.<phase>.<prompt>` for workflow compatibility and may be revisited before public release.

## Prompt metadata

If/when George ports Petri's automated phase runner, generated prompts should explicitly classify special execution requirements rather than relying on hidden assumptions.

Do not copy Petri's browser-required rule mechanically into George before George actually has a browser-execution distinction.

## Closeout truth

Keep implementation completion separate from broader qualification.

Evidence is Green, Not Green, or Evidence Gap. An Evidence Gap is not a pass. Owner acceptance of a known gap is a waiver, not retroactive evidence.
