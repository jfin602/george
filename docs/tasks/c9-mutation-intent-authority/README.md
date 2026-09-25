# c9-mutation-intent-authority

Final bounded Phase 9 correction candidate.

The latest Gate A no longer fails because Qwen cannot inspect, edit, validate, or recover. After George rejected an invalid full replacement, Qwen selected the exact safe patch that would have produced the required file. The frozen qualification approval policy denied that patch. Qwen then used a model-supplied framing-change acknowledgement that the current application approval boundary did not treat as exceptional authority.

This correction:
- makes model-requested framing change an approval-requiring intent rather than self-authorization;
- preserves ordinary Workspace Autonomous mutations;
- adds bounded mutation intent to ApprovalRequest;
- adds a Phase-9-specific fair frozen-edit approval helper that allows write or patch on the exact target while denying framing overrides;
- leaves the historical benchmark definition unchanged;
- reruns the strict A -> B -> C gates.

Prompt order:
1. P1 — mutation intent authority + fair qualification approval;
2. P2 — final gated Phase 9 live qualification;
3. P3 — correction closeout.

Package remains `0.9.10`. Phase 9 owner closeout remains a separate action.
