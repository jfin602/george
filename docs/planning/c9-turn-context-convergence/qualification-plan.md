# Correction 9 Qualification Plan — Turn Context Convergence

Status: **APPROVED QUALIFICATION DIRECTION**

Date: 2026-09-26

Package remains `0.9.10`.

Authority:
- `docs/planning/c9-turn-context-convergence/decision-record.md`;
- current Phase 9 decision and qualification records;
- `docs/tasks/c9-qualification-preflight-scope/closeout.md`;
- official Gate B2 attempt/trace under `docs/tasks/c9-qualification-preflight-scope/evidence/gate-b2/`.

Correction baseline: `d7804684801fa8418050c34d9ef097ca1adf80b6`.

## Gate 0 — deterministic reproduction and boundary proof

Before changing behavior, preserve executable fixtures that reproduce the defect classes without depending on Qwen nondeterminism.

Required reproduction evidence:
- a mutation result containing a large canonical Git snapshot materially inflates the current serialized provider continuation;
- an ordinary frozen 8,192 profile can fail after otherwise successful bounded tool execution because continuation growth crosses its ceiling;
- provider-reported input may exceed the local frozen-profile estimate;
- current production TUI construction gives ordinary turns the coding-workflow instruction string.

The correction is not complete if it only raises a token ceiling or changes the live fixture.

## Gate 1 — provider-result projection

Add the smallest provider-independent projection boundary that separates canonical tool evidence from provider-visible continuation results.

Deterministic tests must prove:
- canonical successful `write_file` / `apply_patch` evidence still retains the Git snapshot required by existing workflow/recovery/Git-preservation consumers;
- the corresponding provider continuation omits that Git snapshot;
- the projected successful mutation result retains path, byte count, and resulting SHA-256;
- `create_directory` retains its bounded useful outcome;
- known tool failures retain bounded code/message evidence;
- provider projections cannot mutate canonical evidence or executable authority;
- projection is deterministic for identical canonical results;
- provider-visible tool result size is bounded independently from canonical internal metadata size;
- existing read/SHA/text-framing convergence remains usable after projection.

Do not remove canonical Git evidence merely to make the continuation smaller.

## Gate 2 — provider-grounded continuation safety and monotonic promotion

Implement continuation accounting so actual provider usage is used when available and adaptive turns may promote only their safety envelope.

Deterministic tests must prove:
- initial adaptive source selection still occurs before the first provider request;
- source identities/rendered guidance/current user input remain byte-for-byte stable across continuation-envelope promotion;
- a continuation that exceeds ordinary but fits medium promotes ordinary -> medium and continues;
- a later continuation that exceeds medium but fits large promotes medium -> large and continues;
- no promotion ever moves backward;
- promotion itself causes no provider call, tool call, source reassembly, source activation, semantic compaction, or session-authority rewrite;
- fixed ordinary remains fixed and fails before an unsafe continuation rather than promoting;
- adaptive continuation above the large 24,576 ceiling fails closed before another unsafe provider request when the excess is locally knowable;
- provider-reported usage above the current adaptive envelope but within a larger existing envelope records a promotion rather than converting the completed response into terminal failure;
- provider-reported usage above the large ceiling remains terminal;
- when usage is reported, the next estimate incorporates that actual input plus continuation-relevant output/new projected results and explicit bounded overhead;
- when usage is absent, the fallback estimator remains deterministic and conservative;
- diagnostics expose initial selected profile, effective continuation envelope, promotions, reasons, and relevant observed/estimated token evidence without exposing hidden reasoning.

Do not change the existing profile constants in this correction.

## Gate 3 — ordinary TUI base-agent wiring

Deterministic startup/application tests must prove:
- production TUI construction uses a base `AgentLoopApplicationService` that does not contain `CODING_WORKFLOW_GUIDANCE`;
- `StructuredTaskApplicationService` still receives the same canonical base agent and all structured Task Prompt behavior remains available;
- explicit `CodingWorkflowApplicationService` creation still adds `CODING_WORKFLOW_GUIDANCE`;
- ordinary TUI turns keep the normal configured tool registry and permission surface;
- no semantic intent classifier is introduced merely to distinguish greetings from coding requests;
- session persistence, recovery, approvals, cancellation, and Task/Transcript presentation behavior remain unchanged.

## Gate 4 — affected-system hard preflight and controlled broad delta

Against the implemented candidate require Green:
- new provider-projection tests;
- new continuation-accounting/promotion tests;
- TUI wiring tests;
- existing context/profile-selector and one-turn continuation floors;
- mutation/Git snapshot/recovery/Git-dirty-state floors;
- Phase 9 structured task/stack integration;
- frozen Gate A deterministic replay;
- v1/v2 instrument/task/metadata/acceptance immutability;
- typecheck;
- phase-runner tests;
- package/lockfile/diff hygiene.

