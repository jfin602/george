# Phase 3 Prompt Assessment

Status: CURRENT IMPLEMENTATION ASSESSMENT

Phase: 3 — Context + Skills  
Execution folder: `p3`  
Assessment baseline: main `e7883db6f5ea481883fca5e07ae3a28937e1bd5b`, package `0.3.0`.

## Assessment conclusion

Proceed as one focused Phase 3 with **five implementation prompts plus one evidence-only closeout**.

The safest order is to establish a provider-independent context model and deterministic source/budget machinery before replacing the bootstrap instruction concatenation, then add portable skills on top of that substrate, expose explicit non-sticky skill activation through the TUI, qualify the exact integrated candidate, and close out from evidence.

All Phase 3 prompts are `Browser required: no.`. The ordinary phase runner can execute the complete stack. Native-terminal and live-LM-Studio/Qwen evidence remain conditional runtime evidence rather than browser handoffs.

## Current-source findings

- `package.json` is `0.3.0`, Node >=26.4.0 <27, TypeScript + ESM, with `@opentui/core` as the only production dependency.
- `AgentLoopApplicationService` still calls `loadRepositoryInstructions()` and flattens George-owned text plus bounded root `BOOT.md` / `AGENTS.md` into one provider `instructions` string.
- the current repository-instruction loader is byte-bounded and may return truncated instruction fragments; Phase 3 must stop presenting a truncated critical instruction as if it were complete.
- conversation history is separately rendered into provider `input`; tool schemas and structured continuations already remain normalized outside LM Studio wire details.
- provider completion events already preserve optional actual input/output token usage, which can be correlated with a Phase-3 estimated provider-facing context size rather than reinventing provider usage accounting.
- `GeorgeConfig` currently knows only workspace, loopback provider URL, and model. It has no George user-config directory, global-instruction/personality sources, or context-budget configuration.
- there is no `src/context` or skill registry yet.
- session state is intentionally in-memory and already stores normalized events/transcript; Phase 3 may add context/skill diagnostic events but must not implement durable filesystem persistence or resume.
- the current canonical tool registry, approval boundary, workspace mutation protections, process boundary, and agent loop are already Phase-2-qualified and must not be weakened by model-facing instructions or skill text.
- the OpenTUI adapter owns presentation/input only and already has stable streaming, approval, draft-preservation, resize, scrollback, and cancellation coverage.
- deterministic application/provider/tool/TUI/runner tests form the regression baseline; Phase 3 should add dedicated context/skill tests rather than overloading unrelated fixtures.
- the existing LM Studio smoke script already traverses the real application loop against a disposable workspace and can remain the bounded live-path qualification hook, extended only if Phase-3 evidence needs additional context/skill markers.
- Phase 1/2 native-terminal and live-model Evidence Gaps remain accepted history and must not be relabeled Green.

## Prompt decomposition

### P1 / 0.3.1 — context source model, discovery, and token budget

Create a reusable provider-independent context layer with stable source identity, trust/priority metadata, active-vs-routed state, whole-source load results, deterministic ordering/deduplication, provider-facing token estimation, and explicit budget outcomes.

Support George-owned core instructions, optional user-global instructions/personality, workspace `.george/instructions.md`, root `AGENTS.md`, root `BOOT.md`, explicit routed workspace documents, conversation/current-user input, and normalized tool-schema overhead in the assembled representation. Do not wire the live loop yet.

### P2 / 0.3.2 — canonical loop integration and context configuration

Replace the bootstrap raw instruction concatenation with the Phase-3 context assembler in the canonical agent loop.

Add safe George user-config discovery, context budget configuration, optional global/personality loading, explicit routed-document input, and structured context diagnostics. Preserve provider independence, provider token usage, tool/approval policy, and all Phase-2 loop semantics.

### P3 / 0.3.3 — portable skill registry and turn-scoped activation

Add built-in, user-global, and workspace skill discovery for `skills/<name>/SKILL.md`; bounded metadata/catalog exposure; stable qualified identities; visible collision/malformed/oversized handling; and explicit per-turn activation.

Full skill bodies load only for activated skills and participate in the same context trust/budget rules. Skill text remains declarative and cannot register executors or raise permissions.

### P4 / 0.3.4 — TUI skill activation and context observability

Make Phase-3 capabilities usable from the terminal without moving business logic into OpenTUI.

Expose a reusable application-level catalog/activation surface and a bounded TUI command UX: `/skills` for available metadata and `/skill <id> <message>` for one-turn activation. Show compact context/activation diagnostics while preserving current draft, streaming, approval, cancellation, resize, scrollback, and terminal-cleanup behavior. Skill activation must never become sticky.

### P5 / 0.3.5 — integrated Phase 3 qualification and hardening

Exercise the complete context/skills candidate across deterministic source, budget, routing, configuration, application-loop, permission-isolation, skill, and TUI fixtures; attempt conditional native/live evidence when available; record qualification evidence; and permit only bounded evidence-driven corrections.

### P6 / 0.3.6 — evidence-only Phase 3 closeout

Audit the exact P5 candidate and evidence, record Implementation Complete / Stability Qualified truth, preserve every Not Green or Evidence Gap, and do not implement or advance Phase 4.

## Key planning decisions

### Context representation

Introduce one reusable assembled-context representation outside the provider adapter. It should retain:
- stable source ID and origin;
- trust/precedence class;
- active, routed, omitted, deferred, duplicate, or failed disposition;
- whole source text only when accepted;
- deterministic estimated-token contribution;
- aggregate estimated provider-facing size;
- enough diagnostics to explain why a source was or was not sent.

