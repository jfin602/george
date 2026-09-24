# Living Project Map — Qualification Plan

Status: APPROVED QUALIFICATION DIRECTION  
Parent authority: `docs/planning/living-project-map/decision-record.md`

## Principle

The Living Project Map must qualify as trustworthy development evidence, not decorative generated prose.

Deterministic fixtures remain the correctness authority. Live visual/interoperability checks supplement deterministic coverage rather than replacing it.

## Structural graph correctness

Automated coverage must prove:

- identical repository states produce stable deterministic structural graphs;
- repeated clean rebuilds are stable;
- incremental updates converge to the same deterministic result as a clean rebuild;
- file/symbol add, delete, move, and rename operations do not leave stale nodes/edges;
- import/export/route/schema/dependency facts are not invented;
- supported relationships are not silently dropped;
- unsupported analysis degrades explicitly;
- stale/incompatible cache state rebuilds or fails visibly;
- workspace identity prevents graph state from bleeding across repositories.

## Evidence integrity

Tests must prove:

- deterministic and semantic evidence remain distinguishable;
- model-derived architecture cannot become deterministic fact through serialization/reload;
- expected impact remains distinguishable from observed changes;
- observed changes remain distinguishable from validation;
- runtime observations remain scoped observations;
- failed validation never renders as validated;
- presentation/view state cannot mutate graph evidence.

## Identity and layout reconciliation

Fixture scenarios should cover:

- unchanged node -> saved layout preserved;
- edited node -> compatible layout preserved;
- renamed/moved node -> layout preserved when reconciliation supports identity;
- new node -> no stale inherited state;
- deleted node -> stale layout removed or safely retired;
- ambiguous identity -> old layout is not silently attached to unrelated entity;
- clean graph rebuild -> compatible saved layout is reapplied by stable identity.

## Local graph correctness

Cover:

- depth 0/1/N boundaries;
- upstream traversal;
- downstream traversal;
- bidirectional traversal;
- relationship filters;
- cycles;
- high-degree nodes;
- removed/missing root entities;
- bounded output under large neighborhoods.

## Projection correctness

For each supported projection, prove:

- projection is derived from ProjectGraph;
- filtering/aggregation does not mutate ProjectGraph;
- deterministic facts preserved in the projection remain attributable;
- projection output is bounded;
- unsupported evidence is not synthesized.

Representative projection fixtures should include architecture, dependencies, tests/validation, current task, and local graph.

## Semantic zoom / progressive disclosure

Representative repositories should demonstrate multiple information levels without rendering all nodes simultaneously.

Tests or deterministic client-state coverage should prove:

- architecture-level view can omit file/symbol detail;
- component drill-down reveals relevant lower-level entities;
- file/symbol detail is available on explicit focus;
- zoom/focus changes do not alter graph truth;
- projection payload remains bounded as repositories grow.

## Current-task overlay truth

Integrated fixture coding sessions should prove correspondence among:

- expected/planned impact;
- inspected entities;
- actual repository changes;
- affected relationships;
- validation results;
- runtime observations.

An entity may hold multiple simultaneous task states.

Expected impact must never be promoted to observed impact without evidence.

## Validation evidence

A validation overlay should consume the same normalized validation evidence as George's coding workflow.

Cover at least:

- passing validation;
- failing validation;
- cancelled validation;
- timed-out validation;
- validation unrelated to a graph entity;
- multiple validation commands with mixed results.

The graph must not summarize a mixed or partial validation state as universally Green.

## Runtime/debug evidence

When runtime integrations exist, prove:

- observations are attached with bounded provenance;
- one observed execution does not rewrite a deterministic static edge;
- stale runtime observations can be distinguished from current execution;
- unavailable runtime adapters do not break static graph use.

## Repository non-mutation

Opening, indexing, viewing, arranging, filtering, semantic zooming, or resetting view state must not modify the target repository.

Tests should compare repository state before/after map-only workflows.

Only explicit export or explicit future project-owned architecture workflows may create repository files, through normal George write policy.

## Storage and recovery

Cover:

- state stored under canonical workspace identity;
- schema versions recorded;
- compatible reopen restores derived graph/view state;
- incompatible structural cache triggers safe rebuild;
- corrupted view state does not corrupt graph truth;
- graph rebuild does not require model inference;
- semantic cache loss does not prevent deterministic map use.

## Model/utility isolation

Prove:

- deterministic indexing succeeds with all models unavailable;
- ordinary deterministic refresh does not trigger hidden primary-model inference;
- semantic model failure leaves structural projections usable;
- semantic output is bounded derived evidence;
- semantic output cannot raise tool permissions or executable capability.

## Performance characterization

Measure separately before adopting hard thresholds:

- cold index time;
- warm reopen;
- incremental update latency;
- memory usage;
- derived-state disk size;
- projection construction time;
- local-graph traversal;
- layout computation;
- visual payload size;
- semantic inference latency/cost/resource pressure where enabled.

Use representative small, medium, and large repositories when implementation reaches qualification.

Do not hide a primary-model call inside ordinary save/edit latency.

## Large-repository stress

Stress cases should include:

- many files;
- high-degree dependency hubs;
- deep package structures;
- generated/vendor directories excluded or handled by policy;
- large symbol counts;
- relationship cycles;
- rapid batches of file changes.

Qualification should measure both graph-service cost and client payload/render responsiveness.

## JSON Canvas qualification

JSON Canvas export should be checked against the JSON Canvas 1.0 specification.

At minimum prove:

- valid JSON;
- stable/unique node IDs within the export;
- stable/unique edge IDs within the export;
- valid geometry for rendered node types;
- valid edge endpoints;
- no dangling edges after projection/filtering;
- groups reference valid geometry/content;
- edge direction and labels survive when represented;
- escaping/content is valid;
- explicit export path/write policy is honored.

Live interoperability evidence should include opening representative exported files in Obsidian when available.

A successful Obsidian open is supplemental live evidence, not a replacement for deterministic format tests.

## Accessibility/client qualification

For the rich visual client, verify:

- states are not communicated by color alone;
- keyboard-accessible selection/navigation where the client platform supports it;
- reduced-motion behavior;
- readable labels at supported zoom levels;
- bounded edge density/default clutter;
- details available without hover-only dependence.

## Regression permanence

Every confirmed project-map regression must leave a permanent executable detector at the lowest reliable layer or justified combination of layers.

Examples:

- stale rename edge -> index/reconciliation fixture;
- expected-impact rendered as observed -> projection/task-state fixture;
- layout reset after ordinary edit -> view reconciliation fixture;
- invalid Canvas edge -> exporter fixture.

## Live evidence classification

Report separately:

- deterministic graph tests;
- integrated task/session tests;
- client rendering tests;
- native/Tauri visual qualification;
- JSON Canvas/Obsidian interoperability;
- live model-assisted semantic qualification.

Missing GUI/model/Obsidian availability is an Evidence Gap, not inferred Green.
