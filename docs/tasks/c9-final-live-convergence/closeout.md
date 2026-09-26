# c9-final-live-convergence Closeout

Date: 2026-09-26
Status: **NOT QUALIFIED — PHASE 9 NOT READY FOR OWNER CLOSEOUT**

Pre-task HEAD: `8ad8db7d006b1d8e30e4630fe7754722d8da427f`. The final live candidate remains `7670122869c87942bb01c3976233209581d9cf7a` with source tree `8d4a2c9f93c50dcea1c248a7d43ad90d6083e251`. Package remains `0.9.10`.

This is an evidence-only closeout. It changes no production code, tests, frozen instruments, hidden acceptance, provider/runtime settings, or preserved evidence. No official live workload was rerun.

## Decision table

| Decision | Result | Evidence |
| --- | --- | --- |
| Mission Card / Alignment Projection Qualified | **Yes — Green** | The deterministic, bounded, non-authoritative projection derives from canonical TaskState, effective permissions, and bounded observed evidence. Permanent tests cover stability, bounds, objective/completion guidance, permission non-expansion, and canonical validation handoff. |
| Per-Round Continuation Alignment Qualified | **Yes — Green** | `AgentLoopApplicationService` calls the alignment seam before every provider round; implementation and correction supply a fresh mission card. Continuation and provider-usage accounting include the refreshed projection. Ordinary turns do not supply this seam and retain inherited behavior. |
| Evidence Freshness / Reuse Qualified | **Yes — Green** | Ephemeral path/resource-aware evidence preserves unaffected observations, marks only affected observations stale after mutation, reuses valid INSPECT evidence, and re-inspects after reopen because freshness is not treated as durable authority. |
| No-Repeat Convergence Qualified | **Yes — Green** | Mission-card reuse guidance is bounded and non-authoritative. The strict equivalent unchanged-read guard remains executable, and neither guidance nor rebase can raise permissions or replace tool validation. |
| Hard Convergence Budget Qualified | **Yes — Green** | Structured implementation/correction retain enforced hard ceilings of `16/16` and `12/12` tool calls/provider rounds respectively, subordinate to task-wide RunBudget and cancellation. Duplicate/no-progress remains separately bounded at two unchanged reads. |
| Efficiency Metric Separation Qualified | **Yes — Green** | The historical `<=10` calls/rounds target is reported independently from functional state. Deterministic qualification proves an efficiency miss alone cannot overwrite functional Green, while hard exhaustion still fails. |
| Partial Provider Timeout Recovery Qualified | **Yes — Green** | Retry eligibility explicitly requires an incomplete provider round with no executed tool, committed assistant response, or ambiguous effect. Provisional text/tool proposals and incomplete response IDs are discarded; retry starts from the same canonical pre-round state with fresh attempt identity and consumes bounded retry/run budget. |
| Provider Stall Watchdog / Recovery Qualified | **Yes — Green** | Application-owned first-evidence (`90000 ms`) and active-inactivity (`60000 ms`) watchdogs remain below the unchanged `120000 ms` absolute provider timeout. Recovery permits at most one identical stall retry and one structured canonical rebase; pressure-gated compaction is one-shot with a `30000 ms` recursion guard. Repeated terminal stalls remain provider-class failures. |
| Broad Suite State | **Current no-failure characterization with one Evidence Gap; historical P3 Not Green retained** | P3 recorded `443 total: 441 passed, 1 failed, 1 skipped`; the failure was the retained intermittent progressive-final-answer reveal and the skip was native real-TTY. The single P4 current run recorded `443 total: 442 passed, 0 failed, 1 skipped`; the skip remains a nonblocking native-TTY Evidence Gap. The P3 failure remains historical evidence but no blocking affected-system regression is present. |
| Greeting | **Green** | One provider attempt/round, `1479/9` input/output tokens, zero tools, 34-byte final answer, ordinary profile, no retry, intervention, promotion, or exhaustion. |
| Three-File | **Green** | Five attempts/rounds, `28352/761` tokens, seven requested tools, all three frozen files read, final answer present, ordinary-to-medium provider-usage promotion, no retry/intervention/exhaustion. One malformed `search_text` call failed recoverably. |
| Gate A Functional | **Green** | Exact 60-byte result with SHA-256 `1216991565e68e28f49d5658371d1a8247b2227e224eb166d84573545faa5039`; V1 passed; TaskState completed with R1/R2 verified and W1 addressed; hidden acceptance passed; no intervention or exhaustion. |
| Gate A Efficiency Target | **Green — met** | Six model-requested tool calls and four logical provider rounds, both within the historical `<=10` targets. The seventh trace call was George-owned V1 validation. |
| Gate B2 | **Not Green — blocking** | P1 completed and V1 passed. P2 V1 failed; its correction ended after terminal provider-stall recovery. P3 remained pending, StackState failed, and hidden acceptance did not run. |
| Gate C2 | **Not Green — blocking** | Diagnostic-only after B2. INSPECT observed `src/app.js`, but implementation produced no mutation or validation before provider stall/timeout retries exhausted. TaskState failed with W1 active and V1/V2 pending; hidden acceptance did not run. |
| Evidence Auditability Qualified | **Yes — Green** | All final attempt/trace pairs are schema 2 and every recorded report/ledger SHA-256 matches. Artifacts retain bounded operational metadata without raw provider streams, assistant prose/private reasoning, file/write/patch bodies, secrets, environment dumps, workspace copies, dependency trees, or unrestricted process output. |
| Historical Evidence Preserved | **Yes — Green** | The six interrupted-P3 files are byte-identical to commit `5013c0245b32ba2ab3a80372d8e6aa59aafbc497`; all earlier Phase 8/9 evidence remains committed and unchanged. Frozen instrument, hidden-acceptance, and three-file trees remain `b5b9dfacf2fdd2aa4f79cdd3f3657b1598853dcc`, `8d1a0367e86a23a05ad9188c0f5c8eedccfda757`, and `a98bac54ef8263bef78cb5fcacd1d2a1a0fe3af5`. |
| Remaining Blocking Failure Count | **2 workload outcomes / 3 ledger entries** | B2 contributes validation-failed and terminal-provider-stall entries; C2 contributes provider-timeout/retry-exhausted. There is no blocking deterministic security, permission, replay, recovery, convergence-budget, or evidence-integrity regression. |
| Nonblocking Evidence Gaps | **3** | Native real-TTY was unavailable; historical sandbox/process intermittency has no established cause; LM Studio GPU Offload 26 was not independently UI-observable. None supplies missing functional Green for B2 or C2. |
| Overall `c9-final-live-convergence` Qualified | **No** | Deterministic P1/P2 and stall recovery are qualified, but the required final live chain did not converge through B2 and C2. |
| Phase 9 Ready For Owner Closeout | **No** | The readiness rule requires B2 and C2 Green. Both are Not Green; Phase 9 remains open and no owner closeout is performed. |

