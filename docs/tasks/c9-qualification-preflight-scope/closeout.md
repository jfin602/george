# c9 qualification preflight scope closeout

Status: **POLICY/PREFLIGHT QUALIFIED; GATE A GREEN; GATE B2 NOT GREEN; OVERALL CORRECTION NOT QUALIFIED**

Date: 2026-09-25

Package: `0.9.10` (unchanged)

Pre-task HEAD inspected: `68193f47d1cd561ce9a86a7d30d0de00ecb33a0f`

This is an evidence-only closeout. P3 did not repair production, fixtures, instruments, acceptance, or historical evidence and did not rerun Gate A, B2, or C2.

## Decision

| Decision | Result | Basis |
| --- | --- | --- |
| Qualification Policy Guard Qualified | **Yes — Green** | The pure classifier keeps hard preflight, aggregate broad state, broad regression delta, and live eligibility explicit and separate. Deterministic tests cover retained failures, new identities despite equal counts, affected pass-to-fail/pass-to-skip changes, changed signatures/categories, missing or non-equivalent evidence, and hard Not Green/Evidence Gap blocking. |
| Controlled Broad Baseline Comparison Qualified | **Yes — Green** | Exact baseline `d7e565ccb0e694166e6fe4346b56f4746f0697f1` and production candidate `04405570b92680e6297b48391a7d0bdf0aa8ed5e` ran exact `npm test` under Node `v26.10.0`, npm `11.19.1`, equivalent non-TTY/Git/dependency conditions, with exact failed/skipped identities and bounded categories/signatures. Counts were supporting evidence only. |
| Hard Preflight Qualified | **Yes — Green** | P2's current-candidate hard floor was Green. P3 reverified policy/live-work `14/14`, mutation-precondition/inherited affected checks `81/81`, Phase 9 integration `5/5`, typecheck, runner `90/90`, package/lockfile/diff hygiene, frozen replay, and instrument immutability. |
| Aggregate Broad Suite State | **Not Green — retained** | P2 recorded `390 passed, 4 failed, 1 skipped`; P3's fresh characterization recorded `389 passed, 5 failed, 1 skipped`. All observed failures are the retained OpenTUI renderer identities and the native real-TTY case remains skipped. Neither run is relabeled Green. |
| Broad Regression Delta | **Green** | Candidate/current observations introduce no new identity or materially worsened bounded signature. P3 reproduced all five controlled-baseline failures plus the same native-TTY skip; the P2 run had one baseline failure resolve transiently. |
| Live Eligibility | **Yes — Green at pre-gate** | Hard preflight and the broad regression delta were Green even though aggregate broad state remained Not Green. This eligibility authorized the one fresh Gate A and subsequent gated B2 attempt; it does not make either the aggregate suite or later B2 Green. |
| Fresh Gate A Qualified | **Yes — Green** | Exact 60-byte edit and SHA, George-owned V1 passed, TaskState completed with R1/R2 verified and W1 addressed, hidden acceptance passed, 10 model-requested calls (11 including validation), 8 logical rounds, 0 retries, zero intervention, and no task/stage/correction/run-budget exhaustion. |
| Gate B2 Greenfield Qualified | **No — Not Green** | P1 remained active and ended `budget_exhausted`; P2/P3 remained pending; no validation ran; StackState ended `budget_exhausted` at P1; hidden acceptance was `not_run`; intervention was zero; task/stage exhaustion occurred and run-budget exhaustion did not. |
| Gate C2 Existing-App Qualified | **No — Not Run by gate** | B2 was Not Green, so baseline preservation, focused/broad validation, completed TaskState, hidden acceptance, intervention, and exhaustion remain unspent. |
| Evidence Auditability Qualified | **Yes — Green** | Every committed comparison/current-delta/runtime/attempt/trace JSON hash matches the P2 ledger. Each reached gate has a committed sanitized attempt and trace; bodies are omitted, and no raw provider stream, secret/environment dump, workspace copy, dependency tree, or unbounded log is tracked. |
| Historical Evidence Preserved | **Yes** | Historical Gate A Green, v1 Not Green, the first B2 Not Green, and mutation-precondition preflight-stop evidence remain unchanged. V1/v2 fixture/task/metadata/acceptance files are unchanged and executable digest guards pass. |
| Overall c9-qualification-preflight-scope Qualified | **No — Not Green** | The policy defect and scoped preflight are qualified, but mandatory B2 is Not Green and C2 was not run. |
| Phase 9 Ready For Owner Closeout | **No** | The owner-closeout rule requires fresh Gate A, B2, and C2 all Green with no blocking regression. B2 failed and C2 remains unspent. |

## Policy and controlled-comparison audit

`classifyQualificationPreflight()` accepts bounded normalized summaries and reports `hardPreflight`, `aggregateBroad`, `broadRegressionDelta`, and `liveEligibility` independently. It fails closed to Evidence Gap for incomplete, inconsistent, unbounded, or execution-inequivalent comparison evidence. Hard Not Green always produces ineligibility. The permanent tests establish that unchanged baseline failures may yield aggregate Not Green, delta Green, and live eligibility Green without weakening aggregate truth.

The controlled comparison used identical Node/npm versions, exact command, non-TTY condition, package/dependency identity `d01d095de8e27144ee1a0967e8f54b0aa3cc1ce5281b753138e1d9c708041c5c`, and equivalent Git metadata behavior. Baseline was `379/5/1` of 385 and candidate was `383/5/1` of 389. The five exact OpenTUI failure identities matched by category/signature, and both skipped exactly `native OpenTUI launches and restores a real Node 26 terminal`. The aggregate candidate remained Not Green while the controlled delta was Green.

