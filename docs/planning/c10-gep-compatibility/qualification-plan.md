# Correction 10 Qualification Plan — GEP Compatibility

Status: **APPROVED QUALIFICATION DIRECTION**

Date: 2026-09-27

Correction: `c10-gep-compatibility`

Package remains exactly `0.10.12`.

Authority:
- `docs/planning/c10-gep-compatibility/decision-record.md`;
- `docs/tasks/c10-generation-bottleneck/{qualification-report,closeout}.md`;
- Phase 5 reliability/context-compaction authority;
- frozen Phase 8 structured replay authority;
- Phase 9 structured-task authority;
- Phase 10 Operation/GEP/benchmark authority.

## P1 — bounded dual projection and legacy fallback

Permanent coverage must prove:

1. eligible small Operation `read_file` result preserves inherited `text`, `bytes`, `truncated=false`, `sha256`, and `textFraming`;
2. the same result adds one GEP receipt/numbered-line view;
3. receipt snapshot/SHA/framing remains one run-local source of truth, not duplicated durable canonical state;
4. serialized dual projection is <= 16 KiB;
5. a complete read whose dual projection would exceed 16 KiB returns unchanged legacy provider evidence and no provider-usable GEP receipt;
6. truncated/binary/mixed/unsupported reads retain unchanged legacy evidence;
7. frozen Phase 8 SHA/framing legacy fallback works unchanged;
8. framing-denial -> reread -> legacy patch recovery works unchanged;
9. GEP stale/current-SHA behavior remains Green;
10. legacy `write_file` / `apply_patch` remain advertised and executable under inherited authority;
11. no duplicated raw source is added to durable events/diagnostics merely for GEP;
12. previous destructive-projection tests are replaced by additive/bounded coexistence tests.

### Efficiency

Use one deterministic representative existing-file fixture.

Record:
- legacy read provider bytes;
- dual GEP read provider bytes;
- legacy mutation argument bytes;
- GEP packet bytes;
- Mutation Transmission Ratio;
- Net Edit Transport Ratio.

Acceptance:
- Mutation Transmission Ratio <= 0.70;
- Net Edit Transport Ratio < 1.0;
- byte-identical final output.

## P2 — Phase 5 budget causal isolation and bounded repair

### Historical matrix

Run exactly the failing Phase 5 long-workflow test under supported Node 26 in clean detached/isolated worktrees for the required commit set.

Do not modify those historical trees.

Record pass/fail and exact terminal state for each.

Find the first bad boundary.

### Current failure instrumentation

On the current candidate, record:
- `budget.exhausted.dimension`;
- latest budget snapshot;
- context profile/mode;
- context.assembled diagnostics;
- compaction events/checkpoints;
- continuation estimates;
- provider usage;
- provider/tool/process/retry counts.

Do not rely only on `completion.terminalState`.

### Repair rules

If causal evidence identifies a current production regression:
- repair only that producer/consumer;
- add a permanent regression with the historical small fixed profile;
- preserve finite safety ceilings.

If causal evidence proves the test expectation is stale/superseded:
- document the authoritative change;
- update the test only if current contracts truly require different behavior;
- do not weaken reliability merely for Green.

Explicitly forbidden without independent evidence:
- increasing `DEFAULT_RUN_BUDGET`;
- changing the fixture's 2,200-token provider-input budget;
- increasing context profiles;
- suppressing budget classification;
- removing compaction assertions.

P2 must leave the exact Phase 5 workflow Green on current Node 26 before P3.

## P3 — integrated deterministic + real-model qualification

### Common validity

Require:
- Node >=26.4.0 <27;
- package 0.10.12;
- exact candidate;
- reachable LM Studio;
- loaded recorded Qwen model;
- known clean/controlled workspace.

### Deterministic floor

Run focused:
- GEP receipts/projection/parser/expansion;
- frozen Phase 8 structured replay/framing recovery;
- Phase 5 long workflow;
- terminal TaskState/session;
- provider timeout/retry/rebase;
- mutation SHA/framing/permission/recovery;
- structured task/correction/freshness;
- affected batching/read-concurrency;
- Phase 5 and Phase 9 integration.

Then:
- `npm run typecheck`;
- `npm run test:runner`;
- `npm test` exactly once;
- `git diff --check`.

All required correction/current affected-system gates must be Green before live spending.

Preserve Phase 10 P7 historical/intermittent failure as historical evidence even when its current assertion passes.

### Real-model workload

Use a disposable fixture, not the owner's Express workspace and not B2/C2.

Exercise:
- multiple reads;
- one GEP-eligible existing-file edit;
- one new text file;
- literal validation;
- session persistence/reopen.

Run exactly once.

Record:
- provider attempts/rounds/retries/rebases;
- input tokens;
- cached input tokens;
- output tokens;
- response acceptance / first useful output / provider-active / total elapsed;
- dual read bytes;
- legacy read-equivalent bytes;
- GEP packet bytes;
- legacy mutation-equivalent bytes;
- Mutation Transmission Ratio;
- Net Edit Transport Ratio;
- validation result;
- final TaskState;
- durable reopen;
- human intervention.

Do not require a live >120s generation if GEP makes the task faster. Preserve P2 deterministic timeout evidence from the parent correction.

## P4 — closeout

Create:
`docs/tasks/c10-gep-compatibility/closeout.md`

Decision table:
- GEP Legacy Read Contract Preserved;
- Bounded Dual Projection Qualified;
- Oversized Dual Projection Safe Fallback;
- Frozen Phase 8 Replay Green;
- Framing Denial/Reread/Patch Recovery Green;
- Mutation Transmission Ratio;
- Net Edit Transport Ratio;
- GEP Receipt Freshness Preserved;
- Canonical SHA/Framing Mutation Authority Preserved;
- Phase 5 First Bad Boundary Identified;
- Phase 5 Exhausted Dimension Identified;
- Phase 5 Fixed-Profile Workflow Green;
- Terminal TaskState Fix Preserved;
- Generation-Aware Timeout Fix Preserved;
- Broad Suite;
- Node 26 + Real LM Studio/Qwen Live Qualification;
- Phase 10 P7 Historical/Intermittent Evidence Preserved;
- Remaining Blocking Failure Count;
- Nonblocking Evidence Gaps;
- Overall `c10-gep-compatibility` Qualified;
- Phase 10 Closeout Ready To Reassess.

P4 is evidence-only.

Do not owner-close Phase 10 or open Phase 11.
