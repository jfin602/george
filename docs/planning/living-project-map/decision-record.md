# Living Project Map / Software Graph — Decision Record

Status: APPROVED DIRECTION  
Scheduling: Post-MVP; intentionally unnumbered until implementation sequencing is revisited  
Roadmap authority: `docs/roadmap/mvp-roadmap.md`

## Purpose

The Living Project Map gives developers a continuously maintained, human-readable spatial model of the **target repository George is currently working on**.

It should answer four questions quickly:

1. What is this system?
2. How do its pieces relate?
3. What part is George working on?
4. What actually changed and what was validated?

This is not a diagram of George itself. It is a project-understanding and task-impact capability for whichever repository George has opened.

## Product thesis

Traditional dependency graphs are useful but often too low-level. Fresh LLM-generated architecture diagrams are readable but cannot be treated as source truth. A useful coding-agent map needs both trustworthy structural evidence and higher-level conceptual organization.

The target experience combines four ideas:

- **automatic graph discovery** from repository evidence;
- **local graph exploration** around the currently relevant entity;
- **persistent canvas-style spatial organization** controlled by the developer;
- **semantic zoom** from architecture to component, module, file, and symbol detail.

George adds a fifth dimension that ordinary mind maps do not have: authoritative coding-task/session evidence. The same project model can therefore show expected impact, inspected areas, actual edits, validation, and runtime observations.

## Architectural boundary

The locked direction is:

```text
                     target repository
                            |
                            v
                deterministic indexers
                            |
             files / symbols / modules
             imports / routes / schemas
             packages / tests / configs
                            |
                            v
                       ProjectGraph
                  presentation-independent
                      /            \
                     /              \
                    v                v
          semantic project       task/runtime
               model               evidence
                     \              /
                      \            /
                       v          v
                     projections
                         |
                   view/layout state
                         |
       +-----------------+------------------+
       |                 |                  |
       v                 v                  v
    OpenTUI           Tauri            JSON Canvas
   projection      visual canvas          export
```

The repository remains source truth. The graph is derived state. View/layout state is a separate derived/user-owned model. Export formats are adapters.

No presentation client becomes the authority for project structure.

## Evidence and state classes

### 1. Deterministic structural evidence

Recovered directly from repository contents through bounded deterministic analysis.

Examples include:

- file/module/package existence;
- imports and exports;
- statically recoverable symbol relationships;
- routes;
- schemas;
- test-to-code relationships where recoverable;
- package dependencies;
- class/interface relationships where recoverable;
- configuration relationships.

Deterministic relationships may not be invented to make the diagram more complete.

### 2. Semantic architecture

Higher-level conceptual organization such as:

- Agent Core;
- Authentication;
- Persistence;
- Renderer;
- Tool System;
- API;
- Billing;
- Simulation Engine.

Semantic architecture may come from explicit project documentation, deterministic conventions, opt-in project metadata, or bounded model assistance.

Its provenance must remain visible and it must remain distinguishable from deterministic evidence.

### 3. Task/runtime evidence

Evidence accumulated while George works, including:

- expected impact;
- inspected entities;
- added, modified, moved, or removed entities;
- affected relationships;
- validation success/failure;
- runtime observations;
- browser/debug observations when applicable.

Task/runtime evidence augments the project graph but does not rewrite deterministic structural facts.

### 4. Presentation/view state

Developer-owned organization, including:

- node positions;
- pinned nodes;
- collapsed/expanded groups;
- viewport and zoom;
- selected projection;
- relationship filters;
- local-graph depth/direction;
- manual visual groups.

Changing presentation state must never change George's structural or semantic evidence.

## Two-model rule: graph truth versus canvas state

The feature maintains two distinct persistent models:

```text
PROJECT GRAPH
facts + semantic interpretation + task evidence
        |
        | projected into
        v
VIEW STATE
positions + groups + zoom + pins + filters
```

This separation is a core product law.

A user-created visual group such as "Stuff I am debugging" is presentation state. A graph-derived component named "Authentication" is semantic architecture. They are not interchangeable.

## Canonical ProjectGraph

George should expose one presentation-neutral graph contract and derive multiple projections from it.

Candidate entity levels include:

```text
workspace
  -> system/application
  -> architectural component
  -> package/subsystem
  -> module
  -> file
  -> symbol
```

Not every repository must use every level, and George must not fabricate hierarchy simply to fill a tree.

Candidate node kinds include:

- workspace;
- component;
- package;
- directory;
- module;
- file;
- symbol;
- route;
- service;
- database/schema/table;
- test;
- external system;
- configuration.

Candidate relationship kinds include:

- contains;
- imports;
- exports;
- calls;
- implements;
- extends;
- depends-on;
- routes-to;
- reads;
- writes;
- persists-to;
- tests;
- configures;
- publishes;
- subscribes.

These sets are extensible. Unsupported semantics should remain absent rather than guessed.

## Provenance

Meaningful graph facts must remain attributable.

A graph relationship should be able to carry, where applicable:

- relationship kind;
- evidence class;
- source/indexer;
- source location;
- semantic provenance;
- confidence only when confidence is meaningful.

Deterministic facts do not need artificial probabilistic confidence.

## Stable identity and reconciliation

Map refresh must preserve developer orientation.

The graph layer therefore needs stable identity and reconciliation sufficient to handle:

- ordinary edits;
- file moves;
- file renames;
- symbol movement where recoverable;
- additions;
- deletions.

Path equality alone is not assumed to be sufficient forever.

