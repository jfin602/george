# c9-turn-context-convergence Prompt Assessment

Status: READY FOR PRODUCTION CONTEXT-CONVERGENCE CORRECTION

Correction: `c9-turn-context-convergence`  
Roadmap phase: 9  
Required unchanged package version: `0.9.10`  
Correction baseline: `d7804684801fa8418050c34d9ef097ca1adf80b6`

## Trigger

`c9-qualification-preflight-scope` qualified the two-tier preflight policy and then spent the fresh Phase 9 gates exactly as authorized.

Observed result:
- hard affected-system preflight: Green;
- broad regression delta: Green while aggregate broad remained truthfully Not Green;
- fresh Gate A: Green;
- fresh `greenfield-express-v2` Gate B2: Not Green;
- Gate C2: Not Run by gate.

The official B2 implementation stage assembled only 1,319 estimated tokens under ordinary, then executed a bounded four-tool round:
- existing `package.json` write failed normally;
- `create_directory("src")` succeeded;
- `write_file("src/app.js")` succeeded;
- `write_file("src/server.js")` succeeded.

Before the next provider round, George estimated continuation context at **28,306** tokens against the frozen ordinary **8,192** provider-input ceiling and terminated P1 as `budget_exhausted`.

A separate ordinary interactive reproduction showed:
- provider-reported input of 8,231 / 8,574 / 8,509 crossing the same 8,192 ordinary ceiling after local pre-send checks had allowed continuation;
- a simple `hi` causing repository inspection rather than a direct conversational response.

## Root causes confirmed by source review

### Internal mutation evidence is leaking into provider continuation

Successful `write_file` / `apply_patch` results include a pre-mutation `GitWorkingTreeSnapshot`.

That snapshot is legitimate canonical George evidence for Git/user-work preservation and workflow/recovery reasoning.

However, the canonical agent loop currently uses the same full tool result as the provider `function_call_output`.

The mutation snapshot may be bounded up to 1 MiB. This makes small mutations capable of creating very large continuation payloads containing workspace state that Qwen does not need.

### Continuation safety is anchored to an incomplete estimate

Before continuation, George approximates growth from the initial assembled-context estimate plus serialized tool results.

LM Studio can later report actual provider input greater than the selected frozen ceiling. The current code treats that completed response as terminal budget failure even when the observed input would fit an existing larger adaptive profile.

Provider-reported usage is stronger evidence than the local approximation and should participate in the next safety decision.

### Ordinary TUI startup injects coding-workflow guidance globally

Production startup constructs a `CodingWorkflowApplicationService` and passes `workflow.agent` into `StructuredTaskApplicationService`.

`createCodingWorkflowApplicationService()` permanently appends `CODING_WORKFLOW_GUIDANCE` to the underlying agent.

Therefore ordinary free-form TUI turns are framed as coding completions even when the user simply says `hi`.

## Locked correction decisions

### Canonical versus provider-visible tool results

Create an explicit provider-result projection seam.

Canonical tool/session/recovery evidence stays complete and bounded.

Provider continuation receives only deterministic bounded information required for the model's next decision.

For successful workspace mutations, provider continuation must preserve the useful receipt:
- tool/name as applicable;
- path;
- bytes;
- resulting SHA-256.

It must not automatically include the internal Git working-tree snapshot.

### Provider-grounded continuation accounting

When provider input/output usage is reported, use it as the strongest available evidence for subsequent continuation safety.

Keep a conservative deterministic fallback when provider usage is unavailable.

Run-wide token budgets and per-request continuation safety remain separate concepts.

### Adaptive continuation envelope promotion

Freeze source composition, not the adaptive safety envelope.

For adaptive mode only:
`ordinary -> medium -> large`

Promotion:
- is monotonic;
- does not reassemble sources;
- does not add routed docs/skills/history;
- does not call the provider;
- does not execute tools;
- does not trigger semantic compaction merely to remain small;
- is observable through bounded diagnostics/evidence.

Fixed mode remains fixed.

Above large remains fail-closed.

### Ordinary TUI base-agent wiring

Production TUI startup must construct the canonical base agent directly.

`StructuredTaskApplicationService` may wrap that base agent.

Explicit `CodingWorkflowApplicationService` remains supported and retains its coding-completion guidance.

Do not introduce a semantic intent classifier for ordinary text.

## Critical non-goals

Do not:
- retune ordinary 8,192 / medium 16,384 / large 24,576;
- change the 32,768 physical target;
- change Task Prompt format 1;
- create greenfield/existing-app v3 instruments;
- rewrite v1/v2 fixtures, task stacks, metadata, hidden acceptance, or historical evidence;
- remove canonical Git/recovery evidence merely to reduce model context;
- weaken permissions, SHA preconditions, text-framing safeguards, Workspace Autonomous boundaries, or recovery semantics;
- use semantic compaction as the ordinary/medium promotion mechanism;
- owner-close Phase 9;
- open Phase 10.

## Recommended stack

### P1 — provider-result projection

**Sol High.**

Reproduce the continuation-amplification defect deterministically, introduce the generic canonical-to-provider projection boundary, keep canonical mutation Git evidence intact, and permanently guard that mutation snapshots do not enter provider continuation.

No adaptive promotion work yet and no live gates.

### P2 — continuation accounting and adaptive envelope promotion

**Sol High.**

Use provider usage when available, add monotonic adaptive safety-envelope promotion without source reassembly, preserve fixed-profile behavior and >large fail-closed semantics, and add bounded promotion diagnostics suitable for live evidence.

No TUI wiring change and no official live gates.

### P3 — TUI base-agent wiring and live-smoke instrumentation

**Sol Medium.**

Fix production TUI composition so ordinary turns use the base agent, preserve explicit CodingWorkflow guidance, add deterministic startup coverage, and add bounded reusable qualification support/frozen synthetic fixture for the greeting and three-file live smokes.

No official live smoke or Gate A/B2/C2 is spent here.

### P4 — scoped preflight + live smokes + fresh Gate A/B2/C2

**Sol Medium.**

Make no production repair. Run the full hard affected-system floor, controlled broad regression delta against `d780468...`, pinned runtime provenance, one greeting smoke, one three-file smoke, then one fresh Gate A -> B2 -> C2 sequence with stop-on-first-failure.

### P5 — evidence-only closeout

**Sol Medium.**

Audit implementation, deterministic regression permanence, broad delta, both smokes, official gates, artifact hashes, historical evidence preservation, and Phase 9 owner-closeout readiness.

## Prompt count

Five prompts including final closeout.

All prompts:
- Browser required: no.
- Package remains exactly `0.9.10`.
- No root `package-lock.json`.
- Historical evidence remains immutable.
- Phase 10 remains unopened.
