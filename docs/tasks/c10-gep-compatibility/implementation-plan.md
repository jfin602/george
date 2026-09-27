# c10-gep-compatibility Implementation Plan

Status: READY FOR PROMPT EXECUTION

Correction: `c10-gep-compatibility`  
Package remains `0.10.12`.

## P1 — bounded additive GEP projection

Change `GeorgeEditReceiptRegistry.project()` semantics.

For an eligible small read:
- preserve the inherited provider result fields;
- add one nested/bounded GEP receipt + numbered-line projection;
- keep one run-local canonical receipt snapshot.

Add a centralized 16 KiB maximum serialized dual-projection size.

If dual projection exceeds the bound:
- return the unchanged legacy provider result;
- do not expose a usable GEP receipt.

Update GEP tests that currently assert SHA absence.

Re-run frozen Phase 8 fallback/recovery tests.

Add deterministic whole-exchange byte accounting:
- legacy read + legacy mutation;
- dual GEP read + GEP packet.

Keep Mutation Transmission Ratio <= 0.70 and require Net Edit Transport Ratio < 1.0.

## P2 — Phase 5 causal isolation

Use clean detached worktrees and Node 26.

Required historical points:
- pre-c10 `a9c5175...`;
- c10 P1 `73885cfc...`;
- c10 P2 `99e5267c...`;
- c10 P3 `38409136...`.

Run only the exact failing Phase 5 integration test first.

Continue backward only if needed.

On current HEAD, instrument/inspect exact budget exhaustion and context/continuation/compaction evidence.

After the first bad boundary is known:
- implement the smallest causal repair if current behavior is defective;
- or update a stale test expectation only if newer authoritative contracts prove the old expectation invalid.

Do not increase general budgets or context envelopes.

## P3 — qualification

Create:
- `docs/tasks/c10-gep-compatibility/qualification-report.md`;
- bounded evidence under `docs/tasks/c10-gep-compatibility/evidence/`.

Run deterministic affected floors, broad suite once, then one disposable Node 26 + LM Studio/Qwen workload if and only if deterministic gates are Green.

No B2/C2.

Measure both mutation-only and net edit transport ratios plus actual input/cached/output tokens.

## P4 — closeout

Create:
- `docs/tasks/c10-gep-compatibility/closeout.md`.

Evidence-only.

If Green, state whether Phase 10 formal closeout is ready to be reassessed.

Do not owner-close Phase 10.

## Regression priorities

Protect:
- legacy read provider contract;
- GEP receipt freshness;
- GEP compact mutation;
- projection byte bound;
- frozen framing recovery;
- Phase 5 small fixed-context workflow;
- terminal TaskState;
- generation-aware timeout;
- response-completion-before-effect;
- SHA/framing/permission/recovery;
- historical evidence.
