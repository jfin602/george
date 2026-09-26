# c9 live sweep P3 agent repair evidence

Status: **COMPLETE — AGENT/PROVIDER/CONTEXT REPAIR WAVE IMPLEMENTED**

Date: 2026-09-26

Pre-task HEAD: `bf90e8b11919f16c0379a1d5b28b13335d5947f6`

Package: `0.9.10` (unchanged)

P3 enumerated exactly the two P2 ledger entries whose `repairCluster` is `agent-provider-context`. Both are actionable George convergence defects at the provider-facing structured-stage slice boundary. They share the missing bounded-stage guidance root, with separate inspection and mutation-prerequisite manifestations. Neither is environment/provider-only or unresolved.

## `live:b2:structured-stage-tool-limit`

Disposition: **actionable George defect; repaired**.

The P2 attempt/trace show the implementation stage spent its frozen eight-call allowance rediscovering already-qualified mutation rules: an existing `package.json` write omitted `expectedSha256`, nested writes preceded explicit parent creation, later reads targeted the absent nested files, and the retry changed existing-file framing. The ninth requested implementation call then received `Structured stage tool call limit of 8 exhausted`; P1 and its stack stopped before validation or hidden acceptance. Context remained ordinary with 6,953 tokens of reported headroom, so this was not context exhaustion or a provider/runtime failure.

The stage limit, SHA authority, explicit-directory rule, framing guard, permission policy, and frozen instrument remain unchanged. `src/application/structured-task.ts` now places the existing executable prerequisites and exact frozen tool-call allowance in the bounded implementation/correction slice before provider work: read existing files and use `expectedSha256`, preserve `textFraming`, and call `create_directory` before nested creation.

Permanent regression guard: `test/unit/application/structured-task.test.ts` asserts the provider-visible implementation slice retains the eight-call bound and all three prerequisite instructions, explicitly linked to this ledger identity.

## `live:c2:inspect-no-evidence`

Disposition: **actionable George defect; repaired; shared stage-guidance root with B2**.

The P2 attempt/trace show one inspection response requested eight tools without knowing the four-call stage allowance. `git_status`, `git_diff`, and root `list_directory` all completed successfully, after which speculative reads of nonexistent `app.py` and `test_app.py` reached the frozen ceiling and correctly hard-stopped the turn. The provider had not been told that one successful read-only round completes INSPECT, what the exact call allowance was, or to discover rather than guess paths.

`src/application/structured-task.ts` now tells the inspection provider to use at most four read-only calls in the response, start from observed paths or list the workspace, avoid guessed paths, and stop after the first round with successful read-only evidence. The hard ceiling and its fail-closed behavior are unchanged; successful evidence does not bypass budget exhaustion.

Permanent regression guard: `test/unit/application/structured-task.test.ts` asserts the provider-visible inspection slice retains the four-call bound and no-guessed-path instruction, explicitly linked to this ledger identity.

## Preserved scope and behavior

- The P2 three-file workload was Green and has no `agent-provider-context` ledger entry; production/provider handling was not changed for the historical schema-1 failure.
- No official live workload ran in P3.
- No stage limit, context profile, provider/runtime setting, permission, recovery, SHA/framing rule, tool authority, task grammar, fixture, instrument, or hidden acceptance changed.
- The v1/v2 instrument and acceptance paths have no Git diff. Phase 9 instrument-immutability integration remained Green.
- P2 artifacts and the pre-repair ledger remain unchanged.

## Validation

All executable validation used Node `v26.10.0`.

| Check | Result |
| --- | --- |
| Structured-task focused regression | **Green: 14/14 passed** |
| Agent/provider/context/tool/permission/recovery/security/Phase 4/5/9/qualification affected floor | **Green: 187/187 passed** |
| `npm run typecheck` | **Green** |
| `npm run test:runner` | **Green: 90/90 passed** |
| Complete `npm test` characterization | **Aggregate Not Green: 408 passed, 5 failed, 1 skipped; 414 total** |
| Package | **Green: exactly `0.9.10`** |
| Root `package-lock.json` | **Green: absent** |
| Frozen live-work instruments/acceptance | **Green: unchanged; Phase 9 integration passed** |

The complete broad run retained the four P2-ledgered OpenTUI failures and the non-TTY skip. It also observed `tool activity, provider failure, cancellation, and teardown clear the thinking timer` failing by the same renderer frame-wait mechanism. That observation is presentation/test-stability work outside P3's ledger-authorized repair cluster; P3 made no TUI change and does not classify or repair it ahead of P4.

No `agent-provider-context` ledger item is intentionally unresolved. A later P5 live sweep, after the separate P4 wave, remains the authority for live B2/C2 outcomes.
