# c9 turn context convergence P1 provider projection evidence

Status: **GREEN — PROVIDER RESULT PROJECTION QUALIFIED**

Date: 2026-09-26

Pre-task HEAD: `154aac8676f5b1df1c83c7228dfd0253eb2a8310`

Package: `0.9.10` (unchanged)

P1 adds one provider-independent projection seam to the canonical `ToolRegistry`. Tool execution and application events retain canonical results. The agent loop separately derives provider-visible results after terminal execution and uses only those projections for continuation payloads and continuation-size estimation. No provider adapter, context profile, production TUI wiring, live instrument, or acceptance artifact changed.

## Pre-fix deterministic reproduction

The regression fixture creates a real temporary Git workspace with 120 realistically named dirty files plus the normal bounded repository instruction files, then executes a successful canonical `write_file` through the production agent loop.

Before the production change, the new test failed because the provider continuation received the canonical result unchanged, including all 122 `GitWorkingTreeSnapshot.entries`. This reproduced the defect without Qwen or LM Studio.

The same fixed fixture now measures:

| Representation | Serialized result size |
| --- | ---: |
| Canonical mutation result, including Git snapshot | 11,918 bytes |
| Provider-projected mutation result | 148 bytes |

Forwarding the canonical result unchanged was therefore about 80 times larger for this fixture. The regression uses a proportional assertion rather than the historical B2 token count. No raw snapshot or file body is tracked.

## Projection boundary

- `ToolDefinition.projectProviderResult` is optional and registry-owned.
- `ToolRegistry.projectProviderResult()` preserves the call ID/name envelope, keeps normal failure code/message semantics with provider bounds of 128/4,096 bytes, and preserves successful results unchanged when no projector is registered.
- A projector receives a structured clone, so it cannot mutate canonical execution evidence.
- Built-in `write_file` and `apply_patch` projections contain only `name`, `path`, `bytes`, and resulting `sha256`.
- Built-in `create_directory` projections contain only `name`, `path`, `created`, and `createdDirectories`.
- Canonical mutation results still contain the pre-mutation Git snapshot.
- Provider adapters remain serialization-only and contain no tool-name-specific projection policy.

## Preserved invariants

- Canonical `tool.completed` events retain full mutation evidence, including Git state.
- `CodingWorkflowApplicationService` still extracts direct mutations from canonical events.
- Recovery intent and reconciliation remain canonical and unchanged.
- Current-content SHA requirements, exact text framing, atomic mutation behavior, workspace containment, Git dirty-state preservation, approvals, effects, replay safety, and tool selection authority are unchanged.
- Read-only, process, plugin, adapter, and other tools without a projector preserve their existing provider result semantics.
- Known failures retain their bounded `code` and `message`.
- Identical canonical results produce identical projections.
- Provider continuation accounting now measures the projected results; adaptive/fixed promotion behavior itself is unchanged for P2.

## Validation

Supported runtime: Node `v26.10.0`; npm `11.19.1`.

| Command / scope | Result |
| --- | --- |
| Pre-fix single regression (`node --experimental-ffi --test --test-name-pattern='provider continuation projects large canonical mutation evidence' test/unit/application/one-turn.test.ts`) | **Expected failure:** provider result still contained `git` |
| Post-fix same regression | **Green: 1/1 passed**; 11,918 bytes canonical versus 148 bytes projected |
| Registry, mutation, one-turn, coding-workflow, recovery focused files | **Green: 63/63 passed** |
| Agent loop, Phase 4/5 Git/recovery, Phase 9, structured replay/task, mutation-intent, qualification/live-work floor | **Green: 48/48 passed** |
| `npm run typecheck` | **Green** |
| `npm run test:runner` | **Green: 90/90 passed** |
| Broad `npm test` characterization | **Not Green: 392 passed, 5 failed, 1 skipped, 398 total** |
| `git diff --check` | **Green** |

The five broad failures are the already-recorded OpenTUI renderer identities: streamed-answer rendering, inactive-task text rendering, progressive reveal timing, draft preservation rendering, and approval rendering timing. The native real-TTY case remained skipped. This P1 does not relabel the aggregate suite Green and did not rerun any live gate.

## Changed files

Production:

- `src/tools/registry.ts`
- `src/tools/mutation.ts`
- `src/application/one-turn.ts`

Tests:

- `test/unit/tools/read-only.test.ts`
- `test/unit/tools/mutation.test.ts`
- `test/unit/application/one-turn.test.ts`
- `test/unit/application/coding-workflow.test.ts`

Evidence:

- `docs/tasks/c9-turn-context-convergence/P1-provider-projection-evidence.md`

## Version, lockfile, and historical evidence

- `package.json` remains exactly `0.9.10`.
- No root `package-lock.json` exists.
- No v1/v2 live-work instrument, fixture, metadata, hidden acceptance, official attempt, or historical evidence file changed.
- Official Gate B2 was read only and was not rerun.
- Gate A/B2/C2, greeting/three-file smokes, Phase 9 owner closeout, and Phase 10 were not run or opened in P1.
