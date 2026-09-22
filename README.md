# George

George is a local-first coding agent harness for running capable local language models against real software repositories.

The initial target is Qwen3-Coder served by LM Studio through its OpenAI-compatible Responses API. George owns the agent loop, tools, context, permissions, project instructions, and session state instead of depending on model-specific orchestration assumptions in another coding harness.

Start with `BOOT.md` before substantial repository-aware work.

## Initial direction

- TypeScript + Node.js 24 core.
- CLI-first; no browser UI requirement.
- Core implemented as reusable libraries, not CLI handlers.
- LM Studio `/v1/responses` as the first inference provider.
- Native filesystem, shell, Git, search, patch, test, and process tools.
- Local-first permissions and explicit trust boundaries.
- Architecture ready for a later local daemon and networking.
- Tauri desktop application is a later adapter, not part of the core.
- Future tools may include Chrome DevTools, Parallel Search, GitHub, and MCP.

See `docs/project-overview.md`, `docs/architecture.md`, `docs/workflow.md`, and `docs/roadmap/mvp-roadmap.md`.
