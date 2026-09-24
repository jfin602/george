# Living Project Map — Graph Contract

Status: APPROVED DESIGN CONTRACT  
Parent authority: `docs/planning/living-project-map/decision-record.md`

## Purpose

This document defines the presentation-independent graph model used by the Living Project Map.

It deliberately separates:

1. repository-derived structure;
2. semantic architectural interpretation;
3. task/runtime evidence;
4. presentation/view state.

The first three belong to or augment the ProjectGraph. View state is separate.

## Graph invariants

The ProjectGraph must satisfy these invariants:

- the target repository remains source truth;
- deterministic facts are never fabricated for visual completeness;
- semantic/model-derived facts are identifiable as such;
- task/runtime evidence never silently rewrites static structure;
- presentation changes never mutate graph evidence;
- incremental deterministic updates converge to a clean deterministic rebuild;
- stale/incompatible cached state never remains silently trusted;
- graph construction is independent from OpenTUI, Tauri, browser, and JSON Canvas;
- graph state is workspace-bound and stored outside the target repository by default.

## Conceptual hierarchy

The graph may represent multiple levels:

```text
workspace
  -> system/application
  -> component
  -> package/subsystem
  -> module
  -> file
  -> symbol
```

Hierarchy is evidence-driven. Missing conceptual levels are valid.

## Candidate node kinds

Initial contract should accommodate at least:

- `workspace`
- `component`
- `package`
- `directory`
- `module`
- `file`
- `symbol`
- `route`
- `service`
- `database`
- `schema`
- `table`
- `test`
- `external-system`
- `configuration`

The TypeScript representation may use extensible discriminated values rather than freezing a permanently closed enum.

## Candidate edge kinds

Initial contract should accommodate at least:

- `contains`
- `imports`
- `exports`
- `calls`
- `implements`
- `extends`
- `depends-on`
- `routes-to`
- `reads`
- `writes`
- `persists-to`
- `tests`
- `configures`
- `publishes`
- `subscribes`

Unsupported edge classes should be absent, not guessed.

## Evidence classes

### Deterministic

Backed directly by bounded source/configuration analysis.

Required properties conceptually include:

- stable fact identity;
- producer/indexer identity;
- relationship/entity kind;
- source location or other recoverable provenance when applicable.

### Semantic

Higher-level interpretation.

Conceptual metadata may include:

- semantic producer;
- source documents/evidence;
- generated/reconciled timestamp or source revision;
- bounded confidence where meaningful.

Semantic evidence must never be serialized in a way that makes it indistinguishable from deterministic structure.

### Task/runtime

Task-scoped annotations should be able to represent independent dimensions such as:

- expected impact;
- inspected;
- added;
- modified;
- moved;
- removed;
- affected;
- validated;
- validation failed;
- runtime observed.

These are not mutually exclusive. For example, an entity can be both `modified`, `validated`, and `runtime observed`.

## Identity

Graph entities require stable identities suitable for incremental reconciliation and saved layouts.

Identity design must account for:

- source path;
- entity type;
- symbol identity when available;
- rename/move reconciliation;
- language/indexer-specific stable keys when justified.

Do not expose a path-only assumption as a permanent architectural law.

The implementation may use internal canonical IDs plus source locators.

## Reconciliation

A refresh/rebuild classifies previous entities conceptually as:

- matched/unchanged;
- matched/changed;
- moved/renamed;
- new;
- removed;
- ambiguous/unresolved.

Presentation state may be retained only when entity reconciliation supports it.

Ambiguous mappings must not silently attach old semantic/layout state to unrelated new code.

## Structural rebuild

A full deterministic rebuild should be possible from the target repository without requiring:

- model inference;
- existing semantic cache;
- existing view state;
- prior task history.

The structural rebuild is the correctness oracle for incremental deterministic indexing.

## Incremental updates

Incremental processing may consume bounded repository/change evidence to avoid complete re-indexing.

Requirements:

- update affected entities/relationships;
- remove stale edges;
- invalidate dependent derived semantic/projection state where needed;
- preserve compatible identities;
- converge to clean-rebuild deterministic output.

## Projection API

A projection is a bounded view over ProjectGraph, not a new source of truth.

A projection may:

- select nodes/edges;
- aggregate lower-level nodes;
- collapse/expand conceptual levels;
- filter by relation/evidence;
- add task overlays;
- compute local neighborhoods;
- supply presentation hints.

A projection may not:

- manufacture structural relationships;
- mutate graph evidence;
- persist UI layout into structural records.

## Required projection families

The graph contract should support:

- architecture;
- modules/dependencies;
- data flow;
- runtime/control flow when evidence exists;
- API/network;
- persistence/database;
- tests/validation;
- current task;
- local graph.

## Local graph traversal

Local traversal should be parameterizable by:

- root entity;
- maximum depth;
- direction: upstream, downstream, both;
- included edge classes;
- included node classes/evidence classes;
- projection/context.

Cycles and high-degree nodes require bounded traversal.

## Task delta model

Task visualization should distinguish at least:

```text
baseline
   ->
expected impact
   ->
current edits / observed impact
   ->
validated state
```

Expected impact is predictive/planning information. It must not be rendered as if George observed a change.

Validation is evidence of the validation command/result, not proof of total system correctness.

## Runtime evidence

Runtime/browser/debug observations are scoped evidence.

A runtime observation may attach to a graph entity or edge, but one execution must not automatically become a generalized permanent static relationship.

Runtime evidence needs enough provenance to identify the observation source/session where practical.

## View/layout state contract

View state is stored separately from ProjectGraph.

Candidate view-state fields include:

- projection identity;
- node coordinates;
- dimensions;
- pinned state;
- expanded/collapsed state;
- user visual groups;
- viewport;
- zoom;
- active filters;
- local-graph settings;
- follow-George state.

View state is keyed to stable graph identities and reconciled after graph updates.

## Storage/versioning

Graph/index/semantic/view data are derived local state.

Each persistent representation must be schema-versioned and workspace-bound.

On incompatible schema or unrecoverable corruption, George should:

1. preserve authoritative repository/session truth;
2. discard/rebuild derived graph data where safe;
3. report failure visibly if a safe rebuild is not possible.

Never mutate target-project source merely to repair graph state.

## Provider/model independence

The ProjectGraph API cannot require a particular model provider.

Semantic augmentation receives/returns normalized George-owned structures.

LM Studio, Qwen, future utility models, and remote providers remain adapter/runtime choices.

## Security/trust

Repository source, documentation, model output, runtime observations, and imported/exported formats remain distinct trust domains.

Graph data cannot raise tool permissions or executable capability.

A future graph import must never be treated as repository instructions or executable authority.

Initial JSON Canvas support is export-only specifically to avoid conflating third-party visual edits with software evidence.
