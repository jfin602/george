# c9 turn context convergence closeout

Status: **DETERMINISTIC PRODUCTION CORRECTION GREEN; LIVE EVIDENCE GAP; OVERALL NOT QUALIFIED**

Date: 2026-09-26

Package: `0.9.10` (unchanged)

Pre-task HEAD inspected: `ef3fe7ddd2661cb62fbac357099cb872a73a0005`

This is an evidence-only closeout. P5 did not repair production, tests, fixtures, profiles, runtime settings, qualification semantics, live instruments, acceptance, or historical evidence, and did not rerun the greeting, three-file smoke, Gate A, Gate B2, or Gate C2.

## Decision

| Decision | Result | Basis |
| --- | --- | --- |
| Provider Result Projection Qualified | **Green** | Canonical mutation results retain bounded pre-mutation Git evidence. Provider continuations receive deterministic projections: `write_file`/`apply_patch` retain name, path, bytes, and SHA-256 without `git`; `create_directory` retains path and bounded creation outcome; known failures retain bounded code/message. Canonical events, recovery, workflow truth, effects, and approvals remain unchanged. Permanent regression coverage reproduces the original amplification class at 11,918 canonical bytes versus 148 projected bytes. |
| Provider-Grounded Continuation Accounting Qualified | **Green** | Completed-response accounting uses `max(local request estimate, reported input) + (reported output ?? deterministic serialized-response estimate)`, then adds only newly projected tool results and the fixed 32-token margin. This uses provider usage when available without adding the same history twice, has a deterministic fallback, accounts from provider projections rather than canonical internal results, and fails closed above large. |
| Adaptive Envelope Promotion Qualified | **Green** | Deterministic coverage proves ordinary -> medium and medium -> large, monotonic promotion with no demotion, one final source assembly, byte-stable instructions/input/tools, no promotion-caused provider/tool call, and no ordinary/medium semantic compaction. Bounded promotion diagnostics survive session, progress, diagnostics, and live-trace projection. |
| Fixed-Profile Safety Preserved | **Green** | Fixed ordinary never promotes and fails before an unsafe continuation. Adaptive continuation or reported usage above the 24,576-token large ceiling remains terminal. |
| Ordinary TUI Base-Agent Wiring Qualified | **Green** | Production TUI composition constructs the base agent directly. Ordinary instructions omit `CODING_WORKFLOW_GUIDANCE`; explicit `CodingWorkflowApplicationService` retains it. Ordinary coding tools, Task Prompt format 1 routing, persistence, recovery, approval, and cancellation behavior remain covered and Green. |
| Hard Preflight Qualified | **Green** | P4 recorded the complete affected floor Green `216/216` before and after evidence generation. P5 revalidation passed the current affected provider/tool/context/one-turn/coding/TUI/qualification/Phase 9 floor `203/203`, typecheck, and runner `90/90` under Node `v26.10.0`. |
| Aggregate Broad Suite State | **Not Green — retained** | Controlled baseline was `389 passed, 5 failed, 1 skipped`; controlled candidate was `401 passed, 4 failed, 1 skipped`. P4 final current characterization was `400 passed, 5 failed, 1 skipped`. P5 again observed `400 passed, 5 failed, 1 skipped` of 406. The five failures are the retained OpenTUI renderer identities; the native real-TTY case remains skipped. |
| Broad Regression Delta | **Green** | The controlled comparison uses exact baseline `d7804684801fa8418050c34d9ef097ca1adf80b6` under equivalent Node/npm, dependency, Git, command, and non-TTY conditions. No new or worsened identity/category/signature was recorded. P5 reproduced the complete retained baseline failure/skip set and no new identity. |
| Live Eligibility | **Green at deterministic pre-gate; runtime Evidence Gap stopped execution** | The qualification classifier correctly reports live eligibility because hard preflight and broad regression delta are Green. The subsequent runtime boundary was not satisfied: the pinned model was listed but had no loaded instance, so required REST-visible runtime controls and GPU Offload 26 could not be observed. |
| Greeting Smoke | **Not Run by gate** | Runtime-control provenance stopped P4 before the first provider request. Provider rounds, tools, committed response, guidance absence, exhaustion, and intervention therefore have no official live result. |
| Three-File Inspection Smoke | **Not Run by gate** | Greeting was not reached. Fixture reads, completed explanation, promotion evidence, fixed source composition, exhaustion, and intervention therefore have no official live result. |
| Fresh Gate A Qualified | **Not Run by gate** | Both required smokes were not Green. No post-correction exact edit, V1, TaskState, hidden acceptance, call/round, intervention, or exhaustion result is inferred. |
| Gate B2 Greenfield Qualified | **Not Run by gate** | Fresh Gate A was not reached. No post-correction P1/P2/P3, validation, StackState, hidden acceptance, provider projection/promotion, intervention, or exhaustion result is inferred. The historical pre-correction B2 remains Not Green and immutable. |
| Gate C2 Existing-App Qualified | **Not Run by gate** | B2 was not reached. Baseline preservation, focused/broad validation, TaskState, hidden acceptance, intervention, and exhaustion remain unspent. |
| Evidence Auditability Qualified | **Green** | All four committed P4 JSON hashes match the ledger. P4 stopped before any smoke/gate attempt, so no reached attempt lacks an attempt/trace pair. The committed correction evidence contains no raw provider stream, assistant/file/write/patch bodies, internal unbounded Git snapshot/log, secret/environment dump, dependency tree, or workspace copy. |
| Historical Evidence Preserved | **Yes** | Prior correction/gate evidence and v1/v2 instruments are unchanged from the correction baseline. Executable immutability guards pass for v1/v2 task, fixture, metadata, format, and acceptance digests. |
| Overall c9-turn-context-convergence Qualified | **No — Evidence Gap** | The production correction is deterministically qualified, but ordinary/live context convergence is not qualified because both live smokes and all post-correction official gates were not run. |
| Phase 9 Ready For Owner Closeout | **No** | The owner-closeout rule requires greeting, three-file smoke, fresh Gate A, B2, and C2 all Green. None has a post-correction official result. |

