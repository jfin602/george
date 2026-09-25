# c9 Qwen work-unit convergence correction closeout

Status: **MUTATION CONTRACT QUALIFIED; LIVE TRACE AND QWEN CONVERGENCE NOT QUALIFIED; OVERALL CORRECTION NOT QUALIFIED**

Date: 2026-09-25

Package: `0.9.10` (unchanged)

Pre-task HEAD and exact P3 candidate inspected: `46c4d0f7d778f7174df10976699a49bc5831d328`

P1 mutation candidate: `317141f38f0c30f6dec4c51bd71af3a316c1d5c5`

P2 live-trace candidate: `15d8549aac7810bae3e93a0e902809e14754c808`

Live evidence: [`P3-live-evidence.md`](P3-live-evidence.md)

This is an evidence-only correction closeout. It does not repair implementation, rerun a live workload, change convergence/context/runtime settings, rewrite earlier failures, owner-close Phase 9, or open Phase 10.

## Decision

| Decision | Result | Basis |
| --- | --- | --- |
| Implementation Complete | **No** | The mutation implementation is complete, and the typed trace/report path is deterministically implemented. However, the official P3 service exception escaped `runLiveWorkInstrument()` before it returned a result, so the runner could not persist the already-collected bounded event envelope. The correction's required failure-resilient official-attempt capture is therefore incomplete at the thrown-service boundary. |
| Mutation Contract Qualified | **Yes** | Exact current source and focused regressions establish full-file `read_file.sha256`, same-open-file text/hash semantics, provider-visible precondition guidance, structured inspection propagation, stale-hash rejection, and a dynamic read-result-to-mutation replay. |
| Live Trace Qualified | **No** | Typed extraction, missing-field resilience, safe projections, and report-failure ordering are deterministic Green, but the one official P3 attempt produced no `attempt.json` or `trace.json` after the structured service threw. The live path is not qualified end to end. |
| Qwen Work-Unit Convergence Qualified | **No** | Gate A was Not Green: INSPECT produced no accepted read-only evidence; implementation and mutation were not reached; the exact edit was absent; George-owned V1 did not pass; and no completed/verified TaskState was returned. Locked call/round and no-exhaustion criteria were not established. |
| Overall c9-qwen-workunit-convergence Qualified | **No** | Gate A is mandatory and cannot be waived. The incomplete thrown-service trace boundary also prevents overall implementation/trace qualification. |

## Mutation contract audit

The prior contract was internally unusable for safe existing-file edits: `write_file` overwrite and `apply_patch` required a current SHA-256 precondition, while `read_file` exposed bounded text but no hash. Qwen therefore had no supported way to obtain the required mutation precondition.

P1 closes that deterministic contract:

- `read_file` now returns a lowercase 64-character SHA-256 of the complete file, including when returned text is truncated;
- bounded text and the full-file hash are read sequentially from the same open file handle, preventing a path reopen between the returned text and hash;
- `write_file` and `apply_patch` descriptions and `expectedSha256` schema descriptions tell the provider to use the latest observed `read_file.sha256` for an existing target;
- structured inspection accepts only a valid `read_file` hash and includes it in the bounded implementation-stage inspection projection;
- mutation execution still reads current bytes and rejects a missing, malformed, or stale precondition before replacement;
- the frozen Phase 8 deterministic replay obtains the hash from the actual preceding `read_file` continuation result, uses that value for `write_file.expectedSha256`, makes the exact edit, and passes George-owned V1. The provider does not hard-code the hash it submits.

The focused read-only and mutation tests additionally cover full-file hashing under truncated reads, provider-visible guidance, dynamic overwrite/patch preconditions, and stale-precondition rejection. No permission, effect, workspace-containment, convergence-limit, or context-profile behavior changed.

## Live trace audit

The prior c9 Gate A production service returned, but its ad hoc postprocessor read a nonexistent context profile shape and failed with:

    TypeError: Cannot read properties of undefined (reading 'id')

P2 adds a repository-owned typed `LiveWorkTrace` over the current `ApplicationEvent` union. Deterministic evidence establishes:

- `context.assembled` is read through `event.diagnostics`, including `profileId`, attempted profiles, promotion reasons, estimated tokens, provider-input budget, and remaining headroom;
- absent optional usage, timing, context, or terminal fields become `null`, empty, or `unavailable` evidence rather than throwing;
- ordered tool requests are paired by call ID with succeeded, failed, denied, or unavailable terminal state and bounded/redacted requested arguments;
- successful mutation path, resulting SHA-256, validation outcomes, provider attempts/rounds/retries/tokens, context assemblies, TaskState/StackState safe projections, correction count, budget snapshots/pressure/exhaustion, workflow/total timing, hidden acceptance, human interventions, and omitted-event count are represented;
- unrelated future bounded events do not break extraction;
- `writeLiveWorkArtifacts()` atomically writes `attempt.json` and `trace.json` before optional report rendering, and the executable regression proves both remain when report rendering throws the previous `reading 'id'` error class.

