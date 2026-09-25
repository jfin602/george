# c9-inspection-stage-completion

Narrow Phase 9 correction for the remaining structured INSPECT convergence defect.

Already qualified and out of scope:
- production task-stack execution;
- inspection evidence handoff / task-wide budget / direct validation / convergence guards;
- full-file read SHA -> safe mutation precondition;
- mandatory first-round INSPECT tool choice;
- exception-safe live attempt/trace retention;
- Bubblewrap containment.

Latest Gate A proves Qwen can enter INSPECT and collect relevant evidence, but George still waits for a voluntary model completion and hits the four-execution stage ceiling before implementation.

This correction makes George finish the INSPECT preflight after the first provider tool round that contains at least one successful qualifying read-only result, then advances directly to implementation.

Prompt order:
1. P1 — deterministic INSPECT stage completion;
2. P2 — gated live requalification;
3. P3 — correction closeout.

Package remains `0.9.10`.

No Task Prompt grammar change, context tuning, stack redesign, mutation-contract change, Bubblewrap/TUI work, or Phase 10 work belongs here.