## Production correction audit

### Provider-result projection

`ToolRegistry.projectProviderResult()` derives provider-visible continuation data from a structured clone, so projection cannot mutate canonical evidence. Built-in mutations register the one shared bounded receipt projector. Successful canonical writes and patches still carry `GitWorkingTreeSnapshot` for application events and downstream recovery/workflow consumers; the provider receipt contains only mutation convergence fields. Directory receipts remain useful and bounded, failures preserve bounded code/message, and tools without a projector preserve their prior result semantics.

The permanent one-turn regression creates a real Git workspace with 120 dirty files and proves the provider continuation excludes the canonical snapshot while canonical evidence remains intact. Registry and mutation tests separately cover determinism, clone isolation, unchanged executable authority, directory projection, and failure bounds.

### Continuation accounting and envelope promotion

The implemented formula is:

`chainAfterResponse = max(previousRequestEstimate, reportedInputTokens ?? 0) + (reportedOutputTokens ?? serializedResponseEstimate)`

`nextRequestEstimate = chainAfterResponse + serializedProjectedToolResultsEstimate + 32`

The `max` treats reported provider input as the stronger observation of the existing chain instead of adding it to the same local history. Only response output, newly projected results, and fixed protocol margin extend that chain. Missing usage follows the deterministic four-code-units-per-token fallback.

Initial adaptive source selection remains final before the first request. Promotion changes only the effective safety envelope through existing adjacent profiles. Tests prove ordinary -> medium -> large, stable source composition and provider request bodies, no reassembly, no demotion, no semantic compaction caused by ordinary/medium promotion, no provider/tool side effect from promotion, fixed-profile non-promotion, and >large fail-closed behavior.

### Ordinary TUI wiring

`createTuiApplicationService()` creates one base `AgentLoopApplicationService`, passes it to `StructuredTaskApplicationService`, and performs resumed-session recovery and persistence before use. The production composition regression proves a one-round direct ordinary response without coding-workflow guidance, the normal coding tool surface, structured Task Prompt behavior, fixed-profile forwarding, normal approval dispatch, cancellation before provider work, durable response persistence, and reconciliation of interrupted directory mutation. Explicit coding workflow construction still adds its guidance.

