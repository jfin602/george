# Phase 3 Closeout — Context + Skills

Date: 2026-09-22  
Closeout candidate: P5 implementation commit `2d8b5a9f4ce0cab87b9694843b14f8885b1f4b55` (`0.3.5`)  
Phase-3 closeout version: `0.3.6`

## State

| State | Truth | Basis |
| --- | --- | --- |
| Implementation Complete | Green | P1-P5 scope is present in the P5 candidate and its focused, aggregate, runner, integration, and TUI evidence passed. |
| Stability Qualified | Not Green | Required conditional live/native characterization has Evidence Gaps. An Evidence Gap is not Green under the stability contract. |

This is a formal implementation closeout, not an owner closeout or a Phase-4 baseline transition. `BOOT.md` and the roadmap remain at Phase 3.

## Evidence audit

| Area | Truth | Current/P5 evidence |
| --- | --- | --- |
| Provider-independent context and adapter boundary | Green | `src/context/index.ts` owns `AssembledContext`, source dispositions, rendering, estimates, and budgets; `src/application/one-turn.ts` supplies that normalized result to the generic provider request. LM Studio wire translation remains in `src/provider/lm-studio.ts`. |
| Precedence and deterministic ordering | Green | Context tests and the integrated fixture cover George invariants, explicit current input, workspace guidance (`.george/instructions.md`, `AGENTS.md`, `BOOT.md`), user-global defaults, and personality. Workspace same-tier order is stable; activated skills inherit their origin and never outrank current user input. |
| Whole sources, duplicates, and routing | Green | Bounded loaders reject oversized sources rather than injecting prefixes; required budget failure is explicit, while optional/routed material is whole omitted/deferred. Exact normalized duplicates retain the higher-priority/stable-earlier source with duplicate evidence. `BOOT.md` is routing guidance only; explicit contained routed documents are turn-local. |
| Estimated versus actual usage | Green | Context diagnostics label deterministic provider-facing counts as estimates. Provider `response.completed.usage` remains preserved as actual provider-reported usage, with no relabeling. |
| Context profile and diagnostics | Green | `DEFAULT_CONTEXT_PROFILE` retains Qwen3-Coder-30B-A3B-Instruct / Q4_K_M / LM Studio operating defaults: 32,768 physical target, 12k-18k preferred ordinary set, 20,000 soft pressure, 24,576 provider-input ceiling, and 8,192 reserved headroom. Tests cover headroom, pressure shedding, stable repeated prefix ordering, and bounded core/project/tools/task/skills/routed/conversation/tool-result diagnostics. |
| No eager fill / ordinary and pressure fixtures | Green | P5 adds the 24-unrelated-document guard: unrelated discoverable material is not injected to fill capacity, and the representative ordinary assembly remains in the 12k-18k target. Existing pressure coverage defers optional context before critical sources. |
| Optional configured sources | Green | Missing user-global instructions, personality, and workspace-native sources are normal; present sources are bounded, ordered, and diagnosed. |
| Portable declarative skills | Green | Unit/application coverage proves built-in, user, and workspace roots; portable `SKILL.md`; stable qualified IDs; visible collisions; bounded metadata/body parsing; metadata-only local catalog; no ordinary-turn catalog/body injection; JIT activation; multi-round retention; and later-turn non-leakage. |
| Authority and Phase-2 safeguards | Green | Hostile repository, personality, and skill text cannot change the canonical tool registry, permissions, approval port, workspace containment, process boundary, or network authority. The disposable integration fixture retains approval gating for a hostile-context `write_file`; existing deterministic Phase-2 tool/process/approval coverage remains part of the aggregate P5 run. |
| Application and TUI observability | Green | Scripted-provider evidence covers canonical continuation and usage preservation. OpenTUI renderer tests cover local `/skills`, one-turn `/skill`, recoverable invalid/collision behavior, non-sticky activation, bounded estimated-context/profile/headroom/pressure/category display, draft preservation, approvals, cancellation, resize, scrollback, and cleanup. |
| Disposable integrated fixture | Green | P5's `test/integration/agent-loop.test.ts` combines source precedence/budget diagnostics, routing-only `BOOT.md`, an explicit routed document, portable skill activation across read-only rounds, later-turn non-leakage, and hostile text behind denied write approval. |
| Native terminal | Evidence Gap | A Node 26.10 real PTY proved launch, local `/skills`, Ctrl+C exit, and terminal restoration (bounded Green evidence). No configured live provider existed for native streamed tool/approval/cancellation interaction; that broader native layer is not Green. |
| Live LM Studio/Qwen | Evidence Gap | P5 found neither explicit `GEORGE_MODEL`/LM Studio configuration nor a reachable loopback `/v1/models` endpoint. There is no live model/quant/runtime observation, estimate-to-provider-usage comparison, ordinary live tool cycle, or pressure characterization. |
| Runner and lockfile invariants | Green | P5 recorded Node `v26.10.0`, `npm run check` (155 passed), `npm run test:runner` (90 passed), `git diff --check`, and no `package-lock.json`. This closeout rechecks its documentation diff and lockfile invariant below. |

## Scope boundary

No Phase-4+ behavior was added or qualified here. Changed-file accounting, validation orchestration, structured completion evidence, durable persistence/resume, compaction, automatic semantic routing, executable hooks, plugin packaging, browser/network adapters, daemon/server mode, Tauri, long-job recovery, and multi-agent scheduling remain deferred to their designated later phases.

## Validation performed for this closeout

```text
git diff --check                  # pass
test ! -e package-lock.json       # pass
```

The P5 durable qualification record is the authoritative execution evidence for the unchanged implementation candidate: [`docs/tasks/p3/P5-qualification-evidence.md`](tasks/p3/P5-qualification-evidence.md).
