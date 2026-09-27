# Phase 13 — Native Desktop + Agent Observatory — Qualification Plan

Status: APPROVED DIRECTION

## Qualification objective

Prove the desktop materially improves diagnosability of George while preserving the Phase 12/application authority boundary.

A window that can chat is insufficient.

## Gate A — authority/parity

Prove from desktop:
- ordinary conversation;
- structured task execution;
- approval/deny;
- cancellation;
- session reopen;
- terminal completion/failure.

Cross-check with OpenTUI/daemon projections to confirm both clients observe the same canonical task/session/evidence truth. UI state changes must not mutate canonical George state.

## Gate B — diagnostic views

Exercise and verify:
- run timeline;
- provider/model inspector;
- context inspector;
- task/orchestration inspector;
- tool/approval inspector;
- diff/change viewer;
- validation panel;
- diagnostics panel.

Each view must trace back to stable correlated evidence rather than UI-invented conclusions.

## Gate C — representative failure diagnosis

Create deterministic fixtures or controlled live cases for:
1. provider stall/retry/rebase/terminal failure;
2. context pressure/promotion/compaction;
3. run-budget pressure/exhaustion;
4. rejected mutation/precondition;
5. failed validation;
6. correction + revalidation;
7. duplicate read or avoided/redundant model round evidence;
8. interruption/reopen/recovery.

For each case, record whether a developer can locate the responsible evidence/cause through the GUI without inspecting raw session files or reconstructing terminal chronology.

## Gate D — baseline/candidate comparison

Compare two recorded runs and verify accurate deltas for:
- result/failure class;
- provider rounds/attempts;
- usage;
- provider-active/total time;
- tool calls/duplicate reads;
- corrections;
- validation;
- available GEP/avoidance/concurrency metrics.

No aggregate winner score is required.

## Gate E — privacy/safety

Prove richer rendering does not expose:
- secrets/credentials;
- unrestricted raw provider payloads;
- unbounded mutation bodies;
- unrestricted process output;
- hidden reasoning/provisional model narration.

## Gate F — reconnect

During a live run:
- close/reopen or detach/reattach the desktop;
- verify current state and timeline reconciliation;
- verify no duplicated action, approval, provider round, or completion.

## Gate G — usability for development

Use the desktop during at least one real George correction/performance investigation and record:
- the defect/bottleneck being investigated;
- which observability views exposed it;
- whether the relevant evidence could be found without raw-file/terminal reconstruction;
- baseline/candidate comparison evidence after repair.

The goal is to prove development leverage, not merely interface correctness.

## Closeout

Record:
- feature/parity results;
- diagnostic fixture matrix;
- live LM Studio/Qwen evidence;
- privacy/redaction checks;
- reconnect evidence;
- one real debugging case study;
- remaining TUI/desktop parity gaps;
- readiness for Phase 14 utility-model work.