## P1 audit

- Mission-card output is deterministic for identical canonical state, capped at `8192` bytes / `2048` estimated tokens / 12 evidence items, and never mutates or replaces canonical TaskState/session authority.
- Structured implementation and correction recompute alignment immediately before every provider request, including continuations after tool results. The agent-loop integration regression also proves ordinary requests remain unchanged when no alignment seam is supplied.
- Freshness is ephemeral, bounded to 32 entries, and resource-aware. File reads invalidate only on mutation of that file; directory listings invalidate on topology changes in that directory; searches invalidate for mutations within their searched resource; Git observations invalidate after mutation. Unaffected evidence remains valid.
- A reopened structured task starts with an empty derived freshness cache and re-inspects. Valid in-run INSPECT evidence is reused across work units and correction rounds.
- Guidance remains provider-facing data, not permission or completion authority. The canonical registry, effective execution policy, TaskState transitions, validation, SHA/framing checks, and approval path remain authoritative.
- Hard ceilings and strict duplicate/no-progress enforcement remain separate from the `<=10` efficiency metrics.

## P2 and provider-stall audit

- `canRetryProviderFailure()` admits only provider-class incomplete attempts with no completed response, tool execution, canonical assistant commit, or ambiguous effect.
- Per-attempt provisional text, tool proposals, and response IDs are reset before retry. Incomplete proposals emit no `tool.requested`, execute no tool, and never enter the canonical transcript or continuation.
- A later incomplete continuation retries from the prior completed canonical continuation, not the incomplete response ID, and does not replay its already executed tool.
- Cancellation wins; provider and retry RunBudget ceilings remain explicit; executed or outcome-unknown effects are never transparently replayed.
- Stall policy is centralized and validated. Provider activity refreshes liveness without exposing payloads. The LM Studio adapter retains the unchanged absolute `120000 ms` timeout and does not own recovery policy.
- The recovery ladder is finite: original stalled attempt, one identical replay-safe retry, one canonical structured rebase, then provider-class termination. High-pressure compaction requires completed compactable evidence and cannot recursively enter stall recovery; low pressure does not compact.
- The P3 live observations exercise truthful recovery: B2 recorded eight suspected/detected active-response stalls, six fresh retries across rounds, one low-pressure rebase, no compaction, and terminal provider failure. C2 recorded three active-response stalls, three `120000 ms` timeouts, five retries, no rebase/compaction, retry exhaustion, and provider-class failure.

