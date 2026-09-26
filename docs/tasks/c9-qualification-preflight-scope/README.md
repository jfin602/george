# c9-qualification-preflight-scope

Phase 9 qualification-policy correction after `c9-mutation-precondition-convergence`.

The production mutation-precondition candidate is implementation-complete and deterministically qualified, but its P2 prompt accidentally required aggregate broad `npm test` Green before live work. That stopped fresh Gate A/B2/C2 even though the approved qualification plan intended broad retained OpenTUI/native failures to be characterized separately from the affected hard gate.

This correction:
- keeps aggregate broad-suite state separate from candidate regression delta;
- compares the exact pre-P1 baseline `d7e565ccb0e694166e6fe4346b56f4746f0697f1` against production candidate `04405570b92680e6297b48391a7d0bdf0aa8ed5e`;
- adds a permanent qualification-layer regression guard for that distinction;
- spends fresh Gate A -> B2 -> C2 only if hard preflight and broad regression delta are Green;
- preserves all prior Not Green / Not Run evidence.

Prompt order:
1. P1 — qualification preflight policy guard + controlled broad baseline comparison;
2. P2 — fresh gated Phase 9 live qualification;
3. P3 — evidence-only closeout.

Package remains exactly `0.9.10`.
