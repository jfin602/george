# c9-inspection-execution

Final narrow Phase 9 correction for the current frozen Gate A failure.

Inherited qualified boundaries are preserved:
- production structured task-stack execution;
- safe read SHA -> mutation precondition contract;
- structured convergence controls;
- Bubblewrap containment.

Remaining defects:
1. structured INSPECT says a read-only tool is required but the provider request still lets the model answer with text only;
2. qualification still loses the attempt envelope when the production structured service throws.

This correction makes the first INSPECT provider round require one tool call from the already-restricted inspection tool set, then restores normal automatic tool choice for continuation rounds. It also makes thrown production-service attempts return/persist bounded qualification evidence.

Prompt order:
1. P1 — required first-round inspection tool choice;
2. P2 — exception-safe live attempt retention;
3. P3 — gated live qualification;
4. P4 — correction closeout.

Package remains `0.9.10`.

No context tuning, mutation-contract change, stack redesign, Bubblewrap/TUI work, or Phase 10 work belongs here.