The exact identity/reconciliation algorithm is deferred to implementation planning, but the product contract requires compatible entities to retain view state whenever the evidence supports reconciliation.

## Incremental update contract

The map should update from authoritative George/repository evidence such as:

- filesystem changes;
- George-native write/patch events;
- Git/repository reconciliation;
- validation events;
- session/task events;
- runtime/debug observations.

A clean rebuild is the deterministic correctness oracle.

**Invariant:** after the same repository state is reached, incremental deterministic indexing must converge to the same structural graph as a clean rebuild.

Semantic caches may be regenerated independently.

## Semantic inference

The map must remain useful with semantic inference disabled.

Deterministic indexing provides the immediate structural substrate. Semantic inference is enhancement, not a prerequisite.

George must not call the primary coding model after every save/edit merely to redraw the map.

When this feature is scheduled, bounded utility-model tasks may include:

- component classification;
- module responsibility summaries;
- architectural clustering;
- label generation;
- semantic reconciliation.

Utility/model output remains derived semantic evidence and cannot alter permissions, deterministic relationships, or canonical session truth.

The primary coding model may be used for genuinely difficult architectural interpretation, but routine map maintenance should not depend on it.

## Storage

Derived project-map state lives in George's own state area keyed to canonical workspace identity by default.

Conceptually:

```text
George state
└── workspace identity
    └── project-map
        ├── structural index
        ├── graph cache
        ├── semantic cache
        └── view/layout state
```

Exact filenames remain implementation details.

Stored representations are schema-versioned. Incompatible or stale state must rebuild or fail visibly.

George must not silently create generated map metadata such as `.george/project-map.json`, `architecture.json`, or `project.canvas` inside the target repository.

Explicit project-owned architecture metadata may be supported later as a separate opt-in workflow.

## Presentation-neutral projections

One ProjectGraph should support projections including:

- architecture;
- modules/dependencies;
- data flow;
- control/runtime flow where evidence exists;
- API/network boundaries;
- persistence/database;
- tests/validation;
- current task;
- local graph.

Projections select and aggregate graph information. They are not separate graph authorities.

## OpenTUI and desktop roles

The ProjectGraph must be useful without a desktop GUI.

OpenTUI may eventually provide textual/compact commands such as:

```text
/map
/map local
/map task
/map deps <entity>
```

The future Tauri client is the natural home for the full interactive spatial canvas, but Tauri does not own graph truth.

## JSON Canvas interoperability

JSON Canvas is an export adapter, not George's graph schema.

Initial interoperability is **export-only**:

```text
ProjectGraph
    |
projection
    |
layout
    |
JSON Canvas exporter
    |
.canvas
```

The exporter should use ordinary JSON Canvas 1.0 constructs for nodes, edges, groups, geometry, labels, and direction where appropriate.

George-specific provenance/task/evidence semantics remain in George's own graph model rather than being flattened into the portable format.

No round-trip/import guarantee is required initially. In particular, visual relationships edited in Obsidian or another JSON Canvas client must never be interpreted automatically as code/architecture truth.

Exporting a `.canvas` file into the target repository requires an explicit user-selected path and George's normal write/approval policy.

George must not depend on Obsidian at runtime and must not assume the active repository is an Obsidian vault.

## Initial implementation slices

### Slice A — graph foundation

- graph contract;
- workspace-scoped storage;
- generic repository index;
- initial TypeScript/JavaScript structural extraction;
- stable deterministic rebuild;
- basic projection API.

A rich GUI is not required.

### Slice B — task-aware graph

- incremental refresh;
- current-task overlay;
- changed-file integration;
- validation integration;
- local-graph traversal.

This is where the feature becomes distinctly George-specific.

### Slice C — interactive visual map

- infinite canvas;
- pan/zoom;
- semantic zoom;
- node selection;
- filters;
- persistent layout;
- local graph;
- task overlays;
- visual/manual groups.

### Slice D — semantic architecture

- component discovery;
- responsibility summaries;
- semantic clustering;
- semantic reconciliation;
- provenance and deterministic fallback.

### Slice E — interoperability

- JSON Canvas export;
- other graph/export formats only if a concrete use case justifies them.

Exact phase slicing is deferred until the feature is scheduled.

## Historical/task state

The first implementation should not persist full graph snapshots for every moment in history.

Prefer:

```text
current repository graph
+
durable task/session evidence
+
baseline/reconciliation identity
```

This should be sufficient to support useful baseline/current/validated task comparisons without prematurely creating a graph-history database.

## Non-goals

Initial implementation does not include:

- fresh LLM-generated Mermaid diagrams treated as source truth;
- rendering every file and symbol at once by default;
- a primary-model inference call after every edit;
- graph state silently stored in the target repository;
- view/canvas layout becoming architecture truth;
- Obsidian as a runtime dependency;
- JSON Canvas as George's internal graph schema;
- automatic interpretation of imported Canvas edges as software relationships;
- full historical graph replay;
- mandatory browser/Tauri dependency for graph-core functionality;
- visualizing George instead of the active target repository.

## External design references

Interaction and interoperability concepts were informed by:

- Obsidian Graph View: https://obsidian.md/help/plugins/graph
- Obsidian Canvas: https://obsidian.md/help/plugins/canvas
- JSON Canvas announcement: https://obsidian.md/blog/json-canvas/
- JSON Canvas 1.0 specification: https://jsoncanvas.org/spec/1.0/

These are design references only. George remains implementation-independent from Obsidian.
