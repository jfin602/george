# c9-text-file-edit-fidelity Implementation Plan

Status: READY FOR PROMPT EXECUTION

Correction: `c9-text-file-edit-fidelity`  
Roadmap phase: 9  
Required unchanged package version: `0.9.10`

## Authority

Read:
- `BOOT.md`;
- `AGENTS.md`;
- current architecture/workflow/stability contracts;
- current Phase 9 decision and qualification authority;
- `docs/tasks/c9-inspection-stage-completion/{P2-live-evidence,closeout}.md`;
- exact read-only tool, mutation tool, structured inspection projection, application loop, and affected tests.

## P1 — framing fidelity implementation

### A. Shared framing classifier

Create the narrowest reusable internal framing classifier needed by read and mutation paths.

For recognized UTF-8 text, represent:
- line-ending convention: `none | lf | crlf | mixed`;
- final-newline state/style: `none | lf | crlf`.

Recognition rules:
- full content must be valid UTF-8;
- NUL-containing content is not treated as ordinary text framing;
- mixed line endings remain `mixed`;
- bare CR or other ambiguous newline patterns must not be silently called LF/CRLF; classify conservatively as mixed/ambiguous under the chosen bounded type.

Do not add an external dependency.

### B. read_file framing metadata

Extend the canonical `read_file` result with optional framing metadata.

Requirements:
- framing describes the full file, even when returned text is truncated;
- compute during the same opened-file scan used for full SHA-256;
- preserve cancellation;
- avoid loading arbitrarily large files solely to classify framing;
- preserve current path/text/bytes/truncated/SHA semantics;
- non-text/invalid input omits framing rather than inventing it.

Update the provider-visible read description accordingly.

### C. mutation fidelity guard

Add optional explicit framing-change acknowledgement to both existing text mutation primitives. Preferred name:

`allowTextFramingChange?: boolean`

Update canonical tool schemas/types/descriptions.

For an existing target:
1. resolve and verify current-content SHA exactly as today;
2. classify current framing if recognized text;
3. produce the proposed/result text exactly as today;
4. classify proposed/result framing;
5. if framing changes and explicit acknowledgement is absent, reject before publication with a bounded recoverable validation error describing current/proposed framing;
6. if acknowledged, permit the exact requested change;
7. publication remains verbatim; never auto-normalize.

Specific semantics:
- `write_file`: current `mixed` framing requires explicit acknowledgement for full replacement even when proposed classification is also mixed, because whole-file framing fidelity cannot be guaranteed from the category alone;
- `apply_patch`: preserve normal exact-patch behavior; reject if the resulting recognized framing differs, otherwise allow; untouched bytes remain unchanged;
- new-file `write_file`: unchanged behavior, no preservation guard;
- unrecognized/binary current target: preserve prior mutation behavior rather than inventing a text policy.

The framing guard is additional to, not a replacement for, SHA/precondition checks.

### D. provider guidance and structured handoff

Provider-facing mutation descriptions must say:
- localized existing-file edits should prefer `apply_patch`;
- full `write_file` replacement is exact and must preserve observed framing by default;
- the explicit framing-change flag is only for intentional task-required changes.

Structured INSPECT projection must carry validated allowlisted framing metadata from `read_file` into the implementation slice along with path/text/SHA.

### E. permanent regressions

At minimum cover:

Read framing:
1. LF file ending with LF;
2. LF file with no final newline;
3. CRLF file ending with CRLF;
4. CRLF file without final newline;
5. mixed framing;
6. truncated returned text still reports full-file framing;
7. invalid UTF-8/NUL content produces no text framing;
8. SHA behavior remains unchanged.

Mutation:
9. existing LF-final-newline full replacement that removes final newline is rejected and file bytes remain unchanged;
10. same-framing full replacement succeeds;
11. explicit acknowledgement permits intentional final-newline change;
12. CRLF -> LF full replacement rejects by default;
13. intentional CRLF -> LF succeeds only with explicit acknowledgement;
14. existing mixed-framing full replacement requires explicit acknowledgement;
15. localized `apply_patch` preserves final newline and LF/CRLF untouched framing;
16. patch that changes detected framing rejects without acknowledgement;
17. new-file creation remains unaffected;
18. stale SHA still rejects independently.

Structured/model path:
19. structured inspection evidence includes framing metadata;
20. provider-facing tool metadata describes patch preference and framing rules;
21. deterministic frozen Gate A-shaped provider first attempts the exact 59-byte no-newline `write_file`;
22. George rejects it recoverably without mutation;
23. provider continuation sees bounded framing evidence/error and retries with preserved newline or exact patch using the still-valid observed SHA;
24. exact expected 60-byte file results;
25. George-owned V1 passes and TaskState completes;
26. ordinary mutation/tool behavior unrelated to framing remains Green.

Do not weaken exact fixture acceptance.

## P2 — gated live qualification

### Deterministic pre-gate

Require Green:
- P1 framing/read/mutation/structured recovery tests;
- inherited SHA/precondition tests;
- mandatory INSPECT/tool-round completion tests;
- exception-safe trace tests;
- frozen deterministic Phase 8 replay;
- Phase 9 integration;
- c9 stack/convergence regression floor;
- typecheck;
- runner;
- diff hygiene.

### Gate A

Run exactly one official frozen structured replay under pinned Qwen.

Record:
- read `textFraming` for target;
- framing metadata in the implementation slice;
- initial mutation tool and requested byte count;
- `expectedSha256`;
- any framing rejection and exact bounded diagnostic;
- retry mutation tool/bytes/acknowledgement if present;
- pre/post SHA;
- final bytes/framing;
- George-owned V1;
- TaskState;
- tool calls/provider rounds/tokens/context/budgets/timing/intervention.

Green criteria remain all locked Phase 9 criteria, especially the exact 60-byte edit.

If Gate A is Not Green:
- stop;
- do not run Gate B/C;
- do not repair production code in P2;
- do not rerun until another approved implementation change.

### Gate B

Only after Gate A Green:
- run exact `greenfield-express-v1` through production stack authority;
- require completed stack/validations/hidden acceptance/zero intervention/no exhaustion.

### Gate C

Only after Gate B Green:
- run exact `existing-express-feature-v1`;
- require focused+broad validation, baseline preservation, completed TaskState, hidden acceptance, zero intervention/no exhaustion.

Create:
`docs/tasks/c9-text-file-edit-fidelity/P2-live-evidence.md`.

## P3 — closeout

Create:
`docs/tasks/c9-text-file-edit-fidelity/closeout.md`.

Report separately:
- Implementation Complete;
- Text Framing Evidence Qualified;
- Mutation Fidelity Guard Qualified;
- Gate A Qwen Work-Unit Convergence Qualified;
- Gate B Greenfield Qualified / Not Run;
- Gate C Existing-App Qualified / Not Run;
- Overall correction Qualified.

Overall qualification requires Gate A Green.

## Validation floor

Every implementation prompt:
- focused affected tests;
- inherited structured/c9 floor;
- `npm run typecheck`;
- `npm run test:runner`;
- `git diff --check`;
- no root `package-lock.json`.

Package remains exactly `0.9.10`.
