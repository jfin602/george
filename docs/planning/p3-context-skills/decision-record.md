# Phase 3 Decision Record — Context + Skills

Status: APPROVED DIRECTION

Baseline: package `0.3.0`  
Current roadmap gate: Phase 3 — Context + Skills

## Problem

Phase 2 established George's bounded model -> tool -> result -> model loop, canonical typed tool registry, per-call approvals, workspace-native writes/patches, bounded arbitrary process execution, Git dirty-state preservation, and structured tool/approval evidence.

The Phase 3 baseline still assembles provider instructions by concatenating George-owned text with bounded root `BOOT.md` / `AGENTS.md` content and has no portable skill registry. Before George's coding workflow becomes more durable and stateful, the harness needs a deterministic, token-conscious context substrate with explicit trust, routing, budgeting, and skill activation semantics.

Phase 3 therefore owns context and declarative skills only. Mutating-run bookkeeping, validation/completion orchestration, filesystem-backed durable sessions, and resume semantics are Phase 4.

## Decisions

### Phase 3 owns provider-independent assembled context

George introduces a provider-independent assembled-context representation.

It keeps distinct source identity, trust class, priority/order, active-vs-routed status, size diagnostics, and omission/defer/failure evidence rather than flattening every discovered file into an undifferentiated string as early as possible.

Model-facing sources may include:
- compact George-owned model instructions;
- explicit current user intent/task input;
- user-global instructions;
- a small user-owned personality source;
- workspace-native `.george/instructions.md`;
- compatible repository guidance such as root `AGENTS.md`;
- root `BOOT.md`-style routing guidance;
- selected/routed project documents;
- current conversation history and normalized tool results;
- activated skill content.

The assembled representation is independent from LM Studio/Qwen request wire format.

### Trust and precedence are deterministic

For conflicting model-facing guidance, the Phase 3 precedence contract is:

1. George-owned invariants that cannot be delegated to lower-trust prompt text;
2. explicit current user intent, subject to George's executable permission ceiling;
3. workspace/project guidance for the active repository;
4. user-global instruction defaults;
5. personality as a stylistic/temperamental default.

A lower layer may refine a higher layer where they do not conflict. Personality does not grant tools, filesystem scope, process/network authority, secret access, approval bypass, or any other executable capability.

Repository files, routed documents, skills, and model output remain untrusted relative to George policy.

### Context budgeting is token-oriented and observable

Raw byte limits are not the Phase 3 context-budget contract.

George maintains an observable provider-facing context-size estimate. If the exact tokenizer for the active provider/model is unavailable, a deterministic documented estimate is acceptable but must be labeled as estimated. Actual provider usage may be recorded separately when reported by the provider.

Budget handling is explicit:
- required compact George invariants are retained;
- lower-priority/routed material may be omitted or deferred with recorded reason;
- an oversized optional source may be rejected/deferred;
- George must not silently cut a critical instruction source and present the fragment as if it were complete.

LLM-based summarization/compaction is not required in Phase 3 and remains Phase 5 scope.

### George optimizes for the smallest sufficient working set

Available context capacity is headroom, not a target to fill. Phase 3 assembly prefers the smallest sufficient provider-facing working set for the current turn. A source is not injected merely because budget remains; project knowledge, source material, and skills are routed or loaded just in time where practical.

George may preserve unused context headroom intentionally for model output, tool-result continuations, and later rounds within the same user turn. Context pressure is an explicit operating condition, not only a provider hard-limit event.

### Context profiles separate model-specific operating policy from the core

George's context machinery remains provider-independent, while an active model/runtime may select a bounded **context profile** describing physical/provider window size when known, provider-input budget, soft pressure, reserved generation/tool-loop headroom, preferred ordinary working-set range, and compact always-on instruction target.

The initial profile to qualify is `Qwen3-Coder-30B-A3B-Instruct` using the `Q4_K_M` GGUF through LM Studio:
- physical context target: `32,768` tokens;
- preferred ordinary assembled working set: approximately `12,000-18,000` estimated tokens;
- soft pressure threshold: approximately `20,000` estimated tokens;
- provider-input hard budget: `24,576` estimated tokens;
- reserved generation/tool-loop headroom: approximately `8,192` tokens;
- normal always-on George + project-instruction target: no more than approximately `2,560` estimated tokens.

These are George engineering defaults for the first supported local model/quant/runtime, not claims about the model's maximum context capability and not architectural limits. Other providers, models, quants, hardware, or measured evidence may select different profiles without changing the context core.

Budget behavior remains whole-source and explicit. Lower-value optional/routed material is omitted or deferred before critical instructions, and unused capacity may remain intentionally unused.

