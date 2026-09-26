# c9 live sweep P1 infrastructure evidence

Status: **IMPLEMENTED; QUALIFICATION INFRASTRUCTURE GREEN**

Date: 2026-09-26

Pre-task HEAD: `c7e531cfb5918aca66789d890bd0dd3f71897908`

Package: `0.9.10` (unchanged)

P1 changed qualification infrastructure and permanent tests only. It did not run an official live workload, repair the three-file agent/provider failure, change a frozen fixture or acceptance instrument, retune runtime/profile policy, repair OpenTUI, owner-close Phase 9, or open Phase 10.

## Artifact schema decision

The durable live-work attempt and trace now use artifact schema version 2 because both add normalized failure evidence. Artifact schema versioning remains independent of live-work task instrument versions; greenfield and existing-app instruments remain v1/v2.

Historical schema-1 artifacts are untouched and retain their original event-category-only semantics. `recognizeLiveWorkArtifactSchema` recognizes schema 1 without fabricating schema-2 diagnostics. The permanent test pins the historical three-file attempt SHA-256 at `eb536899b5b4cac658692b440673b78697aa896d30b2d5270355016b77d88bec`.

Schema-2 attempt and trace artifacts retain a bounded `failures` array derived from authoritative application events plus separate harness/observer errors. Each entry can retain:

- source and finite category;
- event type;
- bounded/redacted code and message;
- bounded provider code/reason and normalized HTTP status when already exposed by George;
- turn, provider-attempt, call, tool, or validation identity.

The writer remains deterministic for identical input. It excludes provider causes other than the explicit normalized fields, provider wire/raw bodies, assistant prose, write/patch bodies, common credential forms, and unrestricted event JSON.

## Sweep semantics

`runQualificationSweep` is qualification-only and provider/tool/presentation independent. It validates unique ordered workload IDs and backward-only prerequisite references before spending any callback.

- Common Not Green or Evidence Gap validity aborts every workload as `Not Run` / `not-run`.
- A functional Not Green or Evidence Gap observation is recorded and later isolated workloads still execute exactly once.
- A workload is `qualifying` only when every declared prerequisite is both observed Green and qualifying; otherwise it is `diagnostic-only`.
- A callback throw becomes bounded harness Evidence Gap evidence and does not suppress independent later workloads.
- A result-writer failure changes common state to Evidence Gap and aborts later callbacks so evidence is not silently lost.
- Duplicate workload IDs fail before any callback, enforcing one attempt per workload per sweep.

Permanent matrices cover all Green; three-file Not Green; Gate A Not Green; B2 Not Green; common runtime invalidity; evidence-writer failure; and duplicate-spend rejection.

## Failure-ledger contract

`normalizeFailureLedger` emits a deterministic JSON-compatible schema-1 ledger sorted by stable identity. It retains individual Not Green/Evidence Gap entries across deterministic, broad, and live layers, including:

- observed and qualification states;
- finite failure class, classification, and repair cluster;
- bounded/redacted code and message;
- tool and validation identity;
- provider attempts, rounds, input/output usage, and tool count;
- selected profile and bounded promotion history;
- bounded TaskState/StackState terminal projection;
- hidden acceptance, intervention, and exhaustion state;
- bounded evidence paths with SHA-256 digests.

Duplicate identities, invalid finite values, invalid counts/digests, oversized identities/references, excessive entries/references/promotions, and malformed state are rejected. Unknown raw fields are omitted; diagnostic text is redacted and truncated.

Repair clusters are exactly:

- `agent-provider-context`;
- `ui-test-stability`;
- `environment-only`;
- `unresolved`.

## Changed files and permanent tests

- `src/qualification/live-work.ts` — schema-2 failure normalization, authoritative event derivation, safe artifact evidence, schema recognition, and durable harness acceptance failures.
- `src/qualification/sweep.ts` — full-sweep orchestration/classification and bounded failure-ledger normalization.
- `src/qualification/index.ts` — qualification export.
- `test/unit/qualification/live-work.test.ts` — provider/turn/cancellation/tool/validation/harness/observer durability, unsafe-data exclusion, schema-1 hash/recognition, and deterministic schema-2 output.
- `test/unit/qualification/sweep.test.ts` — sweep matrices, common aborts, one-attempt invariant, multiple ledger failures, classifications, state/metrics/evidence retention, duplicate rejection, and unsafe/oversized data handling.
- `docs/tasks/c9-live-sweep/P1-sweep-infrastructure-evidence.md` — this evidence.

No production agent, provider, context, tool, task, TUI, or process behavior changed.

## Validation

All supported-runtime commands used Node `v26.10.0` and npm `11.19.1`.

| Check | Result |
| --- | --- |
| Qualification + provider/error/event + session/progress/diagnostic + structured-task + Phase 4/5/9 affected floor | **Green: 167/167 passed** |
| `npm run typecheck` | **Green** |
| `npm run test:runner` | **Green: 90/90 passed** |
| Complete `npm test` characterization | **Not Green: 409 passed, 4 failed, 1 skipped; 414 total** |
| Package | **Green:** exactly `0.9.10` |
| Root `package-lock.json` | **Green:** absent |
| Historical three-file attempt/trace | **Green:** unchanged SHA-256 `eb5368...` / `edaf91...` |
| Frozen fixture, v1/v2 instruments, hidden acceptance, prior evidence/closeouts | **Green:** no diff |
| `git diff --check` | **Green** |

The final supported-runtime broad characterization retained four OpenTUI renderer identities (streamed-answer visibility, inactive-task text rendering, progressive final-answer reveal, and draft preservation), observed the native real-TTY skip, and passed the previously retained approval-rendering identity. An earlier current-task broad characterization was **408 passed, 5 failed, 1 skipped** because the GitHub comment-timeout assertion also failed; that file immediately passed **5/5** in one isolated diagnostic run and passed in the final broad run. Aggregate broad remains Not Green, and the changed GitHub identity is preserved as an intermittent characterization observation rather than erased by later passes. P1 does not repair or relabel broad UI/test-stability failures.

## P1 result

- Failure Evidence Diagnostics: **Green**.
- Full-Sweep Orchestration: **Green**.
- Failure Ledger: **Green**.
- Historical Evidence Preservation: **Green**.
- Official live workloads: **Not Run by scope**.

The three-file production failure remains intentionally unrepaired for the diagnostic sweep.
