# c9-text-file-edit-fidelity

Phase 9 correction for the current byte-exact Gate A failure.

Latest Gate A now reaches:
- structured INSPECT;
- implementation;
- SHA-preconditioned mutation;
- George-owned validation;
- completed TaskState.

The only Gate A defect was a model-requested 59-byte full replacement that omitted the existing final newline from the required 60-byte file. George wrote exactly what Qwen supplied.

This correction does not silently add newlines. It adds:
- full-file text-framing metadata to reads;
- recoverable preservation guards for existing UTF-8 text mutations;
- explicit opt-in for intentional framing changes;
- provider guidance favoring exact patching for localized edits;
- structured propagation of framing evidence.

Prompt order:
1. P1 — text framing evidence + mutation fidelity guard;
2. P2 — gated live qualification;
3. P3 — correction closeout.

Package remains `0.9.10`. Phase 9 stays open until separately owner-closed; Phase 10 remains unopened.
