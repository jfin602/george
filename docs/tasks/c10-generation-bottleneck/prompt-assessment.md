# c10-generation-bottleneck Prompt Assessment

Status: READY FOR CORRECTION EXECUTION

Correction: `c10-generation-bottleneck`  
Roadmap phase: 10  
Required unchanged package version: `0.10.12`

## Trigger

Owner live Express work established three correction-local issues:

1. **Mutation generation is expensive.** Current `apply_patch` makes Qwen emit path, 64-character SHA, exact old text, exact new text, and JSON framing even though George already holds the read snapshot.
2. **The absolute provider timeout is too short for healthy local generation.** The model remained actively generating hundreds of tokens at approximately 6–9 tokens/second when the 120000 ms ceiling aborted it. Exact-prefix retries then regenerated the discarded output.
3. **Terminal TaskState can become impossible.** `blockTask()` clears `currentWorkUnit` but does not clear/terminalize the matching `workUnits[Wn] = active`, so durable-session validation correctly rejects the state after provider failure.

The live prompt sizes were not near the context ceiling. Context profile/compaction work is therefore excluded.

## Decomposition

P1 is first because all later experimental/provider failures must remain persistable.

P2 follows so P3/P4 mutation experiments are not killed by an obsolete absolute ceiling.

P3 implements the model-facing mutation optimization while reusing the canonical mutation engine.

P4 qualifies the integrated correction on supported Node 26 and a real local provider.

P5 closes evidence only.

## Model routing

- P1 — Sol High: TaskState/session correctness.
- P2 — Sol High: provider liveness/retry boundary.
- P3 — Sol High: new agent-loop mutation protocol and safety boundary.
- P4 — Sol Medium: qualification/evidence.
- P5 — Sol Medium: evidence-only closeout.

No Terra.

## Primary source seams

P1:
- `src/tasks/state.ts`;
- `src/application/structured-task.ts`;
- `src/core/session-store.ts`;
- stack-state/session persistence tests.

P2:
- `src/core/config.ts`;
- `src/provider/lm-studio.ts`;
- `src/application/provider-stall.ts`;
- `src/application/one-turn.ts`;
- provider/config/stall/recovery tests.

P3:
- `src/core/provider.ts`;
- `src/application/one-turn.ts`;
- `src/tools/read-only.ts`;
- `src/tools/mutation.ts`;
- structured-task freshness/evidence;
- provider projection and mutation tests.

P4/P5:
- benchmark/live qualification helpers;
- supported Node/runtime provenance;
- new correction evidence under `docs/tasks/c10-generation-bottleneck/`.

## Preserved boundaries

Do not weaken:
- exact current-content SHA;
- text framing;
- workspace containment;
- execution policy/approval;
- response-completion-before-effect;
- replay/outcome-unknown recovery;
- TaskState/validation authority;
- canonical session evidence;
- stable-prefix/late round context;
- Operation-mode narration suppression;
- duplicate/no-progress.

Existing legacy mutation tools remain compatibility surfaces.
