# Phase 12 — Local Daemon + Observability Foundation — Qualification Plan

Status: APPROVED DIRECTION

## Qualification objective

Prove the daemon makes George more observable without creating a second execution authority or weakening local-first safety.

## Gate A — deterministic API/state projection

Prove:
- canonical session/task/application state can produce stable bounded client snapshots;
- event stream entries retain stable correlation IDs and deterministic ordering/sequence semantics;
- snapshot + stream reconciliation cannot duplicate or omit canonical terminal transitions;
- presentation-only state is absent from canonical execution state;
- schemas are versioned and invalid/unknown versions fail explicitly.

## Gate B — attach/reconnect/restart

Exercise:
- attach before run;
- attach mid-run;
- disconnect/reconnect during provider generation;
- disconnect/reconnect during tool execution;
- disconnect/reconnect while approval is pending;
- daemon restart after completed work;
- daemon/process interruption with ambiguous in-flight work.

Expected:
- no duplicated provider/tool work;
- no fabricated completion;
- no silent approval;
- interruption/recovery remains consistent with existing contracts.

## Gate C — observability accuracy

For fixtures producing each class, compare client projection against canonical events/diagnostics:
- context assembly/profile/promotion/compaction;
- provider timing/usage/retry/stall/rebase/error;
- run budgets;
- tools/approvals/processes;
- validation/correction/revalidation;
- model-round avoidance;
- concurrency;
- GEP;
- workflow completion.

The client-facing projection must not contradict canonical evidence.

## Gate D — provider-facing request projection

Prove:
- section ordering/provenance matches the actual normalized provider request assembly;
- category sizes/tokens are truthful within the estimator/reporting contract;
- only provider-visible content is eligible for text inspection;
- credentials/secrets and internal-only evidence are excluded;
- raw mutation/process bodies remain bounded/redacted;
- no hidden reasoning/provisional Operation narration is captured.

## Gate E — trust/security

Prove:
- localhost binding by default;
- client authentication;
- repository/model/task content cannot register or broaden client authority;
- multiple clients cannot bypass one canonical approval/cancellation decision;
- bounded diagnostic retention;
- malformed client messages fail closed.

## Gate F — OpenTUI compatibility

Prove OpenTUI still observes/controls equivalent underlying George state for its supported flows and does not require duplicated agent-loop logic.

## Live/manual evidence

Use at least one real LM Studio/Qwen run and inspect:
- context composition;
- provider-attempt lifecycle;
- tool execution;
- validation;
- completion.

The live check is about observability truth, not model quality by itself.

## Closeout

Record:
- deterministic/API results;
- reconnect/restart results;
- security results;
- live evidence;
- known observability gaps;
- any fields intentionally withheld for privacy/safety;
- whether Phase 13 desktop work is unblocked.
