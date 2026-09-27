# Correction 10 P4 failure ledger

Candidate: `384091366fcd1addabf0a2cff456a6ece77f7875` / tree `8191d407ad178e7549669ed9d87dc7cd60c5515d` / package `0.10.12`.

| ID | Layer | State | Observation | Classification |
| --- | --- | --- | --- | --- |
| F1 | Focused + broad | Not Green | `test/integration/phase5-qualification.test.ts` expected `completed`, observed `budget_exhausted`. | Current inherited-floor failure. The test uses Human mode, so the P3 Operation protocol is not a supported causal explanation; no baseline rerun or production repair was authorized. |
| F2 | Focused + broad | Not Green | `frozen structured Phase 8 counterpart repairs the exact fixture and leaves validation to George` left the target unchanged. | Correction-local P3 compatibility regression: eligible Operation reads are projected as receipt/numbered-lines only, while the advertised legacy fallback still needs SHA/framing/text evidence. |
| F3 | Focused + broad | Not Green | `frozen qualification denies model-requested framing authority before dispatch and permits safe patch recovery` observed no reread SHA. | Same P3 compatibility defect as F2; receipt-only projection removed the SHA consumed by the frozen legacy recovery path. |
| H1 | Phase 10 P7 history | Historical/intermittent Not Green | The earlier lifecycle completion-order failure remains immutable. Its current assertion, `calls execute in provider order across same-response and multiple tool rounds`, passed in both P4 runs. | Retained historical evidence; current passes do not erase the earlier failure. |
| E1 | Live correction workload | Evidence Gap / Not Run | No disposable fixture, provider attempt, mutation, validation, or session reopen was started. | W2 is gated on W1; F1-F3 made W1 Not Green. |

No correction-local run ended with an invalid active-work-unit terminal state. P1 terminalization, StackState, and LocalSessionStore regressions passed. Intentional failure states remained persistable.
