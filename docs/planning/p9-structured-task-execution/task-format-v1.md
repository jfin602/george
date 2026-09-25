# George Task Prompt v1

Status: APPROVED FORMAT DIRECTION
Format marker: GEORGE TASK FORMAT: 1

## Purpose

George Task Prompt v1 is a constrained-natural-language task language for software-development work. Humans or strong planning models can author it comfortably, while George can parse explicit structure without asking the execution model to infer task semantics from prose.

It is not JSON and must remain readable as an engineering brief.

## Detection and failure behavior

A task is structured only when it declares:

    GEORGE TASK FORMAT: 1

If the marker is present, validation is mandatory. A malformed structured prompt fails closed with bounded deterministic diagnostics.

George must not silently repair ambiguous identifiers, invent missing required sections, infer undeclared dependencies, or reinterpret an invalid structured prompt as ordinary conversation.

A prompt without the marker remains ordinary chat unless another explicit George command selects a structured-task file.

## Required sections

Version 1 requires exactly one of each:
- GEORGE TASK FORMAT
- TASK
- KIND
- GOAL
- REQUIREMENTS
- WORKFLOW
- VALIDATION
- STOP CONDITIONS

## Optional sections

Version 1 may additionally include:
- STACK
- VERSIONING
- READ FIRST
- INSPECT
- INVARIANTS
- DELIVERABLES
- NON-GOALS
- PERMISSIONS
- EVIDENCE

Unknown top-level structural sections are rejected in v1 rather than ignored.

## Header fields

Example:

    GEORGE TASK FORMAT: 1

    STACK: p9-structured-task-execution
    TASK: P2 — Adaptive turn integration
    KIND: implementation

KIND is one of implementation, qualification, correction, or closeout.

A one-off task may omit STACK. If STACK is present, numbering/order must be consistent inside that stack. George's repository phase runner may add stricter repository-specific version/closeout validation.

## GOAL

GOAL is bounded natural language describing the outcome. It is authoritative task intent but cannot expand George's permission ceiling or override higher-precedence George/user policy.

## READ FIRST

Known required/optional documents:

    - REQUIRED: BOOT.md
    - OPTIONAL: docs/background.md

REQUIRED means George must resolve/consume the source through normal context routing before dependent work is ready. OPTIONAL failure is observable but not automatically blocking.

READ FIRST never bypasses trust/precedence or filesystem policy.

## INSPECT

INSPECT describes repository areas that must be examined before dependent implementation work without requiring the author to know exact source paths.

Example:
- context configuration and profile resolution
- application turn construction
- relevant tests

George records inspection progress from actual tool/evidence events. Model narration alone does not satisfy inspection.

## REQUIREMENTS

Requirements use stable IDs:

    - R1: Normal startup uses adaptive context mode.
    - R2: Explicit profile override remains fixed.

IDs are unique and positive. Requirement state is application-owned. George must distinguish implementation claims from verified completion.

## INVARIANTS

Invariants use I<number> IDs:

    - I1: Tool permissions must not change.

Violating a required invariant is a failure/correction condition, not successful completion with a warning.

## WORKFLOW

Each work unit has a stable W<number> ID:

    W2 — Integrate adaptive selection
    Covers: R1, R2, R3
    Depends on: W1

    Implement the smallest change that satisfies the covered requirements.

    Complete when:
    - selection occurs before the first provider request;
    - the selected profile remains fixed for the turn.

Rules:
- IDs are unique and ordered;
- Covers references declared requirements only;
- Depends on references declared work units only;
- dependency cycles are invalid;
- Depends on: none is valid;
- completion criteria remain natural language tied to observed task/evidence state;
- the model decides implementation details unless deliberately constrained.

George does not begin a work unit whose dependencies are incomplete except through an explicit correction/recovery transition permitted by the task state machine.

## VALIDATION

Validation uses V<number> IDs.

Literal form:

    V2 — TypeScript
    Covers: R1, R2
    Run: npm run typecheck

Discovery form:

    V1 — Focused regression
    Covers: R1
    Run: DISCOVER
    Scope: tests covering adaptive context-profile selection

Run contains either a literal approved command specification or DISCOVER. DISCOVER requires bounded Scope.

George records actual execution/result evidence. Required validation remains unverified until observed. A later passing rerun does not erase an earlier unexpected failure.

## STOP CONDITIONS

Stop conditions use S<number> IDs:

    - S1: Return Planning needed if safe implementation requires changing the approved architecture.
    - S2: Do not claim completion while required validation is failing or unexecuted.

Once parsed, stop conditions are harness-level task boundaries. The model may diagnose them but cannot override George-owned terminal conditions.

## DELIVERABLES

Deliverables use D<number> IDs and describe required outputs. They do not replace REQUIREMENTS or VALIDATION.

## NON-GOALS

NON-GOALS constrain scope. They cannot lower safety requirements or grant authority.

## PERMISSIONS

PERMISSIONS expresses the execution envelope the authored task expects, not authority the task grants.

Example:

    - Workspace: autonomous
    - Outside workspace: reject
    - Network: ask
    - Remote mutation: ask

George intersects task expectations with actual configured authority; the more restrictive effective policy wins.

## VERSIONING

VERSIONING may declare repository/task-version expectations for runners that use semantic versions. Generic Task Prompt v1 does not require package versioning.

## EVIDENCE

EVIDENCE may name required evidence artifacts/layers. Model-authored claims never substitute for actual tool/test/runtime evidence.

## Canonical example

    GEORGE TASK FORMAT: 1

    STACK: example-stack
    TASK: P2 — Add task priorities
    KIND: implementation

    GOAL

    Add low, medium, and high priorities while preserving existing behavior.

    INSPECT

    - task domain model
    - HTTP routes
    - existing tests

    REQUIREMENTS

    - R1: New tasks default to medium priority.
    - R2: Create and update accept low, medium, or high.
    - R3: Invalid priority returns a validation error.
    - R4: GET /tasks?priority=high filters tasks.
    - R5: Existing unfiltered behavior remains unchanged.

    WORKFLOW

    W1 — Inspect current task behavior
    Covers: R1, R2, R3, R4, R5
    Depends on: none

    W2 — Implement priority behavior
    Covers: R1, R2, R3, R4
    Depends on: W1

    VALIDATION

    V1 — Focused priority tests
    Covers: R1, R2, R3, R4
    Run: DISCOVER
    Scope: focused tests for task API priority behavior

    V2 — Full tests
    Covers: R5
    Run: npm test

    STOP CONDITIONS

    - S1: Do not claim completion while V1 or V2 is failing or unexecuted.

## Grammar versioning

Parsing/semantic changes require a new GEORGE TASK FORMAT version. Newer parsers may not silently reinterpret v1 syntax under changed semantics.