Do not make LM Studio/OpenAI request objects the canonical context model.

### Precedence and ordering

Preserve the approved precedence contract:

1. non-overridable compact George-owned invariants;
2. explicit current user intent;
3. workspace/project guidance;
4. user-global instruction defaults;
5. personality.

Within the workspace/project tier use a documented stable order, preferring George-native `.george/instructions.md` before compatible `AGENTS.md` and routing-oriented `BOOT.md`. Activated skill content inherits trust/priority from its origin and never outranks explicit current user intent.

The final provider-facing rendering must label untrusted project/skill sources rather than pretending they are George policy.

### Whole-source budget behavior

The budget unit is estimated provider-facing tokens, not source bytes. A deterministic documented estimator is acceptable when the exact model tokenizer is unavailable and must be labeled estimated.

Keep a separate bounded source-read safety limit, but never inject a source fragment created by that limit. If a required source cannot fit/read completely, fail explicitly. Optional/routed/personality/skill sources may be omitted or deferred whole with recorded reason.

Estimate the normalized provider-facing request at the layer that includes assembled instructions, conversation/current input, and normalized tool-schema overhead. Existing provider-reported usage remains actual usage evidence when available.

### Duplicate suppression

Use deterministic exact-content suppression after source normalization/fingerprinting where practical. Keep the higher-precedence/stable-earlier source and record the suppressed source as a duplicate; do not perform fuzzy semantic deduplication in Phase 3.

### Routing

`BOOT.md` remains compact routing guidance; path-looking references inside it must not cause George to eagerly inject every referenced document.

The context service should support an explicit list of workspace-bounded routed document paths for the current turn. Routed documents are loaded whole under the same source/budget rules. Existing read tools remain the normal just-in-time path when the model decides it needs additional project knowledge.

Do not add automatic semantic routing.

### User config

Use the platform user configuration area, with Linux following `$XDG_CONFIG_HOME/george` and fallback `~/.config/george`. Conventional optional sources should be deterministic and documented, e.g. `instructions.md`, `personality.md`, and `skills/`.

Missing optional files/directories are normal. Explicit configuration overrides may be supported, but malformed paths/content must fail or degrade visibly instead of silently changing precedence.

### Skills

Support three Phase-3 origins:
- built-in George skills;
- user-global skills;
- workspace `.george/skills/`.

Use qualified stable IDs such as `builtin:name`, `user:name`, and `workspace:name`. An unqualified name resolves only when exactly one discovered skill matches; collisions fail visibly.

Support the portable directory shape containing `SKILL.md`. Parse a small dependency-free metadata subset sufficient for stable name/description and optional noncritical help/argument hints when present. Unknown noncritical metadata is ignored safely.

Catalog exposure contains bounded metadata only. Full bodies are loaded just in time only for explicit activation and must drop out after that user turn.

### TUI activation

The reusable application/context/skill services own discovery, resolution, and activation semantics.

The TUI may parse a tiny built-in command surface:
- `/skills` — render a bounded local catalog without invoking the model;
- `/skill <id> <message>` — submit `<message>` with exactly that skill activated for that turn.

Do not implement sticky `/skill on` state. Normal later input contains no prior activated skill unless explicitly activated again.

### Permission isolation

No context source or skill may modify the ToolRegistry, permission class, ApprovalPort, workspace boundary, process environment, network availability, or approval decision. Tests should include hostile model-facing text that requests elevated authority and prove the executable policy path remains unchanged.

### Test-command truth

Keep `test:runner` separate. Add focused context/skill unit tests and use the existing integration/TUI layers for cross-boundary evidence. `npm test`/`npm run check` may include new deterministic tests only if the script truthfully executes them.

Live LM Studio and genuine native-TTY checks remain opt-in/conditional evidence.

## Model selection

- P1: **Terra High**
- P2: **Terra High**
- P3: **Terra High**
- P4: **Terra High**
- P5: **Terra High**
- P6: **Terra Medium**

## Four stability questions

### 1. User-visible / aggregate quantities at risk

Provider-facing estimated/actual context size, instruction ordering, number/size of active sources, omitted/deferred source counts, tool-schema overhead, skill-catalog size, TUI command/diagnostic layout, provider turn count, session event growth, and normal response/approval/cancellation latency.

### 2. Invariants

Core/application behavior remains presentation-independent; LM Studio wire details remain adapter-local; current user intent outranks repository/global/personality guidance; critical instructions are never silently truncated; optional sources fail/defer explicitly; repository/skill text cannot widen permissions; tool schemas and Phase-2 tool behavior do not change; skill bodies are JIT and non-sticky; workspace/routed paths cannot escape; deterministic tests need no LM Studio; no database/browser/network/plugin/hook/session-persistence scope is introduced.

### 3. Integrated-only evidence

Exact provider-facing request construction through the canonical loop, actual provider token usage, real LM Studio/Qwen behavior with the new context path, and native OpenTUI command/diagnostic ergonomics cannot be fully established by isolated unit tests.

### 4. Comparison baseline

The exact baseline is main `e7883db6f5ea481883fca5e07ae3a28937e1bd5b`, package `0.3.0`, with Phase 2 owner-closed and Phase 3 docs split already applied. Preserve all Phase-2 tool/provider/approval/process/TUI behavior except the explicitly replaced bootstrap context-assembly path.
