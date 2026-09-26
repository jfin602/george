# Phase 10 Fast Live Work

Status: APPROVED DESIGN

## Purpose

Provide a repeatable live efficacy loop that is fast enough to run after meaningful agent-loop changes.

Routine order:

`greeting -> three-file -> Gate A -> B3 -> C3`

The sequence should initially fit roughly 5-10 minutes on the pinned local runtime and be optimized downward.

## B3 — compact greenfield stack

Pure Node fixture; no external dependency installation.

Suggested shape:
- P1 creates a tiny module and package/test script;
- P2 adds one bounded behavior/API function;
- P3 adds focused test/docs or a second small integration behavior.

Must exercise:
- TaskStack ordering;
- multiple tasks;
- mutation;
- declared validation;
- correction capability;
- StackState;
- hidden acceptance.

Avoid framework/package-manager/network cost.

## C3 — compact existing edit

Pure Node prebuilt fixture with a few files and existing tests.

Suggested task:
- inspect one implementation plus focused test;
- add one small behavior while preserving baseline;
- update/add one focused test;
- run focused validation then broad `npm test`.

Must exercise:
- existing-repo evidence;
- focused mutation;
- preservation;
- two validation scopes;
- TaskState;
- hidden acceptance.

## Frozen B2/C2

B2/C2 stay immutable and are not rewritten into B3/C3.

B3/C3 are new Phase 10 instruments.

B2/C2 run only at milestone qualification after the primary-only campaign and at later consolidation as justified.
