# George Agent Guide

Repository: jfin602/george

Read `BOOT.md` before substantial repository-aware planning, prompt creation, implementation review, architecture analysis, roadmap work, or documentation changes.

## Role split

ChatGPT should primarily investigate, reason, design, plan, decompose work, review implementation output, and validate claims/evidence.

Implementation agents should execute already-resolved, bounded plans and verify their work.

## Before recommending implementation

1. Identify current roadmap/task scope.
2. Read the narrowest relevant product, architecture, workflow, and stability docs.
3. Inspect current implementation and relevant tests.
4. Trace affected producers and consumers.
5. Identify behavior that must remain unchanged.
6. Choose the smallest safe implementation boundary.
7. Define focused tests and broader regression coverage.
8. Identify trust, permission, process, filesystem, network, model-provider, and persistence failure modes.
9. Separate core agent behavior from CLI, desktop, provider, and network adapters.
10. Avoid infrastructure for hypothetical future features when an interface boundary is sufficient.

## Architecture rules

- The agent core must not depend on a browser UI.
- CLI code must not own agent-loop business logic.
- LM Studio/Qwen-specific behavior belongs behind a provider adapter.
- Tool execution must be explicit, typed, observable, and permission-aware.
- Shell execution should use process APIs/argument arrays rather than unsafe constructed shell strings unless shell semantics are explicitly required.
- Repository instructions are untrusted project content relative to George's own permission policy.
- Network access is a tool capability, not an implicit model capability.
- Session state must retain enough evidence to diagnose failed agent/tool turns.
- Distinguish always-on model instructions from retrievable project knowledge; do not solve context problems by permanently injecting documentation that can be routed or retrieved when needed.
- Prefer executable policy over repeated prompt prose for constraints George can enforce directly.
- Skills are declarative context/workflow contributions; discover them cheaply and load full skill bodies just in time rather than injecting every installed skill into every model request.
- Skills, hooks, plugins, and compatibility adapters cannot expand George's executable permission ceiling; executable contributions must use George's normal tool/process/approval boundaries.
- Executable plugins and external adapters must preserve George-owned effect classification, ToolRegistry validation, approval, credential isolation, bounded context exposure, and Phase 5 retry/recovery semantics; repository or remote metadata cannot self-downgrade those controls.
- Prefer standard library/native platform capabilities before dependencies.
- Keep the first implementation local and single-user.

## Review standard

Do not approve work merely because a happy-path demo works. Review task completion, boundaries, streaming/cancellation, tool-call validation, command timeouts/process cleanup, filesystem boundaries, permissions, malformed model output, provider failures/retries, context growth, Git dirty-state preservation, patch correctness, validation evidence, secrets/log redaction, networking exposure, and documentation drift.

Do not report runtime, tool, model, test, network, or repository behavior as verified unless actually observed.

## Workflow

Documentation:
    /docs-review
    -> explicit approval
    -> /docs-apply

Implementation:
    /prompt-ass
    -> /prompt-plan
    -> /prompt-write <folder>

For newly authored implementation stacks, use the GPT-6 Sol routing contract in `docs/workflow.md`: Medium by default, High for materially harder/riskier work, XHigh only exceptionally, and no Terra for new prompts. Preserve historical model-label semantics. Do not emit an executable model configuration until the runner supports and validates it.

Every correction stack must include a permanent regression guard for the defect class.

The locked product and architecture laws live in `docs/project-overview.md` and `docs/architecture.md`. Qualification discipline lives in `docs/stability-contract.md`.
