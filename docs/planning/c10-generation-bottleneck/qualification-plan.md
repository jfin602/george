# Correction 10 Qualification Plan — Generation Bottleneck

Status: **APPROVED QUALIFICATION DIRECTION**

Date: 2026-09-27

Correction: `c10-generation-bottleneck`

Package remains exactly `0.10.12`.

Authority:
- `docs/planning/c10-generation-bottleneck/decision-record.md`;
- `docs/phase-10-closeout.md`;
- Phase 5 reliability/session authority;
- Phase 9 TaskState/StackState authority;
- Phase 10 provider, Operation protocol, batching/concurrency, focused correction, and benchmark authority;
- owner-supplied Express/LM Studio diagnostic evidence summarized in the correction decision record.

## Gate 0 — preserve evidence

Do not rewrite:
- Phase 8/9/10 historical qualification;
- Phase 10 optimization ledger;
- Phase 10 formal Not Green closeout;
- post-closeout Transcript/Task repair evidence;
- owner Express workspace/result as if it were a frozen repository qualification instrument.

The owner Express run is diagnostic evidence that motivates this correction.

## P1 — terminal TaskState integrity

Repair terminalization before changing provider/mutation behavior.

Permanent deterministic coverage must prove:

1. terminal provider failure while W1 is active => W1 `blocked`, no `currentWorkUnit`, terminal status/outcome match;
2. cancellation during an active work unit yields the same structural invariant;
3. budget exhaustion during an active work unit yields the same structural invariant;
4. permission/planning-needed terminalization during an active work unit is durable;
5. terminalization with no active work unit does not rewrite already addressed/pending work unnecessarily;
6. nested StackState remains internally consistent after child-task terminalization;
7. LocalSessionStore save/reopen succeeds for every terminal case;
8. strict durable validation still rejects manually constructed impossible states;
9. blocker/correction/validation history is preserved.

Do not weaken the session validator.

## P2 — generation-aware provider deadline

Centralize/validate the new absolute provider timeout policy:
- default 300000 ms;
- maximum 600000 ms.

Permanent fake-time/scripted-provider coverage must prove:

1. accepted prefill remains governed by first-useful-output policy;
2. useful output beginning before first-evidence expiry activates output-progress semantics;
3. useful output continuing regularly past 120000 ms is not aborted merely because 120 seconds elapsed;
4. active-output silence for the existing inactivity threshold still aborts;
5. productive output may complete successfully between 120000 and 300000 ms;
6. productive output reaching 300000 ms is still terminated by finite emergency ceiling;
7. explicit configured timeout remains bounded by 600000 ms;
8. caller cancellation wins;
9. replay-safe retry/rebase semantics remain unchanged;
10. incomplete branch mutation/tool/control proposals remain unexecuted;
11. adapter timeout/cancellation tests remain deterministic without real minute-scale sleeps.

Qualification must distinguish:
- inactivity termination;
- emergency absolute timeout;
- caller cancellation.

Do not solve timeout by disabling finite bounds.

## P3 — George Edit Protocol v1

### Receipt contract

Prove:
- complete eligible UTF-8 Operation-mode reads can receive short ephemeral receipts;
- receipt map stores exact path/SHA/snapshot/framing/freshness only in bounded run-local application state;
- provider-facing read evidence has deterministic line addressing;
- truncated/binary/mixed/unsupported snapshots do not gain unsafe GEP eligibility;
- stale receipt cannot mutate;
- reread produces a fresh receipt/current SHA;
- restart/recovery cannot trust an old in-memory receipt without fresh evidence.

### Packet parser

Use deterministic unit/fuzz-style cases for:
- one replacement;
- multiple non-overlapping replacements;
- multiple files;
- new file creation;
- empty replacement/deletion where allowed;
- delimiter/sentinel content;
- malformed headers;
- unknown version;
- unknown/stale receipt;
- out-of-range lines;
- overlapping ranges;
- duplicated target;
- oversized packet/content/edit count;
- NUL/invalid UTF-8;
- unsupported framing.

Concrete framing must be robust against arbitrary source content. If a George-supplied unique delimiter is used, collision/ambiguity must fail closed.

### Canonical expansion

Prove every accepted GEP mutation expands into the existing mutation authority with:
- exact current-content SHA precondition;
- exact old content derived from receipt snapshot rather than model echo;
- preserved framing;
- workspace containment;
- normal effect classification;
- normal approval policy;
- recovery intent/evidence;
- Git/direct-mutation evidence;
- mutation epoch/freshness invalidation.

Response completion remains required before expansion/execution.

### Protocol coexistence