## Exact P3 outcome

| Measure | Recorded result |
| --- | --- |
| Broad suite | `443 total; 441 passed; 1 failed; 1 skipped` |
| Greeting | Green |
| Three-file | Green |
| Gate A Functional | Green |
| Gate A Efficiency Target | Met: 6 model calls, 4 logical rounds |
| B2 | Not Green, qualifying |
| C2 | Not Green, diagnostic-only |
| Provider retry observations | B2: 27 attempts/rounds, 6 retries, 8 suspected plus 8 detected stalls, 1 rebase; C2: 9 attempts/rounds, 5 retries, 3 detected stalls plus 3 absolute timeouts, no rebase |
| Hard convergence exhaustion | None in greeting, three-file, Gate A, B2, or C2 |
| Human intervention | Zero for every workload |
| Hidden acceptance | Greeting passed; three-file passed; Gate A passed; B2 not run; C2 not run |
| Remaining ledger | 7 entries: 3 blocking live entries, 1 nonblocking broad Not Green, 3 nonblocking Evidence Gaps |

## Evidence and identity audit

All hashes recorded in `P3-final-qualification-report.md` match the committed files, including `runtime.json`, all five final schema-2 attempt/trace pairs, `failure-ledger.json`, and all six historical interrupted-P3 artifacts. The ledger is finite, has seven unique identities, distinguishes B2's validation and terminal-stall observations, and retains C2, broad, historical, terminal, and runtime states without collapsing them.

Frozen identity remains unchanged:

- v1/v2 instrument tree: `b5b9dfacf2fdd2aa4f79cdd3f3657b1598853dcc`;
- hidden acceptance tree: `8d1a0367e86a23a05ad9188c0f5c8eedccfda757`;
- three-file fixture tree: `a98bac54ef8263bef78cb5fcacd1d2a1a0fe3af5`;
- Gate A task SHA-256: `ac85295343d201711b3f177e4ba44a5055fbfe8acf736f23b9c6a47f0ef59c07`;
- B2 metadata/task-stack/acceptance: `f0b6a69445f67eda134a97035058ad9210526a9668a06fca84bb73441777ef9f` / `a8497efe8f26862c782bb8fb9a12201993df6175a30a5bf68a5149dc832c7618` / `052b109605e2eaec752477374f98a9d9c87f6b4e02bf4232d92dc79ce883c849`;
- C2 metadata/task-stack/fixture/acceptance: `ab86b304b8c893503fa390726a0e13d33ff2b0afe3b0744e12afca3fe886e5e5` / `66f262fd8f73171cdf5fc023d2be3a5032569fee9ebd8041241abcaf1c0eb0e9` / `45856b10bfe4ff3f14e1893da22b9a88b1c3334d3923d2417aee0c09e94a5aba` / `183c74474b02166e2ec2fce21019eef2e2c1e20faa91b32d847e6f56e4608d21`.

## Current validation and hygiene

Validation used the installed supported Node `v26.10.0` runtime. The default shell Node 24 command was rejected before test discovery because it lacks `--experimental-ffi`; it produced no test result and is not qualification evidence.

- focused P1/P2, provider/recovery, Phase 5, Phase 9, live-work, sweep, and agent-loop regressions: **150 passed, 0 failed, 0 skipped**;
- current broad `npm test`: **443 total; 442 passed, 0 failed, 1 skipped**; native real-TTY only;
- `npm run typecheck`: **Green**;
- `npm run test:runner`: **90 passed, 0 failed, 0 skipped**;
- package version: **exactly `0.9.10`**;
- root `package-lock.json`: **absent**;
- frozen instruments/acceptance/fixtures: **no working-tree diff**.

Phase 9 remains open. Phase 10 is not opened.
