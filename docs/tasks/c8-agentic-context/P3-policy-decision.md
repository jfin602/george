# P3 agentic context policy decision

Status: **Evidence Gap — production policy unchanged**
Correction: `c8-agentic-context` / P3
Baseline: package `0.8.8`; pre-task HEAD `b55c553dc1ca53548b3fd5688d85e0f549427717`.

## Decision

P2 does **not** establish a credible healthy agentic working-set envelope. P3 therefore makes no runtime-profile, selector, assembler, diagnostic, compaction/recovery, or continuation-pressure change. In particular, it does not infer a replacement preferred working-set, soft-pressure, or provider-input value from the failed 2,048-band run.

The existing adaptive/fixed policy remains the accepted implementation baseline pending new evidence:

| Contract surface | Retained policy | Existing regression guard |
| --- | --- | --- |
| Physical and hard capacity | All profiles retain physical context `32,768`; provider-input ceilings remain safety boundaries (`8,192`, `16,384`, `24,576`) with `8,192` reserved headroom. | `test/unit/core/foundation.test.ts` asserts every concrete profile exactly. |
| Operating policy | Existing `preferredWorkingSetTokens` and `softPressureTokens` remain provisional Phase-8 values; P3 adds no agentic-limit field because no qualified envelope exists to represent. | `test/unit/core/foundation.test.ts`; `test/unit/context/profile-selector.test.ts`. |
| Adaptive and fixed selection | Adaptive remains provider-free, tool-free, session-neutral, monotonically probed before first inference; fixed remains an explicit concrete-profile override; the selected profile remains frozen for the turn. | `test/unit/context/profile-selector.test.ts`; `test/unit/application/one-turn.test.ts`. |
| Source integrity | Phase-3 precedence, source identity, and whole-source defer/omit/fail behavior remain unchanged. | `test/unit/context/index.test.ts`; `test/unit/application/one-turn.test.ts`. |
| Long-run safety | Phase-5 large-profile compaction/recovery and P7 frozen-turn continuation-pressure stop remain unchanged. | `test/integration/phase5-qualification.test.ts`; `test/unit/application/recovery.test.ts`; `test/unit/application/one-turn.test.ts`. |

These existing guards are the permanent regression floor for the retained behavior. No new behavioral guard is needed because this branch changes no production behavior.

## Exact P2 evidence mapping

P2's only exploratory band was requested `2,048`; all three real George application/provider/tool cases selected the ordinary profile with no promotion or compaction.

| P2 family | Result relevant to an envelope | Consequence for P3 |
| --- | --- | --- |
| Repository inspection | Failed: three unrequested unique tools; `32.516 s` workflow completion. | Does not establish a healthy smallest-band result. |
| Multi-round investigation | Passed once with the expected four reads; `16.106 s` workflow completion. | One family/pass is insufficient for the all-family correctness and tool-behavior gate. |
| Edit plus validation | Failed: unrequested tool-plan expansion and deterministic edit mismatch; `60.112 s` workflow completion. | Does not establish a healthy smallest-band result. |

The aggregate was `1/3` passing, with no confirmation run. P2 did not measure an adjacent materially worse region because it stopped after the failed first band. Main-model GPU Offload `26` was also unconfirmed, so the latency observations are not fully controlled. The historical synthetic context ladder and the prior approximately `12,945`-estimated-token / approximately `88 s` real-request observation remain characterization or problem evidence, not an empirically qualified envelope.

Accordingly:

- largest empirically healthy region: none established;
- next materially worse/risk region: none established;
- P3 authority to alter production context policy: insufficient.

## Evidence needed before a policy change

1. Independently confirm the LM Studio UI-only GPU Offload `26` control for a new series.
2. Resolve or explicitly qualify the P1 smallest-band deterministic tool-behavior baseline before treating it as an envelope measurement.
3. Measure a healthy all-family agentic band and the next materially worse band using the real George benchmark, then run bounded confirmation repetitions.
4. Map a production change only to that measured healthy envelope; if correctness-critical selected context cannot fit it, retain explicit pre-provider fail/degrade behavior rather than silently dropping context or sending an unqualified larger request.

P2 evidence is preserved unchanged at [P2-agentic-envelope-evidence.md](P2-agentic-envelope-evidence.md). This decision neither changes the Phase-8 historical profile record nor treats the P2 Not Green/Evidence Gap as Green.
