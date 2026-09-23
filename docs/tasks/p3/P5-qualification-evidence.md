# P5 Qualification Evidence — Phase 3 Context + Skills

Date: 2026-09-22  
Candidate: uncommitted P5 working tree rooted at pre-task HEAD `a875f7e4ae0acc89124174efa99caf035ece14c7`; implementation changes are `package.json`, `test/unit/context/index.test.ts`, `test/integration/agent-loop.test.ts`, and this record. The phase runner owns the resulting commit.

## Outcome

| Layer | Result | Evidence |
| --- | --- | --- |
| Context discovery, identity, precedence, exact duplicates, missing optionals, routing, and containment | Green | Deterministic context tests cover stable IDs/order, whole-source loading, duplicate evidence, optional absence, traversal/symlink rejection, and provider-independent rendering. |
| Provider-facing estimates, budgeting, tool/conversation overhead, whole-source failure/defer, and diagnostics | Green | Context/application tests prove estimated (not actual) accounting, critical-source failure, optional omission/routed defer, bounded diagnostics, tool-schema inclusion, and preserved provider usage events. |
| Initial Qwen/Q4_K_M profile | Green | `DEFAULT_CONTEXT_PROFILE` and regression tests retain physical `32,768`, provider input `24,576`, soft pressure `20,000`, reserved headroom `8,192`, and preferred working set `12,000-18,000`. |
| Smallest sufficient working set / pressure | Green | The new context fixture creates 24 unrelated repository documents and a `12k-18k` composed provider-facing working set without eager document injection; existing pressure coverage omits optional context while retaining invariants. |
| User/workspace sources and BOOT routing | Green | Deterministic fixtures cover user-global instructions, personality, `.george/instructions.md`, `AGENTS.md`, and routing-only `BOOT.md`; explicit routed documents are included only for the submitted turn. |
| Declarative skills | Green | Skill tests cover built-in/user/workspace discovery, portable `SKILL.md`, metadata-only catalog, collisions, malformed/oversized inputs, JIT body loading, multiple rounds, and non-sticky activation. |
| Authority isolation and Phase-2 safeguards | Green | Hostile repository, personality, and portable skill text cannot change the canonical registry or bypass write approval. The integrated fixture confirms a hostile-context write stays denied after read-only continuation rounds. Existing deterministic tool/process/approval/cancellation coverage remains Green. |
| Canonical application/provider continuation | Green | Scripted-provider tests cover assembled requests, two read-only continuations, normalized tool results, provider usage preservation, and final completion. LM Studio wire tests remain deterministic and Green. |
| OpenTUI deterministic behavior | Green | Node 26.10 test renderer passed `/skills`, `/skill`, context/skill diagnostics, draft preservation, approvals, cancellation, resize, scrollback, and cleanup tests. |
| Native terminal command surface and cleanup | Green (bounded) | A genuine PTY on Node 26.10 launched `src/tui/main.ts`, rendered the real OpenTUI screen, accepted `/skills` locally, and exited `0` after Ctrl+C with terminal restoration escape cleanup observed. |
| Native streamed tool/approval interaction | Evidence Gap | No configured live provider was available for a native tool/approval/cancellation interaction; deterministic test-renderer evidence is not relabeled native evidence. |
| Live LM Studio/Qwen characterization | Evidence Gap | No explicit `GEORGE_MODEL`/LM Studio configuration was present and `http://127.0.0.1:1234/v1/models` refused connection. Therefore no supported-Qwen model ID, quant/runtime observation, George/live estimate comparison, provider usage, ordinary live tool cycle, or pressure characterization exists. |

No layer is Not Green for the qualified deterministic candidate. The live/native gaps are not passes.

## Added integrated regression guard

`test/integration/agent-loop.test.ts` adds one disposable workspace that combines:

- George/workspace/user/personality precedence and provider-input budget diagnostics;
- routing-only `BOOT.md` plus explicit `docs/selected.md` retrieval;
- a portable workspace `SKILL.md` activated just in time and retained for two read-only tool rounds;
- a later ordinary turn proving the skill and routed document do not leak; and
- hostile repository/personality/skill content followed by a denied `write_file` approval request.

`test/unit/context/index.test.ts` adds the many-document, ordinary-profile guard: 24 unrelated documents stay out of context while the composed estimate remains within the configured `12,000-18,000` working-set range and below soft pressure.

## Validation

Runtime: Node `v26.10.0`; npm invoked with that Node first on `PATH`; Node platform `linux x64`; host platform `Linux 7.0.0-31-generic x86_64 GNU/Linux`. This is within the locked Node 26 contract. The default shell Node was `v24.21.0`, which cannot accept `--experimental-ffi`; it was not used for authoritative qualification.

Executed successfully with Node 26.10:

```text
npm run check                         # 155 passed, 0 failed
npm run test:runner                   # 90 passed, 0 failed
git diff --check
test ! -e package-lock.json
```

Focused post-change run passed: context and integration tests, 16 passed, 0 failed. The native PTY command was:

```text
GEORGE_MODEL=qualification-local node --experimental-ffi src/tui/main.ts .
```

It used no provider call; `/skills` reported no discovered skills and Ctrl+C exited cleanly. The loopback model probe was read-only and failed to connect, so no live smoke was run.

## Scope check

P5 changes only qualification tests, this evidence record, and the assigned `0.3.5` package version. It adds no durable persistence/resume, changed-file accounting, validation orchestration, completion evidence, compaction/hooks, plugins/network adapters, daemon/Tauri work, or multi-agent behavior.
