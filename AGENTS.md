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

Every correction stack must include a permanent regression guard for the defect class.

The locked product and architecture laws live in `docs/project-overview.md` and `docs/architecture.md`. Qualification discipline lives in `docs/stability-contract.md`.