That implementation does not yet make the official attempt envelope durable when the production structured service itself throws. `runLiveWorkInstrument()` buffers events in memory, awaits the service, and constructs its result only afterward. In P3, `StructuredTaskApplicationService.run()` threw `GeorgeError: Structured INSPECT preflight produced no read-only evidence.` The exception escaped before a `LiveWorkResult` existed, so artifact writing never ran. Deterministic extraction/report behavior is Green, but the required failure-resilient live boundary is **Not Qualified**.

## Live qualification

### Gate A — exact frozen edit and validation

Exactly one official P3 attempt ran against P2 candidate `15d8549aac7810bae3e93a0e902809e14754c808` on Node `v26.10.0`, npm `11.19.1`, and pinned `qwen3-coder-30b-a3b-instruct@q4_k_m`. No rerun or human coding intervention occurred.

| Locked criterion | Result | Evidence |
| --- | --- | --- |
| Target `read_file.sha256` reaches implementation | **Not Green** | Structured INSPECT produced no accepted read-only evidence; implementation was not reached. |
| Mutation `expectedSha256` provenance | **Not Green / not reached** | No mutation was reached. Requested mutation arguments are an Evidence Gap because no trace envelope persisted. |
| Exact edit | **Not Green** | Recovered `src/label.js` remained `export const label = (value) => value.trim();`. |
| George-owned V1 | **Not Green** | V1 did not run. A direct recovery-time test failed with `george` rather than `GEORGE`; it is supporting evidence, not a substitute for George-owned validation. |
| Completed/verified TaskState | **Not Green** | No final TaskState projection was returned or persisted. |
| Zero human coding intervention | **Green** | Harness-supplied count was `0`. |
| No budget exhaustion | **Evidence Gap** | The observed exception was validation-class, but no budget trace persisted; absence of recorded exhaustion is not proof of this criterion. |
| Model-requested tool calls `<=10` | **Evidence Gap** | No official trace persisted. |
| Logical provider rounds `<=10` | **Evidence Gap** | No official trace persisted. |
| Provider attempts/retries/tokens/context/timing | **Evidence Gap** | No official trace persisted. |

Gate A is **Not Green** and is not waived.

### Gate B — greenfield production stack

**Not run by gate.** Gate A did not permit `greenfield-express-v1`, dependency/network authorization, production StackState, or hidden acceptance to be spent.

### Gate C — existing app

**Not run by gate.** Gate B was not reached, so `existing-express-feature-v1` and hidden acceptance were not spent.

## Longitudinal evidence

| Attempt | Result | Calls | Rounds | Input / output tokens | Elapsed |
| --- | --- | ---: | ---: | ---: | ---: |
| Preserved Phase 8 | Not Green | 10 | 7 | 20,765 / 406 | 45.826 s |
| First Phase 9 | Not Green | 25 | 20 | 63,253 / 1,801 | 344.745 s |
| First c9 Gate A | Not Green | Evidence Gap | Evidence Gap | Evidence Gap | Evidence Gap |
| Current P3 Gate A | **Not Green** | Evidence Gap | Evidence Gap | Evidence Gap | Evidence Gap |

No numerical improvement or convergence delta is claimed for either c9 live attempt.

## Inherited boundaries

| Boundary | Closeout truth |
| --- | --- |
| c9 production task-stack execution | **Qualified, deterministic, inherited.** Full-stack validation, ordering, fail-stop, durable TaskState history, reopen/no-replay resume, projection, runner delegation, and hidden-acceptance isolation remain Green. No new Gate B live claim is made. |
| Bubblewrap containment | **Green, inherited.** The real Phase 9 containment qualification remains unchanged; this correction did not rerun or alter it. |
| Native OpenTUI | **Evidence Gap, unchanged.** No supported Node-26 real-TTY qualification was added. |
| Context/runtime policy | **Unchanged.** Ordinary/medium/large profiles remain provisional inherited policy; no context, convergence, retry, provider, or runtime setting was retuned. GPU Offload 26 remained UI-only and unconfirmed during P3, so controlled latency remains an Evidence Gap. |
| Historical Phase 8/Phase 9/c9 failures | **Unchanged.** None is rewritten or upgraded by deterministic P1/P2 success. |

## Closeout validation and hygiene

Observed against the exact P3 candidate before this documentation change:

| Check | Result |
| --- | --- |
| Focused P1/P2, frozen replay, c9 convergence/stack, task/state/session/recovery/workflow/agent-loop, and Phase 5 regression floor | **Green: 107/107 passed.** |
| `node --test test/integration/phase9-qualification.test.ts` | **Green: 3/3 passed.** Combined affected floor: 110/110. |
| `npm run typecheck` | **Green.** |
| `npm run test:runner` | **Green: 90/90 passed.** |
| `npm test` on the available closeout host | **Not runnable:** Node `v24.21.0` rejects the required `--experimental-ffi` flag. |
| Flagless broad characterization | **Not Green: 336/365 passed, 28 failed, 1 skipped.** The failures are the inherited OpenTUI native-FFI-dependent renderer/integrated cases on Node 24; they do not establish native TUI behavior. |
| Package version | **Green: exactly `0.9.10`.** |
| Root `package-lock.json` | **Green: absent.** |
| `git diff --check` | **Green.** |

The implementation result is this single uncommitted closeout document on unchanged HEAD `46c4d0f7d778f7174df10976699a49bc5831d328`. Owner acceptance and Phase 9 owner closeout remain separate actions.