## Current pre-gate audit

P2's official current pre-gate was:

- hard current-candidate state: **Green**;
- aggregate current broad state: **Not Green** (`390 passed, 4 failed, 1 skipped`);
- broad regression delta: **Green**;
- live eligibility: **Green**.

P3's required fresh broad characterization was also **Not Green** (`389 passed, 5 failed, 1 skipped`, 395 total). It reproduced the complete controlled-baseline identity/signature set, so the delta remains Green. The native OpenTUI case remains a skipped non-TTY Evidence Gap and is not relabeled.

## Live-gate audit

### Fresh Gate A — Green

The one official attempt used the unchanged frozen task, fixture, approval helper, George-owned validation, hidden acceptance, and production structured service. A 59-byte full replacement failed the framing guard without mutation; the model reread the unchanged SHA and an exact patch produced the required 60-byte file with SHA-256 `1216991565e68e28f49d5658371d1a8247b2227e224eb166d84573545faa5039`. V1 passed once. Final TaskState was completed/verified, hidden acceptance passed, human intervention was zero, calls and rounds stayed within the locked limits, and no exhaustion occurred.

### Gate B2 — Not Green

The one official `greenfield-express-v2` attempt preserved instrument version 2, Task Prompt format 1, task-stack digest `a8497efe8f26862c782bb8fb9a12201993df6175a30a5bf68a5149dc832c7618`, acceptance version 1, and the exact successful dependency prerequisite. P1 INSPECT completed. The package write failed normally, `create_directory("src")` succeeded, and two subsequent file writes succeeded, but continuation context exceeded the frozen ordinary profile's provider-input budget. P1/StackState ended `budget_exhausted`; P2/P3 stayed pending; validations and hidden acceptance did not run. Human intervention was zero. This attempt was not repaired or rerun.

### Gate C2 — Not Run

C2 was correctly not spent after B2 failed. No existing-app baseline-preservation, validation, TaskState, hidden-acceptance, intervention, or exhaustion result is inferred.

## Evidence and instrument audit

All P2-recorded hashes match the committed JSON:

| Evidence | SHA-256 |
| --- | --- |
| `evidence/broad-baseline.json` | `58f0e5de02612131dec345bded9b16e3e8b8ab31238f86e1ea599aab53a0b58c` |
| `evidence/broad-candidate.json` | `59231ea54df532ed225ef654e26ab726cf6bd3c426d4005f53c4325e9b389562` |
| `evidence/broad-delta.json` | `a674cc702e4ecb7dd3e456cf4aae3daeefdc0cd89c70e87e3f4ac97750dda3be` |
| `evidence/current-broad.json` | `7d09b86505663d08a063a7aa935f49defdcd4c29b76d7d16d2a2fc1ddbd0ac9d` |
| `evidence/current-delta.json` | `18a5dd0bef8352adc5c9c4cda8adb9f814cf10e2389cd0df0658ff3a3644329e` |
| `evidence/runtime.json` | `668e9a2841705cc63544113688e173e3b1a0d9ae043f4541623d0a86be8c0c8b` |
| `evidence/gate-a/attempt.json` | `4b4d6575e3ec4cdaae3dceefa9f940b61142768cf7549e03af68943282d09c2c` |
| `evidence/gate-a/trace.json` | `d398eb4a285d91b7f6086ff654e64ee5c084d2233b444ae5c91ad531ffdf7f51` |
| `evidence/gate-b2/attempt.json` | `92c847c0597089b99b2b5216ac7694a56d750adac8b719900966e617c5f05eda` |
| `evidence/gate-b2/trace.json` | `8d83d810089b63b0dec9b89f2062a60943f22e522de0a6990d737605b68cd40b` |

Only v1/v2 instrument directories exist. Current metadata remains:

- greenfield v1 task stack `c0ea964cc58423ff4646e93135a5e6766bd58dc6379f284219e3856745919063`;
- greenfield v2 task stack `a8497efe8f26862c782bb8fb9a12201993df6175a30a5bf68a5149dc832c7618`;
- existing-app v1/v2 fixture source `45856b10bfe4ff3f14e1893da22b9a88b1c3334d3923d2417aee0c09e94a5aba`;
- existing-app v2 task stack `66f262fd8f73171cdf5fc023d2be3a5032569fee9ebd8041241abcaf1c0eb0e9`;
- greenfield acceptance `052b109605e2eaec752477374f98a9d9c87f6b4e02bf4232d92dc79ce883c849`;
- existing-app acceptance `183c74474b02166e2ec2fce21019eef2e2c1e20faa91b32d847e6f56e4608d21`.

The last value is the executable byte-frozen digest and passes the integration guard. Earlier greenfield-alignment and mutation-precondition closeout prose prints `...2ecf...`; that inherited prose mismatch is recorded here without changing the acceptance artifact, executable guard, or historical documents.

## P3 validation and scope

| Check | Result |
| --- | --- |
| Qualification classifier plus live-work | **Green: 14/14 passed** |
| Mutation-precondition/inherited affected floor | **Green: 81/81 passed** |
| Phase 9 integration and v1/v2 immutability | **Green: 5/5 passed** |
| `npm run typecheck` | **Green** |
| `npm run test:runner` | **Green: 90/90 passed** |
| Current broad `npm test` | **Not Green: 389 passed, 5 failed, 1 skipped**; retained identities/signatures only |
| Package version | **Green: exactly `0.9.10`** |
| Root lockfile | **Green: absent** |
| P3 scope | **Green:** only this closeout document was added; no production/fixture/instrument/evidence repair was made |

Phase 9 remains open. Phase 10 remains unopened.
