# Phase 4 / P6 qualification evidence

Candidate: pre-task `HEAD` `5bb4a344dd7a7f00eda28954cd913caea0006b85`, with the uncommitted P6 diff that sets `package.json` to `0.4.6` and adds `test/integration/phase4-qualification.test.ts`. No commit was created by this phase.

Runtime observed: Node `v26.10.0`; npm `11.19.1`; Linux `7.0.0-31-generic x86_64 GNU/Linux`.

## Deterministic matrix

| Layer | Result | Evidence |
| --- | --- | --- |
| Context and portable skills | Green | The P6 disposable Git fixture combines workspace and user-global guidance, a routed document, and a portable external `SKILL.md`. It asserts the activated skill/routed document are present for the coding turn, estimated context is below the provider-input budget, and neither leaks into the unrelated reopened turn. Existing context/skills tests also cover precedence, source observations, budgets, malformed/oversized sources, and non-sticky activation. |
| Tool, approval, process, and Git safety | Green | The fixture executes `read_file`, `list_directory`, `search_text`, `git_status`, `git_diff`, `write_file`, `apply_patch`, and `run_process` through the canonical loop. Four per-call approvals cover the two native mutations, arbitrary process, and validation. Focused tool/process tests cover schema rejection, traversal/symlink boundaries, atomic mutation preconditions, timeout/cancellation cleanup, bounded output, closed stdin, sanitized environment, literal argv, and dirty-tree preservation. |
| Coding workflow and completion evidence | Green | The fixture starts with `user-work.txt` already dirty; completion reports it as pre-existing, reports `george.txt` and `source.txt` as direct George-native mutations, and reports `process.txt` as newly observed without process attribution. Its intentionally failing approval-gated validation remains `failed` and makes workflow terminal state `failed` even though the scripted assistant says “Validation passed.” |
| Progress/work projection and visible transcript | Green | The fixture verifies a stable work-item identity across lifecycle updates for every built-in tool, literal process executable/argv/cwd plus bounded outcome metadata, and absence of file/read/write/patch/process-result secrets from projected work and rendered transcript. Existing deterministic OpenTUI test-renderer coverage verifies chronological rendering, stable row updates, approval/cancellation, draft preservation, resize, scrollback/selection, streaming, and clean renderer shutdown. Work/progress remains outside canonical transcript and later provider context. |
| Durable sessions and safe resume | Green | Session store tests cover schema/version/workspace/bounds/safe write. The fixture round-trips completed history from a state root outside the Git fixture and starts a later turn without skill leakage. It separately persists incomplete mutation, process, approval, and provider cases; reopening classifies each as interrupted, replays no side effect or approval, and the later request starts a fresh provider turn. |
| Provider contract | Green (deterministic) | Existing LM Studio provider tests cover Responses request/continuation shapes, streaming, malformed/incomplete events, cancellation, timeout, and error normalization. The P6 fixture uses a provider-independent scripted provider, which remains the correctness authority. |
| Native OpenTUI terminal | Evidence Gap | This execution had no usable TTY (`stdin`/`stdout` were not terminals), so no real-terminal approval/cancellation, reopen, draft, resize/scrollback, or terminal-cleanup run was performed. Test-renderer evidence is not relabeled native-terminal evidence. |
| Live LM Studio/Qwen | Evidence Gap | `GEORGE_MODEL` was unset, so the required explicit Qwen model and supported loopback configuration were unavailable. No live cycle, provider usage report, or live visible-work measurement was fabricated. |

## Commands run

```text
node --experimental-ffi --test \
  test/unit/core/session-store.test.ts \
  test/unit/application/coding-workflow.test.ts \
  test/unit/application/progress.test.ts \
  test/unit/tui/app.test.ts \
  test/unit/tools/read-only.test.ts \
  test/unit/tools/mutation.test.ts \
  test/unit/tools/process.test.ts \
  test/unit/context/index.test.ts \
  test/unit/skills/index.test.ts \
  test/integration/agent-loop.test.ts \
  test/integration/phase4-qualification.test.ts
# 65 passed

npm test                 # 191 passed
npm run test:runner      # 90 passed
npm run typecheck        # passed
git diff --check         # passed
test ! -e package-lock.json # passed
```

No evidence-driven product correction cycle was required. The only added regression guard is the deterministic P6 integration fixture; it is permanent coverage for the cross-layer qualification contract rather than a product-scope expansion.