Run current broad `npm test` as characterization.

Compare the candidate against exact correction baseline `d7804684801fa8418050c34d9ef097ca1adf80b6` using the qualification-preflight policy:
- same supported Node/npm;
- equivalent dependency state;
- exact broad command;
- equivalent TTY/non-TTY and relevant environment conditions;
- exact failed/skipped identities and bounded signatures.

Aggregate broad state remains truthful. Live eligibility requires hard preflight Green and broad regression delta Green; it does not require the historically retained broad suite to become aggregate Green.

## Live smoke A — ordinary greeting

Run exactly one bounded ordinary TUI/application smoke against the pinned supported LM Studio/Qwen configuration with user input:

`hi`

Green requires:
- one logical provider round;
- zero model-requested tools;
- one committed direct assistant response;
- no context/profile/task/stage/run-budget exhaustion;
- no coding-workflow guidance in the provider instructions;
- no human intervention beyond starting the smoke.

Record actual provider input/output usage and wall time as characterization, not a hard latency threshold.

If Not Green, stop before official Gate A and investigate. Do not rerun merely to obtain a pass.

## Live smoke B — synthetic three-file inspection

Use a controlled non-George Git repository containing three bounded text files representative of the manual failure shape (for example one implementation file, one focused test, and one short task/readme file, each roughly 4-8 KiB).

Ask Qwen to inspect the files needed to explain the target implementation. Do not tell the model that three files is a permanent maximum.

Green requires:
- successful final explanation grounded in the fixture;
- no context/profile/task/stage/run-budget exhaustion;
- required read evidence remains available to the model;
- provider-visible mutation/internal diagnostic metadata is absent unless explicitly relevant;
- any adaptive envelope promotion is monotonic and recorded truthfully;
- fixed source composition is preserved across promotion;
- zero human coding intervention.

If Not Green, stop before official Gate A. Preserve the attempt.

## Official Gate A — frozen edit-plus-validation replay

Only after Gates 0-4 and both live smokes are Green.

Run exactly one fresh official Gate A using the unchanged frozen task, fixture, approval helper, George-owned V1, hidden acceptance, and locked limits.

Green criteria remain unchanged:
- exact 60-byte edit;
- V1 Green;
- completed/verified TaskState;
- hidden acceptance Green;
- zero human coding intervention;
- no task/stage/correction/run-budget exhaustion;
- <=10 model-requested tool calls;
- <=10 logical provider rounds.

If Not Green, stop. Preserve evidence and do not rerun inside the same correction.

## Official Gate B2 — greenfield-express-v2

Only after fresh Gate A Green.

Run exactly one official `greenfield-express-v2` attempt with unchanged v2 task stack, digest, prerequisite, validation, acceptance, and runtime controls.

Do **not** create v3.

Green requires:
- P1/P2/P3 complete in order;
- declared George-owned validations Green;
- completed StackState;
- hidden acceptance Green;
- zero human coding intervention;
- no task/stage/correction/run-budget exhaustion.

Record provider-visible continuation sizes/projections and all adaptive envelope promotions needed to demonstrate that the earlier 28,306 > 8,192 failure class is actually resolved rather than hidden.

If Not Green, stop and leave C2 unspent.

## Official Gate C2 — existing-express-feature-v2

Only after B2 Green.

Run exactly one official unchanged C2 attempt.

Require:
- baseline behavior preserved;
- focused and broad declared validation Green;
- completed/verified TaskState;
- hidden acceptance Green;
- zero human coding intervention;
- no task/stage/correction/run-budget exhaustion.

## Evidence retention

Create a new correction task folder during implementation/qualification and retain bounded evidence for:
- deterministic reproduction/qualification summary;
- controlled broad baseline/candidate/delta summaries;
- runtime provenance;
- greeting smoke;
- three-file inspection smoke;
- every reached official Gate A/B2/C2 attempt and trace.

Do not rewrite prior correction evidence.

Do not commit raw provider streams, file/write bodies, unbounded Git snapshots/logs, workspace copies, dependency trees, secrets, or environment dumps.

## Closeout

Report separately:
- Provider Result Projection Qualified;
- Provider-Grounded Continuation Accounting Qualified;
- Adaptive Envelope Promotion Qualified;
- Fixed-Profile Safety Preserved;
- Ordinary TUI Base-Agent Wiring Qualified;
- Hard Preflight Qualified;
- Aggregate Broad Suite State;
- Broad Regression Delta;
- Greeting Smoke;
- Three-File Inspection Smoke;
- Fresh Gate A;
- B2;
- C2;
- Historical Evidence Preserved;
- Overall Correction Qualified;
- Phase 9 Ready For Owner Closeout.

Phase 9 is ready for separate owner closeout only if the correction is Green, fresh Gate A/B2/C2 are Green, and no new blocking regression exists.
