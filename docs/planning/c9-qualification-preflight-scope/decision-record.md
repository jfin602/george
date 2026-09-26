# Correction 9 Decision Record — Qualification Preflight Scope

Status: APPROVED DIRECTION — CURRENT PHASE 9 QUALIFICATION CORRECTION

Package boundary: `0.9.10` unchanged.

Historical evidence remains authoritative:
- `docs/tasks/c9-mutation-precondition-convergence/P2-live-evidence.md` — the required P2 pre-gate was Not Green because the prompt treated aggregate broad `npm test` Green as mandatory;
- `docs/tasks/c9-mutation-precondition-convergence/closeout.md` — production mutation-precondition implementation complete and deterministically qualified, fresh Gate A/B2/C2 Not Run;
- `docs/tasks/c9-greenfield-instrument-alignment/P2-live-evidence.md` — the immediately preceding supported-Node broad characterization already showed five OpenTUI renderer failures and one native-TTY skip while the affected qualification floor was Green.

This correction changes qualification policy and evidence classification. It does not change the George production agent loop, live-work instruments, hidden acceptance, Task Prompt format, provider/runtime settings, or package version.

## Problem

The approved mutation-precondition qualification plan distinguishes:
- focused/affected hard gates that must be Green; and
- broad supported-environment characterization whose retained unrelated TUI/native failures must remain truthfully Not Green.

The generated P2 prompt accidentally strengthened the latter into an absolute prerequisite by placing `npm test` inside a list headed `Require Green before live model work`.

P2 then observed:
- correction-specific affected floor `72/72` Green;
- current expanded inherited floor `179/179` Green at closeout;
- Phase 9 integration Green;
- typecheck Green;
- runner Green;
- package/version/lock/diff hygiene Green;
- broad Node 26 suite `383 passed, 5 failed, 1 skipped`.

Because the prompt required aggregate broad-suite Green, it stopped before fresh Gate A even though the broad failure count matched the previously recorded five OpenTUI renderer failures plus one native-TTY skip.

The stop was faithful to the prompt, but the prompt compiled the approved evidence model incorrectly.

## Decision — two-tier qualification preflight

Phase/correction qualification must distinguish **hard affected-system gates** from **broad regression characterization**.

### Hard preflight

Hard preflight must be Green before a live gate can be spent.

It includes the smallest sufficient set of deterministic checks materially connected to the candidate, such as:
- correction-specific focused tests;
- directly affected inherited regression floors;
- current phase integration;
- security/permission/recovery invariants touched by the candidate;
- frozen qualification replay where required;
- fixture/instrument/digest immutability where required;
- typecheck;
- phase-runner tests;
- diff/version/lockfile hygiene.

Any Not Green result in this set blocks live qualification.

### Broad characterization

A broad suite is still run when required by the stability contract, but its aggregate state and its **candidate regression delta** are distinct evidence.

The aggregate broad suite remains Green/Not Green/Evidence Gap exactly as observed.

Separately compare the candidate against a documented pre-change baseline under equivalent runtime/environment/command conditions.

The broad regression delta is Green only when:
- no new failing test identity appears;
- no baseline failure materially worsens in a way relevant to the candidate;
- no previously passing affected test becomes failing/skipped;
- the candidate does not make the broad suite newly un-runnable;
- retained failures/skips are identified and their equivalence is supported by bounded evidence.

An unchanged historical failure remains Not Green. Calling the regression delta Green does **not** relabel the aggregate suite Green or waive the historical failure.

### Blocking rule

Live gates are blocked by:
- any hard-preflight Not Green result;
- a broad regression delta that is Not Green;
- an unexplained broad failure that may plausibly be candidate-caused and cannot be bounded as retained baseline evidence.

Live gates are not blocked solely because an already-recorded broad failure remains materially unchanged from the controlled pre-change baseline.

## Current controlled comparison

For this correction, compare exactly:

- baseline: `d7e565ccb0e694166e6fe4346b56f4746f0697f1` — pre-P1 production state;
- candidate: `04405570b92680e6297b48391a7d0bdf0aa8ed5e` — mutation-precondition production candidate.

Use the same supported Node/npm environment and exact broad command for both.

Do not move or rewrite the active repository HEAD to perform the comparison. Materialize isolated temporary snapshots/clones from those immutable commits and reuse the same dependency installation/state where safely possible.

Record for each:
- runtime and exact command;
- totals/pass/fail/skip;
- exact failing/skipped test identities;
- bounded failure signature/category sufficient to compare assertion/timeout/renderer/native behavior;
- any inability to reproduce under equivalent conditions.

If the exact five OpenTUI failures and native-TTY skip are materially equivalent, classify:
- aggregate broad candidate suite: **Not Green — retained**;
- broad regression delta: **Green**;
- broad retained failures: still **Not Green/Evidence Gap** as previously recorded.

If they differ materially, stop before live gates and investigate the regression.

## Permanent executable policy

This correction must leave a deterministic qualification-layer guard that makes it difficult for future prompt/qualification code to collapse aggregate broad status and regression-delta status into one boolean.

Preferred direction:
- a small qualification-layer pure helper/type representing hard-preflight results, broad baseline/candidate summaries, and the resulting eligibility classification;
- deterministic tests showing an unchanged baseline failure set yields aggregate Not Green + delta Green + eligible when hard gates are Green;
- new/worsened failures yield delta Not Green + ineligible;
- missing/equivocal comparison evidence remains ineligible/Evidence Gap as appropriate.

Do not turn this into a generic CI framework.

## Live-gate handling

No fresh official live gate was spent by `c9-mutation-precondition-convergence`.

After the scoped preflight is qualified:
1. fresh Gate A — exactly once;
2. fresh B2 — exactly once only after A Green, using unchanged `greenfield-express-v2`;
3. C2 — exactly once only after B2 Green, using unchanged `existing-express-feature-v2`.

Historical Gate A Green, v1 Not Green, first B2 Not Green, and the preflight-stopped P2 remain immutable evidence.

## Non-goals

- changing production agent-loop/tool/filesystem behavior;
- repairing OpenTUI in this correction;
- relabeling the five broad renderer failures Green;
- waiving the native-TTY Evidence Gap;
- editing v1/v2 instruments or hidden acceptance;
- changing Task Prompt format 1;
- retuning Qwen/LM Studio/context/stage/run budgets;
- spending a live gate before the controlled baseline comparison is eligible;
- opening Phase 10.

## Documentation hygiene

The mutation-precondition closeout copied the existing-app v1 acceptance SHA with one incorrect nibble sequence. Correct the closeout text to the established frozen value:

`183c74474b02166e2ecfce21019eef2e2c1e20faa91b32d847e6f56e4608d21`

This is a prose correction only; the acceptance artifact and historical evidence are unchanged.