## Preflight and broad characterization

P4's controlled comparison materialized exact baseline `d7804684801fa8418050c34d9ef097ca1adf80b6` and candidate `25d51a93d229e9b8cc76f56eb4b7b9afae1a5723` without moving active HEAD. Both used Node `v26.10.0`, npm `11.19.1`, exact `npm test`, non-TTY execution, dependency identity `d01d095de8e27144ee1a0967e8f54b0aa3cc1ce5281b753138e1d9c708041c5c`, and equivalent read-only Git metadata.

The aggregate suite remains Not Green. The retained identities are streamed-answer rendering, inactive-task text rendering, progressive reveal timing, draft-preservation rendering, approval rendering timing, and the skipped native real-TTY case. Candidate timing variability can make a retained renderer identity pass in one run; it does not make the aggregate suite Green and is not a new regression.

## Live and official-gate audit

P4 reached the runtime provenance boundary and stopped correctly. `GET /api/v1/models` listed `qwen3-coder-30b-a3b-instruct@q4_k_m`, but `loaded_instances` was empty. Context length, eval batch, physical batch, parallelism, Flash Attention, GPU KV-cache offload, expert count, and UI-only GPU Offload 26 therefore remained unobserved. P4 made no warm-up or unofficial provider request to manufacture provenance.

Consequently no correction-era greeting, three-file smoke, Gate A, B2, or C2 attempt exists. The earlier `c9-qualification-preflight-scope` Gate A remains Green historical evidence, its B2 remains Not Green at P1 continuation exhaustion, and C2 remains unspent. Those earlier results do not qualify the post-correction gates.

## Evidence integrity

| JSON | SHA-256 |
| --- | --- |
| `evidence/broad-baseline.json` | `f6a2ebaeced5c9ba0f694049f9d219d5f4e8a7536befbd37ce09d9046914a8f4` |
| `evidence/broad-candidate.json` | `8e013c706b88199c7e5afb7d50c8b33c7461ba8f4645dc9225cb2a7e9976b321` |
| `evidence/broad-delta.json` | `6ae0b600619afa29fd962948e3fa99f0f2767e354072a4dad3bfac8385612a86` |
| `evidence/runtime.json` | `b1003428f26e84f3fef29501d7345cc0457ef43647a7c36e152565c4ef02c943` |

Current immutable instrument authorities remain:

- greenfield v1 task stack `c0ea964cc58423ff4646e93135a5e6766bd58dc6379f284219e3856745919063`;
- greenfield v2 task stack `a8497efe8f26862c782bb8fb9a12201993df6175a30a5bf68a5149dc832c7618`;
- existing-app v1/v2 fixture source `45856b10bfe4ff3f14e1893da22b9a88b1c3334d3923d2417aee0c09e94a5aba`;
- existing-app v2 task stack `66f262fd8f73171cdf5fc023d2be3a5032569fee9ebd8041241abcaf1c0eb0e9`;
- greenfield acceptance `052b109605e2eaec752477374f98a9d9c87f6b4e02bf4232d92dc79ce883c849`;
- existing-app acceptance `183c74474b02166e2ec2fce21019eef2e2c1e20faa91b32d847e6f56e4608d21`.

## P5 validation and scope

All P5 commands below used Node `v26.10.0` and npm `11.19.1`.

| Check | Result |
| --- | --- |
| Current provider/tool/context/one-turn/coding/TUI/qualification/Phase 9 affected floor | **Green: 203/203 passed** |
| Phase 9 integration and v1/v2 immutability | **Green**, included in the affected floor |
| `npm run typecheck` | **Green** |
| `npm run test:runner` | **Green: 90/90 passed** |
| Current broad `npm test` | **Not Green: 400 passed, 5 failed, 1 skipped; 406 total**; exact retained identities only |
| Package version | **Green: exactly `0.9.10`** |
| Root `package-lock.json` | **Green: absent** |
| `git diff --check` | **Green** |
| P5 scope | **Green:** only this closeout document was added; no production, test, fixture, instrument, acceptance, or historical-evidence repair was made |

Phase 9 remains open. Phase 10 remains unopened.