Prove:
- Human mode remains conversational;
- Operation read/control tools remain available;
- GEP mutation text is accepted only in the intended Operation context;
- ordinary narration cannot be parsed as a mutation;
- GEP + conflicting executable tool/control output fails closed or follows one explicitly documented unambiguous rule;
- legacy `write_file` / `apply_patch` continue to work for compatibility/fallback;
- provider adapters remain GEP-unaware beyond ordinary text/function transport.

### Transmission efficiency

Create a deterministic representative existing-file edit fixture.

Measure:
- provider-facing GEP packet bytes;
- equivalent legacy expanded mutation bytes including path/SHA/old/new edit material;
- Mutation Transmission Ratio.

Required:
- ratio <= 0.70;
- resulting file bytes are identical to canonical expected output;
- no safety/permission/framing contract is weakened.

## P4 — integrated deterministic + real-model qualification

### Supported environment

Require:
- Node >=26.4.0 <27;
- exact package `0.10.12`;
- pinned/default or explicitly recorded Qwen model;
- reachable LM Studio;
- exact Git candidate;
- clean/known repository state.

If Node/provider common validity is unavailable, live evidence is an Evidence Gap/Not Green for correction closeout. Do not substitute mock live evidence.

### Deterministic floors

Run focused:
- TaskState/StackState/session durability;
- provider timeout/liveness/retry/rebase;
- Operation protocol;
- mutation tools/framing/SHA/recovery;
- GEP receipts/parser/expansion;
- structured task/correction/freshness;
- batching/read concurrency where touched;
- Phase 5 and Phase 9 integration;
- `npm run typecheck`;
- `npm run test:runner`;
- `npm test` exactly once;
- `git diff --check`.

Preserve any inherited P7 intermittent failure as historical/current evidence; do not silently rewrite its assertion in this correction unless this correction directly caused a new defect.

### Live generation workload

Use a disposable local fixture, not the owner's current Express workspace.

The workload must include:
- multiple reads;
- at least one new text file;
- at least one substantial existing-file edit eligible for GEP;
- validation;
- session persistence/reopen.

The existing-file edit should be large enough that legacy oldText/newText mutation transmission would be meaningfully more expensive, but small enough to stay a bounded developer-agent workload.

Record:
- prompt/input tokens;
- cached input tokens where available;
- output tokens;
- provider attempts/rounds;
- response acceptance / first useful output;
- provider-active and total elapsed;
- longest completed attempt;
- whether any active generation crossed 120000 ms;
- whether a 120000 ms crossing continued successfully;
- GEP packet bytes;
- expanded canonical mutation bytes;
- Mutation Transmission Ratio;
- retries/rebases;
- validations;
- final TaskState;
- LocalSessionStore reopen;
- human intervention.

Do not repeatedly rerun to fish for Green.

### Correction acceptance

Correction-specific Green requires:
- terminal task states are always persistable;
- 120000 ms is no longer the unconditional healthy-generation death point;
- first-evidence/inactivity/cancellation/retry safety is preserved;
- GEP expansion is byte-correct and uses inherited mutation authority;
- deterministic Mutation Transmission Ratio <= 0.70 on the representative existing-file fixture;
- live supported provider task demonstrates the corrected path without a correction-local safety regression;
- broad affected-system validation has no new blocking regression.

## P5 — closeout

Create `docs/tasks/c10-generation-bottleneck/closeout.md`.

Decision table:
- Terminal TaskState Integrity Qualified;
- Active Work Unit Terminalization Qualified;
- StackState Child Terminalization Qualified;
- Durable Session Round Trip Green;
- Default Provider Emergency Ceiling 300s;
- Maximum Configurable Provider Ceiling 600s;
- Healthy Active Generation Beyond 120s Qualified;
- First-Useful-Output Guard Preserved;
- Active-Inactivity Guard Preserved;
- Caller Cancellation Preserved;
- Finite Retry/Rebase Safety Preserved;
- George Edit Protocol v1 Qualified;
- Ephemeral Read Receipt Freshness Qualified;
- GEP Parser/Framing Qualified;
- SHA Preconditions Preserved;
- Text Framing Preserved;
- ToolRegistry/Permission Boundary Preserved;
- Response Completion Before Mutation Preserved;
- Legacy Mutation Compatibility Preserved;
- Mutation Transmission Ratio;
- Node 26 + Real LM Studio/Qwen Live Qualification;
- Phase 5/9 Reliability Floors;
- Broad Suite;
- Phase 10 P7 Historical/Intermittent Evidence Preserved;
- Remaining Blocking Failure Count;
- Nonblocking Evidence Gaps;
- Overall `c10-generation-bottleneck` Qualified;
- Phase 10 Closeout Ready To Reassess.

Closeout is evidence-only.

Do not owner-close Phase 10 or open Phase 11.
