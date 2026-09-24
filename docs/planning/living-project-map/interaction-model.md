# Living Project Map — Interaction Model

Status: APPROVED DESIGN CONTRACT  
Parent authority: `docs/planning/living-project-map/decision-record.md`

## Experience goal

The map should help a developer orient to an unfamiliar project, follow George's work, and understand architectural impact without forcing them to inspect an unreadable whole-repository dependency graph.

The default experience favors conceptual structure and progressive disclosure.

## Default architecture projection

Opening the map should answer "What are the major pieces of this software?"

Representative shape:

```text
                       Application
                            |
        +-------------------+--------------------+
        |                   |                    |
        v                   v                    v
    Agent Core          Tool System          Interfaces
        |                   |                    |
   +----+-----+        +----+----+              TUI
   |          |        |         |
   v          v        v         v
Context    Sessions   Files    Processes
```

The default must not render every file/symbol merely because that data exists.

## Semantic zoom

Zoom changes information density, not only pixel size.

Conceptual levels:

```text
far
 |
 |  system / architectural components
 |  subsystems / packages
 |  modules
 |  files
 |  symbols + detailed relationships
 v
near
```

Exact thresholds/layout algorithms are implementation details.

The product contract is progressive disclosure: more detailed graph levels appear only when the developer intentionally focuses into an area or explicitly requests them.

## Drill-down

Users should be able to traverse:

```text
component -> subsystem -> module -> file -> symbol
```

without losing the surrounding conceptual context.

Breadcrumbs or equivalent navigation should make the current level apparent.

## Local Graph

Selecting an entity should allow a focused relationship view similar in spirit to a local-neighborhood graph.

Controls should include:

- depth;
- upstream / downstream / both;
- relationship classes;
- node/evidence filters.

Typical use:

```text
                    ContextManager
                          |
       +------------------+------------------+
       |                  |                  |
       v                  v                  v
 ContextBudget       SkillRegistry      AgentRunner
       |                                      |
       v                                      v
 Provider Request                       Coding Workflow
```

This is likely the most useful day-to-day coding projection because it reveals only the blast radius around the current work.

## Current Task projection

The current-task view overlays authoritative George task/session evidence onto the same ProjectGraph.

Candidate visual states include:

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

States are independent dimensions rather than one mutually exclusive status.

The presentation must use labels/icons/patterns or equivalent accessible distinctions rather than relying only on color.

## Expected versus observed versus validated

The UI must preserve:

```text
BASELINE
   |
   v
EXPECTED IMPACT
   |
   v
CURRENT EDITS
   |
   v
OBSERVED IMPACT
   |
   v
VALIDATED STATE
```

Examples:

- "George expects AuthService to be affected" is not the same as observing a modification.
- A file being modified is not the same as its relevant validation passing.
- Passing validation is not universal proof that all downstream systems are correct.

## Follow George

Candidate interaction: **Follow George**.

When enabled, the map can gently surface the area George is currently inspecting or modifying.

Examples:

- file read -> highlight associated node;
- dependency traversal -> reveal/focus relationship;
- edit -> mark affected entity;
- validation -> activate validation evidence;
- runtime/browser debugging -> attach observed evidence.

This mode must not constantly seize the viewport.

Manual pan/zoom/selection should suspend or soften automatic following until the user explicitly resumes it.

## Persistent spatial layout

The visual canvas is developer-organizable.

Users may:

- drag nodes;
- pin nodes;
- resize visual groups;
- collapse/expand areas;
- choose relationship visibility;
- move conceptual clusters.

These choices survive ordinary graph refreshes.

Reconciliation behavior:

```text
matched existing node -> preserve position
renamed/moved node     -> preserve when identity reconciliation supports it
new node               -> place near related structure
removed node           -> remove/retire layout state
removed-this-task      -> may remain temporarily in task projection
```

An explicit reset/re-layout operation should allow the user to discard saved positioning and return to automatic layout.

## Visual groups

User-created visual groups are view state.

Examples:

- "Stuff I am debugging"
- "Migration work"
- "Performance hot path"

They must remain distinct from semantic components inferred from the repository.

A visual grouping may eventually be promoted into explicit project-owned architecture metadata only through a separate opt-in workflow.

## Multiple projections

The same underlying ProjectGraph should support at least:

- Architecture
- Modules / Dependencies
- Data Flow
- Runtime / Control Flow
- API / Network
- Persistence / Database
- Tests / Validation
- Current Task
- Local Graph

Users may switch projections without losing compatible spatial/view state.

## Node inspection

Selecting a node should show bounded details appropriate to its kind:

- identity/type;
- responsibility/semantic description;
- source locations;
- relationships;
- provenance/evidence class;
- task status;
- validation evidence;
- runtime observations.

Candidate actions:

- Open source
- Focus local graph
- Show dependencies
- Show dependents
- Show tests
- Ask George about this

Actions that cause filesystem/process/network effects still use George's normal application/tool/permission boundaries.

## Filtering

Candidate filters include:

- node type;
- edge type;
- package/directory;
- evidence class;
- current task only;
- changed only;
- validated/unvalidated;
- runtime observed;
- tests;
- external systems.

Filtering hides projection content. It never deletes graph truth.

## Large repositories

Do not attempt to solve scale by rendering everything and relying on zoom.

Primary scalability tools are:

- conceptual projection;
- aggregation;
- semantic zoom;
- local graph;
- filtering;
- lazy expansion.

The presentation should receive bounded projection payloads rather than an unbounded graph dump.

## OpenTUI projection

Graph functionality must not depend on desktop presentation.

A terminal client can provide compact textual/tree views such as:

```text
/map
/map local
/map task
/map deps <entity>
```

Exact commands are deferred until implementation planning.

OpenTUI remains a renderer of projection/application state, not the owner of graph logic.

## Tauri visual canvas

The future Tauri client is the preferred environment for the rich spatial experience:

- infinite canvas;
- smooth pan/zoom;
- semantic zoom;
- direct manipulation;
- rich details panel;
- projection switching;
- task overlays;
- local graph;
- persistent layout.

The graph core must remain independently testable without Tauri.

## JSON Canvas export UX

JSON Canvas is a portability feature.

A future explicit export might resemble:

```text
/map export architecture.canvas
```

or an equivalent Tauri action.

Export characteristics:

- user chooses target path;
- normal George write/approval policy applies;
- current projection/layout may inform the exported canvas;
- export is a snapshot, not authoritative graph persistence;
- Obsidian is not required to generate the file.

Initial scope does not import edited Canvas relationships back into ProjectGraph.

## Accessibility and legibility

The map should remain understandable without relying only on:

- color;
- animation;
- very small labels;
- hover-only information.

Task/evidence status needs textual or symbolic alternatives.

Dense edges should be suppressible/aggregatable.

## Animation

Animation may help preserve spatial continuity when:

- new nodes appear;
- entities move due to automatic layout;
- projection changes;
- George's current focus changes.

Animation must be bounded and disableable/reduced according to client accessibility/platform conventions.

It must never obscure evidence changes.

## Failure/degradation behavior

If semantic inference is unavailable, keep deterministic views working.

If a language/framework indexer is unsupported, surface the supported subset rather than manufacturing a semantic map.

If view state becomes incompatible, reset/reconcile the view without discarding ProjectGraph truth.

If ProjectGraph cache becomes stale/corrupt, rebuild deterministic state where safe.
