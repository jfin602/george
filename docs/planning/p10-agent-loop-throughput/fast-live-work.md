# Phase 10 Fast Live Work

Status: APPROVED INSTRUMENT DIRECTION

## Purpose

Provide a fast live efficacy loop for Phase 10 optimization without repeatedly spending 20–30 minutes on Phase 9 B2/C2.

Routine live matrix:

`greeting -> three-file -> Gate A -> B3 -> C3`

B2/C2 remain frozen milestone instruments.

## B3 — compact greenfield stack

Working name: `greenfield-core-v1`.

Constraints:
- pure Node;
- no npm dependency installation;
- no network;
- small fixture;
- Task Prompt v1;
- multiple ordered tasks;
- one meaningful cross-task dependency;
- workspace-autonomous mutation;
- literal validations;
- hidden acceptance.

Recommended shape:

### P1 — create a tiny in-memory module

Create a small ESM module with one deterministic data operation and minimal package/test scaffolding.

### P2 — extend behavior and test it

Add one additional behavior that depends on P1 state/API, add focused tests, and preserve P1 behavior.

The exact feature should be deliberately simple enough that the instrument measures George's loop rather than domain knowledge.

Hidden acceptance checks exact behavior independently of model prose.

A separate deterministic test fixture may induce one validation failure to exercise the correction path without making the ordinary B3 happy path intentionally fail.

Initial target runtime: 2–5 minutes.

## C3 — compact existing edit

Working name: `existing-core-edit-v1`.

Constraints:
- pure Node;
- no network;
- pre-existing small repository fixture;
- baseline tests already Green;
- one focused feature;
- focused + broad validation;
- README/docs only if needed to prove a work-unit transition; do not add documentation merely to make the fixture larger;
- hidden acceptance.

Recommended fixture:
- `src/math.js` or similarly tiny deterministic module;
- baseline `node:test` regression file;
- one new feature such as `multiply(a,b)`, clamp, normalization, or another small deterministic behavior.

The task must require:
- INSPECT;
- preservation of existing behavior;
- one mutation;
- one focused validation;
- one broad validation.

Initial target runtime: 1–3 minutes.

## Instrument immutability

Once officially exercised:
- task files are immutable for that instrument version;
- hidden acceptance identity is independently versioned;
- structural changes require B4/C4 or a new named instrument version;
- historical result states remain unchanged.

## Fast-gate timing

Phase 10 should initially record, not assume, the complete matrix runtime.

Desired initial envelope: approximately 5–10 minutes for all five workloads.

If the baseline exceeds it, record the baseline truth and optimize from there rather than weakening acceptance.

## What B3/C3 do not replace

They do not replace:
- B2/C2 historical evidence;
- B2/C2 milestone runs;
- full benchmark;
- affected deterministic regression;
- security/permission/recovery gates.

They exist to make optimization iteration fast enough to be practical.