Where the provider/request shape permits without changing semantic roles or the documented trust/precedence contract, provider-facing rendering should favor a stable repeated prefix before more volatile turn material so runtime prefix caching can reuse the longest practical prefix.


### Routing is distinct from always-on instructions

A discovered project document does not automatically belong in every provider request.

Root `BOOT.md` is primarily a routing source: it may identify relevant project contracts/documents that George can retrieve when needed. Phase 3 proves deterministic routed retrieval/selection without requiring an LLM summarizer.

Always-on active instructions stay compact. Project knowledge that can be loaded just in time should not be permanently repeated across unrelated turns.

### User-global instructions and personality are small optional sources

User-level George configuration may reference optional global instructions and a small personality source from George's user configuration area.

Missing optional files are normal and must not break startup. Oversized or malformed configured sources fail/degrade explicitly according to the context contract.

Personality affects communication style and engineering temperament only. It cannot alter executable policy.

### Phase 3 establishes the declarative skill substrate

Skill sources are:
- built-in George skills;
- user-global skills;
- workspace-native skills under `.george/skills/`;
- later plugin-provided skills.

The portable compatibility target is a directory containing `SKILL.md`, compatible with `skills/<name>/SKILL.md`. George should understand a stable skill name and description plus optional noncritical help/argument metadata when present. Unknown noncritical metadata is ignored safely.

Discovery is cheap and token-conscious. Phase 3 exposes the bounded skill catalog through application/TUI surfaces, but ordinary provider requests do not include the catalog by default because Phase 3 uses explicit user activation rather than automatic model skill selection. Full skill bodies are never inserted merely because a skill is discovered.

Phase 3 requires deterministic explicit activation. An activated skill body is loaded just in time, participates in the same trust/precedence/budget machinery as other model-facing context, remains available across that current user turn's model/tool rounds, and drops out for unrelated later turns unless explicitly activated again.

Stable source identities and collisions are explicit. Ambiguous unqualified names fail visibly instead of silently picking a winner. Plugin-style namespaced identities such as `plugin:skill` remain compatible with later phases without requiring Phase 3 to implement plugin packaging.

Skill text is declarative guidance only. It cannot register an executor or raise George's process, filesystem, network, secret, or approval authority.

Automatic semantic skill selection is deferred until after deterministic explicit activation is qualified.

### Phase boundary

Phase 3 does not include:
- mutating-run changed-file accounting or comprehensive final summaries;
- validation-command orchestration;
- structured coding completion evidence;
- filesystem-backed durable session persistence or resume;
- LLM-based context compaction/summarization;
- automatic semantic skill routing;
- executable lifecycle hooks;
- a frozen George plugin manifest or plugin install lifecycle;
- Ponytail/host-specific executable plugin compatibility beyond portable declarative skill compatibility;
- browser/web/network tools;
- Parallel Search, GitHub, Chrome DevTools, or MCP adapters;
- remembered approval profiles;
- OS/container sandboxing;
- general mutating Git operations;
- crash-safe side-effect replay/reconciliation;
- long-job retries/backoff;
- daemon/server mode;
- Tauri desktop UI;
- multi-agent scheduling.

Phase 4 owns coding workflow and durable sessions. Phase 5 owns long-run reliability and executable hooks. Phase 6 owns plugin packaging and external/network adapters.

## Qualification direction

Deterministic Phase 3 coverage must prove at minimum:
- context-source discovery, precedence, stable ordering, duplicate handling, and provider independence;
- estimated provider-facing context sizing, selected context-profile diagnostics, intentional headroom, and explicit budget/pressure behavior;
- large repositories or many discovered documents do not cause George to fill available context eagerly;
- the initial Qwen/Q4_K_M/LM Studio profile preserves the documented provider-input ceiling and sheds/defers optional material before critical instructions;
- required instructions are not silently truncated and presented as complete;
- missing optional user-global/personality/workspace sources;
- routed/retrievable project documentation is not unnecessarily repeated in every assembled turn;
- repository/personality/skill text cannot raise executable permissions;
- skill discovery across built-in, user-global, and workspace sources;
- visible skill collision behavior and malformed/oversized skill handling;
- compact application/TUI skill catalog behavior without ordinary-turn provider injection or eager full-body loading;
- explicit skill activation scoped to one user turn and absent from an unrelated later turn;
- at least one portable external `SKILL.md` fixture;
- provider/TUI boundaries remain adapters over reusable context and skill services.

Live LM Studio/Qwen and native-terminal evidence remain separately classified under the stability contract. Deterministic fixture coverage does not retroactively close the accepted Phase 1/2 live/native Evidence Gaps.
